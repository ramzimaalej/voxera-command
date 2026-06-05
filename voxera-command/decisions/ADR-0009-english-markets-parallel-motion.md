---
id: ADR-0009
title: English-speaking markets GTM in parallel with the DACH motion
status: accepted
date: 2026-05-31
supersedes: []
superseded_by: null
affects:
  - docs/strategy/strategy.md
  - docs/strategy/vertical-strategy-english-markets.md
  - docs/product/roadmap.md
---

## Context

ADR-0008 fixed the v1 wedge as Pflegebox/DACH on a workflow-kind-agnostic platform, with English-speaking markets sequenced as v3 (year 3+, conditional on v1/v2 success). The reasoning was concentration: better to win one regulated DACH vertical than dilute attention across geographies.

Two things changed:

1. **English-market lead-cost economics are viable now, not in year 3.** The three-vertical research (`docs/strategy/vertical-strategy-english-markets.md`) shows real estate, home services, and insurance all have buyer-is-user, days-not-quarters decision cycles, painful felt cost of slow lead response, and ACVs ($149–$1,500/mo) that support paid acquisition with sub-12-month CAC payback.
2. **The DACH motion is constrained by UWG §7** (German cold-calling law). The founder is running DACH on a compliance-respecting motion (no cold outbound to consumers without prior consent) — which limits the speed at which DACH alone can scale. English-speaking markets don't share this constraint and can absorb meaningful paid-search spend immediately.

The platform decision in ADR-0008 (workflow-kind-agnostic engine, generic DSL, per-vertical label presets per ADR-0005) means a second motion costs little architecturally — it's labels + landing pages + paid-search campaigns + per-vertical operator templates, not a fork in the engine.

The choice in tension: stay sequenced and concentrated (ADR-0008 baseline), or open a parallel motion now to convert the platform optionality into revenue earlier.

## Decision

Run **two parallel GTM motions** starting now:

1. **DACH / Pflegebox** — founder-led, UWG §7-compliant, inbound-then-outbound only. Continues per the existing motion. No structural change.
2. **English-speaking markets** — three verticals (real estate, home services, insurance), paid-search-led with the "AI calls the lead in 30 seconds" demo as the central conversion mechanic. Detailed in `docs/strategy/vertical-strategy-english-markets.md`. Sequencing: real estate first (Q1), home services second (Q2 expand), insurance third (Q2 launch after compliance work).

Both motions share: the product, the engine, the design system (Atlas palette per ADR-0006-adjacent decisions), the audit model (ADR-0003), the agent roster (ADR-0004), the voice stack (ADR-0007). They differ in: lead source, sales-motion shape, vocabulary, compliance frame (UWG vs TCPA + CMS + state insurance regs), localization (DE vs EN).

Founder time allocation (per the English-markets doc): **60% real estate, 25% home services, 15% insurance** for English markets; DACH continues at its current pace alongside. The English-markets motion is intentionally the larger time commitment because it has the higher growth-rate ceiling.

## Alternatives considered

- **Stay sequenced (ADR-0008 baseline)** — Pflegebox first, English markets at v3. Rejected: leaves real lead-cost economics on the table for 24+ months; doesn't exercise the platform-agnostic claim until v3.
- **Switch to English markets only, sunset DACH** — Rejected. DACH has two paying customers, German voice tuning is a real moat, and the Pflegebox cash flow funds operations. Walking from a profitable bootstrapped motion to chase paid-acquisition growth is the kind of decision that needs an external check before it ships, and there isn't one.
- **Add a third motion (e.g., UK/AU regulated verticals separately)** — Rejected for concentration. Three English-market verticals + DACH is already aggressive; adding more dilutes execution.
- **Treat English markets as research only, not launch** — Rejected. The research is solid; the platform is ready; the lead-cost math is unambiguous. Sitting on it is the more expensive choice.

## Consequences

- **Positive:**
  - Two parallel revenue streams. If DACH growth plateaus or hits regulatory turbulence, English markets carry; if English-market CAC blows up, DACH continues.
  - Validates the workflow-kind-agnostic platform claim (ADR-0008 P13 + ADR-0005 vocabulary split) early — by year 1 instead of year 3. Forces the OS bet to pay off.
  - Diversifies the customer-success surface. DACH-only product has unfixed assumptions about jurisdiction, language, vertical workflow. Adding three English verticals shakes them out.
  - The English-market motion's $145K MRR target by month 12 (per the vertical-strategy doc) plus DACH growth puts the combined ARR run-rate well above the previous $1M target.

- **Negative / risks:**
  - **Founder bandwidth split.** Previous model was concentrated DACH; new model is concentrated English + DACH parallel. This works only because DACH has stabilized to a founder-led motion that doesn't need full-time attention.
  - **"What we are not" needs rewriting.** Section 5 of `strategy.md` previously said "we are not selling outside regulated verticals in v1." Two of the three English verticals (real estate, insurance) are regulated under different frames (TCPA, CMS, state insurance, state real-estate rules); home services is largely unregulated SMB. This makes us a regulated-where-it-matters CRM, not strictly a regulated-verticals-only CRM.
  - **Operational complexity.** Two analytics setups (GA4 with English-market UTMs + whatever DACH uses), two payment processors (USD + EUR), two compliance frames, two support inboxes, eventually two onboarding flows. The decision is: keep them shared where possible, split where required by the motion.
  - **Brand split risk.** Atlas palette + Voxera voice cover both motions — but the demos and case studies will increasingly skew English-market. Watch for DACH messaging starvation.
  - **English-market verticals don't share Pflegebox's "regulated paperwork integration" moat layer.** Real estate uses MLS feeds + appointment booking; home services uses field-service tools; insurance uses lead vendors + AMS. The vertical-depth moat per ADR-0008 (Pflegekasse paperwork) is DACH-specific; the English-market moats are different (TCPA-compliant AI calling for insurance, 5-minute-rule wedge for real estate, missed-calls wedge for home services).

- **Follow-ups:**
  - Update `docs/strategy/strategy.md` to v2: add two-motion section, update §5 "What We Are Not" to remove the strict regulated-verticals-only clause, update §7 milestones to include English-market MRR targets. (Done in same commit as this ADR.)
  - Promote `docs/strategy/vertical-strategy-english-markets.md` to `status: active`. (Done in same commit.)
  - Update `docs/product/roadmap.md` if the English-market launch creates new FEAT-xxx items (likely: paid-search landing pages, GA4 event taxonomy, lead-vendor integrations per vertical).
  - Translate the §6/§7 implementation specs in the vertical-strategy doc from vanilla-HTML to Astro (the doc was written against an earlier site stack). Not blocking the strategy decision; blocking the website work that follows from it.
  - Verify the two-motion split doesn't break the bootstrapping-friendly cost discipline. The English-market motion needs paid-search spend ($150–250/day to start, scaling with conversion). Budget comes from DACH commission revenue + the English-markets trial-to-paid conversion — if the latter slips, paid spend must shrink, not grow on credit.

## Relationship to prior ADRs

- **Amends [ADR-0008]** (Pflegebox / DACH as v1 wedge on workflow-kind-agnostic platform): the wedge claim is unchanged for DACH; the "English speaking markets are v3" claim is now superseded by this ADR. The platform-agnostic architecture claim is strengthened — this ADR is the first test of it.
- **Depends on [ADR-0005]** (Generic DSL vocabulary with per-workflow label presets): each English-market vertical gets its own preset (real-estate → "Lead/Showing/Agent"; home-services → "Job/Estimate/Customer"; insurance → "Lead/Policy/Agent"). The vocabulary discipline ADR-0005 enforces is what makes this cheap.
- **Depends on [ADR-0007]** (Twilio + Ultravox voice stack): the English-market motion relies on the same voice stack. No change to the runtime choice.
- **Does not affect [ADR-0002, ADR-0003, ADR-0004, ADR-0006]** — engine, audit model, agent roster, and forms layer are unchanged.
