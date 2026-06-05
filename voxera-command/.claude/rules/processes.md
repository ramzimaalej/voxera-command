# Babysitter process rules — `.a5c/processes/`

This repo owns every babysitter process used across the workspace. The 4 current processes (`iterate-doc.js`, `iterate-vision.js`, `implement-feature.js`, `fix-bug.js`) follow the same shape. New ones should too.

The catalog is in `.a5c/processes/README.md`.

## File anatomy

Every process file has:

### 1. JSDoc header with discovery markers

```js
/**
 * @process voxera/<name>
 * @description One-line summary the SDK surfaces in discovery.
 * @inputs { docPath: string, change: string, dryRun?: boolean }
 * @outputs { success: boolean, ... }
 * @skill brand-conformance ../../../.claude/skills/brand-conformance/SKILL.md
 * @agent general-purpose
 */
```

Required markers:
- `@process <id>` — unique slug, kebab-case, repo-scoped namespace (e.g. `voxera/iterate-doc`).
- `@description` — one line, surfaced in `babysitter run:create` discovery.

Recommended markers (improve discovery quality, reduce noise from the SDK scanning every skill in the plugin):
- `@inputs` / `@outputs` — TS-style shape of inputs and outputs.
- `@skill <name> <path>` — local skills the process relies on. Paths are relative to the plugin's process root (`pluginRoot/skills/babysit/process/`). For local project skills use the relative path from there to your `.claude/skills/<name>/SKILL.md`.
- `@agent <name>` — agents the process spawns. Same path convention as `@skill` when local.

Without `@skill`/`@agent`, the SDK scans every available skill/agent and surfaces dozens of irrelevant results. With them, only the marked dependencies surface — orchestration is sharper.

### 2. Imports

```js
import { defineTask } from '@a5c-ai/babysitter-sdk';
```

Required. The SDK must be installed in `.a5c/processes/node_modules/` (see `.a5c/processes/README.md` first-time setup). The pre-2026 `ctx.task({ name, prompt, files })` shape is **not** valid; use `defineTask`-based tasks only.

### 3. `process` function

```js
export async function process(inputs, ctx) {
  // 1. Validate inputs up front. Throw with a clear message on missing required fields.
  // 2. Phase 1, Phase 2, ... — each is a ctx.task(...) or ctx.breakpoint(...).
  // 3. Return a structured result with success + metadata.
}
```

Conventions:
- Validate inputs at the top; throw `new Error('<process> requires { ... }')` on missing required fields.
- Phases are linear and named in comments (`// PHASE 1 — plan`).
- Each phase is one `ctx.task(taskDef, args)` call or one `ctx.breakpoint({...})` call.
- Loops (refine, verify) explicitly capped — `while (attempts < 3)` not `while (true)`.
- Return shape: `{ success: boolean, ...keyOutputs, metadata: { processId, timestamp } }`.

### 4. Task definitions via `defineTask`

```js
export const myTask = defineTask('task-name', (args, taskCtx) => ({
  kind: 'agent',  // or 'node' | 'shell' | 'skill' | 'breakpoint' | 'sleep'
  title: 'Human-readable task title',
  description: 'What this task does and why.',
  agent: {
    name: 'general-purpose',  // or a specific agent name
    prompt: {
      role: 'role description (e.g., "QA engineer running the gate")',
      task: 'the goal of this single task, in one sentence',
      context: args,           // structured args; agent sees this verbatim
      instructions: [          // numbered steps the agent should follow
        'Step 1...',
        'Step 2...',
      ],
      outputFormat: 'JSON with <fields>. Be exact about the shape.',
    },
    outputSchema: {            // JSON Schema for the result
      type: 'object',
      required: ['fieldA', 'fieldB'],
      properties: {
        fieldA: { type: 'string' },
        fieldB: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'phase-name'],
}));
```

- `kind: 'agent'` for delegated work to an LLM. Other kinds: `'node'` (Node script), `'shell'` (shell command), `'skill'` (Claude Code skill), `'breakpoint'` (human gate), `'sleep'` (time gate).
- `prompt.role` + `prompt.task` + `prompt.instructions` should be tight. Long, vague instructions produce vague work.
- `outputSchema` enforces structure. The agent's output is parsed against the schema before the next phase runs — missing required fields → error.
- `io.inputJsonPath` / `io.outputJsonPath` always reference `tasks/${taskCtx.effectId}/...`. The SDK writes input + reads output from these paths.

### 5. Breakpoints

```js
await ctx.breakpoint({
  title: 'Short title',
  question: 'The question the user sees. Markdown supported.',
  context: {
    runId: ctx.runId,
    files: [
      { path: 'artifacts/preview.md', format: 'markdown', label: 'Proposed change' },
    ],
  },
});
```

- A breakpoint pauses the run. The hook prompts the user via `AskUserQuestion`. The user's response is the breakpoint result.
- Frame the question so the answer is unambiguous — approval is `{ approved: true }`, rejection is `{ approved: false }`. The CLI handles the wiring.
- Include `files:` to surface preview artifacts. The user can read them before deciding.

## Path conventions

Process files live in `voxera-command/.a5c/processes/` and are invoked from any repo. Inside a process:

- The `process` function runs in CWD = the invoking repo's root (voxera-crm, voxera-website, or voxera-command itself).
- Read files via relative paths from CWD. The process is repo-agnostic at the file-system layer.
- For files in voxera-command (specs, docs, ADRs, templates) when invoked from a code repo: `../voxera-command/...`. When invoked from voxera-command itself: just `<path>`.

## Quality-gate processes (`implement-feature.js`, `fix-bug.js`)

Read gate commands from the invoking repo's `.a5c/commands.json` (`qualityGate.commands` + `qualityGate.passingScore`). If a new code repo joins the workspace, it needs its own `commands.json`.

The processes accept `qualityGate` in inputs as an override (advanced use; usually omit).

## When to write a new process

- The workflow is **repeatable** (run more than once, by you or someone else).
- It's **multi-phase** with at least one human gate.
- The phases benefit from being journal-recorded (audit, replay, resume after interruption).

Don't write a process for:
- One-off scripts (just use a `Bash` or `Node` script).
- Single-phase work with no human gate (just invoke an agent).

## Adding a process — checklist

1. Copy the simplest existing process (`iterate-doc.js`, 173 lines) as a starting point.
2. Update the JSDoc header (`@process`, `@inputs`, `@outputs`, `@skill`, `@agent`).
3. Define each phase as a `defineTask`. Keep tasks small + single-responsibility.
4. Add to the table in `.a5c/processes/README.md`.
5. Syntax-check: `node --check .a5c/processes/<your-file>.js`.
6. Dry-run: invoke from the target repo and stop at the first breakpoint to validate.

## Don't

- Don't use the pre-2026 `ctx.task({ name, prompt, files })` shape. It's not valid.
- Don't skip the JSDoc header — discovery degrades.
- Don't put long-form documentation in a process file. Process files are code; the README is the catalog.
- Don't infinite-loop. Cap every retry at a small N with a breakpoint when the cap is hit.
- Don't bypass the babysitter SDK to call agents directly. The journal + state machine depends on the SDK orchestration.
- Don't import from `voxera-website/` or `voxera-crm/` in a process file. Processes are code-repo-agnostic.
