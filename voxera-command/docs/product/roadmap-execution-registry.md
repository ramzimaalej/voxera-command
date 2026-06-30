---
title: Roadmap Execution Registry
version: 1
status: active
updated: 2026-06-29
owner: you
---

> **What this is.** The executable companion to [`roadmap.md`](./roadmap.md): one ordered table mapping every roadmap item to the **exact babysitter workflow** that implements it, plus the selection algorithm the [`resume-roadmap`](../../.claude/skills/resume-roadmap/SKILL.md) skill follows to pick the next move. `roadmap.md` says *what/why/when*; this registry says *which command, from which repo, in what order*.
>
> **Confidentiality (ADR-0014/0015).** This registry is exec-only and may name confidential bets. Engineering processes never read it — when a workflow runs, the orchestrator (you / Claude) reads this registry here, then passes a **self-contained `featureDescription`/`spec` down** into the code repo's process. The engineering process never reads up into `voxera-command`.

## How "resume" selects the next move

1. **Read state** — this registry + [`roadmap.md`](./roadmap.md) + [`gap-analysis-crm-to-product.md`](./gap-analysis-crm-to-product.md), and for any item with a feature folder, that folder's `status.json` (CRM) or `spec.md` frontmatter (sites).
2. **Pick the next executable item** — the highest-priority item that is **not `DONE`** and whose **every dependency is `DONE`**:
   - Horizon order: **Now → Next → Later**.
   - Within a horizon: lower **Order** first; an item already `IN-SDLC` outranks a `NOT-STARTED` one (finish in-flight work before opening new).
   - The two **tracks run in parallel** — the CRM **product spine** (B-bets) and the website **motion** are independent; "next" may legitimately offer one of each.
3. **Map to a command** — look up the item's **Workflow** template below and fill its args from the bet text + gap ids.
4. **Propose, then run** — state the one command it will run + a one-line rationale, get a go-ahead, then `cd` into the repo and invoke. (The babysitter run carries its own human gates; CRM writes no production code before `PLAN_APPROVED`.)
5. **On completion** — tick the `roadmap.md` checkbox, set this item's **Status** to `DONE`, and run `HARVEST`. Then the next `resume` advances to the newly-unblocked item.

## Status vocabulary

`NOT-STARTED` (no spec) · `SPEC-DRAFT` (spec exists, unapproved) · `IN-SDLC:<phase>` (feature folder live; phase from `status.json`) · `BLOCKED` (a dependency isn't `DONE`) · `DONE` (merged + harvested). `BLOCKED` is derived, not stored — recompute it from dependencies each run.

## Workflow templates

Fill `<…>` from the registry row + the bet's `roadmap.md` line and its `GAP-xx` ids in the gap-analysis dossier.

| Template | Command |
|---|---|
| **CRM-BUILD** *(fresh spine bet, no feature folder yet)* | `cd voxera-crm && /babysitter:call --process .a5c/processes/build-feature.process.js#process --inputs '{"featureDescription":"<bet objective composed from the roadmap line + its GAP-xx>","repoRoot":"."}'` — the gate-aware process drives the whole SDLC (spec → design-review → tests → plan → implement → quality gate), honoring `status.json` (no production code before `PLAN_APPROVED`). |
| **CRM-RESUME** *(feature folder exists, mid-SDLC)* | `cd voxera-crm`, read `features/<id>/status.json`, run the SDLC skill for the phase, each gated by `approve-feature-phase`: `DRAFT`→`/refine-feature-spec` · `SPEC_APPROVED`→`/run-design-review` · `DESIGN_APPROVED`→`/generate-test-cases` · `TESTS_APPROVED`→`/generate-implementation-plan` · `PLAN_APPROVED`→`/implement-approved-feature` · `VERIFYING`→`/verify-feature` → `DONE`. |
| **WEB-BUILD** *(site item with an approved spec)* | `cd voxera-website && /babysitter:call --process ../voxera-os/.a5c/processes/build-feature.js#process -- spec features/<id>/spec.md` |
| **WEB-DESIGN** *(site item with no spec yet)* | `cd voxera-website && /babysitter:call --process ../voxera-os/.a5c/processes/design-feature.js#process -- request "<item intent>"` → produces a Software Delivery Intake / spec, then **WEB-BUILD**. |
| **CRM-FIX** | `cd voxera-crm && /babysitter:call --process .a5c/processes/fix-bug.process.js#process --inputs '{"bugDescription":"<…>","repoRoot":"."}'` |
| **CRM-DEBT** | `cd voxera-crm && /babysitter:call --process .a5c/processes/pay-down-debt.process.js#process --inputs '{"scopeHint":"<TD-/PP- id or path>","repoRoot":"."}'` |
| **HARVEST** *(on DONE)* | `cd <repo> && /babysitter:call --process ../voxera-os/.a5c/processes/harvest-feature.js#process -- feature features/<id>` |

> CRM uses its **local gate-aware** processes (canonical for that repo); sites use the **voxera-os baseline** processes by relative path. Never copy a process — invoke it in place.

## Track A — CRM product spine (`voxera-crm`)

Sequenced by dependency (the keystone is B1; compliance gate B6 precedes first live call B5; B13 is dead-last per CEO direction). Bet text + `GAP-xx` live in [`roadmap.md`](./roadmap.md) / [gap-analysis](./gap-analysis-crm-to-product.md).

| Order | Bet | Horizon | Depends on | Status | Workflow | Feature folder |
|---|---|---|---|---|---|---|
| 1 | **B0** Robust authorization layer | Now | — | `IN-SDLC:VERIFYING` | **CRM-RESUME** → `/verify-feature` → DONE, then **HARVEST** | `features/20260624-robust-authz-layer` |
| 2 | **B1** Agent data-model spine (Context + Decisions + cost) | Now | B0 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 3 | **B2** Outbox fully wired + agent-event emission | Now | B1, B0, TD-009 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 4 | **B3** Brain + fixed agent roster + base | Next | B1 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 5 | **B4** Typed Workflow DSL + primitives + write-path | Next | B1, B3 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 6 | **B6** Compliance gate engine + per-motion frames | Next | B4 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 7 | **B5** AI outbound voice operator + scoped tools | Next | B3, B4, B6 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 8 | **B7** Trust & observability surface | Next | B1, B3, B5, B0 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 9 | **B8** Daily-ops shell + report engine + dashboard | Next | B4, B7 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 10 | **B9** Context Copilot + Configurator + self-serve onboarding | Next | B1, B3, B4 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 11 | **B10** Hybrid-close handoff | Later | B5, B7 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 12 | **B11** OS object layer + brand expression | Later | B4, B9 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 13 | **B12** Continuous-improvement loop | Later | B5, B7, B8 | `NOT-STARTED` | **CRM-BUILD** | TBD |
| 14 | **B13** Deep DACH compliance (Pflegekasse + Art. 9) | Later | B6, B11, B0 | `NOT-STARTED` | **CRM-BUILD** | TBD (dead-last) |

**Next ready on this track:** B0 (finish `verify-feature` → DONE). On B0 DONE, B1 unblocks.

## Track B — Website motion (`voxera-website`)

| Order | Item | Horizon | Depends on | Status | Workflow | Spec |
|---|---|---|---|---|---|---|
| 1 | **FEAT-001** Vertical landing-page templates (Astro) | Now | — | `SPEC-DRAFT` | **WEB-BUILD** (spec is `draft` → approve/refine first) | `features/FEAT-001-vertical-landing-templates-astro/spec.md` |
| 2 | **FEAT-002** `/real-estate` landing page | Now | FEAT-001 | `SPEC-DRAFT` | **WEB-BUILD** | `features/FEAT-002-real-estate-landing-page/spec.md` |
| 3 | `/home-services` landing + sub-vertical chips | Next | FEAT-002 | `NOT-STARTED` | **WEB-DESIGN** → WEB-BUILD | TBD |
| 4 | `/insurance` landing page | Next | spine B6 (TCPA) + IMO talks | `BLOCKED` | **WEB-DESIGN** → WEB-BUILD | TBD |
| 5 | "Get called by the AI now" demo backend (crm) | Next | B5, B6 | `BLOCKED` | **CRM-BUILD** | TBD |
| 6 | TCPA cornerstone resource page | Later | — | `NOT-STARTED` | **WEB-DESIGN** → WEB-BUILD | TBD |
| 7 | `/compare?competitor=X` DTR page | Later | paid-search live | `NOT-STARTED` | **WEB-DESIGN** → WEB-BUILD | TBD |
| 8 | Per-vertical activation email tweaks (RE/HS/Ins) | Later | — | `NOT-STARTED` | **WEB-DESIGN** → WEB-BUILD | TBD |

**Next ready on this track:** FEAT-001 (approve the draft spec, then **WEB-BUILD**). FEAT-002 unblocks on FEAT-001 DONE.

## Not roadmap bets (tracked for completeness)

- `voxera-crm/features/20260329-callback-auto-dialer` — Power Dialer callback auto-load — `IN-SDLC:VERIFYING`. Pre-dates the B-bets; finish via **CRM-RESUME** (`/verify-feature`) but it is **not** a roadmap line.

## Maintenance

- This registry is **derived state, kept by hand** — update a row's **Status** the moment a run finishes, and tick the matching `roadmap.md` checkbox in the same change. Bump `version` + add a Changelog line per [`docs.md`](../../.claude/rules/docs.md).
- When a CRM bet gets its feature folder, replace its **Feature folder** `TBD` with the real `features/<id>` path.
- Pairs with [`priorities-coach`](../../.claude/skills/priorities-coach/SKILL.md) (what to do next, by strategy) — this registry is *how* to execute it.

## Changelog
- 2026-06-29 v1: initial — execution map for roadmap.md v8 (B0–B13 spine + website motion), workflow templates, two-track registry, selection algorithm for the `resume-roadmap` skill.
