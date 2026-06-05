---
title: Translate vertical landing-page specs to Astro
version: 1
status: draft
updated: 2026-05-31
owner: you
implements: []
adrs: [ADR-0009]
target: voxera-website
priority: high
roadmap: now
---

# FEAT-001: Translate vertical landing-page specs to Astro

## Why

The English-markets motion ([ADR-0009](../../../decisions/ADR-0009-english-markets-parallel-motion.md)) launches with three vertical landing pages (real estate, home services, insurance). The playbook lives in [`vertical-strategy-english-markets.md`](../../strategy/vertical-strategy-english-markets.md), specifically §6 (page template) and §7 (homepage self-select strip).

That playbook was written against an earlier vanilla-HTML site. It references files that don't exist in the current Astro `voxera-website`: `home-services.html`, `i18n.js`, `analytics.js`, an inline `<script>` template, vanilla `IntersectionObserver`, etc.

Before we can build any vertical page (FEAT-002 for real estate, FEAT-003 for home services, FEAT-004 for insurance), the template needs translation to Astro: components instead of `<script>`-laden HTML, content collections where appropriate, a typed GA4 event helper, a shared testimonials data structure, a reusable `SelfSelectStrip` for the homepage.

This is foundational. Doing it once well means three downstream FEATs become "fill in the copy" rather than "translate + build."

## What

Build a reusable Astro component set + supporting infrastructure that any vertical page can compose:

- **`src/layouts/VerticalLayout.astro`** — page shell extending the existing `SiteLayout`, with slots for the standard vertical sections (hero, demo, problems, how-it-works, features, integrations, trust, testimonial, FAQ, final-CTA, footer).
- **Components in `src/components/vertical/`**:
  - `HeroWithDemo.astro` — H1 + lede + dual CTAs + meta strip + the "Get called by the AI now" form on the right. The demo form is the highest-leverage element on every vertical page; it must work identically across all three.
  - `ProblemGrid.astro` — 3-cell problem section.
  - `HowItWorks.astro` — 3-step section.
  - `FeatureGrid.astro` — 4–7 feature cards with the existing `.features` layout (span 2/3/4 visual rhythm).
  - `IntegrationStrip.astro` — single-line monospace credit-roll of integrations the vertical recognizes.
  - `TrustStatement.astro` — dark `.control-section` reuse.
  - `Testimonial.astro` — composite-voice testimonial, first-name-last-initial format.
  - `FAQ.astro` — 4–6 accordion items, accessible (proper ARIA, keyboard).
  - `FinalCTA.astro` — orange block with vertical-specific headline.
- **`src/components/SelfSelectStrip.astro`** — for the homepage. Routes visitors to the right vertical page via 4 chips (the 3 verticals + "something else"). Per §7 of the strategy doc.
- **`src/data/testimonials.ts`** (TypeScript instead of `testimonials.json` for type safety) — schema per §6.3 of the strategy doc. Composite testimonials per vertical / sub-vertical. Exposed as typed exports.
- **`src/lib/analytics.ts`** — typed GA4 event helper. One function per event from §8 of the strategy doc (`trackVerticalSelfSelect`, `trackDemoCallRequested`, `trackTrialCtaClick`, `trackReferralVisit`). Sets the `active_vertical` user property on each vertical page mount.
- **`functions/api/demo-call.ts`** — Pages Function stub for the "Get called by the AI now" button. Validates the phone number, verifies Turnstile, returns a 202 with a stub message ("calling soon — backend integration pending"). The real backend integration is a separate FEAT — but the page needs a real endpoint to POST to for the demo flow to feel real during paid-acquisition launch.
- **`src/content/config.ts`** addition — content collection for `testimonials` if we want author-friendly markdown editing; otherwise the `.ts` file above is sufficient. Decide during implementation.

The components must reuse the existing `src/styles/site.css` Atlas palette and typography — no new global CSS. Component-scoped `<style>` blocks for component-local styling only.

## Acceptance criteria

Each is testable, observable, and maps to at least one test case in `test-cases.md` (to be written before implementation per the SDLC discipline).

1. `src/layouts/VerticalLayout.astro` exists and accepts named slots for `hero`, `problems`, `how-it-works`, `features`, `integrations`, `trust`, `testimonial`, `faq`, `final-cta`. Missing slots render nothing (no broken HTML).
2. All 9 component files in `src/components/vertical/` exist, each with TypeScript props interface and at least one usage example in a README or doc comment.
3. `HeroWithDemo.astro` includes the demo form. Submitting the form fires the GA4 `demo_call_requested` event with the `method` parameter set to the vertical key passed in props.
4. `src/components/SelfSelectStrip.astro` renders 4 chips, each linking to its destination (`/real-estate`, `/home-services`, `/insurance`, `#problems`). Click on any chip fires the GA4 `vertical_self_select` event with the `selected_vertical` parameter.
5. `src/lib/analytics.ts` exports the 4 typed event functions + a `setActiveVertical(key)` function. All four event names match §8 of the strategy doc exactly. TypeScript types prevent passing wrong shapes.
6. `src/data/testimonials.ts` exports composite testimonials structured per §6.3 of the strategy doc. Schema validated at module load (Zod or compile-time TS types).
7. `functions/api/demo-call.ts` exists, validates inbound POST shape (phone number, Turnstile token), rejects malformed requests with 400, returns 202 + stub message on valid requests. Logs a structured event via `console.log(JSON.stringify({...}))` so the demo-request volume is visible in Cloudflare Logs.
8. All vertical components pass the new `voxera-website/.claude/rules/accessibility.md` checks: semantic HTML, keyboard-navigable, contrast ≥ 4.5:1 on text, focus indicators visible.
9. All vertical components pass the new `voxera-website/.claude/rules/performance.md` budgets: JS for any component using `client:*` directive ≤ 10KB gzipped, images use `<Image>` from `astro:assets`.
10. `astro check` passes. `npm run lint` passes (per `.claude/rules/astro.md` — no Tailwind, no CSS-in-JS, brand voice rules best-effort).
11. The `brand-voice-reviewer` subagent reviews placeholder copy in components and returns no `[block]` findings.

## Non-goals

- **Do not** build any actual vertical page in this FEAT — that's FEAT-002+. This FEAT delivers the toolkit; the pages compose it.
- **Do not** change existing pages (`index.astro`, `features.astro`, etc.) other than adding `<SelfSelectStrip />` to the homepage per §7 of the strategy doc.
- **Do not** wire up real outbound calling. The demo Pages Function is a stub returning 202; backend integration is a separate FEAT once the backend has a public endpoint for this.
- **Do not** add a CMS for the testimonials. The TypeScript file is sufficient (per `.claude/rules/dry.md` for voxera-website — don't over-engineer).
- **Do not** add per-vertical translations (DE) — the English-markets motion is English-only by design (per the strategy doc's anti-goal §10).

## Open questions

- **Testimonials in `.ts` vs Astro content collection?** Default to `.ts` for type safety + simpler reuse from `.astro` files. Revisit if the editor experience matters (e.g., non-technical contributor writes new testimonials).
- **Turnstile site key for the demo form?** The site-wide Turnstile key in `src/config/site.mjs` already exists. Reuse it. If demo-form abuse becomes a problem, consider a separate key.
- **Should the GA4 event helper send events even in dev / preview?** Best practice: yes, to local-only environment, OR gated by `import.meta.env.PROD`. Decide during implementation; document the choice in `src/lib/analytics.ts` JSDoc.

## Changelog

- 2026-05-31 v1: drafted from `vertical-strategy-english-markets.md` §6 + §7. Follow-up to [ADR-0009](../../../decisions/ADR-0009-english-markets-parallel-motion.md).
