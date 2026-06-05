---
title: Product Roadmap
version: 2
status: active
updated: 2026-05-31
owner: you
---

> Two parallel motions per [ADR-0009](../../decisions/ADR-0009-english-markets-parallel-motion.md): **DACH** (founder-led, UWG §7-compliant) and **English-speaking markets** (paid-search-led, three verticals). Items are grouped by motion.

## Now

**English-markets motion** — [playbook](../strategy/vertical-strategy-english-markets.md):
- [ ] [FEAT-001](./features/FEAT-001-vertical-landing-templates-astro.md) — Translate vertical landing-page specs to Astro (website) — foundational; blocks every vertical page below
- [ ] [FEAT-002](./features/FEAT-002-real-estate-landing-page.md) — Build /real-estate landing page (website) — depends on FEAT-001

**DACH motion**:
- [ ] Continuing on the existing motion — no new specs open right now

## Next

**English-markets motion**:
- [ ] `/home-services` landing page with sub-vertical chips (website) — after FEAT-002 ships; FEAT to be drafted
- [ ] `/insurance` landing page (website) — Q2; depends on TCPA-compliance backend work + IMO partnership conversations
- [ ] Backend integration for the "Get called by the AI now" demo endpoint (crm) — converts the FEAT-001 Pages Function stub into a real outbound-call trigger

## Later

- [ ] TCPA cornerstone resource page (website) — credibility asset for the insurance vertical (per `vertical-strategy-english-markets.md` §4.5)
- [ ] `/compare?competitor=X` DTR page for paid-search competitor traffic (website) — only when paid-search competitor campaigns actually run
- [ ] Per-vertical activation email tweaks (per `vertical-strategy-english-markets.md` §9) — RE, HS, Ins variants
- [ ] Adjacent DACH vertical (Hörgeräte or private health insurance) — year-2 milestone per [`strategy.md`](../strategy/strategy.md) §7
- [ ] Multi-language voice agents — EN as first-class alongside DE — year-2 milestone

> Check the box when the implementing run is merged. Each item maps to a FEAT spec; if the line doesn't have a FEAT id yet, draft one in `docs/product/features/` before starting work.

## Changelog
- 2026-05-31 v2: replaced placeholder entries with real FEAT-001 and FEAT-002 (both website, both English-markets motion). Restructured to group items by motion (DACH vs English-markets) per [ADR-0009](../../decisions/ADR-0009-english-markets-parallel-motion.md). Added "Next" items for home services + insurance landing pages and the demo-endpoint backend integration (no FEAT ids yet — to be drafted before work starts). Added "Later" items pulled from `vertical-strategy-english-markets.md` and `strategy.md` §7 milestones.
- 2026-05-27 v1: initial.
