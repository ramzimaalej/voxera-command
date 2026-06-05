---
id: ADR-0006
title: JSON Forms + Mantine renderer set — don't build a forms library
status: accepted
date: 2026-05-31
supersedes: []
superseded_by: null
affects:
  - docs/architecture/forms-renderer-scope.md
  - docs/architecture/architecture-vision-and-principles.md
---

## Context

The product needs declarative, configuration-driven forms across many surfaces: lead intake, qualification questionnaires, custom object capture, Pflegekasse paperwork, workspace settings. JSON Forms (`@jsonforms/react`) is the mature open-source choice — it owns JSON Schema parsing, UI Schema parsing, AJV validation, state management, renderer dispatch, and conditional rules. The renderer sets it ships are Material UI (complete) and Vanilla (basic). A community `jsonforms-mantine` exists but is incomplete and not at parity.

We use Mantine across the product. Material UI clashes; Vanilla is unstyled. Neither is acceptable.

The temptation is to write a forms library from scratch. That's a multi-quarter detour that doesn't differentiate the product.

## Decision

Keep JSON Forms as the engine. Build a **renderer set** (React components Mantine-themed, registered with JSON Forms by `scope` + `type` + `format`) plus custom widgets specific to our domain (address autocomplete, Pflegegrad capture, signature, etc.). Plan ~6 weeks of one engineer for parity coverage, plus per-custom-widget work on top.

Path-finding before commitment: build a **prototyping gate** form that exercises the hardest realistic case — nested object with 1:many array, file upload, conditional sections, custom widget, server-side validation surfaced inline, full Mantine theming. If `jsonforms-mantine` handles it cleanly, extend it. If shaky, build directly against `@jsonforms/react` core. Either way, JSON Forms remains the engine.

## Alternatives considered

- **Roll our own forms library** — multi-quarter cost, doesn't differentiate. Rejected. Listed as an explicit non-goal in `architecture-vision-and-principles.md` §4.
- **Use Material UI renderers and theme to look Mantine-ish** — Material's component model and Mantine's clash in non-trivial ways (form controls, popovers, theming primitives). Theming around it is fragile.
- **Adopt `jsonforms-mantine` as-is** — not at parity; we'd hit gaps quickly. Use it only if the prototyping gate proves it handles the hardest case cleanly.

## Consequences

- Positive:
  - JSON Forms carries the heavy lifting (schema, validation, state, dispatch). We own only the rendering layer.
  - All forms in the product are declarative configuration; the DSL drives them.
  - Mantine theming stays consistent across the product surface.
- Negative / risks:
  - ~6-week up-front investment before the renderer set is at parity coverage.
  - Per-custom-widget work is open-ended; the Pflegebox vertical alone needs several.
  - If `@jsonforms/react` direction diverges from our needs (rare but possible), we own the migration.
- Follow-ups:
  - Run the prototyping gate before the renderer-set commitment is locked in.
  - Catalog the v1 Pflegebox custom widgets; budget engineering accordingly.
