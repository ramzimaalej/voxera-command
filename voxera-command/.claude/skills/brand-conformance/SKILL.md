---
name: brand-conformance
description: Check copy (markdown, .astro, i18n.json, JSX literals) against `voxera-command/docs/brand/brand-guidelines.md`. Use before publishing copy changes to the website, before merging a CRM UI string change, or when reviewing a docs PR. Flags forbidden words, italic overuse, missing brand verbs, CTA pattern violations, lowercase "voxera", and tone drift. Read-only — reports issues, does not auto-fix.
---

# brand-conformance

Lint copy against the Voxera brand guidelines.

## When to invoke

- Reviewing a copy change in `voxera-website/src/pages/**/*.astro`, `voxera-website/public/i18n.json`, or any user-visible string in `voxera-crm/apps/frontend/`.
- Iterating on `voxera-command/docs/brand/` or `voxera-command/docs/vision/`.
- Before approving a copy-bearing PR.

## Source of truth

`voxera-command/docs/brand/brand-guidelines.md`. Read it first. The rules below are the actionable subset; the doc is canonical when they conflict.

## Checks (priority order)

### 1. Naming — block on violation
- **Voxera** must be capital-V every time. Flag any lowercase `voxera`.
- Brand verbs **Approve / Reject / Roll back** stay English in every locale (don't translate in DE copy).

### 2. Forbidden words — block on violation

| Avoid | Why | Acceptable replacement |
|---|---|---|
| revolutionary, game-changing, next-gen, synergies, leverage | hype | say what it does |
| AI-powered | hype | "describes itself", "qualifies leads" |
| solutions | meaningless | "CRM", or the specific feature |
| best-in-class, world-class, industry-leading | empty | a specific claim |
| hallucinate | acknowledged but unused | "guess", "make up" |

### 3. Use the brand vocabulary
- **proposal** (not "suggestion" or "recommendation")
- **built around** (signature phrase)
- **you decide / you stay the boss**
- **plain language**

### 4. Italic emphasis — warn on overuse
- Max 1–2 italic phrases per page (or per major section in a doc).
- Don't italicize "literally", "actually", "truly" — they're filler.

### 5. CTAs — warn on missing/wrong CTA per page
| Page | Primary CTA |
|---|---|
| Most | "Start free trial" → 14-day, no card |
| /about | "Talk to the founders" |
| /customers | "Talk to the founders" (apply to be a design partner) |
| /contact | no duplicate final CTA |
| /security | "Request documentation" |

Trust line below trial CTAs: `No credit card · Cancel anytime · 14-day trial` (i18n key `common.metaLine`).

### 6. Honesty — block on violation
- No fake customer logos / fabricated case studies / fake team members / invented stats ("140+ businesses", "4.8/5 rating").
- Customer-outcome aggregates are off-limits until measured. Product-capability claims ("Live in under an hour") are OK.

### 7. i18n parity (when touching `public/i18n.json`)
- Every EN key must have a DE counterpart. Brand verbs stay English in both.

### 8. Geographic positioning
- HQ is San Francisco. Footer: "Built in San Francisco". Office hours PT.
- Phone mockups: US format (`+1 415 555 …`).
- EU data residency (Frankfurt, Amsterdam) is a *product feature*, not company location.

## Workflow

1. Read each changed file.
2. Run the checks above as a grep-first pass (forbidden words, lowercase voxera, missing brand verbs).
3. Read for tone: short-then-long, plain-spoken, anti-hype, operator-first, specific. Flag prose that drifts.
4. Produce a structured report:
   ```
   File: src/pages/features.astro
     [block]  L42  "AI-powered" — drop or replace with concrete capability
     [warn]   L88  3 italic phrases in this section (max 1–2 per page)
     [warn]   L120 missing primary CTA section
   ```
5. Do **not** auto-fix. Surface issues; let the author or a brand-voice-reviewer subagent decide.

## Companion

`voxera-website/.claude/agents/brand-voice-reviewer.md` is a subagent that performs the same checks via the Task tool and can also propose rewrites when explicitly asked.
