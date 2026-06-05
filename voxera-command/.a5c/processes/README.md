# voxera-command processes

Babysitter process definitions invoked from any repo in the workspace.

## Available

| Process | Where to invoke | What it does |
|---|---|---|
| **iterate-doc.js** | `cd voxera-command` | Plan + review + apply a change to any versioned doc (frontmatter bump + changelog). Lightest-weight — no brand gate, no ADR check. |
| **iterate-vision.js** | `cd voxera-command` | Same as iterate-doc, plus a consistency + brand-voice quality gate (refines up to 2x if score <85) and an optional ADR capture when a strategic decision is detected. Use for vision/brand/roadmap/website-plan edits. |
| **implement-feature.js** | `cd voxera-crm` *or* `cd voxera-website` | Implement a FEAT-xxx spec end-to-end: plan → human gate → implement → quality-gate loop (3x) → human gate → update tracking → optional ADR. Quality gate reads commands from the code repo's `.a5c/commands.json` (`qualityGate.commands`). |
| **fix-bug.js** | `cd voxera-crm` *or* `cd voxera-website` | Fix a BUG-xxx spec test-first: reproduce + write failing regression test → human gate → fix loop (3x) → human gate → update tracking. Same `commands.json` source. |
| **weekly-business-review.js** | `cd voxera-command` | CEO weekly rhythm with **active coaching**: gather state → per-customer pulse loop (invokes `customer-pulse-update`) → coach-pushback (invokes `accountability-check` + `priorities-coach`; surfaces chronic slippers, past-due commitments, red-customer signals, strategic drift, one-thing recommendation) → conditional acknowledgment breakpoint (fires only when pushback found real issues; silent on clean weeks) → draft weekly note (informed by pushback) → CEO approves/refines → CEO sets next-week priorities (coach's recommendations + pointed questions surfaced inline) → archive. Run on Friday or end-of-week. |

## First-time setup

The processes import `@a5c-ai/babysitter-sdk`. Install once:

```sh
cd voxera-command/.a5c/processes && npm install
```

Each code repo also needs a `.a5c/commands.json` for its quality gates:
- `voxera-crm/.a5c/commands.json` — Nx lint/test/build map (already created)
- `voxera-website/.a5c/commands.json` — Astro build + check (already created)

If you add a new code repo, copy one of those as a template and edit the commands.

## Invoking — short forms

From `voxera-command`:
```sh
# Strategy doc edit (with brand gate + ADR check):
/babysitter:call iterate the vision: tighten the ICP to mid-market RevOps

# Lightweight doc edit:
/babysitter:call --process .a5c/processes/iterate-doc.js#process \
  --inputs '{"docPath": "docs/product/roadmap.md", "change": "mark FEAT-007 done"}'
```

From `voxera-crm` or `voxera-website`:
```sh
/babysitter:call implement ../voxera-command/docs/product/features/FEAT-007-pipeline-view.md
/babysitter:call fix       ../voxera-command/docs/product/bugs/BUG-014-hero-cls.md
```

The babysit skill picks the right process based on the spec filename prefix (`FEAT-` → `implement-feature.js`, `BUG-` → `fix-bug.js`).

## Process API conventions

All processes follow the current babysitter SDK pattern:
- `import { defineTask } from '@a5c-ai/babysitter-sdk';`
- `export async function process(inputs, ctx) { ... }`
- Tasks via `await ctx.task(taskDef, args)` where `taskDef = defineTask('name', (args, taskCtx) => ({ kind: 'agent', agent: { name, prompt: { role, task, context, instructions, outputFormat }, outputSchema }, io: { inputJsonPath, outputJsonPath } }))`
- Human gates via `await ctx.breakpoint({ title, question, context })`
- JSDoc header at top with `@process`, `@description`, `@inputs`, `@outputs`, `@skill`, `@agent` markers so the SDK can pre-surface relevant skills/agents.

The pre-2026 `ctx.task({ name, prompt, files })` shape is **not** valid; all four processes were modernized 2026-05-31.

## Adding a new process

1. Copy the simplest existing process (`iterate-doc.js`) as a starting point.
2. Update the JSDoc header (`@process`, `@inputs`, etc.).
3. Define each task with `defineTask`. Keep tasks small and single-responsibility.
4. Add the process to the table above.
5. Test it: `/babysitter:plan --process .a5c/processes/<your-process>.js#process --inputs '{...}'` for dry-run validation.
