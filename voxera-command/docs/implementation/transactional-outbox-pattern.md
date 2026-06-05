---
title: The Transactional Outbox Pattern — Architecture & Capacity Analysis
version: 1
status: active
updated: 2026-06-04
owner: you
---

> **Scope.** This is the *generic, application-name-stripped* write-up of the outbox design — a portable reference that stands on its own. The **decision** is recorded in [ADR-0011: Postgres-only outbox implementation](../../decisions/ADR-0011-postgres-outbox-implementation.md); the **application-specific** architecture (Voxera names, event types, NestJS/Prisma wiring) lives in [`docs/architecture/outbox-implementation.md`](../architecture/outbox-implementation.md). This doc is the design stripped of those names so it can be shared or reused without leaking product internals. It is reference material, not the source of truth — if it ever disagrees with ADR-0011 or the architecture doc, those win.

A design write-up for a single-Postgres outbox: how it works, why each piece is there, and the math supporting that a relational database can carry the load. The pattern is implemented to the letter in production; this document strips out the application-specific names so the design stands on its own.

## Problem

A typical write-path mutation in an application produces several side effects: real-time UI fan-out, materialized view updates, search-index writes, third-party API calls, queue messages, audit trails. Three things commonly go wrong:

1. **The primary write commits, a side effect doesn't.** A bug, a network blip, a process restart, and the database state advances while the search index, the cache, or the analytics view stays behind.
2. **One slow downstream stalls everything.** A rate-limited chat-API call, a brownout from a SaaS API, a multi-second ML extraction — naively, they queue behind the realtime UI emit and block it.
3. **Replay is hard.** Recovering from a downstream outage means manually finding "what writes happened between 10:00 and 10:15" and re-firing the side effects. Without an event log, that's archaeology.

The transactional outbox pattern solves (1) and (3) with a single Postgres table; the consumer architecture below solves (2) by isolating slow integrations into independent groups.

---

## 1. The Outbox Table — Producer Side

### 1.1 The atomicity primitive

Every write that has side effects opens a database transaction, persists the primary row, and **emits one or more event rows into an `outbox` table — all in the same transaction**. Postgres gives us atomicity: either both the primary row and its events commit, or neither does. There is no "is the event lost?" question to answer.

```sql
BEGIN;
  UPDATE entity SET status = 'B' WHERE id = $1;
  INSERT INTO outbox (id, sequence, partition, type, payload, ...)
    VALUES (..., 'EntityStatusChanged', '{"from":"A","to":"B"}', ...);
COMMIT;
```

This is the single non-negotiable design decision. Everything else is consequence.

### 1.2 Table schema

```sql
CREATE TABLE outbox (
  id                 TEXT NOT NULL,
  sequence           BIGSERIAL,
  partition          INTEGER NOT NULL CHECK (partition BETWEEN 0 AND 31),
  aggregate_type     TEXT NOT NULL,
  aggregate_id       TEXT NOT NULL,
  ordering_key       TEXT NOT NULL,
  type               TEXT NOT NULL,
  payload            JSONB NOT NULL,
  correlation_id     TEXT,
  idempotency_key    TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempts           INTEGER NOT NULL DEFAULT 0,
  dead_lettered_at   TIMESTAMPTZ,
  PRIMARY KEY (sequence, id)
) PARTITION BY RANGE (sequence);
```

Fields that earn their place:

- `sequence` (`BIGSERIAL`) — monotonic global counter, the canonical ordering primitive. Consumers advance through the sequence; downstream projections that care about ordering enforce it by applying events in sequence order.
- `partition` — application-level shard for parallel consumption. Stored, not computed on read. See §1.4.
- `ordering_key` — the partition function's input. Typically the aggregate's id (so all events for the same aggregate land in the same partition, preserving per-aggregate order). Defaulted to `aggregate_id` if not specified.
- `payload` (`JSONB`) — the event body. Indexable, queryable, compresses well at rest.
- `attempts` / `dead_lettered_at` — for strict-ordered consumers that retry the row itself. Free-order consumers track failures in a separate table (§2.7).
- `idempotency_key` — optional, lets the producer dedup re-emits.

The table is **range-partitioned by `sequence`** (Postgres declarative partitioning). New partitions are precreated by a daily job; cold partitions detach cleanly for archival.

### 1.3 The load-bearing index

```sql
CREATE INDEX outbox_partition_sequence_live_idx
  ON outbox (partition, sequence)
  WHERE dead_lettered_at IS NULL;
```

A **partial index**: only live rows. Every consumer claim query hits it. Two properties:

- The partial predicate keeps the index proportional to *live* events, not historical ones. Dead-lettered rows don't bloat the hot path.
- `(partition, sequence)` is the exact lookup pattern — equality on partition, range on sequence — so the index is the seek path itself.

At 80M live rows × ~16 bytes per entry × 32 partitions, this is ~1.25 GB total, ~40 MB per child partition. A modest `shared_buffers` keeps the working tail of every partition resident.

Supporting indexes for forensics, not the hot path: `(aggregate_type, aggregate_id)`, `(ordering_key, sequence)`, `(created_at)`.

### 1.4 Partition assignment — hash routing

```text
partition = fnv1a_32(ordering_key) % N_PARTITIONS
```

`N_PARTITIONS = 32` is a fixed application constant. The hash is computed once at write time and stored. Reasons to fix it:

- Stored hash means the partial index can do an equality probe; no computation on read.
- Changing `N_PARTITIONS` after launch rehashes every key — events for the same aggregate end up in different partitions, breaking per-aggregate ordering for in-flight work. There is no online resharding.

**Why 32?** It needs to be enough to parallelize across CPU cores (modern boxes: 8–16 cores, two partitions per core for I/O overlap), and few enough that the per-partition advisory lock pool is small. 32 is comfortably in both windows.

### 1.5 The producer API

Producers don't write SQL. They use a fluent builder:

```ts
outbox.builder()
  .withAggregateType(...)
  .withAggregateId(...)
  .withOrderingKey(...)         // defaults to aggregateId
  .withType(...)
  .withPayload(priorState, nextState)   // delta computed automatically
  .withCorrelationId(...)
  .build();

await outbox.emit(tx, event);    // tx is the in-flight database transaction
```

The `emit` call issues an `INSERT INTO outbox` against the *same* tx as the primary write. The pattern's atomicity guarantee depends on this — no async fire-and-forget, no separate connection, no "I'll write the event later".

---

## 2. Consumer Side — How Events Get Processed

### 2.1 Process layout

A consumer process spins up one **`OutboxConsumer` instance per category** (search-index consumer, real-time consumer, notification consumer, etc.). Each instance owns its own loop and competes with other replicas for advisory locks on the 32 partitions.

A single process can host all categories (lightweight) or split them across processes (HA / per-category capacity scaling). The choice is operational, not architectural — the consumer code is identical.

### 2.2 The main loop

```text
while not shutting_down:
  drained = drain_partition(partition)
  if drained == 0:
    listen_for_wakeup_or_timeout(idle_poll_ms)
```

`listen_for_wakeup_or_timeout` is a Postgres `LISTEN` on a channel that an `INSERT` trigger on `outbox` notifies, with a fallback `sleep(idle_poll_ms)`. Idle consumers wake on the trigger, not the timer. Active partitions never sleep — `drain_partition` returns immediately if rows are available.

### 2.3 Claiming work — `FOR UPDATE SKIP LOCKED`

```sql
SELECT id, sequence, partition, ordering_key, type, payload, ...
  FROM outbox
 WHERE partition = $1
   AND sequence > $2                  -- cursor for this consumer group
   AND dead_lettered_at IS NULL
 ORDER BY sequence
 LIMIT 64
 FOR UPDATE SKIP LOCKED;
```

`FOR UPDATE SKIP LOCKED` is the keystone. Multiple consumer instances reading the same partition in parallel each take row-level locks on different rows; the `SKIP LOCKED` clause means they never block each other and never process the same row twice. Combined with the per-partition advisory lock (§2.4) it gives us defense-in-depth concurrency control: even if two replicas mis-acquire the same partition, the row-level lock prevents double processing.

`batch_size = 64` rows per drain. Larger batches reduce per-row overhead; smaller batches reduce the worst-case head-of-line blocking when one row stalls a strict-ordered drain.

### 2.4 Partition ownership — advisory locks

A starting consumer process tries to take a `pg_try_advisory_lock(lock_base + partition)` for each of the 32 partitions. If acquired, the process owns that partition until the lock releases (process exit or explicit unlock). If not acquired, another replica owns it; the trying process sleeps `lock_reacquire_interval_ms` and retries.

`lock_base` differs per consumer group — every group has its own lock-key range — so the search-index group and the real-time group never contend on the same partition's lock. With 32 partitions × K consumer groups, the total advisory-lock footprint is `32 × K`, comfortably below Postgres's defaults.

This pattern replaces external coordination services (ZooKeeper, Redis with leases, etcd) for "which replica owns which partition". The database is already the strongly-consistent source of truth — advisory locks reuse it.

### 2.5 Cursor — per-group, durable, monotonic

```sql
CREATE TABLE outbox_consumer_offsets (
  group_name     TEXT NOT NULL,
  partition      INTEGER NOT NULL,
  last_sequence  BIGINT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_name, partition)
);
```

After each successful drain, the consumer UPSERTs:

```sql
INSERT INTO outbox_consumer_offsets (group_name, partition, last_sequence)
VALUES ($1, $2, $3)
ON CONFLICT (group_name, partition)
DO UPDATE SET
  last_sequence = GREATEST(outbox_consumer_offsets.last_sequence, EXCLUDED.last_sequence),
  updated_at    = NOW();
```

The `GREATEST` guard makes crash recovery trivial: a process dying mid-tx leaves the cursor where it was; the rows get re-claimed; the cursor only advances when a complete drain commits.

Cursors are **per consumer group**. The search-index group at sequence=1000 does not affect the real-time group's cursor — they drain independently. This is what isolates slow integrations from fast ones.

### 2.6 The architectural split — strict-ordered vs free-order drain

This is the most important design decision after the atomicity primitive. The two drain modes serve different needs.

#### Strict-ordered drain

```text
BEGIN
  rows = SELECT ... FOR UPDATE SKIP LOCKED LIMIT 64
  for row in rows:
    for handler in handlers:
      handler.handle(row, tx)            # tx threaded in
  UPSERT outbox_consumer_offsets ...     # cursor advance inside tx
COMMIT
```

Claim, all handler dispatches, and the cursor advance happen **inside a single Postgres transaction**. If any handler throws, the entire tx aborts — the cursor stays, the rows get re-claimed on the next poll. The cost is head-of-line blocking: row N's failure stalls N+1, N+2, ... on the same partition until N either succeeds or dead-letters.

Why pay that cost?

- **Cascade atomicity.** Handlers that write child rows in other tables (e.g. populating a projection table, writing cascade-derived rows in adjacent aggregates) need the cursor advance and the side-effect write to be atomic. Otherwise a crash between handler success and cursor advance causes re-processing — and a non-idempotent handler double-writes.
- **Projection ordering.** Materialized views and analytics tables that UPSERT-on-conflict need events applied in sequence order. Applying "status = B" before "status = A" silently corrupts the projection.

Use strict-ordered for: cascade writes inside the same database, materialized-view projections, anything where ordering or atomicity is part of the correctness contract.

#### Free-order drain

```text
BEGIN
  rows = SELECT ... FOR UPDATE SKIP LOCKED LIMIT 64
  UPSERT outbox_consumer_offsets ...     # cursor advance commits NOW
COMMIT
                                          # tx closed, handlers run after
for row in rows:                          # no tx; per-handler dedup table
  for handler in handlers:
    if handler.matches(row):
      dispatch(handler, row)              # idempotent at the handler level
```

The cursor advances **before** the handlers run. A chat-API 503, a search-engine timeout, a queue-region brownout — none of them stall the queue. Dedup is per `(group, handler, sequence)` in a separate table (§2.7). If a process crashes between handler success and the dedup-row insert, the next sweep re-runs the handler; idempotent handlers (anything that takes a stable id as a key) tolerate the double-run.

Use free-order for: WebSocket emits, search-index upserts, chat/queue sends, external HTTP APIs — anything that's (a) idempotent at the side-effect layer, and (b) where ordering doesn't matter or is enforced at the side-effect destination.

### 2.7 Per-handler dedup — `outbox_handler_dispatches`

```sql
CREATE TABLE outbox_handler_dispatches (
  group_name     TEXT NOT NULL,
  handler_name   TEXT NOT NULL,
  sequence       BIGINT NOT NULL,
  dispatched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_name, handler_name, sequence)
);
```

For each (row, handler) pair:

1. **Probe**: `SELECT 1 FROM outbox_handler_dispatches WHERE ...`. If exists, return — already ran.
2. **Handle**: invoke `handler.handle(row)`.
3. **Mark on success**: `INSERT ... ON CONFLICT DO NOTHING`. The `ON CONFLICT` resolves the rare race where two replicas process the same row.
4. **On failure**: write a row to `outbox_handler_failures` (§2.8).

This gives at-least-once delivery with at-most-once execution per (handler, row) — assuming either the handler is idempotent, or the dedup-marker INSERT runs after the side effect.

The dispatches table is pruned by a daily job (`dispatched_at < NOW() - 30 days`). Its steady-state size is roughly `K_handlers × events_per_day × 30`, which for typical workloads is in the low tens of GB and is easy to vacuum.

### 2.8 Failure tracking + retry — `outbox_handler_failures`

```sql
CREATE TABLE outbox_handler_failures (
  group_name     TEXT NOT NULL,
  handler_name   TEXT NOT NULL,
  sequence       BIGINT NOT NULL,
  attempts       INTEGER NOT NULL DEFAULT 1,
  error          TEXT NOT NULL,
  last_tried_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_name, handler_name, sequence)
);
```

A retry sweep runs every `retry_sweep_interval_ms` per group (free-order only):

- Pick rows where `attempts < max_attempts AND last_tried_at < NOW() - (base_backoff × attempts)`.
- Exponential backoff: 60s, 120s, 180s, 240s for `max_attempts = 5`.
- Limit ~100 rows per sweep so a backlog doesn't monopolize a connection.
- Re-dispatch through the same dedup pipeline; success removes the failure row, failure bumps `attempts`.

On the final attempt the row is implicitly dead-lettered (the failure row remains as the artifact). Strict-ordered consumers don't use this table — they track retries on `outbox.attempts` directly and dead-letter the outbox row itself (`dead_lettered_at = NOW()` once `attempts ≥ max_attempts`).

**Orphan reconciliation.** A separate sweep anti-joins `outbox` against `outbox_handler_dispatches ∪ outbox_handler_failures` over the past hour. Any row with no dispatch/failure record for a handler that should have matched it gets re-claimed. This catches the rare crash window between handler success and the dedup-row INSERT. The lookback is bounded so the anti-join stays fast.

### 2.9 Handler timeouts

Every handler invocation is wrapped in `Promise.race([handler.handle(...), timeout])`. Per-group timeouts:

- Realtime consumers (WebSocket, cache invalidation): 2s. Handlers should finish in <200ms p99; 10× headroom.
- Search-index, analytics, queue sends: 5s. Allows for index-cluster recovery or cloud round-trip jitter.
- Chat API, cross-network HTTP: 10s. One rate-limit backoff cycle.
- ML / document-extraction serverless functions: 30s. Matches the function's own deadline.

A timeout is just another handler error — it flows through the same retry pipeline. The point of the timeout is to prevent a hung handler from monopolizing a partition.

---

## 3. Handler Inventory — The Generic Shape

Every handler implements:

```ts
interface OutboxEventHandler {
  name: string;
  category: HandlerCategory;
  matches(envelope: OutboxEventEnvelope): boolean;
  handle(envelope: OutboxEventEnvelope, tx?: TransactionClient): Promise<void>;
}
```

- `matches(envelope)` is called inside the drain loop; returning `false` skips the handler entirely (no dispatch row, no retry).
- `handle(envelope, tx?)` does the side effect. `tx` is provided for strict-ordered handlers and is the *same* tx the consumer used to claim — so writes through it are atomic with the cursor advance.

Typical consumer groups in a real deployment, in increasing order of timeout headroom:

| Category | Role | Mode | Typical handlers |
|---|---|---|---|
| **Cascade writes** | Cross-table writes inside the same DB | Strict-ordered | Aggregate-derived row writes, denormalization, audit trail |
| **Projection / analytics** | Materialized-view UPSERTs | Strict-ordered | Funnel views, dashboards, daily-rollup tables |
| **Real-time fan-out** | WebSocket emits + cache invalidation | Free-order | UI push, cache busts, in-process pub-sub |
| **Search indexation** | Search engine upserts | Free-order | Search-engine document upserts |
| **Notifications** | Chat / email | Free-order | Chat API, transactional email |
| **Queue fan-out** | Managed queue / pub-sub / log broker producer | Free-order | Cross-service messaging |
| **Heavy compute** | Serverless / ML pipeline triggers | Free-order, long timeout | Document parsing, embeddings, OCR |

Each group has its own cursor, its own retry sweep, and its own advisory-lock range. A slow chat downstream **cannot** stall the real-time fan-out — they run on independent partition leases.

---

## 4. Operational Properties

### 4.1 At-least-once with at-most-once per handler

The system is at-least-once at the event level (a crash between handler success and dedup-row insert causes one redelivery) and at-most-once at the handler level (the dedup table is the source of truth). Handlers must either be idempotent or carry an external dedup key — both common patterns.

### 4.2 Replay

A replay tool resets a `(group_name, partition)` cursor to a chosen sequence; the next drain re-processes everything past it. Used for:

- Deployed bug — re-run handlers after the fix lands.
- Downstream outage — backfill the events that fired during the dead window.
- New handler — drain from sequence=0 to populate a fresh integration.

Idempotency is the contract. A handler that isn't idempotent (e.g. a billing send without an external key) will double-charge on replay; that's a property of the handler, not the framework.

### 4.3 Dead-letter ergonomics

Dead-lettered rows stay in the outbox with `dead_lettered_at` populated. They're invisible to active consumers (the partial index excludes them). Recovery is manual: inspect the error, fix the underlying bug, then `UPDATE outbox SET attempts = 0, dead_lettered_at = NULL WHERE sequence = $1` and the row gets re-processed.

A UI for this is build-when-you-need-it. At sustained dead-letter rates of <1/week, an alert + manual SQL is appropriate; at higher rates the rate itself is the bug.

### 4.4 Adding a new consumer

1. Implement the `OutboxEventHandler` interface.
2. Register it in the per-category handler list.
3. If the category is new, allocate an advisory-lock range and a cursor namespace.
4. If a historical backfill is needed, replay from sequence=0.

Schema-level migrations are not required to add new event types or handlers — both are application-level.

---

## 5. The Math — Why Postgres Can Carry the Load

The interesting question: does a single Postgres instance survive the workload?

### 5.1 Workload shape

Take a typical SaaS internal-app workload:

- ~150 active users at peak.
- ~1 write-bearing action per user per minute.
- Each action emits 3–5 primary outbox rows (the action itself + cascade-derived events).
- Cascade handlers emit secondary rows: 1.5–2× multiplier.

Result:

```
peak sustained = 150 users × (1/60 s) × 5 primary × 1.7 secondary
               ≈ 21 events/sec, call it 30 for headroom
peak burst (batch operations, EOD jobs) ≈ 250 events/sec
```

For a public-facing application with 10× the active users, the equivalent numbers are 300/sec sustained, 2,500/sec burst.

### 5.2 Per-partition drain throughput

Per partition, the drain does `batch_size = 64` rows per claim. Two bottlenecks to consider:

**Strict-ordered drain.** Each handler runs sequentially inside the claim tx. Say 5 handlers × 5 ms median latency per handler = 25 ms per row × 64 rows = 1.6s per drain. That's `64 rows / 1.6s = 40 rows/sec` sustained per partition.

```
strict-ordered ceiling = 40 × 32 = 1,280 events/sec
```

**Free-order drain.** Handlers run after the tx commits; multiple rows' handlers can overlap. Even with conservative serial dispatch per row: 5 handlers × 50 ms p50 = 250 ms per row × 64 rows = 16s per batch — but the *next* claim doesn't wait for the previous batch's handlers to finish, so the effective throughput is `64 rows / claim time ≈ 200 rows/sec` per partition.

```
free-order ceiling ≈ 200 × 32 = 6,400 events/sec
```

Strict-ordered is the bottleneck. **40× headroom over the 30-event/sec sustained target** and **5× over the 250-event/sec burst**. For a 10×-scale workload (300/sec sustained, 2,500/sec burst), the headroom drops to ~4× sustained and 0.5× burst — at that point you scale either by (a) increasing partition count (one-time cost, requires planned rehash) or (b) splitting one consumer category into two with disjoint aggregate-type filters.

### 5.3 Storage budget

Outbox row size: ~520 bytes (400-byte JSONB payload + 120-byte header).

| Window | Rows | Storage |
|---|---|---|
| 1 day | 30/sec × 86,400 = 2.6M | 1.35 GB |
| 30 days | 78M | 40 GB |
| 1 year | 950M | 490 GB |

The table is range-partitioned by `sequence`. Once every consumer group's cursor has passed a child partition's max sequence, that partition can detach to cold storage (object store / archival tier) — the active footprint stays at 30–60 days.

Sidecar tables:

- `outbox_handler_dispatches` — `K_handlers × events_per_day × 30_days`. At K=5, that's 5 × 2.6M × 30 = 390M rows / ~30 GB. Pruned daily.
- `outbox_handler_failures` — typically <10k rows steady-state; bursts to <100k during a downstream outage.
- `outbox_consumer_offsets` — `N_partitions × K_groups` rows. At 32 × 9 = 288 rows, ever.

**Active Postgres footprint: ~40 GB live + ~30 GB dispatches = ~70 GB.** At managed-Postgres rates (~$0.10/GB/month), that's ~$7/month — round-down compared to operating a separate message bus.

### 5.4 Index size and cache behavior

The load-bearing partial index `(partition, sequence) WHERE dead_lettered_at IS NULL` is what every claim query hits. Size:

```
~16 bytes per entry (4-byte int + 8-byte bigint + 4-byte heap pointer)
× 78M live rows (30-day window)
= 1.25 GB total / ~40 MB per child partition
```

A `shared_buffers = 4 GB` Postgres instance keeps every active partition's index resident, end-to-end. The 40 GB heap can't all fit, but the consumer claim only ever touches the active tail of each partition (the most recent few thousand rows since the cursor), which is the hottest part of the heap and naturally cached.

### 5.5 Connection budget

Per consumer process:

- 1 long-held connection for advisory locks.
- 1 `LISTEN` connection per category.
- 1 transient connection per active partition drain.

With ~9 consumer categories and ~3 active partitions per replica at a time, the consumer footprint is ~30 connections. Postgres's `max_connections` default of 100 absorbs this; production deployments typically run a connection pool (pgbouncer or similar) for the application's own traffic and keep consumer connections on a separate slot allocation.

### 5.6 The cumulative argument

Postgres handles this load because each design choice composes:

1. **`FOR UPDATE SKIP LOCKED` scales row-level concurrency without contention.** Multiple consumers reading the same partition take disjoint row locks; no global lock; no spinning.
2. **Range partitioning by `sequence`** localizes writes to the head partition (no append contention across the table) and lets cold partitions detach for archival without touching the hot path.
3. **The partial index `WHERE dead_lettered_at IS NULL`** keeps the hot index size proportional to live events, not history. Dead rows never bloat the seek path.
4. **`LISTEN/NOTIFY`** eliminates polling latency. Idle consumers wake on the next emit, not on a fixed timer.
5. **Per-group cursors and per-handler dedup tables** isolate slow downstreams. A chat-API 503 doesn't stall the WebSocket emit; a search-engine outage doesn't stall the cache invalidation. The architecture is naturally rate-limit-resilient.
6. **Advisory locks for partition ownership** removes the need for a separate coordination service. No ZooKeeper, no Redis with leases, no etcd. The database is already the strongly-consistent source of truth.

The throughput ceiling is 1,280 events/sec strict-ordered and 6,400 events/sec free-order — 5–200× the realistic burst rate. The storage cost is rounding error. The connection cost is a small slice of a standard pool.

**What runs out before Postgres does** is the external integrations themselves: the chat API's rate limit, the search cluster's index pressure, the serverless concurrency cap. That's exactly the right failure mode — and it's exactly why every external integration lives in its own consumer group, fronted by per-handler dedup and per-group retry sweeps.

---

## 6. Anti-patterns

A few designs that look right but don't compose with the rest:

- **Polling the table without `FOR UPDATE SKIP LOCKED`.** Two replicas process the same row. Forces an external locking scheme.
- **One global cursor.** A slow handler stalls every category. Per-group cursors are non-negotiable.
- **Storing the partition function as a generated column or computing on read.** The partial index can no longer use it as an equality predicate; every claim does a full partition scan.
- **Skipping the partial-index filter.** Dead rows accumulate in the index forever; claim queries scan progressively slower.
- **At-most-once delivery (skip the dedup table).** The window between cursor advance and handler success is small but real; over months it produces enough silent failures to corrupt downstream state.
- **Per-row handler tx.** Tempting because it gives strict-ordered semantics for free, but it bottlenecks on Postgres tx-per-second limits at scale. The two-mode split (strict-ordered for cascade/projection, free-order for everything else) is what unlocks the throughput numbers above.

---

## 7. Reference Constants (Typical Values)

These are the defaults a single-Postgres outbox typically ships with. Tune per workload, but the ratios matter more than the absolute values.

```text
N_PARTITIONS                  32        # immutable post-launch
batch_size                    64        # rows per drain claim
idle_poll_ms                  1000      # LISTEN backstop
lock_reacquire_interval_ms    5000      # advisory lock retry
max_attempts                  5         # before dead-letter
retry_sweep_interval_ms       60_000    # free-order retry cadence
handler_timeout_realtime      2000      # WebSocket/cache budget
handler_timeout_indexation    5000      # search engine round-trip
handler_timeout_notification  10_000    # one rate-limit backoff
handler_timeout_compute       30_000    # serverless extraction
```

---

## Appendix A — End-to-End Trace

To make the moving parts concrete, here is a generic trace from one write to its downstream effects:

1. **HTTP request** lands at an API handler.
2. **Command service** opens a database transaction.
3. **Pre-write deriver** runs (compute derived fields, e.g. denormalized counters).
4. **Primary row** persists.
5. **Post-write emitter** invokes the outbox builder, emits 2–5 event rows. Partition assignment is done at this step (`partition = fnv1a(ordering_key) % N_PARTITIONS`).
6. **Transaction commits.** Primary row + event rows are atomically visible.
7. **`LISTEN/NOTIFY` trigger** fires on the `INSERT`, waking any idle consumers on that partition.
8. **Strict-ordered consumers** claim and dispatch inside one tx:
   - Cascade-write handler writes child rows (denormalization).
   - Projection handler UPSERTs a materialized view.
   - Cursor advances atomically with the writes.
9. **Free-order consumers** claim in parallel; cursor advances first, handlers fire post-commit:
   - Real-time consumer pushes a WebSocket message.
   - Cache-invalidation consumer busts the read-side cache.
   - Search-index consumer UPSERTs a document.
   - Notification consumer posts to chat / email / SMS.
   - Queue-fan-out consumer sends to downstream services.
   - Heavy-compute consumer enqueues a serverless / ML job.

User-visible latency:
- Real-time UI refresh: <1s.
- Chat notification: 1–3s (chat API + rate-limit jitter).
- Search-index visible: <2s.
- ML extraction result: 5–20s (matches the compute consumer's timeout).

A dozen distinct side effects per user click, all atomically tied to the primary write, all idempotent under retry, all isolated from each other's failure modes.

---

*This pattern is well-trodden territory — Pat Helland's "Life Beyond Distributed Transactions" (2007) sketches the original case; Microservices/event-sourcing literature has fleshed out the variants. What the design above contributes is the specific combination of (a) Postgres-only, (b) the strict-ordered/free-order split, and (c) per-group cursors with advisory-lock partition ownership. Each piece is independently common; the composition is what makes a single relational database carry a load that's often assumed to need a dedicated message bus.*

## Changelog
- 2026-06-04 v1: initial import of the generic, application-name-stripped outbox write-up as a portable reference, with illustrative vendor/product names scrubbed to neutral placeholders. Decision is recorded in ADR-0011; application-specific architecture is in `docs/architecture/outbox-implementation.md`.
