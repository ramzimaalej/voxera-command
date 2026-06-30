---
title: Product Roadmap
version: 8
status: active
updated: 2026-06-22
owner: you
---

> Two parallel motions per [ADR-0009](../../decisions/ADR-0009-english-markets-parallel-motion.md): **DACH** (founder-led, UWG §7-compliant) and **English-speaking markets** (paid-search-led, three verticals). Both motions ride one product spine — the CRM → full-product evolution bets (B1–B13) below.
>
> Full reasoning for the bets — gap inventory, RICE ranking, appetites, dependency sequencing: [gap-analysis dossier](./gap-analysis-crm-to-product.md).

## The two layers of this roadmap

This roadmap has a **product spine** and **motion-specific surface work**, and they ride together:

1. **Product-evolution bets (B1–B13)** — the platform/product spine that turns the CRM into the AI-native full product. Sequenced by dependency first, RICE second, framed as Shape-Up *appetite bets* (small-batch ≈ 1–2 weeks of one or two builders; big-batch ≈ one full 6-week cycle for most of the team — appetite is the budget, scope flexes to fit). **Both motions ride this spine** — the same engine, authorization layer, audit model, agent roster, compliance gate, and observability surface serve DACH and English markets without forking.
2. **Motion surface work** — the per-motion landing pages, demo endpoints, and activation tweaks (FEAT-001/002 and their successors) that sit on top of the spine.

Horizons map to [`strategy.md`](../strategy/strategy.md) §7 milestones: **Now** = the next 6-week cycle (down-payment on the 12-month milestone) · **Next** = rest of this year (12-month milestone — both motions provable) · **Later** = 24/36-month (OS-underneath surfacing + the v2+ improvement loop).

Each bet's implementing **FEAT spec is To-Be-Drafted in the implementing code repo** (`voxera-crm/features/`) per [ADR-0014](../../decisions/ADR-0014-split-engineering-os-from-confidential-command-repo.md) — this roadmap references the work by bet id and future intent only; it does **not** author FEAT specs.

## Now

*Down-payment on the 12-month milestone. One fundable 6-week cycle for 5 people. A foundation security bet (B0) that leads, plus two capability bets (B1, B2) — deliberately not more. B0 mostly **formalizes and hardens the S0 critical-auth paydown already budgeted into the restructuring foundation** (it is not a wholly new third bet); if the cycle is over-subscribed, B2 (small-batch) is the flex item, never B0 — no agent write-path ships before the authz layer is hardened.*

### Product spine

- [x] **B0 — Robust authorization layer (column masking + request-scoped elevation + authz-audit table)** · *big-batch* · ✅ **DONE 2026-06-29 · harvested 2026-06-30** (`voxera-crm/features/_archive/20260624-robust-authz-layer`; object-level PII authz + write-side credential redaction, audited `withElevatedPermissions`, `AuthorizationAudit` trail, four critical holes closed, four conformance gates ratcheted; ADR-0024 settled — RD-1 object-level + no wire masking, wire `SensitiveRef` deferred TD-010) · hardens the critical-auth tech-debt (PowerDialer with zero CASL checks, import-service runtime self-elevation, outbox-events IDOR / cross-tenant read, SMS-send mutation with no authz) and adds three load-bearing primitives the whole agent layer rides on: **(1) column / field-level masking** — abilities gate sensitive *columns* (GDPR Art. 9 special-category data, PII), enforced once at the data-access layer rather than re-checked per resolver; **(2) request-scoped elevated permission** — a single audited `withElevatedPermissions(scope, reason)` primitive that replaces runtime permission synthesis, so system jobs and agents elevate explicitly, time-boxed to the request, never by self-granting; **(3) database authorization-audit table** — every authorized *and denied* privileged call written to a dedicated DB audit table (who · ability · resource · elevation reason · decision · timestamp), the third audit surface alongside the Outbox (domain events) and Decision Records (agent reasoning). depends on: nothing (rides S0 foundation) — **sequenced first: B1's Decision-Record/Context writes and every agent write-path in B3/B5 ride through this, so per [ADR-0022](../../decisions/ADR-0022-strangler-fig-crm-to-ai-product.md) no agent ever writes through an unsafe path** · FEAT spec **TBD** in `voxera-crm/features/`; technical "how" (DB-layer vs app-layer masking, elevation mechanism, audit-table schema) → [ADR-0024](../../../voxera-crm/decisions/ADR-0024-unified-authorization-field-masking-elevation-audit.md) (accepted 2026-06-29). **Shared invariant (owned here, applies to every serialized surface — the B0 authz-audit table, B1 Decision Records, and B2 outbox payloads): no PII, special-category data, or credentials are written in the clear to any audit/event surface** — sensitive fields are redacted/tokenized at write time using this bet's field classification, and readers re-resolve them through the authz layer; one enforcement gate covers all three surfaces
- [ ] **B1 — Agent data-model spine (Context + Decisions + cost)** · *big-batch* · closes GAP-01, GAP-02, GAP-05, GAP-46 · depends on: B0 (every Context + Decision-Record write rides the hardened authz layer + lands a row in the authz-audit table) (rides S1·S4·S5) — the keystone the whole year hangs from: Business Context substrate + Decision Record trust spine + per-action cost + the reused inspect-reasoning chip. **Decision Records obey the B0 shared invariant** — they reference sensitive data by id and store rationale, never PII/special-category data/credentials in the clear · FEAT spec **TBD** in `voxera-crm/features/`
- [ ] **B2 — Outbox fully wired + agent-event emission (PII/credential-safe payloads)** · *small-batch* · closes GAP-14 · depends on: B1 (Decision Record write path), B0 (reuses the field classification from B0 column masking), TD-009 — finishes the cheapest, highest-reuse brownfield item and leaves the event backbone live. **Outbox payloads must not leak PII or credentials**: event payloads carry references/ids and non-sensitive fields only, with special-category data (GDPR Art. 9), PII, and any secrets (provider tokens, voice-identity credentials, API keys — emitted notably by the `communication` context) redacted or tokenized at emit time using the same B0 field classification; an enforcement gate fails the build if an unclassified field reaches a payload, and consumers re-resolve sensitive fields through the authz layer rather than reading them off the event. · FEAT spec **TBD** in `voxera-crm/features/`

### Motion surface work

**English-markets motion** — [playbook](../strategy/vertical-strategy-english-markets.md):
- [ ] **FEAT-001** — Translate vertical landing-page specs to Astro — foundational; blocks every vertical page below · spec: `voxera-website/features/FEAT-001-vertical-landing-templates-astro/spec.md`
- [ ] **FEAT-002** — Build /real-estate landing page — depends on FEAT-001 · spec: `voxera-website/features/FEAT-002-real-estate-landing-page/spec.md`

**DACH motion**:
- [ ] Continuing on the existing motion — no new specs open right now

## Next

*Rest of this year — the 12-month milestone: both motions provable. Seven bets, sequenced by dependency, run roughly in listed order. This is more than one cycle in total — that's correct; Next is the whole year.*

### Product spine

- [ ] **B3 — Brain + fixed agent roster + base** · *big-batch* · closes GAP-06, GAP-07, GAP-13 · depends on: B1 — the constrained reasoning entry point + fixed seven-role roster + no-engine-privileges enforcement; no agent capability exists until this lands · FEAT spec **TBD** in `voxera-crm/features/`
- [ ] **B4 — Typed Workflow DSL + primitives + write-path** · *big-batch* · closes GAP-04, GAP-33, GAP-52, GAP-34 · depends on: B1, B3 (rides S6) — `workflow_kind=linear_funnel`, typed stages, primitives registry, agent-driven stage transitions, time-triggers; the OS-underneath executable substrate · FEAT spec **TBD** in `voxera-crm/features/`
- [ ] **B6 — Compliance gate engine + per-motion frames** · *big-batch* · closes GAP-26, GAP-27, GAP-28, GAP-29, GAP-21, GAP-31 · depends on: B4 (rides S7) — dispatch-layer gate engine (calling-hours, DNC, consent, recording-consent) + per-motion config frames; the regulated-vertical moat made mechanical, serving both motions. **Sequenced before B5** — the gate must front every live AI call · FEAT spec **TBD** in `voxera-crm/features/`
- [ ] **B5 — AI outbound voice operator + scoped tools** · *big-batch* · closes GAP-15, GAP-16, GAP-23, GAP-24 · depends on: B3, B4, **B6** (compliance gate must front dispatch) — *the* differentiator: the AI that places and conducts the qualification call atop the ADR-0007 telephony stack, scoped operator tools, mid-call lookups, DE voice profile (EN queued for the second motion) · FEAT spec **TBD** in `voxera-crm/features/`
- [ ] **B7 — Trust & observability surface** · *big-batch* · closes GAP-10, GAP-11, GAP-12, GAP-22, GAP-51 · depends on: B1, B3, B5, B0 (the per-lead causal audit timeline reads the B0 authz-audit table for who-was-authorized-to-do-what) — visible reasoning, proposal-and-approve diffs, autonomy ceilings, live call monitoring, per-lead causal audit timeline; the observability-beats-automation moat made visible · FEAT spec **TBD** in `voxera-crm/features/`
- [ ] **B8 — Daily-ops shell + report engine + dashboard** · *big-batch* · closes GAP-47, GAP-42, GAP-44, GAP-43, GAP-48 · depends on: B4, B7 — the surface the operator buys: Today/Live-calls/Improvements shell, deterministic (never LLM) report engine, funnel/cost dashboard, fleet live-calls board · FEAT spec **TBD** in `voxera-crm/features/`
- [ ] **B9 — Context Copilot + Configurator + self-serve onboarding** · *big-batch* · closes GAP-08, GAP-09, GAP-36, GAP-35, GAP-37, GAP-43 (derivation) · depends on: B1, B3, B4 — "config-not-rebuild": adaptive interview writes Business Context, Configurator derives workflow/stages/agents/gates/reports, per-vertical presets + templates; retires TD-003/PP-003 and enables the English-markets <60-min self-serve setup · FEAT spec **TBD** in `voxera-crm/features/`

### Motion surface work

**English-markets motion**:
- [ ] `/home-services` landing page with sub-vertical chips (website) — after FEAT-002 ships; FEAT to be drafted in `voxera-website/features/`
- [ ] `/insurance` landing page (website) — Q2; depends on TCPA-compliance backend work (rides spine bet B6) + IMO partnership conversations
- [ ] Backend integration for the "Get called by the AI now" demo endpoint (crm) — converts the FEAT-001 Pages Function stub into a real outbound-call trigger; depends on spine bets B5 (voice operator) + B6 (compliance gate)

## Later

*24/36-month — OS-underneath surfacing + the v2+ improvement loop. Bets the strategy explicitly defers: option value, sequenced after the v1 spine proves out.*

### Product spine

- [ ] **B10 — Hybrid-close handoff** · *big-batch* · closes GAP-18, GAP-17, GAP-19, GAP-20, GAP-50 · depends on: B5, B7 — in-call calendar booking, inbound triage, AMD/auto-drop cost-discipline, mid-call human take-over, mobile companion · FEAT spec **TBD** in `voxera-crm/features/`
- [ ] **B11 — OS object layer + brand expression** · *big-batch* · closes GAP-03, GAP-25, GAP-49 · depends on: B4, B9 (rides S5) — workspace-defined custom objects (the OS object layer), number-pool management, and the Voxera v2 design system reskin (ADR-0021); OS option value + brand · FEAT spec **TBD** in `voxera-crm/features/`
- [ ] **B12 — Continuous-improvement loop** · *big-batch* · closes GAP-38, GAP-39, GAP-40, GAP-41, GAP-45 · depends on: B5, B7, B8 — Critic → eval-set → Promoter loop improving voice-agent prompts from real call data + Reporter agent; strategy marks this v2+, do not start until B5's calling loop is in production · FEAT spec **TBD** in `voxera-crm/features/`
- [ ] **B13 — Deep DACH compliance (Pflegekasse paperwork + special-category data)** · *big-batch* · **sequenced dead last / secondary (CEO direction, 2026-06-21)** · closes GAP-32, GAP-30 · depends on: B6, B11, B0 (reuses B0 column masking for special-category fields rather than rebuilding it) (rides S8) — Pflegekasse paperwork integration + GDPR Art. 9 special-category-data handling; the deepest DACH moat. Deliberately deferred to the very end: the generic per-motion gate engine already lands in B6 and serves both motions; this is only the DACH-care-specific *depth* on top, not table-stakes · FEAT spec **TBD** in `voxera-crm/features/`

### Motion surface work

- [ ] TCPA cornerstone resource page (website) — credibility asset for the insurance vertical (per `vertical-strategy-english-markets.md` §4.5)
- [ ] `/compare?competitor=X` DTR page for paid-search competitor traffic (website) — only when paid-search competitor campaigns actually run
- [ ] Per-vertical activation email tweaks (per `vertical-strategy-english-markets.md` §9) — RE, HS, Ins variants
- [ ] Adjacent DACH vertical (Hörgeräte or private health insurance) — year-2 milestone per [`strategy.md`](../strategy/strategy.md) §7
- [ ] Multi-language voice agents — EN as first-class alongside DE — year-2 milestone (the EN voice profile queued in spine bet B5)

> Check the box when the implementing run is merged. Each spine bet (B1–B13) and motion item maps to a FEAT spec; the spec lives in the **implementing code repo** (spine bets in `voxera-crm/features/`, website surface work in `voxera-website/features/`), referenced here by bet/FEAT id per [ADR-0014](../../decisions/ADR-0014-split-engineering-os-from-confidential-command-repo.md). If a line has no FEAT id yet, draft the spec in that code repo before starting work — this confidential roadmap never authors FEAT specs itself.

## Changelog
- 2026-06-22 v8: resolved B0's technical-"how" pointer from "ADR TBD" to the drafted [ADR-0024](../../../voxera-crm/decisions/ADR-0024-unified-authorization-field-masking-elevation-audit.md) (proposed) in the CRM repo — unified app-layer authorization (field masking, request-scoped elevation, authorization-audit table, one classification + one gate).
- 2026-06-22 v7: promoted the no-leak rule to a **shared invariant owned by B0** — "no PII, special-category data, or credentials written in the clear to any audit/event surface" — applying uniformly to the B0 authz-audit table, B1 Decision Records, and B2 outbox payloads, enforced by one gate; noted on B1 that Decision Records reference sensitive data by id and store rationale only.
- 2026-06-22 v6: hardened **B2** so the outbox event backbone cannot leak PII or credentials — payloads carry references + non-sensitive fields only, with special-category data, PII, and secrets (provider tokens, voice-identity credentials, API keys) redacted/tokenized at emit time using B0's field classification, an enforcement gate on unclassified fields, and consumers re-resolving sensitive fields through the authz layer. Made B2 depend on B0.
- 2026-06-22 v5: added **B0 — robust authorization layer** (column/field-level masking, request-scoped elevated permission, dedicated DB authorization-audit table) to the Now horizon as the security substrate the agent layer rides on; it formalizes and hardens the S0 critical-auth paydown (PowerDialer/import/outbox-IDOR/SMS) into a first-class bet. Made B1 depend on B0, and noted B7 (reads the authz-audit table) and B13 (reuses column masking for GDPR Art. 9) as downstream consumers. Rationale: per ADR-0022 agents write through the same RBAC/audit paths as humans, so those paths must be hardened before any agent write; column masking also pre-builds the Art. 9 substrate B13 needs. Flagged a new CRM ADR (technical "how") as a follow-up.
- 2026-06-22 v4: rewrote the roadmap as the CRM→full-product spine — 13 Shape-Up appetite bets (B1–B13) across Now/Next/Later, sequenced by dependency (agent data-model spine first; compliance gate B6 before first live call B5; deep DACH compliance B13 dead-last per CEO direction), reconciled with the engineering-os restructuring phases S0–S9. Preserved FEAT-001/002 and the two-motion grouping. Added link to the new gap-analysis dossier.
- 2026-06-16 v3: FEAT-001 and FEAT-002 relocated to `voxera-website/features/` per ADR-0014 (specs live in the implementing repo; the confidential roadmap references them by ID). Replaced the broken cross-repo file-links with ID + spec-path pointers.
- 2026-05-31 v2: replaced placeholder entries with real FEAT-001 and FEAT-002 (both website, both English-markets motion). Restructured to group items by motion (DACH vs English-markets) per [ADR-0009](../../decisions/ADR-0009-english-markets-parallel-motion.md). Added "Next" items for home services + insurance landing pages and the demo-endpoint backend integration (no FEAT ids yet — to be drafted before work starts). Added "Later" items pulled from `vertical-strategy-english-markets.md` and `strategy.md` §7 milestones.
- 2026-05-27 v1: initial.
