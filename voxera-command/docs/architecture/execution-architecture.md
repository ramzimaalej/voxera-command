---
title: Execution Architecture
version: 1
status: active
updated: 2026-05-31
owner: you
---

# Execution Architecture — v1.0

**Vocabulary note.** Per `workflow-dsl.md`, the internal vocabulary is generic ("workflow," "process instance"); the v1 CRM user-facing labels are "Pipeline," "Lead." References below use the internal vocabulary except where explicitly quoting user-facing text.

---

## 1. Build vs Buy

Custom state machine over Postgres, not Temporal/Inngest/Restate. Reasoning:

- The DSL is highly constrained (linear stages, declarative triggers, finite primitive set).
- The durable parts are narrow: current stage, pending awaits, scheduled jobs, form state.
- Version migration of in-flight leads is dramatically simpler when we own the state model.
- The agent reasoning around webhook handlers fits naturally as a tool-using sub-process invoked from the engine, not as Temporal activities.

A general-purpose engine creates impedance mismatch with the DSL. Keep it boring: Postgres + a job runner + a publisher.

> *Decision recorded as [ADR-0002: Custom state machine on Postgres, not Temporal/Inngest/Restate](../../decisions/ADR-0002-custom-state-machine-on-postgres.md).*

---

## 2. Core Data Model

Logical tables (Postgres):

```
workflow_instances
  id, lead_id, pipeline_id, pipeline_version, current_stage,
  entered_stage_at, task_scratchpad (jsonb),
  status (active | won | lost), instance_version (optimistic lock)

form_responses
  id, workflow_instance_id, form_id, target_kind (lead|task|object),
  target_ref, data (jsonb), data_version, sealed_at, sealed_by_rule

pending_awaits
  id, workflow_instance_id, primitive_invocation_id,
  await_kind (signature | email_reply | sms_reply | call_completion),
  match_keys (jsonb), timeout_at, on_resolve_actions (jsonb)

primitive_invocations
  id, workflow_instance_id, primitive_id, dispatched_at,
  status (pending | succeeded | failed | timed_out),
  external_ref, response_payload

scheduled_jobs
  id, workflow_instance_id, stage_id, kind (time_trigger | timeout),
  fire_at, payload (jsonb), status, attempts

outbox_events
  id, aggregate_kind, aggregate_id, aggregate_version,
  event_type, changes (jsonb), payload (jsonb),
  actor_kind (agent | human | system), actor_id,
  causing_decision_id (nullable, set when actor_kind = agent),
  trace_id, occurred_at, published_at (nullable)
  -- the single source of truth for data changes

agent_decisions
  id, workspace_id, agent_id, agent_role, agent_prompt_version,
  agent_model, business_context_version,
  trigger (jsonb), loaded_context (jsonb),
  tools_available (jsonb), reasoning (jsonb),
  decision (jsonb), outcome_refs (jsonb),
  cost (jsonb), trace_id, parent_decision_id (nullable),
  occurred_at
  -- captures agent reasoning steps that produce outward actions

domain_event_definitions   (from DSL, cached)
field_change_subscriptions (derived from DSL field_change_triggers)

configuration_locks
  id, workspace_id,
  artifact_kind, artifact_id, section_path,
  holder_user_id, acquired_at, expires_at, last_heartbeat_at
  UNIQUE(workspace_id, artifact_kind, artifact_id, section_path)
  -- supports section-level write locks for configuration editing

configuration_drafts
  lock_id, user_id, draft_content (jsonb),
  updated_at
  -- per-user, per-lock draft state for configuration editing
  -- (Redis-backed in production; Postgres fallback acceptable)
```

`task_scratchpad` is the workflow-task scratchpad referenced in the DSL (`task.<field>`). Lives with the instance, GC'd when the instance closes.

### 2.1 Field-level versioning for LWW

For LWW-per-field conflict resolution (per `realtime-collaboration.md`), each writable field on a lead or custom object instance carries metadata:

```
lead_field_versions / object_field_versions
  entity_id, field_path,
  value, written_at (server timestamp, monotonic),
  writer_kind, writer_id,
  outbox_event_id, causing_decision_id (nullable)
```

Implementation can be a JSONB envelope per field on the entity row, a separate versions table joined for reads, or a hybrid (recent versions in the row, history in a partition). Choose based on read/write patterns at scale.

Form responses carry `written_at` at the record level (record-level granularity for forms). `task_scratchpad` carries `written_at` at the document level.

---

## 3. Engine Entry Points

Four entry points, each landing in the same core transition function:

1. **Human action** (HTTP API): save form, advance stage, move back, transition to lost, unseal form, etc.
2. **Webhook receiver** (inbound email/SMS/call/partner): runs through the four-stage pipeline (`cross-cutting-patterns.md` §1); `pending_awaits` matched first, then routed to webhook handlers' Analyze stage.
3. **Scheduler** (cron, runs every 30s or via Postgres `LISTEN/NOTIFY`): claims due rows from `scheduled_jobs`.
4. **Internal event bus**: field-change events from form saves trigger `field_change_subscriptions` evaluation.

All four converge on:

```
fn apply_transition(instance_id, transition: Transition, actor: Actor) -> Result:
  BEGIN
    SELECT ... FOR UPDATE workflow_instances WHERE id = instance_id
    validate(transition, current_state)
    for each field write in transition:
      read current written_at for the field (or record, or document)
      apply the write unconditionally
      stamp new written_at = server timestamp (monotonic)
      record both the prior value (in outbox `before`) and new value
    write state mutations
    materialize side effects (insert into scheduled_jobs, pending_awaits, primitive_invocations)
    insert into outbox_events (one per state change, with actor + causing_decision_id)
  COMMIT
  NOTIFY publisher
```

Writes are never rejected for being stale; LWW means we accept all writes and the latest server timestamp wins (per `realtime-collaboration.md`).

Single transaction per logical transition. Side effects only leave the engine via the outbox.

---

## 4. Agent Decision Records

Decision Records are produced by agents at outward decisions (those that result in actions, proposals, or approval-deferrals). Internal LLM calls within multi-step agent invocations are not Decision Records — they're observability traces.

Flow for an Operator handling an inbound:

1. Webhook receiver routes the inbound to a Lead.
2. Engine invokes the configured Operator with the inbound + loaded Business Context.
3. Operator runs, produces a structured output (classification, recommended actions, confidence, alternatives, rationale).
4. Engine writes an `agent_decisions` row with the full record, including `loaded_context` snapshotted at decision time.
5. Engine reads `decision.recommended_actions` and runs each through `apply_transition`. Each transition's outbox event carries `causing_decision_id` pointing back.
6. After all actions, engine updates the Decision Record's `outcome_refs.outbox_event_ids`.

The Decision Record is written *before* actions execute (so the system's understanding is recorded even if action execution fails partway). The `outcome_refs` field is updated after.

Agent decisions emit a single corresponding outbox event (`AgentDecisionRecorded`) for downstream subscribers that want to react to decisions themselves (e.g., the Critic's batch indexer). This event is the link from the outbox view back into the agent_decisions table.

---

## 5. Suspension & Resumption

When a primitive dispatches (e.g. `signature_request`):

1. Insert `primitive_invocations` row → external system call → store `external_ref`.
2. Insert `pending_awaits` with match keys: `{ kind: signature, external_ref: "abc123" }`.
3. Optionally insert `scheduled_jobs` for timeout.

When the external response arrives:

1. Webhook receiver looks up `pending_awaits` by match keys.
2. Runs `on_resolve_actions` against the workflow instance — typically `update_field` + `transition_to`.
3. Deletes the await and any linked timeout job.

For inbound email/SMS without a primitive in flight: routes through the webhook pipeline's Persist → Analyze → Act stages.

**Indefinite wait works for free** — no row expires until resolution or explicit cancellation.

---

## 6. Triggers

**Time-based triggers (per-stage):**
- On stage entry, materialize each `time_triggers` entry as a `scheduled_jobs` row with `fire_at = entered_stage_at + offset` (business/calendar day math done at insert time).
- On stage exit (forward or backward), cancel pending scheduled jobs scoped to that instance + stage.
- Business-day math uses a workspace-configurable calendar (holidays).

**Field-change triggers (pipeline-level):**
- Every form save emits `FieldChanged` outbox events with `{ field_path, before, after }`.
- A subscriber matches these against `field_change_subscriptions`. On match, invoke `apply_transition` with the trigger's action.
- Loop protection: same field changing within the same transaction doesn't re-trigger.

**Backward movement + synthetic events:**
- Moving back from stage N to stage N-2: emit `StageExited(N)`, `StageEntered(N-1)`, `StageSkipped(N-1, direction=backward)`, `StageEntered(N-2)`.
- Synthetic events feed analytics; they don't re-run stage forms' activation logic.

---

## 7. Outbox & Audit

The `outbox_events` table is the single source of truth for **data changes**. It serves three jobs simultaneously:

1. **Audit log** — immutable, append-only. Retained per workspace policy.
2. **Domain event publication queue** — consumed by the publisher (see `automations-and-events.md`).
3. **Internal event bus** — field_change subscriptions, scheduler triggers, analytics indexers all read from here.

A publisher service maintains per-subscriber cursors. At-least-once delivery; subscribers idempotent on `event_id`.

> *Implementation spec in [`outbox-implementation.md`](./outbox-implementation.md) — schema (range-partitioned by sequence, 32 hash-routed partitions, partial index `WHERE dead_lettered_at IS NULL`), producer API (`outbox.emit(tx, event)` inside the primary write tx), consumer split (strict-ordered for cascade + projection handlers; free-order for everything else), advisory-lock partition ownership, throughput ceiling (1,280 strict / 6,400 free events/sec). Decision recorded as [ADR-0011: Postgres-only outbox implementation](../../decisions/ADR-0011-postgres-outbox-implementation.md).*

Common event types:
- Workflow lifecycle: `StageEntered`, `StageExited`, `StageSkipped`, `WorkflowMigrated`, `LeadWon`, `LeadLost`
- Form lifecycle: `FormSaved`, `FormSealed`, `FormUnsealed` (carries `reason`, `actor`)
- Primitive lifecycle: `PrimitiveDispatched`, `PrimitiveResolved`, `PrimitiveTimedOut`
- Webhook stages: `InboundReceived`, `InboundPersisted`, `InboundRouted`, `InboundAnalyzed`, `InboundActed`
- Agent artifacts: `AgentDecisionRecorded`, `PipelineProposed`, `PipelineApplied`, `AgentProposed`, `AgentApplied`, `ReportProposed`, `ReportApplied`, `ContextSectionProposed`, `ContextSectionEdited`
- Prompt lifecycle: `PromptProposalCreated`, `PromptProposalApproved`, `PromptDeployed`, `PromptRolledBack`
- Custom domain events from the DSL

Encrypted fields are redacted from outbox payloads by default. Opt-in inclusion requires explicit declaration in the event's payload definition and is audit-logged.

Decision Records are **not** in the outbox. They live in `agent_decisions`, linked via `causing_decision_id` on outbox events and `outcome_refs.outbox_event_ids` on records. Full two-log model in `cross-cutting-patterns.md` §2.

---

## 8. Version Migration

1. Admin publishes new pipeline version. Validator diffs against current version:
   - Pure additions → no mapping required for in-flight leads.
   - Mutations (renamed fields, removed fields, breaking reordering) → mapping required.
2. If new fields added, the Configurator proposes a mapping. Admin reviews/edits/approves.
3. Migration mapping stored as a workspace-scoped artifact, keyed by `(pipeline_id, from_version, to_version)`.
4. In-flight leads migrate **on next interaction**: interceptor checks `pipeline_version` at the start of `apply_transition`, runs the mapping if needed, bumps version, emits `WorkflowMigrated` with before/after diff.
5. Removed fields aren't deleted — moved into `task_scratchpad` under `__migrated_legacy.<field>`.

Leads in terminal states (won/lost) are not migrated.

Agent definitions, report definitions, and Business Context follow the same pattern.

---

## 9. Concurrency, Idempotency, Failures

- `workflow_instances.instance_version` (optimistic lock): every transition increments it; conflicting writes retry.
- Row-level locks (`SELECT ... FOR UPDATE`) only held within a single transition transaction (fast).
- Idempotency keys on all external entry points (webhook headers, API request IDs).
- Job runner uses `SELECT ... FOR UPDATE SKIP LOCKED` to claim jobs safely.
- Failed primitive dispatches retry with exponential backoff up to a configurable max; then go to a DLQ surfaced in admin UI.

---

## 10. Retention & Cold Storage

Per `cross-cutting-patterns.md` §2.5:

- **Outbox hot tier (Postgres):** default 90 days, configurable per workspace.
- **Outbox cold tier (S3/GCS/Azure):** default 7 years, configurable, then purged.
- **Decision Records hot tier (Postgres):** default 90 days.
- **Decision Records cold tier:** default 2 years, configurable.
- Cold storage partitioning: `{workspace_id}/{yyyy}/{mm}/{dd}/{kind}.jsonl`, compressed, encrypted at rest.
- Purge events themselves recorded in the outbox (`AuditPurged`).

A daily archive job moves expired hot-tier rows to cold storage. A separate purge job removes cold-tier data past retention.

---

## 11. Stack Recommendation

- **Postgres 16+** — primary store, outbox, job queue, agent_decisions, locks. Use `pg-boss` or `Oban`-style if you want batteries-included, or roll your own with `LISTEN/NOTIFY` + `SKIP LOCKED`.
- **Engine service** — your language of choice. Stateless. Multiple replicas safe.
- **Publisher service** — separate replicaset reading the outbox, fanning out to subscribers. Per-subscriber cursors + retry state.
- **SSE multiplexer service** — separate replicas for client real-time push. Reads from outbox (filtered per connection subscription) and ephemeral event bus (presence, locks, draft updates). Stateless, behind sticky-session load balancing.
- **Redis** — ephemeral state: presence, configuration drafts, ephemeral event pub/sub. Acceptable for these because losing it degrades UX without losing committed truth.
- **Scheduler** — leader-elected cron loop, or a separate replica.
- **Object storage** — for signature documents, PDF templates, generated PDFs, cold-tier audit/decision archives.
- **Secrets store** — partner HMAC keys, outbound API credentials, customer-managed encryption keys.

Avoid: Redis-as-source-of-truth (for anything committed), Kafka before you actually need fanout >1000 events/sec, microservice fragmentation early on.

---

## 12. Observability

- Every transition emits structured logs with `workflow_instance_id`, `transition_id`, and `trace_id`.
- Outbox event count + lag per subscriber → SLOs.
- Per-pipeline funnel analytics derived from `StageEntered` events.
- `pending_awaits` age histogram — long-tail awaits are usually a signal of broken integrations.
- Per-operator Decision Record dashboards: count, confidence distribution, latency, cost.
- Confidence calibration tracking: when Operator said 0.X, was outcome correct X% of the time?
- Admin UI to inspect a single workflow instance: timeline view rendered from outbox, with Decision Record drill-ins where actions originated from agents.
- SSE connection counts and event throughput per workspace; lock contention metrics.

---

## 13. Open Questions

- **Multi-tenant isolation** — single-DB-row-level vs schema-per-tenant vs cluster-per-tier. Depends on customer profile.
- **Background agent execution model** — is the runtime agent (webhook reasoning) a synchronous call from the engine, or queued? Recommend queued: dispatch agent reason → agent emits tool calls → tool calls become normal transitions. Decouples engine latency from LLM latency.
- **Calendar source for business days** — workspace-level setting? Per-pipeline? Per-trigger override?
- **Field versioning storage strategy** — JSONB envelope vs separate versions table vs hybrid. Decide based on read/write patterns and history retention needs.
- **Draft persistence tier** — Redis default vs Postgres-backed for enterprise SLA tiers.

## Changelog
- 2026-05-31 v1: imported from `/Users/ramzi/Downloads/files-6/execution-architecture-v1.0.md`; frontmatter added (status active), inline "**Status:** v1.0" line removed in favor of frontmatter.
