/**
 * @process voxera/fix-bug
 * @description Fix a BUG-xxx spec test-first: reproduce + write failing regression test, fix until green, approve diff, update tracking.
 * @inputs { spec: string, qualityGate?: object }
 * @outputs { success, spec, attemptsToConverge }
 * @skill verify .claude/skills/verify/SKILL.md
 * @agent general-purpose
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Fix a bug spec in a code repo, test-first.
 *
 * Run FROM the code repo so the journal lands there:
 *   cd voxera-website
 *   /babysitter:call --process ../voxera-command/.a5c/processes/fix-bug.js#process \
 *     -- spec ../voxera-command/docs/product/bugs/BUG-014-hero-cls.md
 *
 * Quality gate commands read from .a5c/commands.json (qualityGate.commands).
 *
 * Phases:
 *   1. reproduce  — agent reproduces the bug and adds a failing regression test
 *   2. human gate — user confirms reproduction
 *   3. fix loop   — implement smallest change; verify; loop up to 3 attempts
 *   4. human gate — approve the fix
 *   5. update     — set status: fixed in the spec
 */
export async function process(inputs, ctx) {
  const { spec, qualityGate = null } = inputs;

  if (!spec) {
    throw new Error('fix-bug requires { spec }');
  }

  // PHASE 1 — reproduce + add failing regression test
  const repro = await ctx.task(reproduceBugTask, { spec });

  // PHASE 2 — confirm reproduction
  await ctx.breakpoint({
    title: 'Confirm reproduction',
    question: [
      `**Spec**: ${spec}`,
      ``,
      `**Regression test added**: ${repro.regressionTestPath}`,
      `**Test currently failing**: ${repro.failingAsExpected ? 'yes ✓' : 'NO — investigate before proceeding'}`,
      `**Reproduction notes**: ${repro.reproductionNotes}`,
      ``,
      'Approve to proceed to the fix loop.',
    ].join('\n'),
  });

  // PHASE 3 — fix loop
  const gate = qualityGate || (await ctx.task(loadGateTask, {}));
  const passingScore = gate.passingScore ?? 95;
  const gateCommands = gate.commands || [];

  await ctx.task(implementFixTask, { spec });

  let verify = await ctx.task(verifyFixTask, {
    spec,
    regressionTestPath: repro.regressionTestPath,
    commands: gateCommands,
    passingScore,
  });

  let attempts = 1;
  while (verify.score < passingScore && attempts < 3) {
    await ctx.task(fixAgainTask, { spec, failures: verify.failures });
    verify = await ctx.task(verifyFixTask, {
      spec,
      regressionTestPath: repro.regressionTestPath,
      commands: gateCommands,
      passingScore,
    });
    attempts++;
  }

  if (verify.score < passingScore) {
    await ctx.breakpoint({
      title: 'Fix loop not converging',
      question: [
        `Fix gate stayed below ${passingScore} after ${attempts} attempts.`,
        `Current score: ${verify.score}`,
        `Regression test passing: ${verify.regressionTestPassing ? 'yes' : 'NO'}`,
        `Other failures: ${verify.failures.slice(0, 5).join('; ')}`,
        ``,
        'Approve to commit anyway, or reject to investigate manually.',
      ].join('\n'),
    });
  }

  // PHASE 4 — approve fix
  await ctx.breakpoint({
    title: 'Approve fix for commit',
    question: `Bug ${spec} fixed. Regression test passes ✓. Quality score: ${verify.score}/100 after ${attempts} attempt(s).\n\nApprove to update tracking and finish.`,
  });

  // PHASE 5 — update tracking
  await ctx.task(updateBugTrackingTask, { spec });

  return {
    success: true,
    spec,
    attemptsToConverge: attempts,
    finalScore: verify.score,
    metadata: { processId: 'voxera/fix-bug', timestamp: ctx.now() },
  };
}

export const reproduceBugTask = defineTask('reproduce-bug', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reproduce bug + add failing regression test',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'engineer practicing test-first bug fixing',
      task: `Reproduce ${args.spec} and add a regression test that fails today.`,
      context: args,
      instructions: [
        `Read the bug spec at ${args.spec} in full. The "Regression test to add" section (if present) is the contract.`,
        'Reproduce the bug locally (run the failing scenario, capture the wrong behavior).',
        'Write a regression test that exercises the failing path. The test MUST fail against the current code (verify by running it).',
        'Place the test in the repo\'s test directory following the existing convention. For voxera-crm: test/app/<module>/ or apps/<app>/test/. For voxera-website: there is no test runner — skip the test, write a documented reproduction in artifacts/reproduction.md instead.',
        'Do NOT write the fix yet. The fix is a later phase.',
      ],
      outputFormat: 'JSON with regressionTestPath (string or null), failingAsExpected (boolean), reproductionNotes (string).',
    },
    outputSchema: {
      type: 'object',
      required: ['failingAsExpected', 'reproductionNotes'],
      properties: {
        regressionTestPath: { type: ['string', 'null'] },
        failingAsExpected: { type: 'boolean' },
        reproductionNotes: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bug', 'reproduce', 'test-first'],
}));

export const implementFixTask = defineTask('implement-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement the smallest possible fix',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'engineer making the minimum change to fix a bug',
      task: 'Make the smallest change that turns the regression test green.',
      context: args,
      instructions: [
        `Read the bug spec at ${args.spec} for context.`,
        'Apply the smallest possible code change that addresses the root cause.',
        'Do NOT refactor unrelated code. Do NOT add features. Do NOT change tests other than the regression test from Phase 1.',
        'Do not run quality gates here — the next phase does that.',
      ],
      outputFormat: 'JSON with filesChanged (array), rootCauseNotes (string).',
    },
    outputSchema: {
      type: 'object',
      required: ['filesChanged'],
      properties: {
        filesChanged: { type: 'array', items: { type: 'string' } },
        rootCauseNotes: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bug', 'fix'],
}));

export const verifyFixTask = defineTask('verify-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify regression test passes + full gate is green',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer running the bug-fix gate',
      task: 'Run the full quality gate and confirm the regression test now passes.',
      context: args,
      instructions: [
        `Run these commands in order from CWD: ${(args.commands || []).map(c => `\`${c}\``).join(', ')}`,
        `Confirm the regression test at ${args.regressionTestPath} is in the test runner\'s output and PASSES.`,
        'Score 0-100. Heuristic: 100 = all commands pass + regression test green. 95 = regression green + minor unrelated warnings. <95 = something is broken.',
        'List concrete failures (command + output excerpt). If the regression test still fails, that is the top failure.',
      ],
      outputFormat: 'JSON with score (0-100), regressionTestPassing (boolean), failures (array of strings), commandResults (array).',
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'regressionTestPassing', 'failures'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        regressionTestPassing: { type: 'boolean' },
        failures: { type: 'array', items: { type: 'string' } },
        commandResults: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bug', 'verify', 'quality-gate'],
}));

export const fixAgainTask = defineTask('fix-again', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Address remaining failures',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'engineer iterating on a bug fix',
      task: 'Resolve every failure from the previous verify run.',
      context: args,
      instructions: [
        'For each failure, identify root cause and apply minimum fix.',
        'Do not disable, skip, or weaken any test to make the gate pass.',
        'If the regression test still fails, prioritize fixing that before anything else.',
      ],
      outputFormat: 'JSON with failuresAddressed (array), filesChanged (array).',
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
  labels: ['agent', 'bug', 'fix'],
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
        'Return the `qualityGate` object (commands array + passingScore).',
        'If file missing, return { commands: ["echo no-gate-configured"], passingScore: 0 }.',
      ],
      outputFormat: 'JSON: { commands: string[], passingScore: number }.',
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

export const updateBugTrackingTask = defineTask('update-bug-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set status: fixed in the bug spec',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'doc editor closing the loop in the command repo',
      task: 'Update the bug spec\'s frontmatter and changelog to reflect the fix.',
      context: args,
      instructions: [
        `Read ${args.spec}.`,
        'In frontmatter: set `status: fixed`, update `updated` to today, bump `version`.',
        'Append a Changelog bullet dated today: "fixed in <repo-name> in <commit-sha-or-branch>".',
        'Save.',
      ],
      outputFormat: 'JSON with specUpdated (boolean), specVersion (number).',
    },
    outputSchema: {
      type: 'object',
      required: ['specUpdated'],
      properties: {
        specUpdated: { type: 'boolean' },
        specVersion: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'tracking'],
}));
