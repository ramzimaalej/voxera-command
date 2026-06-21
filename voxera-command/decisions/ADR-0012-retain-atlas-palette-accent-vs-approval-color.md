---
id: ADR-0012
title: Retain Atlas palette; brand accent and approval color are separate knobs
status: superseded
date: 2026-06-04
supersedes: []
superseded_by: ADR-0021
affects:
  - ../voxera-os/docs/brand/brand-guidelines.md
  - ../voxera-website/src/styles/site.css
  - ../voxera-crm (in-product design tokens)
---

> **Superseded by [[ADR-0021]]** (adopt the Voxera v2 design system) on 2026-06-21 — the Atlas palette + Fraunces/DM Sans are replaced by the v2 indigo/cyan/ember two-mode system. The "brand accent ≠ approval color" principle survives (v2 gives AI its own reserved cyan). Retained for history.

## Context

The website and CRM both ship on the **Atlas** palette (near-white + near-black ink + a single deep-brass accent `#8E6824` + navy secondary, mono-accent, editorial), documented in `../voxera-os/docs/brand/brand-guidelines.md` v2. Atlas itself replaced an earlier warm-cream + electric-orange palette that read too close to Anthropic.

The question raised: should we adopt a different palette, and specifically — given the product's core gesture is **Approve / Reject / Roll back** and the mark is literally an approval check — should the accent be a color that *means* the gesture?

Three alternatives were designed against the exact Atlas token structure (so any swap is drop-in) and previewed side-by-side in context (hero, eyebrow, buttons, proposal cards, in the real Fraunces / DM Sans / JetBrains Mono fonts):

- **Oxblood** — literary deep-red accent (`#8C2F39`), slate secondary. Pushes "editorial, not enterprise" furthest.
- **Evergreen** — pine accent (`#2F5D45`), warm-clay secondary, brighter `--ok`. Accent aligns with the approve gesture.
- **Cobalt** — saturated ink-blue accent (`#1E50A8`), brass demoted to secondary. Most legible, most conventional.

A follow-on question: keep **Atlas for the website and Evergreen for the CRM** — a two-tier brand.

The key realization that reframed both questions: **the brand accent and the approval color are separate knobs.** "Approve = green / Reject = red" is a *functional* color need that exists independent of brand identity — and Atlas already carries it (`--ok #2E6B43`). So the desire for green-approval semantics in-product does **not** require making green the brand accent; it's already available as a functional status color.

## Decision

**Retain Atlas as the single brand palette across both the website and the CRM.** No change to `site.css` tokens or in-product brand tokens.

Two principles confirmed alongside the retention:

1. **One brand accent across all surfaces.** The accent + dot is the brand carrier (per `brand-guidelines.md` § "The dot system"). It must be identical at the website → "Start free trial" → product handoff, which is the highest-trust seam. We do **not** run different brand accents on the marketing site vs. the product.
2. **Brand accent ≠ approval color.** The brand accent (dot, links, primary CTAs, eyebrows) is `--accent` deep brass. Approval/rejection semantics in-product are carried by **functional** colors — green `--ok` for approve/success, red for reject/destructive — and by the **check shape** of the mark, not by recoloring the brand. Status colors remain functional, not brand (this restates the existing mono-accent rule).

## Alternatives considered

- **Switch to Oxblood** — Rejected for this product. Strongest on pure editorial grounds and the most memorable, but red is the universal *reject / destructive / error* color. Using it as the primary/approve accent in an approval-centric CRM fights the semantics of the product's own Reject button. Great for a brand site, awkward in an approval queue.
- **Switch to Evergreen** — Rejected, but closest contender. Green aligns beautifully with the approval gesture — however, the benefit it was chosen for (green = approve) is already obtainable via the functional `--ok` color without discarding Atlas. Switching the whole brand to capture a semantic that functional color already provides is a large move for a lateral gain, and it risks blurring brand-green against status-green.
- **Switch to Cobalt** — Rejected. The brand explicitly argues against "gradient SaaS blue" (`brand-guidelines.md` § Anti-patterns); even a single saturated cobalt is the most on-the-nose, least category-contrarian option.
- **Two-tier brand: Atlas on the website, Evergreen in the CRM** — Rejected. Fractures the single strongest recognition asset (accent + dot) at the exact seam where trust transfers (site → signup → product). Doubles the token sources of truth and invites drift — overhead a 5-person, 3-customer team should not take on. A deliberate marketing-brand-vs-product-brand split is a legitimate mature-company pattern with explicit token mapping and an owner; it is not worth its weight at this stage.
- **Keep Atlas (chosen)** — Zero implementation cost (already live), preserves brand continuity across surfaces, and the approval-semantics need is met by functional color that already exists.

## Consequences

- **Positive:**
  - No implementation work; Atlas is already shipped in `site.css` and in-product.
  - Brand continuity across the website → product handoff is preserved — one accent, one dot, everywhere.
  - The "accent vs. approval color are separate knobs" framing is now recorded, so the recurring "should we go green/red/blue?" question has a durable answer instead of re-litigating from scratch.
  - This is the first dedicated canonical ADR for the brand palette; prior ADRs (e.g. ADR-0009) referenced "Atlas per ADR-0006-adjacent decisions" loosely. That reference is now concrete.

- **Negative / risks:**
  - We forgo the bolder editorial identity Oxblood would have given the marketing site.
  - In-product, brand-brass and functional-green/red must stay visually distinct so the brand dot never reads as a status pip. Mitigation: rely on the **check shape** to carry "approved," reserve a clearly distinct `--ok` green, and never place the brand dot adjacent to a status pip of similar size.

- **Follow-ups:**
  - Add a one-line note to `../voxera-os/docs/brand/brand-guidelines.md` § Color recording the "brand accent ≠ approval color" principle and the rejected alternatives, so the guideline doc reflects this ADR. (Brand doc owns *what*; this ADR owns *why*.)
  - When CRM in-product design tokens are formalized, ensure they inherit the same `--accent` and keep `--ok` / reject-red as functional-only.

## Relationship to prior ADRs

- **Makes concrete the loose reference in [ADR-0009]** ("Atlas palette per ADR-0006-adjacent decisions"). Atlas now has a dedicated palette ADR. Both GTM motions continue to share Atlas, as ADR-0009 assumed.
- **Does not affect [ADR-0006]** (JSON Forms + Mantine renderer) — the in-product forms layer is unchanged; this ADR only fixes the brand-accent vs. functional-color relationship the renderer should follow.
- **Consistent with the mono-accent rule** in `brand-guidelines.md` (one brand accent; status colors are functional, not brand).
