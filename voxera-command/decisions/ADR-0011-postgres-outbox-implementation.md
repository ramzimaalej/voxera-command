---
id: ADR-0011
title: Postgres-only outbox implementation — 32 partitions, strict-ordered + free-order split, advisory-lock partition ownership
status: accepted
date: 2026-05-31
supersedes: []
superseded_by: null
affects:
  - docs/architecture/outbox-implementation.md
  - docs/architecture/cross-cutting-patterns.md
  - docs/architecture/execution-architecture.md
  - docs/architecture/automations-and-events.md
  - voxera-crm/libs/prisma-schema-backend/
  - voxera-crm/apps/backend/src/app/
---

## Context

[ADR-0003] (two-log audit model) committed Voxera to an outbox carrying every state change, in-transaction with the change that produced it, with per-subscriber cursors driving audit / automations / external webhooks / analytics / search. That ADR settled the *concept*; it did not settle the *implementation*.

The implementation has real architectural choices with propagating consequences:
- **Where does the outbox live?** Same Postgres as the application data, a separate Postgres, or a dedicated message bus (Kafka, NATS, Pub/Sub, SQS)?
- **How is ordering enforced and parallelism achieved?** Single stream, per-aggregate streams, or a fixed-shard count with hash routing?
- **How are slow downstream integrations isolated?** Slack 503s, search-cluster timeouts, and 30-second ML extractions all need to not stall the realtime UI emit.
- **How is partition ownership coordinated across consumer replicas?** Database-native primitives, an external coordinator (ZooKeeper, etcd, Redis with leases), or single-replica only?
- **What's the delivery semantic per handler?** At-most-once, at-least-once, exactly-once?

Voxera's scale envelope (per the math in [`outbox-implementation.md`](../docs/architecture/outbox-implementation.md) §5): ~30 events/sec sustained at current SaaS-internal-tool shape, ~250 events/sec burst; ~300 sustained / ~2,500 burst at 10×-scale. Most off-the-shelf "kafka-or-bust" frameworks target two orders of magnitude beyond this.

The constraints that ruled the choice:
- **Bootstrapped operations.** A separate message bus is a separate operational surface (cluster, replication, IAM, observability, paging). A 5-person team running two motions ([ADR-0009]) cannot afford it.
- **Atomicity with the primary write is non-negotiable.** State changes that "commit but the event didn't fire" silently corrupt downstream projections; an outbox in a separate system loses this guarantee.
- **Replay must be cheap.** Bug-recovery and adding a new handler both need "drain from sequence=0" without operational drama.
- **Ordering matters for some handlers, doesn't for others.** Materialized views need strict order; Slack notifications don't.

## Decision

Adopt the **single-Postgres transactional outbox** with the specific implementation choices documented in [`docs/architecture/outbox-implementation.md`](../docs/architecture/outbox-implementation.md). The load-bearing choices:

1. **Same-Postgres outbox.** The `outbox` table lives in the application Postgres (Cloud SQL per [ADR-0010] direction). Producer emit is `INSERT INTO outbox` inside the same transaction as the primary write. No message bus.
2. **Range-partitioned table by `sequence`** (Postgres declarative partitioning). Daily job precreates new partitions; cold partitions detach for archival without touching the hot path.
3. **32 application-level partitions**, fixed post-launch. Partition assignment via `fnv1a_32(ordering_key) % 32`, computed at write time and stored. The stored value lets the load-bearing partial index do equality probes. Changing N after launch rehashes every key — there is no online resharding.
4. **Partial index `(partition, sequence) WHERE dead_lettered_at IS NULL`.** Hot index size scales with live events, not history. ~40 MB per child partition at 80M-live-row scale.
5. **`FOR UPDATE SKIP LOCKED` claim queries.** Row-level concurrency without contention; multiple consumer replicas reading the same partition take disjoint locks.
6. **Per-group cursors** (`outbox_consumer_offsets`). Each consumer group (search index, realtime, notifications, etc.) drains independently. A slow Slack downstream cannot stall the SocketIO emit.
7. **Strict-ordered vs free-order drain split** — the most important sub-decision after atomicity:
   - **Strict-ordered**: claim + handler dispatch + cursor advance inside one Postgres tx. Used for cascade-table writes and materialized-view projections where ordering or atomicity is part of the correctness contract.
   - **Free-order**: cursor advances first; handlers fire after tx commit; per-handler dedup table makes the side effect idempotent. Used for SocketIO, search indexation, Slack/email, queue fan-out, ML compute — anything where ordering doesn't matter or is enforced at the destination.
8. **Advisory-lock partition ownership** (`pg_try_advisory_lock`). No ZooKeeper, no Redis with leases, no etcd. Per-group lock-key ranges so groups never contend.
9. **Per-handler dedup table** (`outbox_handler_dispatches`). At-least-once delivery, at-most-once per-handler execution (assuming idempotent handlers). Daily-pruned (30-day retention). Backed by an **orphan-reconciliation sweep** that anti-joins `outbox` against `outbox_handler_dispatches ∪ outbox_handler_failures` over a bounded recent lookback (≈1h): any row a handler should have matched but for which no dispatch/failure record exists gets re-claimed. This closes the rare crash window between handler success and the dedup-row INSERT; the bounded lookback keeps the anti-join cheap.
10. **Failure tracking + retry sweep** per group (`outbox_handler_failures`). Exponential backoff (60s, 120s, 180s, 240s; 5 attempts). Final attempt implicitly dead-letters.
11. **`LISTEN/NOTIFY` on outbox INSERT** wakes idle consumers; fallback `idle_poll_ms = 1000` backstop.
12. **`batch_size = 64`** rows per drain claim. Larger batches reduce per-row overhead; smaller batches reduce head-of-line blocking in strict-ordered mode.
13. **Per-group handler-timeout ladder**, each invocation wrapped in `Promise.race([handler, timeout])`: realtime (SocketIO / cache-invalidation) 2s, indexation / analytics / queue sends 5s, notifications (Slack / email) 10s, heavy-compute (Lambda / ML) 30s. A timeout is just another handler error and flows through the same retry pipeline — its purpose is to stop a hung handler from monopolizing a partition. The ladder is set per category so a slow ML extraction's headroom never relaxes the realtime budget.

Throughput ceiling (per §5 math): **1,280 events/sec strict-ordered** and **6,400 events/sec free-order** on a single instance. That's 5–200× the realistic burst rate; the bottleneck will be the external integrations themselves, not Postgres.

## Alternatives considered

- **Dedicated message bus (Kafka / NATS / GCP Pub-Sub / AWS SQS)** — Industry-standard for event-driven systems at scale. Rejected because (a) it doubles the operational surface for a 5-person team, (b) it breaks the atomicity guarantee (primary-write commits, message publish can fail independently), (c) the throughput numbers don't warrant it for ~5+ orders of magnitude — the strict-ordered ceiling of 1,280 events/sec is already 40× the sustained target. We'll revisit if and when scale exceeds the strict-ordered headroom.
- **Debezium-style change-data-capture (CDC)** — Reads Postgres WAL, emits to Kafka. Avoids the application emitting events, but introduces Kafka as the secondary surface and forces every consumer to be Kafka-aware. Loses the strict-ordered/free-order split. Rejected.
- **Polling without `FOR UPDATE SKIP LOCKED`** — Multiple replicas process the same row; forces an external locking scheme. Rejected; the SKIP LOCKED primitive is exactly what the database gives us for free.
- **Single global cursor (no per-group)** — A slow handler stalls every category. Rejected as a non-starter.
- **Per-row handler transaction** — Tempting because it gives strict-ordered semantics for every handler. Bottlenecks on Postgres tx-per-second at scale. Rejected; the two-mode split is what unlocks the throughput numbers.
- **Computed partition column (generated, not stored)** — The partial index can no longer use partition as an equality predicate; every claim does a full partition scan. Rejected — the partition value is stored, not computed.
- **Higher partition count (64, 128, 256)** — Each adds advisory-lock overhead and dilutes the per-partition working set in `shared_buffers`. 32 is the right point for 8–16-core hosts with 2 partitions per core for I/O overlap.

## Consequences

- **Positive:**
  - **Atomicity with the primary write.** The single non-negotiable correctness property is structurally enforced — there is no "did the event fire?" failure mode.
  - **One operational surface.** Application Postgres is already the strongly-consistent source of truth; reusing it for the event log avoids running a second cluster.
  - **Replay is a UPDATE on `outbox_consumer_offsets`.** Bug recovery, new-handler backfill, downstream-outage repair — all one query.
  - **Failure isolation by design.** A 30-second ML extraction in the heavy-compute consumer cannot stall the 200ms realtime fan-out — they run on independent partition leases with independent cursors.
  - **No coordination service.** Advisory locks replace ZooKeeper / Redis / etcd for partition ownership.
  - **At-least-once + at-most-once-per-handler** is the right delivery semantic for ~every side-effect category Voxera has.
  - **Storage cost is rounding error.** ~$7/month at 30-event/sec scale on managed Postgres.

- **Negative / risks:**
  - **Throughput ceiling is real.** Strict-ordered drain caps at ~1,280 events/sec on a single instance. At 10×-scale (300 sustained / 2,500 burst), the sustained headroom drops to 4× and burst headroom is below 1×. Scale path: (a) split a strict-ordered consumer category into two with disjoint aggregate-type filters, or (b) add Postgres read replicas with `FOR UPDATE SKIP LOCKED`-aware routing, or (c) revisit the bus question.
  - **`N_PARTITIONS = 32` is immutable.** Changing it requires a planned rehash of in-flight work. The number was chosen for current + 10× scale; choosing differently later is expensive.
  - **Idempotency is the handler's contract, not the framework's.** A non-idempotent handler (e.g., a billing send without an external key) will double-charge on replay. The framework gives at-least-once; the handler must absorb it.
  - **Postgres becomes the single point of failure for the event log.** Standard managed-Postgres HA (Cloud SQL REGIONAL availability) handles this; failover is invisible at the consumer level (cursors are durable in the same DB).
  - **Schema-level discipline required.** Forgetting to `INSERT INTO outbox` inside the primary tx breaks atomicity silently. The producer API (`outbox.emit(tx, event)` against the same tx as the primary write) enforces this via the type system — any new code that bypasses the builder must be caught in code review (see `.claude/rules/backend.md`).

- **Follow-ups:**
  - Implement the `outbox`, `outbox_consumer_offsets`, `outbox_handler_dispatches`, `outbox_handler_failures` tables in the Prisma schema (`voxera-crm/libs/prisma-schema-backend/`).
  - Build the `OutboxConsumer` runtime in the NestJS backend with strict-ordered and free-order modes. Categorize the existing event types per §3 of `outbox-implementation.md`.
  - Update `voxera-crm/docs/patterns/` with a code-pattern doc (`outbox-implementation-nestjs.md`) showing the producer builder, the consumer class, and the handler interface as they land in the codebase.
  - Add a lint rule to `voxera-crm/.eslintrc` or backend `no-restricted-syntax` to flag `prisma.outbox.create` calls outside the builder (forces the type-safe emit path).
  - Add observability — span attributes for outbox emit (sequence, partition, type), counter metrics for dispatch + failure rates per group.
  - Decide on the per-group handler categories early — the math in §5 is sensitive to the strict-ordered handler count. Default starting set: cascade-writes (strict), projections (strict), realtime fan-out (free), search index (free), notifications (free), queue fan-out (free), heavy-compute (free).
  - Implement `LISTEN/NOTIFY` trigger + a daily partition-creation job + a daily prune job for `outbox_handler_dispatches`.
  - Implement the orphan-reconciliation sweep (bounded ~1h anti-join of `outbox` against dispatches ∪ failures) and the per-group `Promise.race` timeout ladder (2s / 5s / 10s / 30s) as part of the `OutboxConsumer` runtime.

## Relationship to prior ADRs

- **Implements [ADR-0003]** (two-log audit model). ADR-0003 committed to the outbox concept; this ADR settles the implementation. The Decision Records side of the two-log model is unchanged.
- **Depends on [ADR-0002]** (custom state machine on Postgres). The state machine's transitions are the primary writes; the outbox emits ride atomically alongside them inside the same transaction. ADR-0002's "Postgres + a job runner + a publisher" line is what this ADR fleshes out — the publisher is the OutboxConsumer runtime.
- **Depends on [ADR-0010]** (GCP + Fabric for infra). The Postgres instance hosting the outbox is Cloud SQL Postgres per the ADR-0010 default. HA + EU residency apply.
- **Constrains future scale decisions.** If we exceed the strict-ordered 1,280 events/sec ceiling, we either split categories (cheap) or revisit the bus question (expensive). The strict-ordered/free-order split is the lever we tune first.
- **Does not affect [ADR-0004, 0005, 0006, 0007, 0008, 0009]** — engine roster, DSL vocabulary, forms layer, voice stack, wedge, and motion structure are all unaffected by the implementation detail of the outbox.
