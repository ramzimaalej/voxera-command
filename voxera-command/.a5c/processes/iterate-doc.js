/**
 * @process voxera/iterate-doc
 * @description Apply a change to a versioned voxera-command doc — plan, review, apply, bump frontmatter + changelog.
 * @inputs { docPath: string, change: string, dryRun?: boolean }
 * @outputs { success: boolean, docPath: string, newVersion: number, changelogEntry: string }
 * @skill brand-conformance ../../../voxera-command/.claude/skills/brand-conformance/SKILL.md
 * @agent general-purpose
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Iterate a doc in voxera-command.
 *
 * The voxera-command CLAUDE.md advertises:
 *   /babysitter:call iterate <doc>: <change>
 * This process is what backs that invocation.
 *
 * Phases:
 *   1. plan-change   — agent reads doc, drafts diff + frontmatter bump + changelog line
 *   2. review        — breakpoint: user approves, edits, or rejects the plan
 *   3. apply-change  — agent writes the change atomically, bumps version, appends changelog
 *
 * Workspace convention (per voxera-command/CLAUDE.md):
 *   - Every doc has frontmatter: title, version, status, updated, owner
 *   - Every doc ends with a "## Changelog" section
 *   - "Substantive" edits bump version + add a changelog line
 *   - Real architectural choices also open an ADR via decisions/_template.md
 *
 * @param {Object} inputs
 * @param {string} inputs.docPath - Absolute or workspace-relative path to the doc.
 * @param {string} inputs.change  - Human-language description of the change.
 * @param {boolean} [inputs.dryRun] - If true, stop after the review breakpoint.
 * @param {Object} ctx - Process context.
 */
export async function process(inputs, ctx) {
  const { docPath, change, dryRun = false } = inputs;

  if (!docPath || !change) {
    throw new Error('iterate-doc requires { docPath, change }');
  }

  // PHASE 1 — plan
  const plan = await ctx.task(planChangeTask, { docPath, change });

  // PHASE 2 — review
  await ctx.breakpoint({
    title: 'Review proposed change',
    question: [
      `**Doc**: ${docPath}`,
      `**Change requested**: ${change}`,
      '',
      `**Current version**: ${plan.currentVersion}  →  **new version**: ${plan.newVersion}`,
      `**Changelog entry**: ${plan.changelogEntry}`,
      '',
      '**Diff summary**:',
      plan.diffSummary,
      '',
      'Approve to apply, or provide corrections.',
    ].join('\n'),
    context: {
      runId: ctx.runId,
      files: [{ path: plan.previewPath, format: 'markdown', label: 'Proposed full doc' }],
    },
  });

  if (dryRun) {
    return {
      success: true,
      docPath,
      newVersion: plan.newVersion,
      changelogEntry: plan.changelogEntry,
      applied: false,
      reason: 'dry-run',
    };
  }

  // PHASE 3 — apply
  const applied = await ctx.task(applyChangeTask, {
    docPath,
    previewPath: plan.previewPath,
    newVersion: plan.newVersion,
    changelogEntry: plan.changelogEntry,
  });

  return {
    success: applied.success,
    docPath,
    newVersion: plan.newVersion,
    changelogEntry: plan.changelogEntry,
    applied: true,
    metadata: { processId: 'voxera/iterate-doc', timestamp: ctx.now() },
  };
}

export const planChangeTask = defineTask('plan-doc-change', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan doc change',
  description: 'Read the doc, draft the diff, propose frontmatter bump + changelog line.',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'documentation specialist familiar with voxera-command conventions',
      task: 'Plan a change to a versioned voxera-command doc. Do not write yet.',
      context: { docPath: args.docPath, change: args.change },
      instructions: [
        'Read the doc at docPath in full.',
        'Parse its frontmatter (title, version, status, updated, owner).',
        'Draft the change implied by `change`. Keep edits scoped — do not touch unrelated sections.',
        'If the change is substantive, plan a version bump (currentVersion + 1) and a one-line changelog entry dated today.',
        'If the change is purely cosmetic (typo, link fix), do NOT bump version; note "no bump" in the entry.',
        'If brand-guidelines.md is the doc, check writing rules (forbidden words, italic limits, CTA conventions) before proposing copy.',
        'If the change is an architectural decision rather than a doc edit, suggest opening an ADR instead and stop.',
        `Write the full proposed doc (including updated frontmatter + appended changelog line) to "artifacts/${taskCtx.effectId}-preview.md".`,
        'Produce a short diffSummary (≤10 lines) describing what changed.',
      ],
      outputFormat: 'JSON with currentVersion, newVersion, changelogEntry, diffSummary (multi-line string), previewPath (relative to runDir).',
    },
    outputSchema: {
      type: 'object',
      required: ['currentVersion', 'newVersion', 'changelogEntry', 'diffSummary', 'previewPath'],
      properties: {
        currentVersion: { type: 'number' },
        newVersion: { type: 'number' },
        changelogEntry: { type: 'string' },
        diffSummary: { type: 'string' },
        previewPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'doc', 'plan'],
}));

export const applyChangeTask = defineTask('apply-doc-change', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply doc change',
  description: 'Atomically replace the doc with the approved preview.',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'documentation editor',
      task: 'Write the approved preview to the target doc path.',
      context: args,
      instructions: [
        'Read the preview file at previewPath.',
        'Write its contents verbatim to docPath. This replaces the existing doc.',
        'Do not modify the preview further — the user approved it as-is.',
        'After writing, re-read docPath to verify the write succeeded; check that the frontmatter version matches newVersion and the changelog ends with changelogEntry.',
        'If verification fails, report the mismatch and do not retry blindly.',
      ],
      outputFormat: 'JSON with success (boolean), bytesWritten (number), verified (boolean), notes (string).',
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'verified'],
      properties: {
        success: { type: 'boolean' },
        bytesWritten: { type: 'number' },
        verified: { type: 'boolean' },
        notes: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'doc', 'apply'],
}));
