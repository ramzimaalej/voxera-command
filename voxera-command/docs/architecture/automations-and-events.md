---
title: Automations and Domain Events
version: 1
status: active
updated: 2026-05-31
owner: you
---

# Automations & Domain Event Delivery — v1.0

**Vocabulary note.** Per `workflow-dsl.md`, the internal vocabulary is generic ("workflow," "process instance"); the v1 CRM user-facing labels are "Pipeline," "Lead." References below use whichever is clearer in context.


---

## 1. Three Subscriber Kinds

A domain event in the outbox can have multiple subscribers of three kinds:

1. **External webhook** — user supplies URL + optional HMAC secret. Outbound HTTP, signed payload, retries, DLQ.
2. **Internal automation** — workspace-scoped declarative recipe that reacts to events with actions.
3. **Built-in sinks** — audit log (always), analytics index (always), search index (always). Not user-configurable.

User configures (1) and (2). (3) is automatic for every event flowing through the outbox.

---

## 2. Sync vs Async

**Default: async.** Domain events do not block the transition that fires them. The transition commits, outbox event is written in the same transaction, publisher fans out afterward.

**Optional: synchronous subscribers.** For genuine "must check before allowing the transition" cases (fraud check, external eligibility), a subscriber can be marked synchronous. The transition blocks until the subscriber responds. Strict short timeout (default 5s, max 30s) + circuit breaker + fallback policy (allow vs deny on timeout).

Use sync subscribers sparingly. Most needs that feel sync are better modeled as: fire async event → external system → webhook back → resume workflow via `pending_awaits`.

---

## 3. Event Envelope (Universal)

```yaml
event_id: 01JCB...        # ULID, idempotency key for subscribers
event_type: enrollment_completed
schema_version: 1
workspace_id: ws_...
pipeline_id: pflegebox_funnel
pipeline_version: 3
workflow_instance_id: wfi_...
lead_id: lead_...
occurred_at: 2026-05-13T14:23:01Z
actor:
  kind: human | agent | system
  id: ...
causing_decision_id: ad_... | null    # set when actor.kind == agent
payload: { ... user-defined per the DSL ... }
```

User-defined `payload` from the DSL is wrapped in this envelope. Subscribers receive the full envelope.

Encrypted fields are **redacted by default** when an event leaves the workspace boundary. To include them, the DSL's `payload` definition must reference the field explicitly AND the subscriber must have an `allow_encrypted: true` flag on the subscription. Both conditions are audit-logged.

---

## 4. DSL Extension for Subscriptions

```yaml
domain_events:
  - id: enrollment_completed
    fires_on:
      - { type: stage_entered, stage: enrollment_signed }
    payload:
      lead_id: lead.id
      pflegegrad: lead.pflegegrad
      pflegekasse: pk_app.pflegekasse_name
    subscribers:
      - kind: webhook
        url: https://partner.example.com/hooks/enrollment
        secret_ref: secrets.partner_acme_hmac
        retry:
          max_attempts: 10
          backoff: exponential
          initial_delay: 30s
        timeout: 10s
        sync: false

      - kind: automation
        automation_id: notify_logistics_team
```

`secret_ref` points to a workspace secrets store. The publisher never sees the secret in DSL.

---

## 5. Automations

An automation is a workspace-scoped declarative recipe: `trigger → optional condition → ordered actions`. They live one level above workflows — they can affect multiple pipelines, multiple leads, or fire on workspace-wide events.

```yaml
automations:
  - id: notify_logistics_team
    label: Notify logistics on new enrollment

    trigger:
      kind: domain_event
      event_type: enrollment_completed

    condition:
      "==": [ { "var": "payload.pflegegrad" }, 5 ]

    actions:
      - kind: send_email
        primitive: notify_logistics_high_pflegegrad
        to: workspace.logistics_dl

      - kind: create_task
        assignee: lead.assigned_agent_id
        title: "High-Pflegegrad enrollment requires expedited delivery"
        due: "+1d"

      - kind: emit_event
        event_type: logistics_notified
        payload:
          lead_id: payload.lead_id
          pflegegrad: payload.pflegegrad
```

---

## 6. Automation Trigger Kinds

| Kind | Fires on |
|---|---|
| `domain_event` | A user-defined event matching `event_type` |
| `system_event` | Built-in events: `stage_entered`, `stage_exited`, `lead_won`, `lead_lost`, `form_sealed`, `form_unsealed`, `workflow_migrated`, `signature_completed`, `agent_decision_recorded`, etc. |
| `schedule` | Cron expression, workspace timezone |
| `external_webhook` | Workspace-level inbound webhook (distinct from pipeline-level `webhook_handlers` which route into a specific lead) |

System events let automations react to things the user didn't explicitly model as domain events — useful escape hatch.

---

## 7. Automation Action Library

Actions are the same primitives plus a few orchestration verbs:

- **Primitives:** `send_email`, `send_sms`, `make_call`, `signature_request` (same definitions as in workflow DSL — single source of truth)
- **`transition_lead`** — force a stage change on a specific lead
- **`update_field`** — write to lead / object instance / task scratchpad
- **`create_task`** — create a human task
- **`emit_event`** — fire another domain event (enables chaining)
- **`call_external`** — generic outbound HTTP with field mapping
- **`agent_reason`** — invoke a runtime agent with prompt + tool subset; agent tool calls become further actions
- **`assign_lead`** — change lead ownership
- **`add_to_pipeline`** — enroll a lead in another pipeline (cross-sell)

---

## 8. Cross-Pipeline Coordination

Custom objects shared across leads (e.g. a `Household` with multiple recipients) enable cross-pipeline automations:

```yaml
automations:
  - id: cross_sell_supplements_on_pflegebox_enrollment
    trigger:
      kind: system_event
      event_type: lead_won
    condition:
      and:
        - { "==": [ { "var": "payload.pipeline_id" }, "pflegebox_funnel" ] }
        - { "==": [ { "var": "lead.supplements_lead_status" }, null ] }
    actions:
      - kind: add_to_pipeline
        lead_id: payload.lead_id
        pipeline: care_supplements_funnel
        stage: new_inquiry

      - kind: send_email
        primitive: supplements_intro_de
```

This pays for the "objects can participate in pipelines" investment.

---

## 9. Delivery Infrastructure

**Publisher service** reads `outbox_events`, fans out per subscriber.

- Per-subscriber consumer cursor (per webhook URL, per automation_id).
- At-least-once delivery. Subscribers idempotent on `event_id`.
- Webhook delivery: HTTP POST, signed with `X-Signature: hmac-sha256=...` using the workspace's signing key referenced by `secret_ref`. Signed header includes timestamp to prevent replay.
- Retry: exponential backoff, jitter, configurable max attempts. After exhaustion → DLQ.
- DLQ is browsable in admin UI; supports manual replay and bulk replay-since-timestamp.

**Automation execution** runs as in-process work in the publisher, dispatched to the engine via the same API external integrations would use (so automations get no special privileges — same RBAC, same audit).

> *Full publisher / consumer architecture in [`outbox-implementation.md`](./outbox-implementation.md). Webhook delivery and automation execution are **free-order** consumer groups per that spec (per-handler dedup table, exponential backoff retry sweep, advisory-lock partition ownership). A slow webhook endpoint cannot stall the realtime fan-out — different consumer groups, disjoint cursors. Decision recorded as [ADR-0011](../../decisions/ADR-0011-postgres-outbox-implementation.md).*

---

## 10. Ordering, Backpressure, Failure Isolation

- **Per-workflow-instance ordering** preserved — events from the same instance fan out in commit order to each subscriber.
- **Cross-instance ordering** not guaranteed.
- **Failing subscriber isolation:** each subscriber has its own queue + cursor; a slow or broken webhook only backs up its own pipeline, not others.
- **Backpressure:** publisher tracks lag per subscriber; admin UI surfaces lag SLO breaches.
- **Loop protection:** automation chains capped at N hops (default 10) per originating event to prevent infinite loops. Hop counter rides in the envelope.

---

## 11. Idempotency & Replay

- Subscribers idempotent on `event_id`. Replays don't double-act.
- Automation runs deduped on `(automation_id, event_id)`.
- Outbox retained per workspace policy (per `execution-architecture.md` §10).
- Admin can replay: a single event, a range of events to one subscriber, or backfill after a misconfiguration.

---

## 12. Permissions Model (Sketch)

- `automation.create` / `automation.edit` / `automation.delete` — admin role
- `automation.run_history.view` — for debugging
- `webhook_subscriber.create` / `webhook_subscriber.rotate_secret`
- `event.replay` — replay events to a subscriber (separate from edit)
- `event.payload.view_encrypted` — view encrypted fields in event detail UI

The agent inherits the autonomy level of whoever's running it but is always bounded by the workspace's RBAC.

---

## 13. The Runtime Agent's Place in This Picture

When a webhook handler fires (per the four-stage pipeline in `cross-cutting-patterns.md` §1):

1. Router matches inbound message to a lead → `pending_awaits` first, then `webhook_handlers` rules.
2. Engine invokes the configured Operator with the inbound + loaded Business Context.
3. Operator produces a Decision Record; engine reads `recommended_actions`.
4. Each action becomes a normal engine transition (`update_field`, `transition_lead`, `move_to_lost`, `send_reply`, etc.) flowing through the same audit + outbox path with `causing_decision_id` set.

The agent gets no special engine privileges. Every action is auditable, replayable, and rate-limited by the same policies.

For automation-invoked agent reasoning (the `agent_reason` action kind), the same flow applies: invoke agent → produce Decision Record → enact recommended actions → emit outbox events.

---

## 14. Open Questions

- **Schema registry for domain events.** Should event payload schemas be versioned and registered separately (Avro/JSON Schema style) for subscriber contract stability? Recommend yes for any workspace with external integrations.
- **Dead-letter UX.** How much triage tooling in v1? At minimum: list, inspect payload, retry, suppress.
- **Replay safety for automations.** Replaying a `lead_won` event would re-fire cross-sell automations. Default to "replay-aware" mode where automations check for prior side effects, or expose an explicit "dry run" replay mode.
- **Event sampling for high-volume types.** If `field_changed` events from a busy workspace overwhelm the system, sampling/aggregation at the outbox level, or push that concern to subscribers?

## Changelog
- 2026-05-31 v1: imported from `/Users/ramzi/Downloads/files-6/automations-and-events-v1.0.md`; frontmatter added (status active), inline "**Status:** v1.0" line removed in favor of frontmatter.
