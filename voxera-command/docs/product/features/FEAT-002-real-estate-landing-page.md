---
title: Build /real-estate landing page
version: 1
status: draft
updated: 2026-05-31
owner: you
implements: [FEAT-001]
adrs: [ADR-0009]
target: voxera-website
priority: high
roadmap: now
---

# FEAT-002: Build /real-estate landing page

## Why

Real estate is the priority-1 wedge in the English-markets motion (per [ADR-0009](../../../decisions/ADR-0009-english-markets-parallel-motion.md) and [`vertical-strategy-english-markets.md`](../../strategy/vertical-strategy-english-markets.md) §2). It's where paid-search dollars flow first; the page is the conversion surface.

The strategy doc §2.3 already specifies the copy. This FEAT is the build: compose the Astro components from [FEAT-001](./FEAT-001-vertical-landing-templates-astro.md) with the real-estate-specific text, ship it to a `/real-estate` URL, wire it to GA4, and put it behind paid-search traffic.

Why "the 5-minute rule" wedge matters: it's a pre-existing sales argument (HBR / MIT Sloan / InsideSales.com research). Agents accept the premise without convincing — the pitch becomes "you already know it matters; here's how you finally do it" rather than "let me convince you that fast lead response is a thing."

## What

A `/real-estate` Astro page composed from FEAT-001 components, with copy taken verbatim from [`vertical-strategy-english-markets.md`](../../strategy/vertical-strategy-english-markets.md) §2.3.

Structure (in order, per FEAT-001's `VerticalLayout`):

1. **Nav** — site default (no active state on a vertical entry; verticals aren't nav items per the strategy doc's §1.3 anti-goal).
2. **Hero + demo** (`HeroWithDemo` component) — H1 "Stop losing leads to *the 5-minute rule*", subhead about Zillow/Realtor.com/website leads, primary CTA "Get called by the AI now", secondary "Start free trial", meta strip "Answers in 30s · Live in 30 minutes · No credit card". `vertical="real_estate"` prop.
3. **3 problems** (`ProblemGrid`) — copy from §2.3 "The three problems" (11pm lead / $40 per lead / 'thanks!' text drip).
4. **3 steps** (`HowItWorks`) — copy from §2.3 "How it works" (connect lead sources / it calls in your voice / you walk in already briefed).
5. **Features** (`FeatureGrid`) — 6 cards from §2.3 "Feature highlights": lead-source integrations, qualifies on the call, books showings, sounds like a real agent, TCPA-compliant, drip + recall.
6. **Integration strip** (`IntegrationStrip`) — "Connects with Zillow Premier Agent · Realtor.com Connections · Facebook lead ads · Follow Up Boss · kvCORE · BoomTown · Google Calendar · Outlook".
7. **Trust statement** (`TrustStatement`) — "AI proposes. You approve. Always." block from §2.3.
8. **Testimonial** (`Testimonial`) — Marcus T. composite from §2.3 (pulled from `src/data/testimonials.ts`).
9. **FAQ** (`FAQ`) — 5 items from §2.3 (Zillow ToS, out-of-area properties, personal-relationship concern, legal/TCPA, vs Structurely/Conversica).
10. **Final CTA** (`FinalCTA`) — "Your next lead is *about to hit your inbox*. Start your 14-day trial. Live in 30 minutes. No credit card. Cancel anytime."
11. **Footer** — site default.

GA4 wiring per §8 of the strategy doc:
- Page mount → `setActiveVertical('real_estate')` (sets the user property).
- Demo button → `trackDemoCallRequested({ method: 'landing_real_estate' })`.
- Trial CTA → `trackTrialCtaClick({ location: 'real_estate_final' })`.

Localization: `<html lang="en">`. No `data-i18n` on vertical-specific elements. Vertical page stays English-only per strategy doc §1.3.

## Acceptance criteria

1. `src/pages/real-estate.astro` exists and renders without errors at `/real-estate`.
2. All 11 sections in the structure above are present in the rendered HTML in the specified order.
3. Hero copy matches `vertical-strategy-english-markets.md` §2.3 verbatim — including the italic flourish on "the 5-minute rule".
4. The demo form on the hero is functional: submitting a valid phone number fires `gtag('event', 'demo_call_requested', { method: 'landing_real_estate' })` (verifiable in browser dev tools network tab) and POSTs to `/api/demo-call`.
5. The "Start free trial" CTAs (in hero + final CTA) both fire `gtag('event', 'trial_cta_click', { location: 'real_estate_<location>' })` with the correct location label.
6. Page mount fires `gtag('set', 'user_properties', { active_vertical: 'real_estate' })`.
7. Testimonial is the Marcus T. composite from `src/data/testimonials.ts` — no hard-coded text in the page file.
8. All 6 feature cards from §2.3 are present and styled with the existing `.features` grid rhythm.
9. The 5 FAQ items from §2.3 are present, keyboard-navigable (Tab to focus, Enter to expand), and use proper ARIA (`aria-expanded`, `aria-controls`).
10. `astro check` passes; `npm run lint` passes with zero `[block]` findings from the brand-voice-reviewer subagent.
11. **Performance**: Lighthouse mobile score ≥ 90 across Performance, Accessibility, Best Practices, SEO. LCP < 2.0s on simulated Slow 4G.
12. **Accessibility**: passes axe-core or Lighthouse a11y with zero violations. Color contrast ≥ 4.5:1 on body text.
13. **Brand-voice**: brand-voice-reviewer subagent reviews the page and returns zero `[block]` findings (warnings allowed but documented in the PR).
14. The strategy doc's §1.3 anti-goals are honored:
    - No fabricated specifics (Marcus T. composite, not a fabricated named customer).
    - No new nav item for "Real estate" — page is reached via paid traffic and the homepage `SelfSelectStrip`.
    - No dollar promises in copy ("you'll close $50k more" etc.).
    - No competitor names in default copy (Structurely / Conversica appear only in the FAQ — which is OK per the doc; FAQ context is comparative-by-design).
    - `<html lang="en">`; no DE translations.
15. The page is added to the homepage `SelfSelectStrip` (delivered in FEAT-001) — clicking the "Real estate" chip lands on `/real-estate`.

## Non-goals

- Home services and insurance vertical pages — separate FEATs (FEAT-003, FEAT-004).
- Paid-search campaign setup in Google Ads — that's go-to-market execution, not a website FEAT.
- Backend integration of the demo-call endpoint to actually trigger an outbound call — the Pages Function from FEAT-001 stays a stub here; real backend integration is a separate FEAT (FEAT-005 likely).
- A `/compare?competitor=Structurely` DTR page — the strategy doc §2.4 mentions paid-search ads can target this; building it is FEAT-006 if/when those ads run.
- Per-vertical activation email tweaks (§9 of strategy doc) — separate FEAT or handled outside the website repo.

## Open questions

- **Sub-vertical variants for real estate?** The home-services vertical has `?trade=` DTR per §3.3. Real estate could plausibly have `?segment=solo` vs `?segment=brokerage` (the strategy doc treats the brokerage as a secondary buyer to defer to Q3). Default: ship a single page targeting solo agents first; add brokerage variant later as a FEAT.
- **MLS/lead-source UTM tagging?** Paid-search ads may want to attribute back to specific MLS regions or lead-vendor traffic sources. Track at the GA4 event level (extra params on `demo_call_requested`)? Decide during implementation; default to keeping the schema minimal.
- **Demo form behavior on Pages Functions cold start?** Cold start may take 1–2 seconds. The "Calling…" button state should show immediately, not wait for the function response. Implement optimistically; let the function 202 in the background.

## Changelog

- 2026-05-31 v1: drafted from `vertical-strategy-english-markets.md` §2.3 + §2.6 (real-estate launch checklist). Depends on FEAT-001 components being shipped first.
