---
title: Cross-Cutting Patterns
version: 1
status: active
updated: 2026-05-31
owner: you
---

# Cross-Cutting Patterns — v1.0

Three patterns that span every component: the inbound webhook pipeline, the two-log audit model (outbox + Decision Records), and the Promoter observability surface.

**Vocabulary note.** Per `workflow-dsl.md`, the internal vocabulary is generic ("workflow," "process instance"); the v1 CRM user-facing labels are "Pipeline," "Lead." References below use whichever is clearer in context.


---

## Part 1 — Inbound Webhook Pipeline

### 1.1 Four-stage model

Inbound signals (webhook deliveries, email replies, SMS callbacks, call completions, signature events) flow through a four-stage pipeline:

```
   Receive  →  Persist  →  Analyze  →  Act
```

Each stage has its own responsibility, failure modes, and replay semantics.

### 1.2 Stage definitions

#### Receive

- Accept the inbound HTTP request.
- Authenticate (HMAC signature, mTLS, IP allowlist).
- Validate basic shape; reject malformed payloads.
- Assign `inbound_event_id` (ULID).
- Emit outbox event: `InboundReceived`.
- Return 200 fast. Everything downstream is async.

#### Persist

- Store raw payload immutably (object storage, content-addressed).
- Extract normalized structured representation: source, direction, channel, sender, recipient, content, attachments, references.
- Persist the normalized record.
- Match against `pending_awaits` — if matched, this is a primitive resolution, not a new inbound. Hand off accordingly.
- Match against routing rules to identify the relevant Lead. Multiple matches → use rule precedence; zero matches → mark unrouted, may still flow to analysis for triage.
- Emit outbox events: `InboundPersisted`, then `InboundRouted` or `InboundUnrouted`.

#### Analyze

- Load Business Context sections, Lead state, workflow stage, applicable webhook handler config, standing operational policies.
- Invoke the configured Operator. The Operator's output is a **Decision Record** (Part 2) — its understanding of the inbound, the alternatives considered, recommended actions, confidence, autonomy check.
- The Decision Record is persisted *before* the Act stage runs. The system's *understanding* is an inspectable artifact, independent of what it does next.
- Emit outbox event: `InboundAnalyzed` with `decision_record_id` reference.

**Failure modes:** Operator times out → fallback deterministic rule from webhook handler config; low confidence → record decision, queue for human approval, do not act; Operator emits malformed output → retry once then escalate to human, audit.

#### Act

- Read the Decision Record.
- Apply autonomy gating: if `decision.autonomy_check.requires_approval` is true, queue for human and stop. Otherwise proceed.
- Translate `recommended_actions` into engine transitions (`update_field`, `transition_lead`, `dispatch_primitive`, `send_reply`, etc.).
- Each transition emits its own outbox event with `causing_decision_id` pointing back to the Decision Record.
- Emit outbox event: `InboundActed` (or `InboundDeferred` if gated).

### 1.3 Replay semantics

Each stage is independently replayable:

- **Re-Persist:** normalization logic changed → replay from raw payload.
- **Re-Analyze:** Business Context changed materially or Operator prompt updated → re-run analysis. Produces a new Decision Record; does **not** re-act unless explicitly invoked.
- **Re-Act:** reads existing approved Decision Record and executes (rare; used when a human approves late).

Replay actions are clearly marked in audit (`replay: true`, with reason and triggering user).

### 1.4 Pflegebox example trace

An inbound email arrives from `mueller@example.de` asking about eligibility for a parent with Pflegegrad 2.

**Receive (T+0ms)** — HMAC verified, `inbound_event_id` assigned, 200 returned. → outbox: `InboundReceived`.

**Persist (T+200ms)** — raw stored, normalized, routed to `lead_842`. → outbox: `InboundPersisted`, `InboundRouted`.

**Analyze (T+1.2s)** — Operator `pflegebox_inbound_triage` loads context, produces **Decision Record `ad_xyz`**: classification=question, extracted={pflegegrad: 2, relation: child}, confidence=0.91, recommended actions=[update_field, transition_lead, send_reply], autonomy gating passes. → outbox: `InboundAnalyzed(decision_record_id=ad_xyz)`.

**Act (T+1.4s)** — actions dispatched. → outbox: `FieldChanged(causing_decision_id=ad_xyz)`, `StageTransitioned(causing_decision_id=ad_xyz)`, `PrimitiveDispatched(causing_decision_id=ad_xyz)`, `InboundActed`.

The Decision Record sits in its own log; the outbox carries the resulting state changes. Linked via `causing_decision_id`, queryable from either side.

### 1.5 Webhook DSL

```yaml
webhook_handlers:
  - id: inbound_email_general
    source: email

    receive:
      auth: hmac_provider_default
      max_payload_kb: 512

    persist:
      normalize: standard_email
      routing:
        - match_lead_by_field: lead.email
          to: inbound.sender
      unrouted_action: queue_for_triage

    analyze:
      operator: pflegebox_inbound_triage
      fallback_on_timeout:
        kind: deterministic_rule
        rules:
          - if: { "contains": [ inbound.body_text, "abbestellen" ] }
            classify_as: opt_out

    act:
      autonomy: inherit_from_operator
      approval_required_if:
        confidence_lt: 0.7
```

---

## Part 2 — The Two-Log Audit Model

Two logs, two concerns, explicit linkage.

> *Decision recorded as [ADR-0003: Two-log audit model — outbox for data changes, Decision Records for agent reasoning](../../decisions/ADR-0003-two-log-audit-model.md).*

### 2.1 The Outbox — data changes

The outbox carries **every state change** in the system, by any actor (human, agent, system). Single source of truth for *what happened to the data*. Drives audit, automations, external webhooks, analytics, search indexing, replay.

```yaml
outbox_event:
  id: oe_...                            # idempotency key for subscribers
  workspace_id: ws_...
  occurred_at: iso8601
  trace_id: trc_...                     # links events from one originating trigger

  aggregate:
    kind: lead | workflow_instance | form_response | object_instance |
          agent_definition | report_definition | business_context |
          prompt_proposal | ...
    id: lead_842
    version: 12                         # post-change

  event_type: FieldChanged | StageTransitioned | FormSaved | FormSealed |
              FormUnsealed | PrimitiveDispatched | PrimitiveResolved |
              WorkflowMigrated | LeadWon | LeadLost | PromptDeployed |
              BusinessContextEdited | InboundReceived | InboundAnalyzed |
              AgentDecisionRecorded | ...

  changes:                              # for clean state-change events
    - field: pflegegrad
      before: null
      after: 2

  payload:                              # for events without simple before/after
    primitive_id: send_qualification_email_de
    invocation_id: pi_...

  actor:
    kind: agent | human | system
    id: pflegebox_inbound_triage | user_xyz | scheduler_process

  causing_decision_id: ad_... | null    # set when actor.kind == agent

  published_at: nullable                # publisher fanout cursor
```

**Properties:**
- Append-only.
- Single Postgres table, in-transaction with the state change that produced it.
- Per-subscriber consumer cursors (audit log, analytics, external webhooks, automations, search index).
- Retention: per-workspace, default 7 years for compliance. Older events archive to cold storage (§2.5).
- Encrypted fields redacted by default; opt-in inclusion is itself audited.

> *Implementation spec in [`outbox-implementation.md`](./outbox-implementation.md) (Postgres-only, 32 partitions, strict-ordered vs free-order consumer split, advisory-lock partition ownership, throughput math). Decision recorded as [ADR-0011: Postgres-only outbox implementation](../../decisions/ADR-0011-postgres-outbox-implementation.md).*

### 2.2 The Decision Record — agent reasoning

A Decision Record captures one outward-facing agent decision — a reasoning step that produces actions, proposals, or approval-deferrals. Stored separately from the outbox, in its own table.

**Critical scoping rule:** Decision Records are produced **only for decisions that result in outward actions**. Internal LLM calls within a multi-step agent invocation are observability traces (spans, logs), not Decision Records. The threshold: "did this reasoning step produce an outward decision?"

```yaml
agent_decision:
  id: ad_...
  workspace_id: ws_...
  occurred_at: iso8601
  trace_id: trc_...
  parent_decision_id: ad_... | null     # for chained decisions

  agent:
    id: pflegebox_inbound_triage
    role: operator                      # operator | configurator | critic |
                                        # reporter | orchestrator | copilot
    prompt_version: 4
    model: claude-opus-4-7
    business_context_version: 7

  trigger:
    kind: inbound_event | scheduled_check | field_change |
          user_request | upstream_decision
    ref: inbound_evt_...

  loaded_context:                       # what the agent actually saw
    business_context_sections:
      [brand_voice, products, regulatory, glossary, outcome_definitions]
    workflow_state:
      instance_id: wfi_...
      current_stage: new_inquiry
      pipeline_version: 3
    lead_snapshot:
      id: lead_842
      version: 12
      relevant_fields: { ... }
    object_instances: [...]
    prior_decisions: [ad_...]
    inbound_payload_ref: inbound_evt_...

  tools_available:
    [send_reply, transition_lead, update_field, create_task]

  reasoning:
    classification: question            # role-specific shape
    extracted_entities:
      { pflegegrad: 2, relation: child_of_recipient }
    rationale: |
      Sender confirms Pflegegrad 2 for parent. Eligibility clear.
      Standard qualification flow applies.
    confidence: 0.91
    alternatives_considered:
      - option: classify_as_opt_out
        score: 0.02
        rejected_because: "no opt-out signals in body"
      - option: classify_as_unknown
        score: 0.07
        rejected_because: "Pflegegrad explicitly stated"
    rubric_self_assessment:
      - "Confirmed Pflegegrad: yes (explicit)"
      - "Avoided forbidden phrases: yes"
      - "Respected GDPR consent state: yes (prior opt-in on file)"

  decision:
    recommended_actions:
      - kind: update_field
        params: { field: lead.pflegegrad, value: 2 }
      - kind: transition_lead
        params: { to: qualification }
      - kind: send_reply
        params: { template: qualification_followup_de, ... }
    autonomy_check:
      operator_autonomy: hybrid
      confidence_threshold: 0.8
      proceeds_without_approval: true

  outcome_refs:
    outbox_event_ids: [oe_..., oe_..., oe_...]
    failed_actions: []

  cost:
    model_input_tokens: 4231
    model_output_tokens: 412
    duration_ms: 1234
```

**Properties:**
- One per outward agent decision. No "every LLM call" inflation.
- Stored in its own Postgres table for hot queries (last N days configurable, default 90).
- Older records archive to cold storage (§2.5).
- Indexed by `agent.id`, `occurred_at`, `trace_id`, `workspace_id`.
- Encrypted-field redaction in `loaded_context` and `reasoning` follows the same rules as the outbox.
- Access gated by permission (`agent_decisions.read`). Replay/eval access gated separately (`agent_decisions.replay`).

### 2.3 The linkage

Bidirectional, explicit:

- **From decision → data:** `agent_decision.outcome_refs.outbox_event_ids` lists every outbox event the decision produced.
- **From data → decision:** every outbox event whose `actor.kind == agent` carries `causing_decision_id` pointing to the originating Decision Record. Outbox events from human or system actors carry `causing_decision_id: null`.

Both sides share `trace_id` for the originating trigger, so a complete causal thread is a single query on either log.

### 2.4 What each log enables

**Outbox enables:**
- Compliance audit ("show me everything that happened to lead_842")
- Automations (subscribers fire on event types)
- External webhook delivery
- Analytics pipelines (funnel reports, conversion metrics)
- Search indexing
- Replay for migrations
- Real-time UI updates

**Decision Records enable:**
- Critic pattern discovery
- Eval replay (run a new prompt against historical `loaded_context`)
- Promoter "why was this proposed" surface
- Debugging ("why did the agent classify this as opt_out?")
- Cost attribution per agent and per workspace
- Confidence calibration (post-hoc analysis)

### 2.5 Retention and cold storage

Configurable per workspace, with sensible defaults:

```yaml
audit_retention:
  outbox:
    hot_retention_days: 90              # in Postgres, indexed
    archive_to: cold_storage            # then move to object storage
    cold_retention_years: 7             # then purge

  agent_decisions:
    hot_retention_days: 90
    archive_to: cold_storage
    cold_retention_years: 2             # shorter default

  cold_storage:
    kind: s3 | gcs | azure_blob
    bucket: workspace-managed
    encryption: customer_managed_key | platform_managed_key
    partition_strategy: by_date_and_workspace
```

**Hot tier (Postgres):** indexed, queryable, low-latency.

**Cold tier (object storage):** JSON files partitioned `{workspace_id}/{yyyy}/{mm}/{dd}/{kind}.jsonl`. Compressed, encrypted at rest. Restore-on-demand for old compliance queries; not directly queryable from the live UI.

**Purge:** after cold retention expires, files are deleted per workspace policy. Purge events themselves recorded in the outbox (`AuditPurged`).

The user controls the cost/access curve.

---

## Part 3 — Promoter Observability

### 3.1 What the Promoter needs to see

The user approving Critic-proposed prompt deltas is making a high-stakes decision. The UI must answer four questions, immediately and concretely:

1. **What is being proposed?** A specific prompt delta, displayed as a diff.
2. **Why is it being proposed?** The Critic's rationale, structured.
3. **What evidence supports it?** Specific Decision Records that motivated the change, drillable to full context.
4. **How does it perform?** Eval results against the curated set, before/after.

If any is missing or vague, the Promoter cannot meaningfully approve.

### 3.2 The Proposal record

A Critic proposal is itself an artifact. Its lifecycle generates outbox events (`PromptProposalCreated`, `PromptProposalApproved`, etc.). The Critic's reasoning to produce the proposal is itself a Decision Record (the Critic is an agent role).

```yaml
prompt_delta_proposal:
  id: pdp_...
  workspace_id: ws_...
  operator_id: pflegebox_qualifier
  proposed_by: critic
  proposed_at: iso8601
  produced_by_decision_id: ad_...        # Critic's own Decision Record
  status: pending_review | approved | rejected | superseded

  current_prompt_version: 4
  proposed_prompt:
    diff: <unified diff against v4>
    full_text: <complete proposed prompt>

  rationale:
    summary: "Calls under 90 seconds correlate with lost: no_response."
    structured:
      observed_pattern: |
        Of 47 calls with duration < 90s, 38 ended in lost: no_response.
        Of these 38, 31 did not include a decision-maker confirmation.
      hypothesized_cause: |
        Operator discusses eligibility before confirming the listener
        is the decision-maker, causing hang-ups.
      change_mechanism: |
        Add explicit decision-maker confirmation step before
        eligibility discussion.

  supporting_evidence:
    - decision_record_id: ad_xyz_001
      summary: "Call to lead_103, 67s, hang-up at 0:34"
      relevant_excerpt: "..."
    - decision_record_id: ad_xyz_002
      ...

  eval_runs: []                          # populated when Promoter triggers eval

  decision:
    decided_by: user_id | null
    decided_at: iso8601 | null
    decision: approved | rejected | edited_then_approved
    reason: "free text"
    edited_prompt: <text if user edited>
```

### 3.3 The Promoter UI surface

**Inbox view.** List of pending proposals across all operators. Each row: operator, summary, supporting evidence count, age. Filterable, sortable.

**Proposal detail view.** Full context for one proposal:
- Diff panel: current vs proposed prompt.
- Rationale panel: structured rationale; expandable to show the Critic's full Decision Record.
- Evidence panel: list of `decision_record_id`s; each clickable to the full Decision Record (loaded_context, reasoning, decision, outcome_refs → outbox events → actual outcomes).
- Eval panel: "run against eval set" button; results compare current vs proposed on curated scenarios, per-scenario verdicts, regressions called out.
- Decision panel: approve / reject / edit-then-approve; reason capture; rollout preview (canary / full / immediate).

**History view.** Past proposals: approved, rejected, rolled back. For approved, post-deployment metrics — did the change help? Pulled from operator metrics in the outbox stream.

### 3.4 Eval comparison: before/after

When the Promoter triggers an eval run:

- The curated eval set for the operator role is loaded. Each scenario is a `loaded_context` snapshot (often derived from real historical Decision Records, anonymized) plus an expected outcome labeled by domain experts.
- Both the current prompt and the proposed prompt are run against every scenario.
- Per scenario: better / same / worse by the rubric. Numeric scoring where defined.
- Aggregate: "Proposed prompt improves 12, regresses 2, neutral on 6 of 20."
- Each regression is drillable to the specific scenario and the divergence.

A proposal cannot be approved without an eval run in v1 (configurable later, default-on).

### 3.5 Post-deployment guard period

After approval:

- A guard period (e.g. 7 days, configurable) tracks operator metrics derived from the outbox.
- If metrics regress beyond threshold, the Promoter is notified and one-click rollback is offered.
- After the guard period, deployment is ratified and metrics enter the operator's baseline.

This is what makes the Critic itself improvable — accumulate data about which kinds of proposals actually improved metrics in production. Future Critic outputs can be weighted by this track record.

### 3.6 Auditing of Promoter actions

The Promoter is a human actor. Approving / rejecting / editing / rolling back emits outbox events with `actor.kind: human`:

```
event_type: PromptProposalApproved
aggregate: { kind: prompt_proposal, id: pdp_... }
actor: { kind: human, id: user_xyz }
payload: { reason: "...", eval_run_id: er_... }
causing_decision_id: null              # human, not agent
references_decision_id: ad_critic_...  # Critic's Decision Record that proposed it
```

The Promoter does not produce Decision Records (per the scoping rule). But the Critic that produced the proposal *does* have a Decision Record, referenced as `produced_by_decision_id`. Full trail: Critic's Decision Record → Proposal → Promoter approval (outbox event) → Prompt deployed (outbox event) → operator runs new prompt (subsequent Decision Records).

### 3.7 Failure modes to design against

- **Approval fatigue.** Too many low-quality proposals → user skims. Mitigation: minimum evidence threshold (e.g., ≥5 supporting Decision Records); similar findings aggregated; rate limits per operator per week.
- **Rationale theater.** Critic generates plausible rationales not supported by evidence. Mitigation: rationale must reference specific Decision Record IDs; UI surfaces the linkage; spot-checking is one click.
- **Eval gaming.** Proposed prompt wins on eval, loses in production. Mitigation: eval set curated and rotated (active/holdout partition); production guard period catches regressions; Critic track record audited.
- **Silent regression.** Change ships, metrics degrade slowly. Mitigation: guard period auto-rollback on threshold breach; weekly Promoter digest of post-deployment performance.

---

## Closing Note

The two logs share a spine: the system makes its data changes and its agent reasoning legible — but cleanly separated. Data changes are the substrate of automations, audit, and analytics; they happen in the outbox in transactional lockstep with state mutation. Agent reasoning is the substrate of the Critic and Promoter; it lives in Decision Records, sized only to outward decisions that matter. The linkage between them (`causing_decision_id` ↔ `outcome_refs.outbox_event_ids`) lets you trace either direction without forcing one log to carry the other's metadata.

This is what makes "the user observes and supervises, the system runs" tractable in practice: every data change traceable to its cause, every agent decision inspectable on its merits, neither bucket polluted by the other's concerns.

## Changelog
- 2026-05-31 v1: imported from `/Users/ramzi/Downloads/files-6/cross-cutting-patterns-v1.0.md`; frontmatter added (status active), inline "**Status:** v1.0" line removed in favor of frontmatter.
