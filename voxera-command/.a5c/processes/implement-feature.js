/**
 * @process voxera/implement-feature
 * @description Implement a FEAT-xxx spec end-to-end in a code repo: design-review gate → plan → human approval → implement → quality-gated verify loop → human approval → update tracking → optional ADR.
 * @inputs { spec: string, qualityGate?: object, skipDesignReview?: boolean, designLenses?: string[], dossierPath?: string }
 * @outputs { success, spec, attemptsToConverge, dossierPath?: string, adrCreated?: string }
 * @skill code-review .claude/skills/code-review/SKILL.md
 * @skill verify .claude/skills/verify/SKILL.md
 * @agent code-reviewer
 * @agent general-purpose
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { designReview } from './design-review.js';

/**
 * Implement a feature spec in a code repo (voxera-crm or voxera-website).
 *
 * Run FROM the code repo so the journal lands there:
 *   cd voxera-crm
 *   /babysitter:call --process ../voxera-command/.a5c/processes/implement-feature.js#process \
 *     -- spec ../voxera-command/docs/product/features/FEAT-007-pipeline-view.md
 *
 * Quality gate commands are read from .a5c/commands.json (qualityGate.commands).
 * Pass `qualityGate` in inputs to override.
 *
 * Phases:
 *   0. design     — design-review gate: DDD → ERD → Prisma design + adversarial review (skippable / auto-skips when no data/domain impact)
 *   0b. human gate — user approves the design dossier
 *   1. plan       — agent reads spec + strategy + roadmap + design dossier, produces implementation plan
 *   2. human gate — user approves plan
 *   3. implement  — agent writes the code
 *   4. verify     — quality-gate loop (up to 3 attempts; lint+typecheck+test+build+spec-conformance)
 *   5. human gate — user approves final diff
 *   6. update     — set status: done in spec, tick roadmap, bump roadmap version
 *   7. adr-check  — optional, gated by user
 */
export async function process(inputs, ctx) {
  const { spec, qualityGate = null, skipDesignReview = false, designLenses = null, dossierPath: providedDossier = null } = inputs;

  if (!spec) {
    throw new Error('implement-feature requires { spec }');
  }

  // PHASE 0 — design-review gate. Three modes:
  //   1. `dossierPath` provided  → a design was already produced + approved upstream (e.g. the
  //      voxera-crm feature SDLC's run-design-review step). Reuse it; do not re-run the gate.
  //   2. `skipDesignReview`      → skip entirely (trivial/no-design features).
  //   3. otherwise               → run the lenses now, then a human gate to approve the dossier.
  // Auto-skips the gate when the spec has no data/domain/API/behavior impact (no lenses detected).
  let dossierPath = providedDossier;
  if (!providedDossier && !skipDesignReview) {
    const design = await designReview(spec, ctx, { lenses: designLenses });
    dossierPath = design.dossierPath;

    if (design.lenses.length) {
      const unresolved = design.lenses.filter((l) => l.verdict !== 'approved');
      await ctx.breakpoint({
        title: 'Approve design before planning',
        question: [
          `**Spec**: ${spec}`,
          ``,
          `Design lenses (domain → data → schema):`,
          ...design.lenses.map(
            (l) =>
              `- **${l.title}**: ${l.verdict} (score ${l.score}, ${l.revisions} revision${l.revisions === 1 ? '' : 's'})` +
              (l.riskNote ? ` — ${l.riskNote}` : ''),
          ),
          ``,
          unresolved.length
            ? `⚠️ ${unresolved.length} lens(es) did not reach "approved" — read their findings in the dossier before approving.`
            : `All lenses approved by their adversarial reviewer.`,
          ``,
          'Approve to lock the design and plan against it, reject to iterate further.',
        ].join('\n'),
        context: {
          runId: ctx.runId,
          files: [{ path: dossierPath, format: 'markdown', label: 'Design dossier' }],
        },
      });
    }
  }

  // PHASE 1 — plan
  const plan = await ctx.task(planFeatureTask, { spec, dossierPath });

  // PHASE 2 — approve plan
  await ctx.breakpoint({
    title: 'Approve implementation plan',
    question: [
      `**Spec**: ${spec}`,
      ``,
      `**Files to touch**: ${plan.filesToTouch.length}`,
      `**Approach**: ${plan.approach}`,
      `**Test strategy**: ${plan.testStrategy}`,
      `**Acceptance criteria mapped**: ${plan.acMappedCount} / ${plan.acTotalCount}`,
      ``,
      'Approve to implement, reject to refine.',
    ].join('\n'),
    context: {
      runId: ctx.runId,
      files: [{ path: plan.planPath, format: 'markdown', label: 'Full implementation plan' }],
    },
  });

  // PHASE 3 — implement
  await ctx.task(implementFeatureTask, { spec, planPath: plan.planPath, dossierPath });

  // PHASE 4 — quality-gated verify loop
  const gate = qualityGate || (await ctx.task(loadGateTask, {}));
  const passingScore = gate.passingScore ?? 95;
  const gateCommands = gate.commands || [];

  let verify = await ctx.task(verifyFeatureTask, {
    spec,
    planPath: plan.planPath,
    commands: gateCommands,
    passingScore,
  });

  let attempts = 1;
  while (verify.score < passingScore && attempts < 3) {
    await ctx.task(fixFailuresTask, { spec, failures: verify.failures });
    verify = await ctx.task(verifyFeatureTask, {
      spec,
      planPath: plan.planPath,
      commands: gateCommands,
      passingScore,
    });
    attempts++;
  }

  if (verify.score < passingScore) {
    await ctx.breakpoint({
      title: 'Quality gate not converging',
      question: [
        `Quality gate stayed below ${passingScore} after ${attempts} attempts.`,
        `Current score: ${verify.score}`,
        `Failures: ${verify.failures.slice(0, 5).join('; ')}${verify.failures.length > 5 ? ' …' : ''}`,
        ``,
        'Approve to commit anyway (e.g., known flaky test), or reject to investigate manually.',
      ].join('\n'),
    });
  }

  // PHASE 5 — final diff approval
  await ctx.breakpoint({
    title: 'Approve final diff for commit',
    question: `All acceptance criteria for ${spec} verified.\nQuality score: ${verify.score}/100 after ${attempts} attempt(s).\n\nApprove to update tracking and finish.`,
  });

  // PHASE 6 — update tracking
  await ctx.task(updateTrackingTask, { spec });

  // PHASE 7 — ADR check
  const arch = await ctx.task(archDecisionCheckTask, { spec, planPath: plan.planPath });
  let adrCreated = null;
  if (arch.hasArchitecturalDecision) {
    await ctx.breakpoint({
      title: 'Record ADR?',
      question: [
        `An architectural choice was made:`,
        ``,
        `> ${arch.summary}`,
        ``,
        `Record an ADR in ../voxera-command/decisions/?`,
      ].join('\n'),
    });
    const adr = await ctx.task(writeFeatureAdrTask, { spec, decision: arch });
    adrCreated = adr.adrPath;
  }

  return {
    success: true,
    spec,
    dossierPath,
    attemptsToConverge: attempts,
    finalScore: verify.score,
    adrCreated,
    metadata: { processId: 'voxera/implement-feature', timestamp: ctx.now() },
  };
}

export const planFeatureTask = defineTask('plan-feature', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan feature implementation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'principal engineer planning a vertical-slice implementation against repo conventions',
      task: `Read the spec at ${args.spec} and produce a concrete implementation plan.`,
      context: args,
      instructions: [
        `Read the spec at ${args.spec} in full.`,
        args.dossierPath
          ? `Read the approved design dossier at ${args.dossierPath} — it holds the locked domain model, ERD, and Prisma/migration design. The plan MUST implement that design; do not re-decide the data model or schema here.`
          : 'No design dossier was produced (spec has no data/domain impact). Plan directly from the spec.',
        'Read ../voxera-command/docs/vision/vision.md and ../voxera-command/docs/product/roadmap.md for strategic context.',
        'Read the current repo\'s CLAUDE.md + .claude/rules/**/*.md + any docs/patterns/** to ground the plan in repo conventions.',
        'For voxera-crm: respect the feature SDLC discipline — features live under features/<id>/ with spec.md, test-cases.md, implementation-plan.md, status.json, handoff.md. Do not write production code until status === "PLAN_APPROVED".',
        'For voxera-website: target Astro pages + components, respect the brand guidelines on copy.',
        'Map every acceptance criterion in the spec to at least one test case.',
        'List the files to touch (apps/libs paths), the approach in 1-2 paragraphs, the test strategy, and the slice boundary if it makes sense.',
        `Write the full plan to "artifacts/${taskCtx.effectId}-plan.md".`,
      ],
      outputFormat: 'JSON with planPath, filesToTouch (array), approach (string), testStrategy (string), acMappedCount (number), acTotalCount (number), slices (array, optional).',
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'filesToTouch', 'approach', 'testStrategy', 'acMappedCount', 'acTotalCount'],
      properties: {
        planPath: { type: 'string' },
        filesToTouch: { type: 'array', items: { type: 'string' } },
        approach: { type: 'string' },
        testStrategy: { type: 'string' },
        acMappedCount: { type: 'number' },
        acTotalCount: { type: 'number' },
        slices: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'plan'],
}));

export const implementFeatureTask = defineTask('implement-feature', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute the approved implementation plan',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior engineer executing an approved plan test-first (TDD), with scope discipline',
      task: 'Implement exactly what the approved plan describes, following strict TDD: a failing test precedes every change to production behavior. Do not refactor unrelated code.',
      context: args,
      instructions: [
        `Read the approved plan at ${args.planPath}.`,
        args.dossierPath
          ? `For data-model / schema / migration work, follow the locked design in ${args.dossierPath} exactly — especially the Prisma/ZModel design and the migration plan (additive vs expand-contract). Do not deviate from the approved schema or migration strategy.`
          : 'No design dossier — implement directly from the plan.',
        'Work through the plan slice-by-slice if slices are defined; otherwise file-by-file.',
        'TDD is mandatory — for each slice follow red → green → refactor: (1) RED: write the test(s) for the slice first, derived from the test cases, run them, and confirm they FAIL for the right reason; (2) GREEN: write the minimum production code to make them pass; (3) REFACTOR with tests green. Never write production code before its failing test. Capture, per slice, the command you ran to see the test fail (red) and then pass (green).',
        'For voxera-crm: a data-model change still goes Prisma schema first → npm run backend:prisma:gen:types → then the test for the service/resolver behavior (red) → then the implementation (green). Frontend changes follow Mantine + repo patterns, component test first.',
        'For voxera-website: respect brand guidelines on user-visible copy; reuse Astro component patterns.',
        'Do not weaken, skip, or delete a test to make a slice pass. If a planned test is wrong, fix it deliberately and note why.',
        'Do NOT touch files outside the plan unless the plan explicitly says so.',
        'Do not run the full quality gate here — the next phase does that; but you MUST run each slice\'s own tests to observe red then green.',
      ],
      outputFormat: 'JSON with filesChanged (array), filesCreated (array), testsAdded (array), tddEvidence (array of { slice, redCommand, greenCommand } showing the failing-then-passing transition per slice), notes (string).',
    },
    outputSchema: {
      type: 'object',
      required: ['filesChanged'],
      properties: {
        filesChanged: { type: 'array', items: { type: 'string' } },
        filesCreated: { type: 'array', items: { type: 'string' } },
        testsAdded: { type: 'array', items: { type: 'string' } },
        tddEvidence: { type: 'array' },
        notes: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'implement'],
}));

export const loadGateTask = defineTask('load-quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Load .a5c/commands.json qualityGate from current repo',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CLI helper',
      task: 'Read .a5c/commands.json from CWD and return the qualityGate block.',
      context: args,
      instructions: [
        'Read .a5c/commands.json from the current working directory.',
        'Return the `qualityGate` object exactly as defined (commands array + passingScore).',
        'If the file is missing, return a minimal default: commands=["echo no-gate-configured"], passingScore=0 (never blocks).',
      ],
      outputFormat: 'JSON matching qualityGate shape: { commands: string[], passingScore: number }.',
    },
    outputSchema: {
      type: 'object',
      required: ['commands', 'passingScore'],
      properties: {
        commands: { type: 'array', items: { type: 'string' } },
        passingScore: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'config'],
}));

export const verifyFeatureTask = defineTask('verify-feature', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quality gate: run repo commands + check spec conformance',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer running the gate',
      task: 'Run each command in `commands` in order. Check spec conformance against the implementation. Score the result.',
      context: args,
      instructions: [
        `Run these commands in order from CWD: ${(args.commands || []).map(c => `\`${c}\``).join(', ')}`,
        'Capture exit codes and last 50 lines of output for any non-zero exit.',
        `Read the spec at ${args.spec} and verify each acceptance criterion is satisfied by the implementation (read the changed files if needed).`,
        'Verify TDD was followed: every acceptance criterion / changed behavior has a test that actually exercises it, and the implement step reported tddEvidence (a failing-then-passing transition per slice). Treat new or changed production behavior with no covering test — or no red-phase evidence — as a failure, not a pass.',
        'Score 0-100. Heuristic: 100 = all commands pass + every AC satisfied + TDD evidence present. 95 = minor non-blocking warnings. 90 = one criterion partially met or weak test coverage. <90 = real failures (including untested behavior).',
        'List concrete failures (command name + output excerpt, or AC identifier + what\'s missing, or behavior shipped without a covering test). No vague descriptions.',
      ],
      outputFormat: 'JSON with score (0-100), failures (array of strings), commandResults (array of {command, exitCode, lastLines}).',
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'failures'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        failures: { type: 'array', items: { type: 'string' } },
        commandResults: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'verify', 'quality-gate'],
}));

export const fixFailuresTask = defineTask('fix-failures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Address verify failures',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'engineer fixing the smallest possible diff to clear failures',
      task: 'Resolve every failure from the previous verify run. Do not introduce unrelated changes.',
      context: args,
      instructions: [
        'For each failure, identify the root cause and apply the minimum fix.',
        'If a failure is a flaky test, do NOT mark it as known-flaky here; surface it in the next verify\'s failures so the human gate sees it.',
        'Do not skip or disable tests to make the gate pass.',
      ],
      outputFormat: 'JSON with failuresAddressed (array of strings), filesChanged (array of strings).',
    },
    outputSchema: {
      type: 'object',
      required: ['failuresAddressed'],
      properties: {
        failuresAddressed: { type: 'array', items: { type: 'string' } },
        filesChanged: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fix'],
}));

export const updateTrackingTask = defineTask('update-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update spec status + roadmap',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'doc editor closing the loop in the command repo',
      task: 'Set status to "done" in the spec file and tick its roadmap item.',
      context: args,
      instructions: [
        `Read ${args.spec}.`,
        'In the frontmatter, set `status: done`. Update `updated` to today\'s date. Bump `version`.',
        'Append a Changelog bullet to the spec dated today: "implemented in <repo-name> in <commit-sha-or-branch>".',
        'Read ../voxera-command/docs/product/roadmap.md. Find the roadmap item that references this spec (by ID). Mark it complete (e.g., `[x]`). Bump roadmap version + add Changelog line.',
        'Save both files.',
      ],
      outputFormat: 'JSON with specUpdated (boolean), roadmapUpdated (boolean), specVersion (number), roadmapVersion (number).',
    },
    outputSchema: {
      type: 'object',
      required: ['specUpdated', 'roadmapUpdated'],
      properties: {
        specUpdated: { type: 'boolean' },
        roadmapUpdated: { type: 'boolean' },
        specVersion: { type: 'number' },
        roadmapVersion: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'tracking'],
}));

export const archDecisionCheckTask = defineTask('arch-decision-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Did implementation introduce an architectural decision?',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'architecture reviewer with low tolerance for ADR-bloat',
      task: 'Decide whether the implementation involved a non-obvious architectural choice worth recording.',
      context: args,
      instructions: [
        `Read the spec at ${args.spec} and the plan at ${args.planPath}.`,
        'A real architectural decision is: a fork in the road (built X over Y), a load-bearing tradeoff, a pattern other code will follow.',
        'Routine implementation (followed existing patterns, used the standard service shape, added a CRUD module) is NOT an ADR.',
        'Bias toward NO. If unsure: NO.',
        'If yes: summarize the decision in 1 sentence + 1 paragraph of context.',
      ],
      outputFormat: 'JSON with hasArchitecturalDecision (boolean), summary (string), context (string), alternativesConsidered (array of strings).',
    },
    outputSchema: {
      type: 'object',
      required: ['hasArchitecturalDecision'],
      properties: {
        hasArchitecturalDecision: { type: 'boolean' },
        summary: { type: 'string' },
        context: { type: 'string' },
        alternativesConsidered: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'gate', 'adr-detection'],
}));

export const writeFeatureAdrTask = defineTask('write-feature-adr', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write ADR for an architectural decision made during implementation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADR author following voxera-command conventions',
      task: 'Create the next ADR file in ../voxera-command/decisions/ from _template.md.',
      context: args,
      instructions: [
        'Use the extract-adr skill at ../voxera-command/.claude/skills/extract-adr/SKILL.md as the workflow reference.',
        'List ../voxera-command/decisions/ADR-*.md, take the next number.',
        'Copy _template.md to ADR-XXXX-<slug>.md. Fill from the decision context.',
        `Set affects: include ${args.spec} and the main code files changed.`,
        'Return the full ADR path.',
      ],
      outputFormat: 'JSON with adrPath (string), adrNumber (number).',
    },
    outputSchema: {
      type: 'object',
      required: ['adrPath'],
      properties: {
        adrPath: { type: 'string' },
        adrNumber: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'adr'],
}));
