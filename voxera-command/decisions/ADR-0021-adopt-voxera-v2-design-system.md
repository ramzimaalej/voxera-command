---
id: ADR-0021
title: Adopt the Voxera v2 design system (indigo/cyan/ember, two-mode product+marketing)
status: accepted
date: 2026-06-21
supersedes: [ADR-0012]
superseded_by: null
affects:
  - ../voxera-os/docs/brand/design-system/
  - ../voxera-os/docs/brand/brand-guidelines.md
  - ../voxera-website/src/styles/site.css
  - ../voxera-website/src/components/Logo.astro
  - ../voxera-crm (in-product design tokens)
---

## Context

[[ADR-0012]] retained the **Atlas** palette (near-white + ink + deep-brass accent `#8E6824` + navy, mono-accent, Fraunces/DM Sans) as the single brand across website and product, and confirmed two principles: one brand accent across all surfaces, and brand-accent ≠ approval color.

A dedicated brand-strategy effort (the *VoxeraBrandStrategyProject*) produced a complete **v2 design system** — a documented foundation (color, type, spacing, elevation, motion, AI states), component + dashboard specs, marketing blocks, a palette exploration (Option E adopted), and machine-consumable **design tokens** (a Mantine theme + CSS variables). It is incorporated at `voxera-os/docs/brand/design-system/` (browser-openable `*.dc.html` specs). This ADR records the decision to adopt it as the canonical visual identity, replacing Atlas.

## Decision

**Adopt the v2 design system as the single source of truth for how every Voxera surface looks.** Its tokens (`04 Tokens`) are the only values surfaces import; `voxera-os/docs/brand/brand-guidelines.md` now defers to it for all visual specifics and keeps the verbal brand.

Key shape:
1. **One brand foundation, two visual modes.** A **cool, dense Product** mode (voxera-os, command center, CRM — Space Grotesk display) and a **warm, editorial Marketing** mode (website — Newsreader serif). The brand hues cross the line unchanged so the surfaces read as one family.
2. **Palette:** brand **indigo `#2A33B8`** (primary) + **AI cyan `#0E8C9A`** + **Ember `#E2552B`** (marketing accent). Neutrals do ~70% of the work. Fonts: Space Grotesk / Newsreader / Hanken Grotesk (body) / JetBrains Mono.
3. **A dedicated AI color (cyan), never a CTA.** Machine-generated content carries cyan + a ◆ glyph + a confidence number + links to sources. This *extends* ADR-0012's "brand accent ≠ approval/functional color" principle: AI now has its own reserved knob, separate from both brand and status colors. The "AI proposes, you approve" Proposal→Approve→roll-back primitive is retained as the signature pattern.
4. **Tokens are the only import**, dark mode is first-class (hues lift for AA, not a flat inversion).

This supersedes ADR-0012: the palette changes (Atlas → indigo/cyan/ember), and "one brand accent across all surfaces" becomes "one brand *foundation*; mode-specific accents (indigo product / ember marketing) over constant brand hues."

## Alternatives considered

- **Keep Atlas (ADR-0012).** Rejected: the dedicated v2 effort produced a more complete, tokenized, two-mode system that better serves a multi-surface product (os + command + crm + marketing) and gives AI its own visual language — which Atlas lacked. Atlas's editorial intent survives in the v2 **Marketing** mode.
- **Single mode (one look for product + marketing).** Rejected: product needs density/scanning/keyboard-first; marketing needs trust/story/conversion. v2 keeps them one family via constant brand hues while letting grounds + display fonts differ.
- **Palette alternatives (Oxblood / Evergreen / Cobalt, and the v2 exploration's other options).** Rejected in favor of Option E (indigo + AI cyan), recorded in `design-system/Voxera v2 - Palette Alternatives.dc.html`.

## Consequences

- Positive:
  - One tokenized source of truth (`04 Tokens`) → a value change ships to every surface at once.
  - AI gets a consistent, non-CTA visual language across all product surfaces.
  - Marketing keeps an editorial feel; product gains a dense, keyboard-first system.
- Negative / risks:
  - **Implementation lag.** `voxera-website/src/styles/site.css` + `Logo.astro` are still on v1 Atlas; the CRM/product token packages must be created/rewired to v2. Until then, the *spec* is v2 but the *shipped* surfaces are mixed — flagged in `brand-guidelines.md` § Implementation reference.
  - The `.dc.html` specs are reference docs, not a built token package; a `voxera-tokens` package (theme.ts + tokens.css) still needs standing up so apps import rather than copy.
- Follow-ups:
  - Stand up a shared tokens package (Mantine theme + CSS vars) from `04 Tokens`; rewire website `site.css` + logo, then product apps.
  - Update `brand-conformance` skill checks to the v2 vocabulary (AI-cyan-only, mode rules) if/when they encode palette specifics.

> *The v1 Atlas spec and the previous `brand-guidelines.md` visual sections remain in git history.*
