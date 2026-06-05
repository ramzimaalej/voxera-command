---
id: ADR-0003
title: Two-log audit model — outbox for data changes, Decision Records for agent reasoning
status: accepted
date: 2026-05-31
supersedes: []
superseded_by: null
affects:
  - docs/architecture/cross-cutting-patterns.md
  - docs/architecture/architecture-vision-and-principles.md
  - docs/architecture/multi-agent-architecture.md
  - docs/architecture/automations-and-events.md
  - docs/architecture/execution-architecture.md
---

## Context

The system has two distinct audit concerns:
1. **What happened to the data** — every state change, by any actor (human, agent, system). This drives audit logs, automations, external webhooks, analytics indexing, search indexing, and replay.
2. **Why an agent did what it did** — the reasoning, alternatives considered, confidence, autonomy check, and outward actions of every agent decision. This drives the Critic, evals, and the Promoter's "why" surface.

A single combined log would either (a) pollute the data stream with verbose reasoning blobs (breaking subscribers that expect clean state-change events), or (b) lose the reasoning trail when collapsed into actor metadata. Either choice damages the agent-as-proposer model that the product depends on (P3 in `architecture-vision-and-principles.md`).

## Decision

Maintain two append-only logs, linked but separate:

- **Outbox** — single Postgres table, in-transaction with the state change. Every `event_type` (`FieldChanged`, `StageTransitioned`, `FormSaved`, `PrimitiveDispatched`, `LeadWon`, etc.) lands here. Carries `actor` + optional `causing_decision_id`. Per-subscriber consumer cursors (audit log, analytics, automations, external webhooks, search).
- **Decision Records** — separate table, one record per outward-facing agent decision. Carries trigger, business-context version, prompt version, model, alternatives considered, recommended actions, confidence, autonomy check, `outcome_refs.outbox_event_ids` pointing into the outbox.

Linkage is bidirectional: outbox events from agents reference the Decision Record (`causing_decision_id`); Decision Records list the outbox events they produced (`outcome_refs`). Decision Records are produced **only** for reasoning steps that result in outward action — internal LLM calls within a multi-step agent invocation are observability traces, not Decision Records.

## Alternatives considered

- **Single combined audit log** — simpler infra, but either pollutes subscribers with reasoning payloads or loses the reasoning trail.
- **Decision Records as a side-table on the outbox** — keeps them coupled to data changes, but loses the "Decision Record exists before action runs" property (which makes understanding replayable separately from behavior — P7).
- **Reasoning lives in OpenTelemetry spans only** — fine for debugging, but spans are ephemeral, not query-shaped, and not user-visible. The Critic and Promoter need a first-class artifact.

## Consequences

- Positive:
  - Outbox stays clean for downstream subscribers — analytics, search, external webhooks see uniform state-change events.
  - Decision Records are queryable, versionable, linkable; the Critic and Promoter can operate against them as artifacts.
  - "Analyze before Act" works: the system's *understanding* of an inbound is persisted independently of what it does next, enabling re-analysis and re-action separately (per the four-stage inbound pipeline, P7).
  - Every agent-produced artifact (Business Context edits, DSL diffs, prompt deltas, report drafts) carries `produced_by_decision_id` — replay, critique, and audit are uniform across the roster.
- Negative / risks:
  - Two log surfaces to evolve in lockstep. Schema changes that affect linkage need coordinated migrations.
  - Strict "outward action ⇒ Decision Record" scoping requires discipline; over-recording bloats the table and dilutes signal.
- Follow-ups:
  - Document the threshold for "outward decision" in agent-author guidelines.
  - Retention policy: outbox 7 years (compliance), Decision Records align with outbox per workspace.
