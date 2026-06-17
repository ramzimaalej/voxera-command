---
title: Product Roadmap
version: 3
status: active
updated: 2026-06-16
owner: you
---

> Two parallel motions per [ADR-0009](../../decisions/ADR-0009-english-markets-parallel-motion.md): **DACH** (founder-led, UWG §7-compliant) and **English-speaking markets** (paid-search-led, three verticals). Items are grouped by motion.

## Now

**English-markets motion** — [playbook](../strategy/vertical-strategy-english-markets.md):
- [ ] **FEAT-001** — Translate vertical landing-page specs to Astro — foundational; blocks every vertical page below · spec: `voxera-website/features/FEAT-001-vertical-landing-templates-astro.md`
- [ ] **FEAT-002** — Build /real-estate landing page — depends on FEAT-001 · spec: `voxera-website/features/FEAT-002-real-estate-landing-page.md`

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

> Check the box when the implementing run is merged. Each item maps to a FEAT spec; the spec lives in the **implementing code repo** (`voxera-website/features/`, `voxera-crm/features/`), referenced here by ID per [ADR-0014](../../decisions/ADR-0014-split-engineering-os-from-confidential-command-repo.md). If a line has no FEAT id yet, draft the spec in that code repo before starting work.

## Changelog
- 2026-06-16 v3: FEAT-001 and FEAT-002 relocated to `voxera-website/features/` per ADR-0014 (specs live in the implementing repo; the confidential roadmap references them by ID). Replaced the broken cross-repo file-links with ID + spec-path pointers.
- 2026-05-31 v2: replaced placeholder entries with real FEAT-001 and FEAT-002 (both website, both English-markets motion). Restructured to group items by motion (DACH vs English-markets) per [ADR-0009](../../decisions/ADR-0009-english-markets-parallel-motion.md). Added "Next" items for home services + insurance landing pages and the demo-endpoint backend integration (no FEAT ids yet — to be drafted before work starts). Added "Later" items pulled from `vertical-strategy-english-markets.md` and `strategy.md` §7 milestones.
- 2026-05-27 v1: initial.
