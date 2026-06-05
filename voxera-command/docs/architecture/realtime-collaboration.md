---
title: Real-Time Collaboration
version: 1
status: active
updated: 2026-05-31
owner: you
---

# Real-Time Collaboration — v1.0

How the system handles multiple users interacting with the same data at the same time. Covers three distinct cases with different concurrency models, unified under a single real-time push channel.

**Vocabulary note.** Per `workflow-dsl.md`, the internal vocabulary is generic ("workflow," "process instance"); the v1 CRM user-facing labels are "Pipeline," "Lead." References below use whichever is clearer in context.


---

## 1. The Three Cases

Real-time collaboration in this system is not one problem. It is three problems that share infrastructure.

| Case | What | Concurrency model |
|---|---|---|
| **Case 1: Live record viewing** | Multiple users viewing the same lead, dashboard, or pipeline. Changes from any source (other users, agents, system) appear live. | No conflicts. Outbox events fan out to subscribed clients. |
| **Case 2: Concurrent operational edits** | Multiple users editing the same lead, custom object instance, or workflow scratchpad. | Last-writer-wins per data piece, with field/record/document granularity. |
| **Case 3: Configuration editing** | A user editing system configuration (pipeline, Business Context section, agent definition, report definition). Other users observe live, including uncommitted changes, but cannot write. | Section-level write lock with read-through streaming. |

All three share the same SSE push channel and the same outbox stream as their source of truth. Each adds its own semantics on top.

---

## 2. The Real-Time Channel

### 2.1 Transport: Server-Sent Events (SSE)

One-way push from server to client. HTTP-friendly. Easy behind load balancers and CDNs. Sufficient for all three cases.

Clients open an SSE connection scoped to a **subscription context**: the workspace plus the set of entities the user is currently viewing (a lead, a dashboard, a configuration artifact, etc.). The server pushes events relevant to that context.

Bi-directional features (presence updates, edit-field indicators) use small HTTP POST endpoints for client → server signals; the server then echoes them out on SSE to other subscribers. WebSockets are deferred to v2 unless a feature demands them.

### 2.2 Two event streams over one channel

The SSE channel carries two categories of message:

**Committed events** — sourced from the outbox. Every outbox event whose `aggregate` matches the subscriber's context is pushed. This serves case 1 universally and case 2 for committed writes.

**Ephemeral events** — not in the outbox. Includes:
- **Presence**: `UserViewing(user_id, entity_ref)`, `UserStoppedViewing`, `UserEditingField(user_id, field_path)`, `UserStoppedEditingField`
- **Uncommitted edits** (case 3 only): `UncommittedChange(artifact_id, section_path, draft_content_diff)` — streamed as the lock-holder edits their draft
- **Lock state**: `LockAcquired(artifact_id, section_path, user_id)`, `LockReleased`, `LockStolen`, `LockTimeoutWarning`

Ephemeral events have a brief TTL (typically session-scoped) and are not persisted. Clients tolerate missing ephemeral events; presence will re-sync on reconnect.

### 2.3 Subscription model

When a client opens a view (say, lead detail for `lead_842`):

1. Client makes an HTTP GET for the current state.
2. Client opens an SSE connection with a subscription request: `{ workspace_id, contexts: [{kind: lead, id: lead_842}] }`.
3. Server pushes the **resume cursor** for the outbox (the last `outbox_event.id` known to be applied to the returned state).
4. Server streams subsequent outbox events whose aggregate matches the context, starting from the cursor (catching up any events that occurred between GET and SSE open).
5. Server pushes ephemeral events relevant to the context (presence, lock state) as they happen.

Reconnection: client resumes from the last received `outbox_event.id`. Events missed during disconnect are replayed from the outbox.

### 2.4 Filtering and authorization

Every event pushed to a client is filtered by:
- **Subscription context** — does it match an entity the client is viewing?
- **Permission** — does the user have read access to the aggregate?
- **Encryption redaction** — encrypted field values are redacted in the pushed event the same way they are in the outbox, unless the user has `field.view_encrypted`.

The server-side SSE multiplexer keeps per-connection filter state. Cheap.

---

## 3. Case 1 — Live Record Viewing

The simplest case. Any committed outbox event whose aggregate matches a subscriber's context is pushed.

### Behavior

- User A is viewing lead_842 detail. User B advances lead_842 to qualification.
- Engine writes the transition and emits `StageTransitioned` to the outbox.
- Publisher (the SSE multiplexer is one of its subscribers) pushes the event to User A's SSE connection.
- User A's client applies the patch to local state. UI updates.

### Properties

- **No conflict resolution.** Single source of truth (the engine) writes; viewers reflect.
- **Source-agnostic.** Same path whether the writer is a human, an agent, or the scheduler. Agent writes carry `causing_decision_id`; the client can use this to surface "updated by Operator pflegebox_qualifier" with a drillable link to the Decision Record.
- **Includes synthetic events.** `StageSkipped` events from backward movement push the same way.

### Reporter/dashboard views

Reports backed by aggregations also subscribe to the outbox events that affect their inputs and re-aggregate (debounced) when relevant events arrive. Heavy aggregations may use server-side debouncing or polling fallback to avoid recomputing on every event; defined per report.

---

## 4. Case 2 — Concurrent Operational Edits (LWW-per-data-piece)

Two or more users editing the same lead, custom object instance, or workflow scratchpad concurrently. Resolved by last-writer-wins with granularity tuned per data kind.

### 4.1 Granularity

| Data kind | Granularity | Rationale |
|---|---|---|
| Lead fields | Field-level | Independent fields; two users editing `email` and `phone` simultaneously should both succeed. |
| Custom object instance fields | Field-level | Same as lead fields. |
| Form submissions | Record-level | A form submit is a coherent atomic write of intent. Auto-saves between submits are field-level; the final submit is record-level. |
| Workflow task scratchpad | Document-level | It's a single JSON doc per workflow instance; either user's save wins it all. Use a custom object instead if finer granularity is needed. |

### 4.2 LWW mechanics

Every writable data piece carries a server-assigned version + timestamp:

```yaml
field_version:
  field_path: lead.email
  value: "mueller@example.de"
  written_at: 2026-05-13T14:23:01.234567Z   # server timestamp (monotonic)
  writer:
    kind: human | agent | system
    id: user_xyz | pflegebox_inbound_triage | scheduler
  outbox_event_id: oe_...                    # the write's outbox event
  causing_decision_id: ad_... | null
```

On write:

1. Client submits `{field_path, new_value, base_version_seen}` to the engine.
2. Engine acquires the workflow_instance lock (existing optimistic locking; v0 unchanged).
3. Engine reads the field's current `written_at`.
4. **If `base_version_seen < current`:** another writer beat this one. Engine still applies the new write (writes are not rejected) but stamps it with the new server timestamp. Both the old write and the new write are in the outbox as separate `FieldChanged` events. The new write becomes current.
5. **If `base_version_seen == current`:** trivial write, applied.
6. Engine emits `FieldChanged` outbox event with `before`, `after`, `actor`, `causing_decision_id`, timestamp. New version is the timestamp.

**Important**: LWW means the last *write* wins, not the last *read base*. We don't reject writes for being stale. We accept all writes, order them by server timestamp, and the latest one is what's persisted. This is the simplest and most pragmatic interpretation.

### 4.3 Auto-save behavior

JSON Forms auto-save (per `forms-renderer-scope.md`) submits field-level deltas on idle. Each delta is one or more `update_field` operations, each emitting its own `FieldChanged` outbox event. With multiple users editing the same form simultaneously, the resulting outbox stream interleaves their field updates naturally.

If two users edit the *same field* concurrently, the later auto-save wins for that field. The earlier write is still in the outbox (audit truth preserved).

### 4.4 Conflict notification UX

When User A's write is overwritten by User B (User A's write was applied, then User B's write to the same field arrived later and won):

- **Live notification to User A on the affected field**: a toast or inline indicator: "Your change to `email` was overwritten by User B." With "view their value" / "restore mine" affordances.
- **The notification is computed client-side**: User A's client knows it wrote `value_A` at `T_A`. On receiving the `FieldChanged` outbox event with `after: value_B, written_at: T_B > T_A, writer: user_B`, the client detects the overwrite and renders the notification.
- **No server-side notification table.** This is purely a UI behavior driven by the outbox stream.

For agent writes that overwrite a user's edit: same notification UX, just with "Operator pflegebox_qualifier" as the writer and a link to the Decision Record.

### 4.5 Soft-conflict indicator (presence-driven)

While User A is typing in the `email` field, the client sends `UserEditingField(field_path=lead.email)` to the server (debounced). Server echoes to other subscribers of the same lead.

When User B's client receives that event, the `email` field shows a soft indicator: "User A is editing this." User B can still edit — this is LWW, not pessimistic locking — but they're warned. Last write still wins.

### 4.6 Audit truth

Every write is preserved in the outbox even if it was overwritten 200ms later. The outbox is the historical record; the entity's current value is just "whatever the latest write to it was." This means:
- Audit queries can show the full sequence of attempts.
- The Critic and other consumers can analyze write-collision patterns if needed.
- An admin can answer "did User A's edit ever happen?" with "yes, here it is in the outbox, and here's the subsequent write that overwrote it."

---

## 5. Case 3 — Configuration Editing (Section-Level Write Lock)

Editing system configuration — pipelines, Business Context sections, agent definitions, report definitions — uses a write lock with read-through streaming. Only the lock-holder can save changes; other users see the in-progress edits live but cannot write.

### 5.1 Locked artifacts and granularity

Locks are **section-level** within these artifact kinds:

| Artifact | Section grain |
|---|---|
| Business Context | One section (e.g. `brand_voice`, `regulatory`, `glossary`) |
| Pipeline definition | One pipeline (the whole pipeline is one section for lock purposes; finer-grain locking inside a pipeline isn't worth the UX cost) |
| Agent definition | One agent |
| Report definition | One report |
| Custom object definition | One object |
| Workspace primitives | One primitive |
| Automations | One automation |

A user editing the `brand_voice` Business Context section does not block editing of `regulatory`. A user editing the `pflegebox_funnel` pipeline does not block editing of `home_supplements_funnel`.

### 5.2 Lock lifecycle

```
User A opens an editor for section S
  → client requests lock on S
  → server checks: is S locked?
     ├── No → acquire lock, write LockAcquired ephemeral event
     │       broadcast to subscribers
     │
     └── Yes → reject with current lock holder info,
              client opens read-only view

User A edits the draft (drafts are server-side, see §5.3)
  → each edit pushes UncommittedChange ephemeral event
     to subscribers

User A saves
  → server commits the change as a normal DSL diff
     (per multi-agent doc, this is a propose/approve flow
     if the artifact requires approval)
  → outbox event emitted (e.g., PipelineEdited or PipelineProposed)
  → lock released, LockReleased ephemeral event

OR User A cancels
  → draft discarded, LockReleased

OR User A goes idle past timeout (default 10 min, workspace-configurable)
  → server emits LockTimeoutWarning 2 min before
  → at timeout, lock becomes stealable

  User B steals the lock
  → server emits LockStolen to User A
  → User A's next interaction triggers a "lock taken" UI:
     options to view their draft as read-only, copy to clipboard,
     or discard
  → User B inherits the draft? NO — drafts are per-user.
     User B starts with the last committed version.
```

### 5.3 Draft state and uncommitted streaming

When User A holds a lock and starts editing, their changes accumulate as a **server-side draft**, scoped to `(artifact, section, user_id, lock_id)`. The draft:

- Is not in the outbox (it isn't committed).
- Is persisted server-side (Redis or a Postgres ephemeral table) so it survives brief disconnects.
- Is streamed to read-through observers as `UncommittedChange` ephemeral events on every edit (debounced ~200ms).
- Is discarded when the lock releases (either via save → committed, or via cancel/steal → dropped).

Observers (User B viewing while User A edits) see a live preview of User A's draft. The observer's UI is read-only and clearly marked "Viewing live edits by User A — read-only."

### 5.4 Save → propose/approve flow

Saving from the editor doesn't always commit directly. For most configuration artifacts, the save creates a **proposal** that goes through the existing diff-review flow (per multi-agent doc):

- For Business Context sections edited by hand: save → outbox `ContextSectionEdited` → committed (user is editing their own context, no extra approval).
- For pipeline / agent / report definitions edited by hand: save → outbox `*Proposed` → requires approval before becoming current. Same flow as agent-proposed diffs, just with `actor.kind: human` and `causing_decision_id: null`.

This unifies human-authored and agent-authored configuration changes — both flow through the same propose/approve substrate.

### 5.5 Lock contention UX

When User B tries to edit a locked section:
- They see a read-only view with User A's live draft streamed in.
- A banner: "Editing locked by User A since 14:23 (5 minutes ago). [Request edit access]".
- "Request edit access" sends a notification to User A; User A can release the lock voluntarily. If User A is idle and the timeout passes, User B can steal.

User A sees a separate indicator: "User B is also viewing this section and has requested edit access." Lightweight nudge to wrap up.

### 5.6 What's locked vs read-everywhere

Locks restrict **writes**, never **reads**. Anyone with read permission to the artifact can view the section live during a lock, including in-progress draft state. This is the "read-during-lock streaming" promise.

---

## 6. Presence Indicators

Three presence signals are supported. Cursor-position-within-text is explicitly not.

| Signal | Granularity | When sent |
|---|---|---|
| User viewing entity | Per entity (lead, pipeline, dashboard, etc.) | On view open / close; heartbeat every 30s |
| User editing field | Per field path | On focus / blur, debounced |
| User holding lock | Per locked section | On lock acquire / release |

### 6.1 Implementation

Client → server: small POST endpoints (`/presence/viewing`, `/presence/editing_field`) with heartbeat semantics. Last-heartbeat-wins for staleness detection.

Server → client: ephemeral SSE events filtered to subscribers of the same entity.

Server-side storage: in-memory or Redis with TTL. Lost on server restart (acceptable for ephemeral data).

### 6.2 UI surfaces

- **Avatar stack** on a lead detail / pipeline / config artifact showing who else is viewing.
- **Field-level indicator** during form edits when another user is editing the same field.
- **Lock badge** on configuration sections held by another user.

---

## 7. Engine Changes Required

### 7.1 Field-level versioning

Each writable field carries `written_at` (server timestamp) and `writer` (actor reference) alongside its value. For lead and custom object fields, this is stored either as a column triplet or as a JSONB envelope per field, depending on schema strategy. The `outbox_event_id` of the write is also stored, enabling a join to retrieve full audit context for the current value.

For the workflow task scratchpad (document-level), `written_at` is on the whole doc.

For forms (record-level), `written_at` is on the form_response.

### 7.2 Server timestamp ordering

Engine guarantees monotonic timestamps via:
- All writes go through a single transition function per workflow instance (serialized by the `SELECT ... FOR UPDATE` lock).
- Within a transaction, `clock_timestamp()` is used; across transactions, Postgres provides monotonic guarantees.
- For multi-replica engine deployments, a centralized timestamp service or Postgres-as-clock is used. Avoid client timestamps.

### 7.3 Lock service

A new service component (or a table in Postgres) tracks locks:

```
configuration_locks
  id, workspace_id,
  artifact_kind, artifact_id, section_path,
  holder_user_id, acquired_at, expires_at,
  last_heartbeat_at
  UNIQUE(workspace_id, artifact_kind, artifact_id, section_path)
```

Lock acquire = INSERT with conflict handling. Heartbeat = UPDATE `last_heartbeat_at`. Steal = UPDATE `holder_user_id` if `expires_at < now()`. Release = DELETE.

Lock ephemeral events on acquire/release/steal/timeout-warning are NOT in the outbox — they're pushed via SSE only.

### 7.4 Draft storage

Configuration draft state is per-user, per-lock. Stored in Redis (preferred for low latency) or in a `configuration_drafts` Postgres table for simplicity. Keyed by `(lock_id, user_id)`. Cleared on lock release.

### 7.5 SSE multiplexer service

A new service alongside the publisher. Reads from:
- Outbox events (filtered per connection subscription)
- Ephemeral event bus (presence, locks, draft updates) — in-memory pub-sub or Redis Pub/Sub
- Per-connection state: which contexts, which permissions

Stateless replicas behind a sticky-session load balancer (SSE benefits from session affinity but doesn't require it; reconnection handles cross-replica failover).

---

## 8. Failure Modes and Mitigations

| Failure | Mitigation |
|---|---|
| Client disconnects briefly during edit | SSE reconnect with `Last-Event-ID`; outbox replay catches up; ephemeral state re-syncs. Drafts survive briefly via server-side storage. |
| Server-side draft lost (Redis flush, etc.) | Acceptable degradation: user loses unsaved work. Workspace admins can configure persistence stronger (Postgres-backed drafts) for higher SLA. |
| Two users see different "latest" due to push delay | LWW based on server timestamp — push timing doesn't affect ordering. Pushes are eventually consistent; the outbox is authoritative. |
| Agent writes a field while User A is mid-edit | Field-edit indicator doesn't apply to agents (they don't "focus"). User A sees the FieldChanged event arrive via SSE and the overwrite notification fires if their write was earlier. |
| User A's lock heartbeat fails (network blip) | Two-tier timeout: short timeout (e.g. 3 min) downgrades to "idle"; long timeout (10 min) makes the lock stealable. Reconnection within the short window resumes seamlessly. |
| User B steals lock User A was actively typing in | User A's UI shows "Your lock was taken by User B." Draft preserved for User A to view, copy, or restart. User B inherits the committed state, not User A's draft. |
| Race: User A saves at the exact moment lock times out | Saves are server-validated against current lock holder. If User A's lock has expired, save is rejected with "Lock expired; reacquire to save." |
| Push channel saturation in large workspaces | Per-workspace event rate limits; client subscriptions are scoped to currently-viewed entities, not workspace-wide; SSE multiplexer fans out filtered. |
| Encrypted-field redaction in ephemeral events | Same rules as outbox events; per-connection permission applied before push. |

---

## 9. Trade-Offs Recorded

### 9.1 LWW over CRDT / OT

CRDTs (or operational transforms) handle merging better in pathological cases but add significant complexity, payload overhead, and a learning curve for the team. LWW-per-field is pragmatic and well-understood. The merge model satisfies "two users edit different fields → both succeed; same field → last wins."

The cost: in rare cases, a user's edit gets overwritten without their seeing it before the overwrite — but the overwrite notification handles this and audit truth is preserved.

### 9.2 SSE over WebSockets

SSE is simpler operationally, HTTP-friendly, and sufficient for v1. WebSockets become attractive only for genuinely bi-directional real-time UX (collaborative cursor positions, real-time chat in the product, etc.) — none of which are v1 goals. Upgrading later if needed is a contained change.

### 9.3 Section-level locks over finer-grained co-editing for case 3

Configuration is high-stakes and infrequent. The cost of a coarse lock is occasionally waiting for another user; the cost of CRDT-style co-editing on structured DSL is significant and the benefit is marginal. Locks with live read-through are the right point on the curve.

### 9.4 Drafts not in the outbox

Drafts are uncommitted intent. Putting them in the outbox would pollute it with churn that has no business meaning. The trade-off: drafts have weaker durability guarantees than committed events. Acceptable.

---

## 10. Open Questions

- **Cross-tab session for a single user.** If User A has two browser tabs open editing the same lead, are they treated as one writer or two? Recommend one (same `user_id`); concurrent writes from the same user are still LWW but the overwrite notification is suppressed (it's themselves).
- **Mobile/offline editing.** Currently assuming online editing with brief reconnects. Offline-first editing with queued writes is out of scope for v1; could be added with a vector-clock layer on top of LWW later.
- **Per-workspace draft persistence tier.** Default Redis (ephemeral). Enterprise tier could be Postgres-backed. Pricing/configuration decision.
- **Push channel cost at scale.** Per-workspace event rate limits will need calibration as workspaces grow. Observability on SSE connection counts and event throughput is needed early.
- **Reconnect storms after server deploys.** Rolling deploys should drain SSE connections gradually; documentation and tooling for this is operational concern.

## Changelog
- 2026-05-31 v1: imported from `/Users/ramzi/Downloads/files-6/realtime-collaboration-v1.0.md`; frontmatter added (status active), inline "**Status:** v1.0" line removed in favor of frontmatter.
