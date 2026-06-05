---
id: ADR-0002
title: Custom state machine on Postgres, not Temporal/Inngest/Restate
status: accepted
date: 2026-05-31
supersedes: []
superseded_by: null
affects:
  - docs/architecture/execution-architecture.md
  - docs/architecture/workflow-dsl.md
---

## Context

We need a durable workflow engine to drive leads through pipeline stages, dispatch primitives (emails, SMS, calls, signature requests), park on `pending_awaits` until matched, and survive migrations of in-flight leads when the pipeline DSL evolves. The off-the-shelf options are Temporal, Inngest, and Restate — all mature, all general-purpose.

The forces in tension:
- The workflow DSL is highly constrained (linear stages, declarative triggers, finite primitive set) — most of what general-purpose engines offer is unused.
- The durable surface is narrow: current stage, pending awaits, scheduled jobs, form state.
- Version migration of in-flight leads must be first-class — generic engines treat this as a hard problem; we have to own the state model to make it tractable.
- Agent reasoning around webhook handlers needs to plug into the engine as a tool-using sub-process, not as Temporal-style activities — the impedance mismatch hurts.

## Decision

Build a custom state machine on Postgres. Logical tables (per `execution-architecture.md` §2): `workflow_instances`, `form_responses`, `pending_awaits`, `primitive_invocations`, plus the outbox. A job runner and a publisher round it out. No Temporal/Inngest/Restate dependency.

## Alternatives considered

- **Temporal** — battle-tested durable execution, but the SDK-bound activity model fights the declarative DSL, and migrating in-flight executions is famously painful. Adds a heavyweight operational dependency for v1.
- **Inngest** — lighter than Temporal, function-oriented, but still requires modeling our DSL primitives as functions and ceding control of the state model. The hosted offering pulls us off Postgres.
- **Restate** — newest of the three, attractive primitives, but immature ecosystem and the same impedance mismatch as Temporal for our DSL shape.

## Consequences

- Positive:
  - Engine fits the DSL exactly — no translation layer, no impedance mismatch.
  - In-flight version migration is straightforward because we own every field of `workflow_instances`.
  - Operational footprint is one stack (Postgres + job runner + publisher), all already required.
  - Outbox + two-log audit (see [[ADR-0003]]) lives in the same Postgres transaction as the state change.
- Negative / risks:
  - We carry the cost of building scheduler reliability, retry semantics, and timer correctness ourselves.
  - If the DSL surface grows beyond the linear-funnel shape, we may revisit. P13 in the principles doc commits us to keeping the engine workflow-kind-agnostic to absorb that growth without a rewrite.
- Follow-ups:
  - Engine correctness test suite (chaos, restart, double-dispatch) before the second customer goes live.
  - Document the upgrade path if we ever introduce a non-linear workflow kind.
