# voxera-command processes — business / CEO cadence

The **business** babysitter processes — run by execs, operating on this repo's confidential docs (strategy, brand, roadmap, customer/financial state). They stay here, not in `voxera-os`, because they read exec-only content.

> **Engineering processes** (`implement-feature`, `fix-bug`, `design-review`) live in **`voxera-os/.a5c/processes/`** and are invoked from code repos by `../voxera-os/.a5c/processes/<name>.js`. See `voxera-os/.a5c/processes/README.md`. This split is `ADR-0014`.

## Available (business)

| Process | Where to invoke | What it does |
|---|---|---|
| **iterate-doc.js** | `cd voxera-command` | Plan + review + apply a change to any versioned doc (frontmatter bump + changelog). Lightest-weight — no brand gate, no ADR check. |
| **iterate-vision.js** | `cd voxera-command` | Same as iterate-doc, plus a consistency + brand-voice quality gate (refines up to 2x if score <85) and an optional ADR capture when a strategic decision is detected. Use for vision/brand/roadmap/website-plan edits. |
| **weekly-business-review.js** | `cd voxera-command` | CEO weekly rhythm with **active coaching**: gather state → per-customer pulse loop (invokes `customer-pulse-update`) → coach-pushback (invokes `accountability-check` + `priorities-coach`) → conditional acknowledgment breakpoint (silent on clean weeks) → draft weekly note → CEO approves/refines → CEO sets next-week priorities → archive. Run on Friday or end-of-week. |
| **revenue-pulse.js** | `cd voxera-command` | Between-weekly **survival heartbeat**: read `revenue-model.md` + customer pulse → assess runway + the binding constraint (the deal/lever solvency depends on) + the single top action → **conditional breakpoint that fires only when RED** (runway ≤ alert threshold or the key deal is overdue; silent otherwise) → append a dated row to `docs/operations/revenue-pulse-log.md`. Run any day when runway is short; the one signal that must never go dark. Inputs: `{ asOf?, runwayAlertWeeks? }` (default threshold 4 weeks). |

## First-time setup

The processes import `@a5c-ai/babysitter-sdk`. Install once:

```sh
cd voxera-command/.a5c/processes && npm install
```

## Invoking — short forms

From `voxera-command`:
```sh
# Strategy doc edit (with brand gate + ADR check):
/babysitter:call iterate the vision: tighten the ICP to mid-market RevOps

# Lightweight doc edit:
/babysitter:call --process .a5c/processes/iterate-doc.js#process \
  --inputs '{"docPath": "docs/product/roadmap.md", "change": "mark FEAT-007 done"}'

# Weekly review:
/babysitter:call --process .a5c/processes/weekly-business-review.js#process --inputs '{}'
```

## Process API conventions

The canonical authoring conventions for **every** babysitter process in the workspace live in **`voxera-os/.claude/rules/processes.md`**. The three business processes here follow them. In short: `import { defineTask }`, `export async function process(inputs, ctx)`, tasks via `defineTask`, human gates via `ctx.breakpoint`, JSDoc header with `@process`/`@inputs`/etc.

## Adding a new business process

1. Copy `iterate-doc.js` as a starting point.
2. Update the JSDoc header.
3. Define each task with `defineTask`. Keep tasks small and single-responsibility.
4. Add the process to the table above.
5. Dry-run: `/babysitter:plan --process .a5c/processes/<your-process>.js#process --inputs '{...}'`.

For engineering processes (anything a code repo runs), add it in `voxera-os` instead — keep this repo exec-only.
