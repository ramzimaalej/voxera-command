# Babysitter process rules — pointer

The **canonical** conventions for authoring any babysitter process across the workspace live in **`../../../voxera-os/.claude/rules/processes.md`** (moved there with the engineering processes per `ADR-0014`). Read that when writing or changing a process.

This repo (`voxera-command`) holds only the **business / CEO** processes — `iterate-doc.js`, `iterate-vision.js`, `weekly-business-review.js`, `revenue-pulse.js` — in `.a5c/processes/`. They follow the same conventions. The engineering processes (`implement-feature`, `fix-bug`, `design-review`) live in `voxera-os/.a5c/processes/`.

## The essentials (full detail in voxera-os)

- Every process file has a JSDoc header with `@process`, `@description`, `@inputs`, `@outputs`, and recommended `@skill` / `@agent` markers.
- `import { defineTask } from '@a5c-ai/babysitter-sdk';` — the SDK must be installed in `.a5c/processes/node_modules/`.
- `export async function process(inputs, ctx)` — validate inputs up front; linear, named phases; each phase one `ctx.task(...)` or `ctx.breakpoint(...)`; cap every loop at a small N.
- Tasks via `defineTask('name', (args, taskCtx) => ({ kind: 'agent', title, description, agent: { name, prompt, outputSchema }, io: { inputJsonPath, outputJsonPath }, labels }))`.
- Return `{ success, ...keyOutputs, metadata: { processId, timestamp } }`.

## Path conventions (business processes here)

- The `process` function runs in CWD = the invoking repo's root. Read files via relative paths from CWD.
- Business processes here operate on this repo's `docs/`, `decisions/`, etc. — they may read confidential docs because they are run by execs.
- **Engineering processes must NOT read `../voxera-command/...`** — that re-introduces the confidentiality coupling `ADR-0014` removed. Keep them repo-agnostic. (Enforced in `voxera-os/.claude/rules/processes.md`.)

## Don't

- Don't use the pre-2026 `ctx.task({ name, prompt, files })` shape.
- Don't add an engineering process here — add it in `voxera-os` to keep this repo exec-only.
- Don't infinite-loop; cap every retry.
