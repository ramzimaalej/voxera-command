---
title: Voxera Brand Guidelines
version: 2
status: active
updated: 2026-05-31
owner: you
---

> Canonical brand reference. Implementation specifics (CSS tokens, file paths, Astro components) live in [`../../../voxera-website/docs/marketing/BRAND.md`](../../../voxera-website/docs/marketing/BRAND.md). This doc owns *what* the brand is; the website doc owns *how* it ships.

## Brand essence

**Voxera is the AI-native CRM, built around how you sell.**

For service businesses, agencies, and outbound sales teams (5–100 people) that want their pipeline worked without hiring more people. The product describes itself, qualifies leads, books meetings, and writes reports — but every change comes to the operator as a proposal they approve.

**Brand promise:** *AI proposes. You approve.*

Three pillars:
- **Category contrarianism.** Most CRMs are filing cabinets. Most AI tools are off-the-shelf robots. Voxera is neither.
- **Editorial, not enterprise.** Near-white + serif italic emphasis, not gradient SaaS blue.
- **Human-in-the-loop is the moat.** The buyer stays in control. Always.

## Company facts (as of 2026-05-20)

| | |
|---|---|
| Team | 5 people: CEO, COO, 1 engineer, 2 sales reps |
| Offices | San Francisco, CA (HQ) · Sfax, Tunisia (engineering + ops) |
| Customers | 3 in production, private beta. No public rating yet. |
| Investors | None — bootstrapped. |
| Open roles | None. |
| Compliance | Founders own security and compliance. GDPR conscious by design, not yet certified. |
| Help center | None — every email goes to a real person. |
| Legal | `/privacy` and `/terms` are the only canonical sources. |

Be honest about every line. If a fact changes, update this table first, then propagate it into copy.

## Voice & tone

Five voice attributes:

| Attribute | Example | Anti-example |
|---|---|---|
| **Plain-spoken** | "Your CRM is a filing cabinet." | "Voxera reimagines the customer-relationship layer." |
| **Confident, not loud** | "Numbers you can actually defend." | "Best-in-class analytics suite!" |
| **Anti-hype** | "Built from your data, not from a chatbot guessing." | "Powered by next-gen AI." |
| **Operator-first** | "You answer your own phone at night." | "Empower your sales team to scale revenue." |
| **Specific** | "Live in 30 minutes." | "Fast setup." |

**Sentence shape:** short, then long. Em-dashes welcome. Periods welcome. Exclamation points discouraged — we don't sell that way.

**Use:** "proposal" (not "suggestion"), "Approve / Reject / Roll back" (brand verbs), "built around" (signature phrase), "you decide", "plain language".

**Avoid:** "revolutionary", "game-changing", "next-gen", "synergies", "leverage", "AI-powered" (say what the AI does instead), "solutions", "best-in-class", "world-class", "industry-leading", "hallucinate".

## Naming

Voxera (capital V, never lowercase in copy). Never translate "Voxera" or the brand verbs — keep them English in every locale.

## Visual identity

### Mark

A "V" inside the brand dot. The V reads two ways at once:
1. **V for Voxera** — typographic anchor that matches the Fraunces-serif voice.
2. **The approval check** — same gesture as every "Approve change" button.

The dot is the brand carrier. It pulses in nav to signal "live". Wordmark layout: `[V-in-dot] Voxera` in Fraunces 600, `-1.2` letter-spacing.

Clear space ≥ the height of the wordmark. Never crop the V out of the circle. Never add a second mark color, never outline the circle, never swap Fraunces for a sans-serif in the wordmark.

### Color — palette "Atlas"

Editorial-magazine feel: near-monochrome ink-on-near-white anchored by a single deep-brass accent and a navy secondary. Replaces the earlier warm-cream + electric-orange palette (which read too close to Anthropic).

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#FAFAF8` | Primary background (near-white) |
| `--bg-deep` | `#F0EFEA` | Section dividers, alternating bands |
| `--card` | `#FFFFFF` | Cards, panels |
| `--ink` | `#0B0B0B` | Body text, headlines (near-black) |
| `--ink-soft` | `#2B2B2B` | Secondary text |
| `--mute` | `#6E6E6E` | Tertiary text, eyebrows |
| `--line` | `#DEDED6` | Borders, dividers |
| `--accent` | `#8E6824` | Dot, primary buttons, links (deep brass) |
| `--accent-deep` | `#6B4F1A` | Primary button hover |
| `--accent-soft` | `#F4E8CE` | Accent backgrounds, soft highlights |
| `--accent-2` | `#2D5F8A` | Secondary accent — navy, used sparingly |
| `--accent-2-soft` | `#DCE7F2` | Soft secondary background |
| `--ok` | `#2E6B43` | Checkmarks, success states |

**Mono-accent.** `--accent` carries 95% of the emphasis. `--accent-2` is reserved for the occasional contrasting badge, quote highlight, or status pip — never two accents in the same composition. Status colors are functional, not brand.

### Typography

| Family | Use | Notes |
|---|---|---|
| **Fraunces** | All headlines, the wordmark, italic flourish, price tags | Variable serif. 500 default, 600 for the logo. Use `<em>` for italics. |
| **DM Sans** | Body copy, buttons, labels | 400 / 500 / 600 / 700. |
| **JetBrains Mono** | Eyebrows, meta lines, OG footer, mono labels | Always uppercase + `letter-spacing: 0.12em+`. |

**Italic emphasis is rare.** Max 1–2 italic phrases per page, only on genuinely punchy moments (hero, brand-line, page-defining headline). When everything is italicized, nothing is.

### The dot system

The small accent circle is the brand element. It appears:
1. In the wordmark, leading "Voxera".
2. Before every `.eyebrow` (via `::before`). Don't strip it.
3. As a "live" pip inside live indicators.
4. On the favicon and OG image — same circle, scaled.

A subtle SVG noise grain (40% opacity, mix-blend-mode: multiply) overlays the body. It breaks the SaaS feel. Don't remove it.

## Writing rules

These are the conventions the `iterate-vision` / website-copy processes can enforce as checks.

### Headlines
- One italic flourish per hero or major section heading, max.
- Avoid "literally / actually / truly" as italic targets — they're filler.
- Prefer specific over general. *"From describe to done in under an hour"* beats *"Fast setup."*

### CTAs
- **Primary (most pages):** "Start free trial" → 14-day, no card, no sales call.
- **/about:** "Talk to the founders" leads; trial is secondary.
- **/customers:** "Talk to the founders" (apply to be a design partner). Trial secondary.
- **/contact:** no duplicate final CTA — the page IS the contact path.
- **/security:** "Request documentation" leads.

Every page ends with a single CTA section. Vary the headline; don't vary the offer.

**Trust line:** `No credit card · Cancel anytime · 14-day trial` (i18n key `common.metaLine`).

### Geographic positioning
- **HQ: San Francisco.** Footer says "Built in San Francisco." Office hours in PT.
- **Data residency: EU optional.** Frankfurt and Amsterdam are *product features*, not company location.
- **Customer examples:** prefer SF-flavored ($, PT, US idioms) unless deliberately illustrating an EU customer.
- **Phone numbers in mockups:** US format (e.g., +1 415 555 ...).
- **i18n:** EN + DE are both first-class. Any English copy change updates `public/i18n.json` for both locales.

### Honesty

Voxera is **early**. We do not pretend otherwise.

- **No fake customer logos.** Buyers Google them.
- **No fabricated case studies.** When we have real customers and real metrics, we publish them with consent. Until then, `/customers` invites design partners.
- **No fake team members.** Real founders, real bios, real photos — or no team grid at all.
- **No invented stats** (e.g., "140+ businesses running Voxera," "4.8/5 rating"). Product-capability claims ("Live in under an hour") are OK; customer-outcome aggregates are not, until measured.

## Anti-patterns

- A second accent color used as much as the primary. The brand is mono-accent on purpose.
- Italicizing every other word in a headline.
- Inlining the logo dot via `style="..."` — use the `Logo` component.
- Gradient backgrounds, glow effects, "AI sparkle" iconography. Voxera is the calm one in the room.
- Stock photos of diverse-team-laughing-at-laptop. Real or none.
- A "What our customers say" carousel before we have customers.
- Translating "Voxera" or the brand verbs.
- Tailwind utilities anywhere. The website uses a single hand-written stylesheet; Tailwind preflight would clash with the reset.

## Cheat sheet

```
HQ              San Francisco, CA  ·  PT business hours
Mark            V-in-dot + Voxera (Fraunces 600)
Accent          #8E6824 (--accent, deep brass)
Palette         Atlas — near-white + ink + deep brass + navy secondary
Fonts           Fraunces · DM Sans · JetBrains Mono
Italic emphasis Max 1–2 per page, hero-only
Brand verbs     Approve · Reject · Roll back
Brand promise   AI proposes. You approve.
Pricing         $ USD
Locales         EN (default) · DE
```

## Implementation reference

| Topic | Where |
|---|---|
| CSS tokens, font loading | `voxera-website/src/styles/site.css` |
| Logo component | `voxera-website/src/components/Logo.astro` |
| Asset inventory (favicon, OG, logo SVGs) | `voxera-website/docs/marketing/BRAND.md` § 6 |
| Translations (EN + DE) | `voxera-website/public/i18n.json` |
| Undraw illustration library + per-page picks | `voxera-website/docs/marketing/BRAND.md` § 6 |

## Changelog

- 2026-05-31 v2: filled out from `voxera-website/docs/marketing/BRAND.md`. Added brand essence, voice attributes, Atlas color palette (deep brass `#8E6824` replacing the stale `#E84C1F`), typography, writing rules, honesty stance, CTA conventions, cheat sheet, and pointer to the implementation reference. Status: draft → active.
- 2026-05-27 v1: initial draft.
