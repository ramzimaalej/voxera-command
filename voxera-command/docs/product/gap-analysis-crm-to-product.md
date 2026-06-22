---
title: Gap Analysis — CRM to Full Product
version: 1
status: active
updated: 2026-06-22
owner: you
---

# Gap Analysis — CRM to Full Product

A standalone dossier mapping the delta between what the `voxera-crm` codebase does **today** and the full-product **target** the vision and [strategy](../strategy/strategy.md) describe — then turning that delta into a RICE-ranked, dependency-sequenced set of bets. It draws on the [vision](../vision/vision.md), the [strategy](../strategy/strategy.md), and a ground-truth audit of the live code (Prisma/ZModel schema, NestJS bounded contexts, React routes, the Twilio/Telnyx/Ultravox wiring). The sequenced build plan it produces lives in [roadmap.md](./roadmap.md); this dossier is the analysis behind it.

## Executive summary

Voxera today is a **strong, multi-tenant, human-operated B2B CRM with a production human-calling substrate** — a sales-pipeline state machine, a polymorphic Resource/Lead model, a full communication/activity log, a browser softphone + power-dialer + callback stack on Twilio/Telnyx, and an Ultravox transcription seam (30 distinct production/partial capabilities). What it has **zero** of is the layer the whole product thesis rests on: there is **no AI-agent layer at all** — no Business Context substrate, no Decision Records, no Brain/orchestrator, no seven-agent roster, no AI voice operator, no configurator/DSL, no compliance gate engine, no Critic/Promoter loop. That entire layer exists only as ADRs (ADR-0003/0004/0005 — 100% blueprint, 0% code). Mapping the 67-capability / 11-theme target against the current state yields **52 gaps** (8 critical), which RICE prioritization and Shape-Up framing collapse into **13 sequenced bets** — a data-model spine first, the agent runtime and the differentiating AI voice operator next, and the deepest DACH compliance depth deliberately last.

## Target product

The end-state the roadmap converges toward: **67 capabilities across 11 themes** (full inventory in the source artifact, traced to vision §, strategy §, and the `App.jsx` demo flows). Summarized per theme:

| # | Theme | What it covers (target) |
|---|-------|--------------------------|
| 1 | Onboarding & Business Context | Context Copilot adaptive interview writing a live 6-section Business Context — the substrate every agent reads; vision calls reducing the friction of describing the business "the deepest moat." |
| 2 | Configurator & Derived Workspace (Platform/DSL) | Configurator agent that derives the whole workspace (workflow, stages, agents, objects, gates, reports) from approved Context — the OS-underneath: a vertical is a configuration, not a fork. v1 ships `linear_funnel` only. |
| 3 | Agent Runtime, Brain & Decision Records | A constrained Brain that dispatches to a fixed seven-agent roster (no dynamic spawning); every action produces a drillable Decision Record with autonomy ceilings and per-action cost. |
| 4 | Voice Calling | The differentiator: AI outbound voice operator (per-language, scoped tools), inbound triage, in-call calendar booking, AMD/voicemail drop, mid-call escalation, live monitoring. Runtime consumed (Twilio + Ultravox), not built. |
| 5 | Lead Lifecycle & Audit | The system of record holding the whole lifecycle: lead entity, full causal audit timeline (event ← causing Decision Record), per-vertical disposition/reason taxonomy. |
| 6 | Compliance Gates | Engine-enforced dispatch-layer gates (calling-hours, DNC scrub, consent, special-category data, per-motion frames, Pflegekasse paperwork) — the moat made mechanical, not prompt-hoped. |
| 7 | Critic / Promoter Improvement Loop | Continuous-improvement loop (batch call analysis → evidence-cited findings → prompt diff → eval set → guarded rollout). Strategy marks this explicitly v2+. |
| 8 | Reporting & Analytics | DSL-computed, deterministic reports (never LLM-generated numbers), starter set derived from Context, Reporter agent, daily-ops dashboard. |
| 9 | Daily Operations Surface | The operator's daily product: Today/Live-calls/Improvements navigation, proactive nudges, live-calls board. |
| 10 | Mobile Companion | Focused phone view for the CEO/owner persona: live-call overview + drill-into-call/take-over. |
| 11 | Design System & Brand Expression | Voxera v2 visual language + the decision-chip/drawer "inspect the reasoning" interaction primitive. |

**Explicit non-goals** (must NOT be added by any roadmap): generic/horizontal SMB CRM, voice-agent infrastructure (we consume Twilio + Ultravox), AI-SDR/cold-outreach, enterprise features, zero-touch-by-default / agent swarms / dynamic spawning, no-code builder, custom model training, agent marketplace, empty-context workspace, and DACH cold-outbound (UWG §7 — inbound-then-outbound only).

## Current CRM

What the live code actually does, mapped against the same 11 themes. Maturity: `none` · `stub` · `partial` · `production`.

| Theme | Maturity today | What exists |
|-------|----------------|-------------|
| 1 Onboarding & Business Context | **none** | No Business Context model; system runs context-free. Verticals are hard-coded duplicated pages/forms (TD-003/PP-003). |
| 2 Configurator & DSL | **partial engine / none configurator** | Real custom Postgres state machine (ADR-0002) + `Pipeline.definition Json`; no `workflow_kind` DSL, no primitives/triggers, no configurator, no derivation. |
| 3 Agent Runtime, Brain & Decision Records | **none runtime / partial outbox** | ADR-0003/0004 are blueprint only; only the transactional-outbox skeleton exists, wired in 1 of 8 contexts. No Brain, no agents, no Decision Record entity. |
| 4 Voice Calling | **production human / none AI** | Softphone, power-dialer, recording, transcription, Twilio/Telnyx/Ultravox all production — but for **human** agents. No AI that places/conducts calls. ("Agent" in schema = the human's calling identity.) |
| 5 Lead Lifecycle & Audit | **partial → production** | Lead entity, append-only PipelineEvent history, full activity log, audit identity (ADR-0013) all real. Missing the **causal** layer (event ← Decision Record) because there are no agents. |
| 6 Compliance Gates | **mostly none** | Data-state flags (`DialerLeadStatus.DoNotCall`, `deletedAt`) + a contract signature flow. No engine-enforced calling-hours/DNC/consent/special-category gates. |
| 7 Critic / Promoter | **none** | ADR-0004 role names only (target itself marks this v2+). |
| 8 Reporting & Analytics | **none / stub** | `Dashboard.page.tsx` is an empty `<Container><Stack/>`; cost data exists unused. No report engine. |
| 9 Daily Operations Surface | **partial** | Genuine Mantine app shell + rich Lead/Prospect/Pipeline/Contract/Callback/Dialer surfaces; no Today/Live-calls/Improvements framing. |
| 10 Mobile Companion | **none** | No mobile routes; web-responsive at best. |
| 11 Design System & Brand | **partial** | Real Mantine system + governed 8-layer UI taxonomy (ADR-0017); not the brand-specific Voxera v2, no decision-chip/drawer (nothing to inspect). |

**The AI-layer-absent verdict.** Each named element of the target's AI layer was checked against the schema and backend: **Business Context — absent. Decision Record — absent. Agent roster (seven roles) — absent (ADR-0004 design only). Configurator/DSL — absent (config-data only). Brain/Orchestrator — absent. Critic/Promoter — absent.** The only thing touching "AI/voice" is the Ultravox **transcription** seam + Twilio/Telnyx **call placement** for **human** agents. **Bottom line: the codebase is the CRM + human-calling substrate the vision's AI layer is meant to sit on top of — that layer is 100% blueprint, 0% code.**

## Gap backlog

**52 gaps** (PARTIAL + MISSING; parity items and pure demo-flourishes excluded), across 8 categories. Each row carries complexity / risk and a brownfield-reuse note — where a restructuring phase (S0–S9) or tech-debt item provides a *foundation* (structural seam / domain logic), the product capability on top is still net-new and is **not** double-counted as built.

### Count per category

| Category | Count | Gaps |
|---|---|---|
| data-model | 6 | GAP-01…05, GAP-52 |
| agent-layer | 9 | GAP-06…14 |
| voice-runtime | 11 | GAP-15…25 |
| compliance | 7 | GAP-26…32 |
| platform-dsl | 5 | GAP-33…37 |
| improvement-loop | 4 | GAP-38…41 |
| reporting | 4 | GAP-42…45 |
| frontend | 6 | GAP-46…51 |
| **Total** | **52** | |

### data-model

| ID | Gap | Cx | Risk | Brownfield reuse |
|----|-----|----|----|------------------|
| GAP-01 | Business Context entity (6 typed sections) — the system substrate | high | high | No phase; net-new. Traverses TD-001 (fragile ZModel→Prisma). |
| GAP-02 | Decision Record entity (trigger…cost) — the trust spine | high | high | ADR-0003 blueprint; S1/S4 build the *other* (outbox/activity) log. Model + write path net-new. |
| GAP-03 | Workspace-defined custom objects (typed, decoupled from workflows) | high | med | Foundation in S5 (resource hub) + S2; dynamic object schema net-new. Retires TD-003 symptom. |
| GAP-04 | Workflow/DSL typed model (`workflow_kind`, typed stages, reason taxonomy) | high | high | Foundation in S6 (stage DSL + history); typed DSL surface net-new. ADR-0002 state machine kept. |
| GAP-05 | Per-action cost accounting (agent tokens + duration) | low | low | Foundation in S4; extends existing cost columns. Thin once GAP-02 exists. |
| GAP-52 | Agent-driven stage-transition write-path | med | med | Foundation in S6 + S8 authz; decision→PipelineEvent binding net-new on GAP-02/06. |

### agent-layer

| ID | Gap | Cx | Risk | Brownfield reuse |
|----|-----|----|----|------------------|
| GAP-06 | Brain / Orchestrator (classify, select, dispatch, record; never acts directly) | high | high | No phase; pure net-new runtime. |
| GAP-07 | Fixed agent roster + base (seven roles, no dynamic spawning) | high | high | No phase; net-new. |
| GAP-08 | Context Copilot — adaptive interview (writes Business Context live) | high | med | No phase; net-new. |
| GAP-09 | Configurator agent (Context → derives whole workspace) | high | high | No phase for the agent; outputs land on S5/S6. Net-new derivation engine. |
| GAP-10 | Visible reasoning + gap/inference/contradiction surfacing | med | med | No phase; net-new (the observability moat). |
| GAP-11 | Proposal-and-approve for every change (diff, challenge, edit, approve-all) | med | med | No phase; net-new trust primitive. |
| GAP-12 | Autonomy ceilings + confidence thresholds | med | med | No phase; reuses human ABAC concepts. |
| GAP-13 | No-engine-privileges enforcement (agents use same API/RBAC/audit) | med | high | Foundation in S8 (iam authz); agent-as-principal binding net-new. |
| GAP-14 | Outbox events on commit, fully wired | med | med | **Directly covered** by TD-008 (done) + TD-009 (open) + S1 (relay). Only agent-event emission new. |

### voice-runtime

| ID | Gap | Cx | Risk | Brownfield reuse |
|----|-----|----|----|------------------|
| GAP-15 | AI outbound voice operator (places/qualifies, per-language, scoped tools) | high | high | Substrate from S3/S7; AI conversational operator net-new. ADR-0007 stack reused. |
| GAP-16 | Scoped operator tool surfaces (no signature/closing tools) | med | med | No phase; composes with primitives registry. |
| GAP-17 | Inbound triage operator (text classifier/router) | med | med | Foundation in S7/ADR-0020 (inbound adapter); classifier net-new. |
| GAP-18 | Calendar booking during a call (mid-call handoff) | med | med | `Meeting` model present; in-call tool + handoff net-new. |
| GAP-19 | Voicemail/AMD detection + auto-drop | med | med | No phase; net-new on S7 seam. Cost-discipline lever. |
| GAP-20 | Mid-call escalation / human take-over | high | high | No phase; depends on live-monitoring seam. |
| GAP-21 | Recording-consent capture at call start (engine-enforced) | med | high | No phase; lives inside GAP-26 gate engine. Compliance moat. |
| GAP-22 | Live call monitoring (streaming transcript, timer, cost, status) | med | med | Substrate from S7 + S4; streaming transcript UI is the delta. |
| GAP-23 | Mid-call CRM lookups by the operator | low | low | No phase; thin once GAP-15 + GAP-01 exist. |
| GAP-24 | Voice profile / language library (DE v1, EN next) | med | low | No phase; net-new. |
| GAP-25 | Number-pool management (high-volume dialing) | med | low | Adjacent to S3; net-new pool layer beside existing identities. |

### compliance

| ID | Gap | Cx | Risk | Brownfield reuse |
|----|-----|----|----|------------------|
| GAP-26 | Engine-level compliance gate engine (dispatch-layer enforcement) | high | high | Seam in S7; gate engine net-new. The moat — engine-enforced. |
| GAP-27 | Calling-hours gate | low | med | Hooks GAP-26; net-new rule. |
| GAP-28 | DNC scrub gate (Robinson-Liste + workspace-internal) | med | high | Data state exists; enforcement-at-dispatch net-new on GAP-26. |
| GAP-29 | Consent / opt-in gate | med | high | Net-new on GAP-26 (UWG §7 / TCPA). |
| GAP-30 | Special-category-data handling (field encryption + access audit) | high | high | No phase; net-new (GDPR Art. 9). Adjacent to S8 audit, distinct. |
| GAP-31 | Per-motion compliance frames (UWG/GDPR ⇄ TCPA/CMS/state) | med | med | Net-new config layer over GAP-26. Enables both motions. |
| GAP-32 | Pflegekasse paperwork integration (PDF → signature → submission → sealed forms) | high | med | Partial reuse: signature components reusable; mapping/submission/sealing net-new (sealing v2+). |

### platform-dsl

| ID | Gap | Cx | Risk | Brownfield reuse |
|----|-----|----|----|------------------|
| GAP-33 | Primitives registry (named typed reusable actions) | med | med | No phase; the composability backbone for triggers/operators. |
| GAP-34 | Time-triggers on stages (anchor/after/calendar/condition → fire primitive) | med | med | Foundation in S6 (pipeline + callbacks); declarative trigger DSL net-new. |
| GAP-35 | Vocabulary / operator label presets per vertical | low | low | No phase (ADR-0005 intent); reduces TD-003 once present. |
| GAP-36 | Derivation trace + challenge/edit UX | med | med | No phase; rides GAP-09 + GAP-11. |
| GAP-37 | Per-vertical onboarding templates (<60-min self-serve) | med | med | No phase; directly retires TD-003. Enables English-markets trial. |

### improvement-loop (v2+ by strategy)

| ID | Gap | Cx | Risk | Brownfield reuse |
|----|-----|----|----|------------------|
| GAP-38 | Critic agent (batch analysis → evidence-cited findings → proposes prompt edit) | high | med | Foundation in S4 (call-analysis chain); Critic agent net-new (v2+). |
| GAP-39 | Prompt-version diff + eval-set run | high | med | No phase; net-new (v2+). |
| GAP-40 | Promoter agent (rollout + guard period + auto-rollback) | high | high | No phase; net-new (v2+). |
| GAP-41 | Improvement inbox | low | low | No phase; thin UI on GAP-38 (v2+). |

### reporting

| ID | Gap | Cx | Risk | Brownfield reuse |
|----|-----|----|----|------------------|
| GAP-42 | Daily operations dashboard (funnel KPIs, cost, spend) | med | low | Data from S4 + existing PipelineEvent; UI + wiring net-new. |
| GAP-43 | Starter report set derived from Business Context | med | low | No phase; rides GAP-09. |
| GAP-44 | DSL-computed report engine (deterministic — NOT LLM numbers) | high | med | No phase; net-new. The "trustworthy numbers" principle. |
| GAP-45 | Reporter agent (user-defined reports on demand) | med | low | No phase; net-new (v2+). |

### frontend

| ID | Gap | Cx | Risk | Brownfield reuse |
|----|-----|----|----|------------------|
| GAP-46 | Decision-chip / drawer "inspect reasoning" pattern | med | med | Governed by ADR-0017 UI taxonomy; net-new component. |
| GAP-47 | Daily-ops shell framing (Today / Live-calls / Improvements + badges) | med | low | Reuse existing Mantine shell; new surfaces/badges the delta. |
| GAP-48 | Live-calls board (fleet-wide) | med | low | Substrate from S7; board UI net-new. |
| GAP-49 | Voxera v2 design system (per ADR-0021) | med | low | No phase; reskin/extend existing Mantine. ADR-0021 lives in voxera-command. |
| GAP-50 | Mobile companion (live-call overview + drill-in/take-over) | med | low | No phase; net-new (lean v2). |
| GAP-51 | Per-lead causal audit timeline (event ← causing Decision Record) | med | low | No phase; composes existing events + GAP-02 via GAP-46 primitive. |

### Critical gaps (8) — high moat-impact AND blocking

GAP-01 Business Context · GAP-02 Decision Record · GAP-04 Workflow/DSL typed model · GAP-06 Brain/Orchestrator · GAP-07 Fixed agent roster + base · GAP-09 Configurator agent · GAP-15 AI outbound voice operator · GAP-26 Engine-level compliance gate engine. These are the spine of the product thesis — everything else depends on them, and each is a moat differentiator.

## RICE prioritization

**Score = (Reach × Impact × Confidence) ÷ Effort**, calibrated to the strategy (Reach = how many of the four motions/verticals a gap touches; Impact weighted to the differentiator + three moat layers; Confidence capped at 0.5 for explicit v2+ items; Effort in person-weeks for a 5-person bootstrapped team). Full table and the dependency-vs-score reconciliation are in the RICE artifact.

### Top 10 by raw RICE score

| # | Gap | Cat | Score | Why it tops the list |
|---|-----|-----|-------|----------------------|
| 1 | GAP-46 | frontend | 8.00 | Cheap (2 pw), reused across every flow; inspect-reasoning moat made repeatable. |
| 2 | GAP-05 | data-model | 5.33 | Tiny lift on existing cost columns; the cost-discipline lever both motions need. |
| 3 | GAP-01 | data-model | 5.00 | The Business Context substrate — max reach, max impact, demo-proven necessity. |
| 4 | GAP-02 | data-model | 5.00 | The Decision Record trust spine — max reach, max impact. |
| 5 | GAP-04 | data-model | 4.29 | Typed Workflow DSL — the OS-underneath everything else builds on. |
| 6 | GAP-31 | compliance | 4.27 | Per-motion compliance frames — one gate engine serving both GTM motions. |
| 7 | GAP-22 | voice-runtime | 4.00 | Live call monitoring — the observability pitch made visible, cheap on S7+S4. |
| 8 | GAP-16 | voice-runtime | 3.73 | Scoped operator tool surfaces — what makes the AI operator safe. |
| 9 | GAP-11 | agent-layer | 3.60 | Proposal-and-approve — the one-click-trust primitive, cross-cutting. |
| 10 | GAP-10 | agent-layer | 3.60 | Visible reasoning + honest flags — the observability moat. |

### Full ranked list (all 52)

| Rank | Gap | Score | Rank | Gap | Score | Rank | Gap | Score | Rank | Gap | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | GAP-01 | 5.00 | 14 | GAP-42 | 2.67 | 27 | GAP-35 | 2.80 | 40 | GAP-30 | 1.33 |
| 2 | GAP-02 | 5.00 | 15 | GAP-33 | 2.13 | 28 | GAP-19 | 1.87 | 41 | GAP-36 | 1.60 |
| 3 | GAP-04 | 4.29 | 16 | GAP-44 | 2.56 | 29 | GAP-27 | 3.20 | 42 | GAP-51 | 3.20 |
| 4 | GAP-15 | 3.00 | 17 | GAP-11 | 3.60 | 30 | GAP-28 | 3.20 | 43 | GAP-25 | 1.60 |
| 5 | GAP-14 | 2.67 | 18 | GAP-10 | 3.60 | 31 | GAP-29 | 3.20 | 44 | GAP-49 | 2.13 |
| 6 | GAP-07 | 2.29 | 19 | GAP-52 | 3.20 | 32 | GAP-31 | 4.27 | 45 | GAP-03 | 2.13 |
| 7 | GAP-06 | 2.29 | 20 | GAP-08 | 2.24 | 33 | GAP-43 | 3.20 | 46 | GAP-50 | 0.50 |
| 8 | GAP-05 | 5.33 | 21 | GAP-17 | 1.60 | 34 | GAP-34 | 1.87 | 47 | GAP-20 | 1.17 |
| 9 | GAP-22 | 4.00 | 22 | GAP-12 | 2.40 | 35 | GAP-47 | 2.67 | 48 | GAP-41 | 1.17 |
| 10 | GAP-26 | 3.20 | 23 | GAP-13 | 1.80 | 36 | GAP-37 | 1.60 | 49 | GAP-45 | 0.58 |
| 11 | GAP-09 | 2.00 | 24 | GAP-21 | 2.80 | 37 | GAP-32 | 1.20 | 50 | GAP-38 | 1.00 |
| 12 | GAP-46 | 8.00 | 25 | GAP-23 | 3.73 | 38 | GAP-24 | 1.60 | 51 | GAP-39 | 0.50 |
| 13 | GAP-16 | 3.73 | 26 | GAP-18 | 3.73 | 39 | GAP-48 | 1.87 | 52 | GAP-40 | 0.78 |

> The rank column follows the **strategic build narrative** (dependency-forced order), not strictly descending raw score — so the score and the build sequence read side-by-side. Where raw RICE rewards cheap, low-dependency items (GAP-46 at 8.00 can't ship before the GAP-02 it renders; GAP-05 is a thin extension of GAP-02; the voice operator tools outscore the runtime they depend on), the dependency graph forces the order. **Net build arc:** data-model spine (01→02→05→04) → agent runtime (06→07) → the differentiator (15→16) → trust/observability surface (46→10→11→22) → compliance moat (26→27/28/29→31) → configurator + OS layer (09→03→35/37) → reporting (44→42→43) → v2+ improvement loop (38→39→40→41) last.

## Sequenced bets

The 52 RICE-ranked gaps regroup into **13 Shape-Up bets**, sequenced by dependency first and RICE second, each citing the restructuring phase(s) it builds on so the plan is buildable on today's codebase, not a rewrite. Appetite is the budget (small-batch ≈ 1–2 weeks; big-batch ≈ a 6-week cycle). The **full per-bet detail and the sequenced product roadmap live in [roadmap.md](./roadmap.md)** — this is the betting-table summary.

| Bet | Title | Appetite | Horizon | Gaps closed |
|-----|-------|----------|---------|-------------|
| **B1** | Agent data-model spine (Context + Decisions + cost) | big | **Now** | GAP-01, 02, 05, 46 |
| **B2** | Outbox fully wired + agent-event emission | small | **Now** | GAP-14 |
| **B3** | Brain + fixed agent roster + base | big | **Next** | GAP-06, 07, 13 |
| **B4** | Typed Workflow DSL + primitives + write-path | big | **Next** | GAP-04, 33, 52, 34 |
| **B5** | AI outbound voice operator + scoped tools | big | **Next** | GAP-15, 16, 23, 24 |
| **B6** | Compliance gate engine + per-motion frames | big | **Next** | GAP-26, 27, 28, 29, 21, 31 |
| **B7** | Trust & observability surface | big | **Next** | GAP-10, 11, 12, 22, 51 |
| **B8** | Daily-ops shell + report engine + dashboard | big | **Next** | GAP-47, 42, 44, 43 (engine), 48 |
| **B9** | Context Copilot + Configurator + self-serve onboarding | big | **Next** | GAP-08, 09, 36, 35, 37, 43 (derivation) |
| **B10** | Hybrid-close handoff (in-call booking, inbound triage, escalation) | big | **Later** | GAP-18, 17, 19, 20, 50 |
| **B11** | OS object layer + brand expression | big | **Later** | GAP-03, 25, 49 |
| **B12** | Continuous-improvement loop (Critic → eval → Promoter) | big | **Later** | GAP-38, 39, 40, 41, 45 |
| **B13** | Deep DACH compliance (Pflegekasse paperwork + special-category data) | big | **Later (last)** | GAP-32, 30 |

**Counts:** 13 bets · Now = 2 · Next = 7 · Later = 4.

**Net build arc:** *Now:* B1 → B2. *Next:* B3 (runtime) → B4 (DSL) → B6 (compliance gate) → B5 (voice operator, gated by B6 — the gate must front dispatch before the first live AI call) → B7 (trust/observability) → B8 (ops surface) → B9 (configurator/onboarding). *Later:* B10 (hybrid-close) → B11 (OS layer + brand) → B12 (improvement loop) → **B13 (deep DACH compliance, dead last)**.

**B13 deep-DACH-compliance is deliberately last (CEO direction, 2026-06-21).** The Pflegekasse paperwork (GAP-32) and GDPR Art. 9 special-category-data handling (GAP-30) are the deepest DACH vertical moat and genuinely defensible — but they are **secondary** to everything else and are sequenced dead last. Critically, the **generic, per-motion compliance *gate engine*** (calling-hours, DNC, consent, recording-consent) lands much earlier in **B6** and serves *both* GTM motions; only the DACH-care-specific *depth* is deferred. The DACH motion operates today without this depth automated — it is moat-deepening, not table-stakes — so pulling it forward would starve the v1 spine and the differentiator.

> *Decision recorded as [ADR-0023: Dispatch-layer compliance gate engine](../../../voxera-crm/decisions/ADR-0023-dispatch-layer-compliance-gate-engine.md).*

> *Decision recorded as [ADR-0022: Evolve the CRM into the AI product via strangler-fig sequencing](../../decisions/ADR-0022-strangler-fig-crm-to-ai-product.md).*

## Open questions

1. **Business Context versioning depth (B1).** B1 deliberately ships "one editable version + history," not a full temporal store. Is that sufficient for the audit/trust posture the vision promises, or will regulated customers expect point-in-time reconstruction of "what Context did the agent read on date X" sooner than v2?
2. **TD-001 (fragile ZModel→Prisma) under load.** Every net-new data-model gap (GAP-01/02/03/04) traverses the fragile migration path behind the guarded gate (PP-001). The plan files friction as debt and moves on — but four high-complexity models in quick succession may force TD-001 remediation earlier than "later." When does the migration fragility become a blocker rather than a tax?
3. **B6-before-B5 sequencing cost.** The compliance gate engine (B6) is sequenced *before* the differentiating voice operator (B5) because the gate must front dispatch. This delays the single most demo-able capability. Is there a thin "gate-stub" that lets B5 prototype against a non-production gate so the differentiator can be shown to investors/customers before B6 fully lands?
4. **Confidence on the v2+ block (B12).** The improvement-loop bets are confidence-capped at 0.5 by strategy. If early DACH calling produces strong real call data faster than expected, does the Critic (GAP-38) get pulled from "Later" into "Next" — and what evidence threshold would justify overriding the bootstrapped-discipline default?
5. **English-markets self-serve readiness (B9).** B9 enables the <60-min self-serve trial the English-markets motion depends on, but it sits at the *end* of "Next." Does the English motion need a lighter-weight onboarding path before B9, or does the DACH-first sequencing implicitly defer the English motion's GTM proof to next year?

## Changelog
- 2026-06-22 v1: initial gap-analysis dossier — assembled from the target-product inventory (67 caps / 11 themes), the current-state audit (30 caps, AI-layer absent), the 52-gap backlog, the RICE ranking, and the 13-bet sequence (B13 deep-DACH-compliance dead last per CEO direction).
