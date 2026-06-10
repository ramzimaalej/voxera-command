---
id: ADR-0013
title: Audit attribution is Membership-scoped; archivedAt is the single soft-delete tombstone
status: proposed        # proposed | accepted | superseded | deprecated
date: 2026-06-09
supersedes: []
superseded_by: null
affects:
  - voxera-crm/libs/prisma-schema-backend/base.zmodel
  - voxera-crm/libs/prisma-schema-backend/schema.zmodel
  - voxera-crm/docs/tech-debt/prisma-data-model-audit.md
  - voxera-crm/.claude/rules/prisma.md
  - voxera-crm/docs/patterns/domain-and-data-modeling.md
---

## Context

Every persisted model in the CRM extends an abstract `Base` that stamps **who** created/updated a row and (newly) who archived it. Historically those columns were `createdByUserId` / `updatedByUserId` referencing the global **`User`** table with `onDelete: Restrict`, and soft-delete was an ad-hoc per-model `deletedAt` timestamp on 6 of 45 tables (with no actor recorded).

Three forces are in tension:

1. **Users are global and erasable; tenancy is not.** A `User` is a single global principal (one login, may belong to several accounts) and must be hard-deletable for GDPR erasure. But `onDelete: Restrict` on the audit FK of ~45 tables means *any* user who ever wrote a row can never be deleted — erasure is structurally impossible, and the only escape is the soft-delete-only path that never truly erases.
2. **Attribution must be tenant-correct.** "Who did this *in this account*" is the person's **`Membership`** (the account-scoped actor), not their cross-tenant global identity. The domain already models the in-account actor as `Membership` everywhere *except* audit: `Task.assignee`/`completedBy`, `Lead.assignee`, `Callback.assignedMembership`, `CampaignLead.dialerLockedByMembership` all reference `Membership`. Audit attribution to `User` was the lone inconsistency.
3. **Soft-delete was inconsistent.** `deletedAt` existed on only 6 models, recorded no actor, sat beside the new `archivedAt`, and the `UserAction` enum already distinguished `archive`/`reactivate` from `delete` — leaving "is this archived or deleted?" ambiguous.

This was surfaced by the data-model audit (`voxera-crm/docs/tech-debt/prisma-data-model-audit.md`, finding **TD-050**). It is related to but distinct from **ADR-0003 (two-log audit model)**: ADR-0003 governs *what we log about decisions*; this ADR governs *which identity a row's mutation is attributed to*.

## Decision

1. **All audit attribution references `Membership`, never `User`.** `Base` carries `createdByMembershipId`, `updatedByMembershipId`, `archivedByMembershipId`, all referencing the tenant-scoped `Membership`. The same rule governs any "who acted" field (assignment, authorship): the in-account actor is a `Membership`.
2. **Audit columns are plain indexed scalar FKs — not ORM relations.** No `@relation` for `createdBy`/`updatedBy`/`archivedBy`. Navigational back-relations would rebuild a relation god-object on `Membership` — the exact anti-pattern that forced `UserView` to exist on `User` (~90 back-relations). The FK + `onDelete` is declared in migration SQL; the ZModel keeps the indexed scalar only.
3. **`Membership` is the durable actor and survives user erasure.** `Membership.userId` becomes **nullable** with `onDelete: SetNull` (was non-null `Cascade`). Erasing a `User` sets `userId = NULL` and leaves the `Membership` as an anonymous, PII-free (`team`/`title` only) audit anchor. Audit FKs into `Membership` use `onDelete: Restrict` (a membership that authored rows is soft-archived, never hard-deleted).
4. **`archivedAt` is the single soft-delete tombstone.** It replaces `deletedAt` entirely (NULL = active), paired with `archivedByMembershipId`. There is no separate "deleted" state at the row level: `archive`/`reactivate` toggle `archivedAt`; `delete` is a hard delete. `deletedAt` is removed from all models.
5. **A "system" actor represents non-human and global writes.** Outbox relays, cron jobs, AI-agent writes, and rows on global/cross-tenant tables (see below) are attributed to a reserved **system `Membership`** — a per-account system membership for account-scoped tables, and one global system membership (in a reserved system account) for the genuinely global tables.

The ZModel/`Base` source-of-truth change and the operating-system enforcement (reviewer + designer agents, `prisma.md`, `domain-and-data-modeling.md`) are already applied (2026-06-09); this ADR ratifies the decision and authorizes the database migration.

## Alternatives considered

- **Keep `User` attribution, soften erasure to soft-delete only.** Rejected: real GDPR erasure stays impossible, and attribution remains tenant-incorrect (one global identity across N accounts).
- **`Membership` attribution via real Prisma relations (with back-relations).** Rejected: recreates the `User` back-relation god-object on `Membership`; `UserView` exists precisely to dodge that bloat. Scalar FKs give the same integrity (enforced in SQL) without the navigational explosion.
- **Denormalize identity onto each row (store name/email at write time).** Rejected: stores PII on every table (worsens erasure), and drifts from the live actor.
- **Keep both `deletedAt` and `archivedAt` as distinct states.** Rejected: no current feature needs a row-level "deleted-but-not-archived" state; one tombstone + a hard `delete` action covers the `UserAction` verbs. Revisit only if a concrete two-state workflow appears.
- **Per-account system user instead of system membership.** Rejected: a "system user" is still a global `User`; the system actor should itself be tenant-scoped — a `Membership` with `userId = NULL`.

## Consequences

- **Positive:**
  - GDPR user-erasure becomes possible: delete the `User`, memberships persist as anonymous audit anchors.
  - Attribution is tenant-correct and consistent with existing assignment fields.
  - `Base` shrinks the schema (~1,599 → ~1,305 ZModel lines); the `User` audit god-block is gone.
  - One soft-delete convention; reads filter `archivedAt: null`.
  - The convention is enforced by the design-review gate, so it can't silently regress.
- **Negative / risks:**
  - **Large guarded migration** across 45 tables (rename + backfill + FK swap + `deletedAt`→`archivedAt` + `Membership` FK + `UserView`). Executed as expand → backfill → contract over two deploys, never one. `alwaysBreakOn: database-migration`. High-risk on the dual-migration substrate (PP-001 / ADR-... migration tech-debt TD-006).
  - **Backfill ambiguity on the 8 global/cross-tenant tables** (`Account`, `AccountHierarchy`, `Address`, `Company`, `CompanyName`, `ContactMethod`, `Plan`, `User`). Account-derivable ones (`Company`/`CompanyName` via `Resource`; `Account` via self) map to that account's membership; the genuinely global ones (`User`, `Address`, `ContactMethod`, `Plan`, `AccountHierarchy`) map to the **global system membership**. This requires a reserved system account — confirm it is acceptable to introduce one.
  - **Code follow-up:** callers of `.createdBy`/`.updatedBy` (was a `User` relation) and `.deletedAt` must move to `…MembershipId` / `archivedAt`. The backend will not typecheck until updated.
  - **`Membership` uniqueness:** `@@unique([accountId, userId])` now permits multiple `userId IS NULL` rows (Postgres NULLs distinct), so several system/erased memberships can coexist. If durable memberships should be append-mostly (one *active* per (account,user)), convert to a partial unique `WHERE userId IS NOT NULL AND archivedAt IS NULL` — flagged for decision in the migration.
- **Follow-ups:**
  - Migration draft for review: `voxera-crm/docs/tech-debt/prisma-audit-identity-migration.draft.sql` (do **not** place in `apps/backend/.../migrations/` until approved — that dir auto-runs at boot).
  - Backend code sweep for `.createdBy`/`.updatedBy`/`.deletedAt` usages (candidate `fix-bug`/refactor run).
  - Decide the `Membership` partial-unique question.
  - Tracks TD-050 (and closes TD-041 / TD-042) in the data-model audit.
