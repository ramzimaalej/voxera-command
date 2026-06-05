---
id: ADR-0008
title: Pflegebox / DACH as v1 wedge on a workflow-kind-agnostic platform
status: accepted
date: 2026-05-31
supersedes: []
superseded_by: null
affects:
  - docs/strategy/strategy.md
  - docs/architecture/architecture-vision-and-principles.md
  - docs/architecture/workflow-dsl.md
  - docs/architecture/voice-calling.md
---

## Context

Two strategic questions, one decision:

1. **What vertical do we serve first?** Generalist CRMs (HubSpot, Pipedrive, Close, Salesforce SMB) own the broad SMB market. AI-SDR specialists (Clay, 11x, Artisan, Regie) sell outreach, not full-lifecycle CRMs. AI voice infrastructure (Vapi, Retell, Bland) sells the runtime, not the workflow. The competitive whitespace is regulated verticals where compliance, paperwork integration, and vertical depth keep generalists out.
2. **Do we hard-code the v1 vertical into the platform, or keep the platform process-agnostic underneath?** Hard-coding ships faster; agnostic-underneath preserves expansion optionality without rebuild.

We already have two paying Pflegebox customers (commission-based) in DACH. German-language voice agent tuning gives a head start. Adjacent DACH verticals (Hörgeräte, private health insurance, care services, mobility aids) share buyer profile and paperwork patterns — natural v2 targets.

## Decision

Two coupled commitments:

- **v1 wedge: Pflegebox (free monthly care supplies in Germany, funded by Pflegekassen under § 40 SGB XI), DACH-only, outbound-heavy, hybrid close.** Pflegebox is the *forcing function*: v1 must demonstrably run a Pflegebox CRM well — outbound German-language voice qualification, Pflegekasse paperwork integration, § 7 UWG compliance, full lifecycle from inquiry to enrollment. Every architecture decision is testable against this.
- **Platform stays workflow-kind-agnostic from day one.** The engine, DSL, agent roster, audit, and real-time infrastructure carry no CRM-specific or care-vertical-specific terminology. The DSL declares a workflow's topology kind (`linear_funnel` is the only kind shipped in v1; future kinds are documented extension points). Custom objects are workspace-scoped and decoupled from specific workflows. User-facing CRM labels live in a per-workflow-kind preset (see [[ADR-0005]]).

The expansion path is documented but uncommitted on calendar: v2 (year 2) = adjacent DACH care/insurance; v3 (year 3+) = English-speaking regulated markets, conditional on v1/v2.

## Alternatives considered

- **Generic SMB CRM positioning in v1** — competes head-on with HubSpot / Pipedrive / Close. No moat, no whitespace. Rejected; listed as an explicit non-goal in `architecture-vision-and-principles.md` §4.
- **Hard-code the Pflegebox vertical into the platform** — fastest to v1, but the OS bet dies and every future vertical is a rewrite. Rejected.
- **Build the agnostic platform and worry about a wedge later** — the platform without a forcing function under-specifies every decision. We've seen this fail elsewhere. Rejected.
- **English-speaking markets first** — saturated with AI CRM tooling; competitive density is high; voice quality advantage is smaller. Rejected for v1, kept for v3.

## Consequences

- Positive:
  - Pflegebox is concrete enough to force decisions — vague architecture loses to specific architecture every time.
  - Two paying customers fund initial development without dilution.
  - DACH-care positioning is defensible: compliance + paperwork + German voice tuning + buyer trust accumulate as moat.
  - The agnostic platform underneath means v2 ships features, not rewrites.
- Negative / risks:
  - v1 ships a single-vertical CRM. If Pflegebox economics weaken (regulatory change, Pflegekasse policy shift, commission compression), the wedge narrows before v2 lands.
  - The agnostic-underneath discipline costs ongoing review — every contributor must resist hard-coding care-vertical assumptions into the engine.
  - "Pflegebox is the forcing function, not the ceiling" only works if the team holds the line on workflow-kind-agnostic engine code. Drift here is the long-term failure mode.
- Follow-ups:
  - Quarterly check on Pflegebox unit economics and Pflegekasse regulatory signals.
  - First non-Pflegebox vertical pilot should land inside year 2 to validate the agnostic-underneath claim.
  - Lint rule and code-review discipline against CRM-flavored identifiers in engine code (also tracked in [[ADR-0005]]).
