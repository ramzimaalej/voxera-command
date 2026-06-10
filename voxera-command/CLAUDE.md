# voxera-command — source of truth + orchestration

This repo holds Voxera's strategy docs, the decision log, and every babysitter process used across the workspace.

## Layout
- `docs/vision/` — vision (north star, ICP, positioning)
- `docs/brand/` — brand guidelines, voice, assets
- `docs/product/roadmap.md` — now / next / later
- `docs/product/features/` — `FEAT-xxx-*.md` specs (inputs to implementation runs)
- `docs/product/bugs/` — `BUG-xxx-*.md` reports
- `docs/website/` — website plan/IA/content
- `docs/strategy/` — `strategy.md` (the bet, wedge, moat, milestones) + `vertical-strategy-english-markets.md` (English-markets playbook)
- `docs/operations/` — CEO ops: weekly reviews, per-customer pulse, meeting notes, templates
- `decisions/` — **company-level** ADRs (strategy/brand/vision/governance) + `_template.md` + `README.md` (the workspace-wide ADR registry / number allocator)

> Product/platform architecture lives with the code that owns it: CRM platform architecture + technical decisions are in `../voxera-crm/docs/architecture/` and `../voxera-crm/decisions/`; infra in `../voxera-infra/`. The decision log is **federated** — see `decisions/README.md` and `.claude/rules/adrs.md`.
- `.a5c/processes/` — babysitter process definitions (see `processes/README.md` for the catalog)
- `.a5c/runs/` — babysitter run journals (gitignored)
- `.claude/skills/` — local skills (`extract-adr`, `brand-conformance`, `capture-decision`, `meeting-notes`, `customer-pulse-update`, `priorities-coach`, `accountability-check`)

## Doc conventions
Every doc starts with frontmatter:
```
---
title: Vision
version: 2
status: active        # draft | active | superseded
updated: 2026-05-27
owner: you
---
```
…and ends with a `## Changelog` list. Bump `version` + add a changelog line on every substantive edit. Tag milestones: `git tag -a vision-v2 -m "..."`.

## How to run things
- First-time per machine: `/babysitter:user-install`
- First-time in this repo: `/babysitter:project-install` (optional — produces a richer project profile)
- First-time in `.a5c/processes/`: `cd .a5c/processes && npm install` (installs the babysitter SDK so processes can import `defineTask`)
- Iterate strategy (with brand gate + ADR check): `/babysitter:call iterate <doc>: <change>` → `.a5c/processes/iterate-vision.js`
- Iterate any doc (lightweight): `/babysitter:call --process .a5c/processes/iterate-doc.js#process --inputs '{"docPath":"...","change":"..."}'`
- Plan only (no edits): `/babysitter:plan ...`
- Check run health: `/babysitter:doctor`

For the full process catalog, see `.a5c/processes/README.md`.

## Local skills, rules (project-level)
Under `.claude/`:
- **skills/extract-adr** — turn a load-bearing decision in a long-form spec into a numbered ADR file with the right template + a backlink in the source doc.
- **skills/capture-decision** — turn a brief CEO decision-in-the-moment (chat-shape) into a draft ADR. Lighter than extract-adr.
- **skills/meeting-notes** — turn raw meeting input (notes, transcript, memory dump) into structured output: decisions, action items, open questions, follow-up commitments.
- **skills/customer-pulse-update** — append a dated entry to a per-customer pulse file in `docs/operations/customers/`, updating health rating + frontmatter.
- **skills/priorities-coach** — recommend a ranked priority list for the next planning horizon from state (FEATs, roadmap, strategy, customer pulse, past notes). Pushes back on a user-proposed top-3 if it doesn't match the strategy. Forward-looking pair of `accountability-check`.
- **skills/accountability-check** — surface chronic slippers (3+ week carry-overs), silently-dropped commitments, past-due commitments to others, customer-pulse declines without closed action items, strategic drift. Backward-looking pair of `priorities-coach`. Silent when the picture is clean.
- **skills/brand-conformance** — lint copy against `docs/brand/brand-guidelines.md` (forbidden words, italic limits, brand verbs, CTA patterns, honesty stance). Read-only.
- **rules/** — auto-loaded on every session:
  - `docs.md` — frontmatter + version + changelog conventions for every versioned doc
  - `specs.md` — FEAT-xxx / BUG-xxx authoring discipline
  - `adrs.md` — ADR template, numbering, when-to-extract
  - `processes.md` — babysitter process file conventions (`defineTask`, JSDoc markers)

## CEO operations layer

`docs/operations/` holds the day-to-day rhythm (weekly reviews, customer pulse, meeting notes). The `weekly-business-review` babysitter process (Friday rhythm) drives it with **active coaching** — accountability-check surfaces what slipped, priorities-coach pushes back on weak priority choices, and a conditional breakpoint fires only when there's a real issue to decide. The 5 CEO skills (`capture-decision`, `meeting-notes`, `customer-pulse-update`, `priorities-coach`, `accountability-check`) handle the in-between moments. Lightweight by design — for a 5-person bootstrapped team. See `docs/operations/README.md` for what lives there and how the flows hang together.

## ID scheme
- Features: `FEAT-001`, `FEAT-002`, …
- Bugs: `BUG-001`, …
- Decisions: `ADR-0001`, …
Link them: a FEAT references the ADRs and roadmap items it implements; an ADR lists the docs it affects.
