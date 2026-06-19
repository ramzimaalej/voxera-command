/**
 * @process voxera/iterate-vision
 * @description Evolve a strategy doc (vision/brand/roadmap/website-plan) with consistency + brand-voice gates, a human approval gate, and an optional ADR capture for strategic decisions.
 * @inputs { docPath: string, change: string, dryRun?: boolean }
 * @outputs { success: boolean, docPath: string, newVersion?: number, adrCreated?: string|null }
 * @skill brand-conformance ../../../voxera-os/.claude/skills/brand-conformance/SKILL.md
 * @skill extract-adr ../../.claude/skills/extract-adr/SKILL.md
 * @agent general-purpose
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Iterate a strategy doc in voxera-command.
 *
 * Invoke from the command repo:
 *   /babysitter:call iterate the vision: tighten the ICP to mid-market RevOps
 *
 * For non-strategic doc edits (architecture spec, technical note), prefer iterate-doc.js
 * which skips the brand-conformance + ADR-check phases.
 *
 * Phases:
 *   1. draft-revision    — agent reads doc + brand + vision, produces a draft
 *   2. consistency-review — agent scores draft against brand + adjacent strategy docs
 *   3. refine            — looped (up to 2 attempts) when score < 85
 *   4. human gate        — user approves the diff
 *   5. apply             — write the doc, bump version, append changelog
 *   6. decision-check    — agent detects whether this is a strategic decision
 *   7. adr-gate + write  — only if decision detected
 */
export async function process(inputs, ctx) {
  const { docPath, change, dryRun = false } = inputs;

  if (!docPath || !change) {
    throw new Error('iterate-vision requires { docPath, change }');
  }

  // PHASE 1 — draft
  const draft = await ctx.task(draftRevisionTask, { docPath, change });

  // PHASE 2 + 3 — review + refine loop
  let review = await ctx.task(consistencyReviewTask, {
    docPath,
    draftPath: draft.draftPath,
  });

  let refineAttempts = 0;
  while (review.score < 85 && refineAttempts < 2) {
    const refined = await ctx.task(refineRevisionTask, {
      docPath,
      draftPath: draft.draftPath,
      issues: review.issues,
    });
    review = await ctx.task(consistencyReviewTask, {
      docPath,
      draftPath: refined.refinedDraftPath || draft.draftPath,
    });
    refineAttempts++;
  }

  // PHASE 4 — human gate
  await ctx.breakpoint({
    title: 'Approve revision',
    question: [
      `**Doc**: ${docPath}`,
      `**Change**: ${change}`,
      ``,
      `**Consistency + brand-voice score**: ${review.score}/100${review.issues.length ? ' (with notes)' : ''}`,
      review.issues.length ? `**Notes**: ${review.issues.join('; ')}` : '',
      ``,
      'Approve to apply, or reject and provide direction.',
    ].filter(Boolean).join('\n'),
    context: {
      runId: ctx.runId,
      files: [{ path: draft.draftPath, format: 'markdown', label: 'Proposed revision' }],
    },
  });

  if (dryRun) {
    return { success: true, docPath, applied: false, reason: 'dry-run', score: review.score };
  }

  // PHASE 5 — apply
  const applied = await ctx.task(applyDraftTask, { docPath, draftPath: draft.draftPath });

  // PHASE 6 — decision check
  const decision = await ctx.task(decisionCheckTask, { docPath, change });

  let adrCreated = null;
  if (decision.isStrategicDecision) {
    await ctx.breakpoint({
      title: 'Record ADR?',
      question: [
        `This change looks like a strategic decision:`,
        ``,
        `> ${decision.summary}`,
        ``,
        `Record an ADR? Approve to capture; reject to skip (you can always run extract-adr later).`,
      ].join('\n'),
    });
    const adr = await ctx.task(writeAdrTask, {
      docPath,
      decisionSummary: decision.summary,
      decisionContext: decision.context,
    });
    adrCreated = adr.adrPath;
  }

  return {
    success: true,
    docPath,
    newVersion: applied.newVersion,
    adrCreated,
    metadata: { processId: 'voxera/iterate-vision', timestamp: ctx.now() },
  };
}

export const draftRevisionTask = defineTask('draft-revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft strategy revision',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'strategy editor familiar with the Voxera doc set',
      task: `Apply the requested change to ${args.docPath} while staying consistent with the surrounding strategy and brand voice.`,
      context: { docPath: args.docPath, change: args.change },
      instructions: [
        `Read ${args.docPath} in full.`,
        'Read docs/vision/vision.md (if not the same file).',
        'Read ../voxera-os/docs/brand/brand-guidelines.md (voice + writing rules).',
        'Read docs/product/roadmap.md if the change touches roadmap items.',
        'Apply the change scoped tightly to the relevant section(s). Do not touch unrelated content.',
        'Preserve frontmatter and the existing Changelog section.',
        `Write the full proposed doc to "artifacts/${taskCtx.effectId}-draft.md".`,
        'Produce a short summary (≤6 lines) of what changed.',
      ],
      outputFormat: 'JSON with draftPath (run-relative), changesSummary (multi-line string).',
    },
    outputSchema: {
      type: 'object',
      required: ['draftPath', 'changesSummary'],
      properties: {
        draftPath: { type: 'string' },
        changesSummary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'strategy', 'draft'],
}));

export const consistencyReviewTask = defineTask('consistency-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Consistency + brand-voice review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'reviewer enforcing brand voice and strategy coherence',
      task: 'Score the draft for internal consistency with the rest of the voxera-command doc set and the brand guidelines.',
      context: { docPath: args.docPath, draftPath: args.draftPath },
      instructions: [
        `Read the draft at ${args.draftPath}.`,
        'Read docs/vision/vision.md, docs/strategy/strategy.md (if exists), ../voxera-os/docs/brand/brand-guidelines.md.',
        'Score 0-100. Heuristic: 100 = ships as-is. 85 = ships after small fixes. 70 = real issues to address. <70 = rework.',
        'Check for: positioning contradictions, voice violations (forbidden words, italic overuse, hype phrases), brand verbs misuse, honesty stance drift, scope creep beyond the requested change.',
        'Run the brand-conformance skill checks if the doc is brand-adjacent.',
        'Return concrete issues (file:section pointers, not vague impressions).',
      ],
      outputFormat: 'JSON with score (number 0-100), issues (array of strings, may be empty), strengths (array of strings).',
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'issues'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        issues: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'review', 'quality-gate'],
}));

export const refineRevisionTask = defineTask('refine-revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine draft to address review issues',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'editor revising a draft against reviewer feedback',
      task: 'Address every issue from the previous review, preserving the rest of the draft.',
      context: { docPath: args.docPath, draftPath: args.draftPath, issues: args.issues },
      instructions: [
        `Read the current draft at ${args.draftPath}.`,
        'For each item in `issues`, make the minimum change required to resolve it.',
        'Do not introduce new content beyond what the issues call for.',
        `Write the refined draft back to the same path (${args.draftPath}).`,
      ],
      outputFormat: 'JSON with refinedDraftPath (string), changesApplied (array of strings).',
    },
    outputSchema: {
      type: 'object',
      required: ['refinedDraftPath'],
      properties: {
        refinedDraftPath: { type: 'string' },
        changesApplied: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'strategy', 'refine'],
}));

export const applyDraftTask = defineTask('apply-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply approved draft + bump frontmatter + changelog',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'doc editor',
      task: 'Write the approved draft to the target path, bump frontmatter version, append a Changelog entry dated today.',
      context: args,
      instructions: [
        `Read the approved draft at ${args.draftPath}.`,
        `Read the current ${args.docPath} to capture the existing version.`,
        'Increment frontmatter `version` by 1. Set `updated` to today\'s ISO date (YYYY-MM-DD).',
        'Append one dated bullet to the `## Changelog` section summarizing the change in ≤120 chars.',
        `Write the result to ${args.docPath}, replacing its contents.`,
        'Re-read the file and verify the version + changelog landed; report mismatch if any.',
      ],
      outputFormat: 'JSON with success (boolean), newVersion (number), changelogEntry (string), verified (boolean).',
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'newVersion', 'verified'],
      properties: {
        success: { type: 'boolean' },
        newVersion: { type: 'number' },
        changelogEntry: { type: 'string' },
        verified: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'strategy', 'apply'],
}));

export const decisionCheckTask = defineTask('decision-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect whether the change embodies a strategic decision',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'architecture reviewer with low tolerance for ADR-bloat',
      task: 'Decide whether this change is a real strategic decision worth recording as an ADR.',
      context: args,
      instructions: [
        'A real decision has: a fork in the road (one path picked over alternatives), forces in tension, consequences that propagate.',
        'A non-decision is: typo, copy refinement, restructure, scope tightening, wording change.',
        'Read the updated doc + the change description carefully before deciding.',
        'Bias toward NO. ADRs are expensive; over-recording dilutes them.',
        'If yes: write a one-sentence summary of the decision and a brief context paragraph.',
      ],
      outputFormat: 'JSON with isStrategicDecision (boolean), summary (string), context (string), recommendedAlternatives (array of strings, may be empty).',
    },
    outputSchema: {
      type: 'object',
      required: ['isStrategicDecision'],
      properties: {
        isStrategicDecision: { type: 'boolean' },
        summary: { type: 'string' },
        context: { type: 'string' },
        recommendedAlternatives: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'gate', 'adr-detection'],
}));

export const writeAdrTask = defineTask('write-adr', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write ADR from decisions/_template.md',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADR author following the voxera-command decision-log conventions',
      task: 'Create the next ADR file from the template, fill it in, add a backlink in the source doc.',
      context: args,
      instructions: [
        'Use the extract-adr skill at .claude/skills/extract-adr/SKILL.md as the workflow.',
        'List decisions/ADR-*.md, take the next number.',
        'Copy decisions/_template.md to decisions/ADR-XXXX-<slug>.md.',
        'Fill: id, title, status: accepted, date today, affects (include the source doc), Context, Decision, Alternatives considered, Consequences.',
        `Add a backlink in ${args.docPath} after the relevant section: \`> *Decision recorded as [ADR-XXXX: title](../../decisions/ADR-XXXX-slug.md).*\`.`,
        'Return the full ADR path.',
      ],
      outputFormat: 'JSON with adrPath (string), adrNumber (number), backlinkAdded (boolean).',
    },
    outputSchema: {
      type: 'object',
      required: ['adrPath'],
      properties: {
        adrPath: { type: 'string' },
        adrNumber: { type: 'number' },
        backlinkAdded: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'adr', 'apply'],
}));
