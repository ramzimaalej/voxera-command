# voxera-command processes

Babysitter process definitions invoked from any repo in the workspace.

## Available

| Process | Where to invoke | What it does |
|---|---|---|
| **iterate-doc.js** | `cd voxera-command` | Plan + review + apply a change to any versioned doc (frontmatter bump + changelog). Lightest-weight — no brand gate, no ADR check. |
| **iterate-vision.js** | `cd voxera-command` | Same as iterate-doc, plus a consistency + brand-voice quality gate (refines up to 2x if score <85) and an optional ADR capture when a strategic decision is detected. Use for vision/brand/roadmap/website-plan edits. |
| **design-review.js** | `cd voxera-crm` | Engineering design gate: for each discipline a spec touches, run a design → adversarial-review → converge loop and assemble a design dossier. Ships the **DDD → ERD → Prisma → GraphQL → Webhook → AI-agent → Analytics → OO → TDD** lenses (each a `*-designer`/`*-reviewer` subagent in `voxera-crm/.claude/subagents/`). Runs standalone, and `implement-feature.js` calls it as a gated phase before planning. Extend via `LENS_REGISTRY` + new subagent pairs. |
| **implement-feature.js** | `cd voxera-crm` *or* `cd voxera-website` | Implement a FEAT-xxx spec end-to-end: **design-review gate** (DDD→ERD→Prisma→GraphQL→Webhook→AI-agent→Analytics→OO→TDD; auto-skips when no data/domain/API/behavior impact) → human gate → plan → human gate → implement → quality-gate loop (3x) → human gate → update tracking → optional ADR. Quality gate reads commands from the code repo's `.a5c/commands.json` (`qualityGate.commands`). |
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

## Extending the design operating system (`design-review.js`)

`design-review.js` is the spine of the engineering design gate. It ships the **DDD → ERD → Prisma → GraphQL → Webhook → AI-agent → Analytics → OO → TDD** lenses. Add a new design discipline ("lens") without touching the orchestration:

1. Author the subagent pair in `voxera-crm/.claude/subagents/`: `<lens>-designer.md` and `<lens>-reviewer.md` (follow the existing six as templates — designer produces a markdown design artifact; reviewer returns `{ verdict, score, findings }` and defaults to skepticism).
2. Add an entry to `LENS_REGISTRY` in `design-review.js`: `{ id, title, designerAgent, reviewerAgent, appliesWhen, designGoal }`. Order matters — lenses run top-to-bottom and each reads the approved output of the earlier ones.
3. Add the two agents to the `@agent` markers in the JSDoc header.
4. Sanity-check: `node --check .a5c/processes/design-review.js`.

All nine disciplines from the original engineering-OS brief are now shipped (ddd, erd, prisma, graphql, webhook, ai-agent, analytics, oo, tdd). A future lens follows the same recipe. See `voxera-crm/.claude/rules/engineering-design.md` and `voxera-crm/docs/patterns/domain-and-data-modeling.md`.
