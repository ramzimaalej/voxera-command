/**
 * @process voxera/revenue-pulse
 * @description Between-weekly survival heartbeat: read the revenue model + customer pulse, assess runway and the binding constraint (the deal/lever solvency depends on), fire a breakpoint ONLY when critical, and append a dated pulse-log entry so the survival signal can't go dark.
 * @inputs { asOf?: string, runwayAlertWeeks?: number }
 * @outputs { success, status, runwayWeeks, bindingConstraint, topAction, logPath }
 * @skill customer-pulse-update .claude/skills/customer-pulse-update/SKILL.md
 * @agent general-purpose
 *
 * Why this exists:
 *   The weekly-business-review is the full Friday cadence. revenue-pulse is the lighter,
 *   run-it-any-day financial heartbeat — the one signal that must never go dark when runway
 *   is short (per docs/operations/revenue-model.md). It is read-mostly: it assesses, flags
 *   only when critical (minimal-breakpoints), and appends to a pulse log for trend visibility.
 *
 * Phases:
 *   1. assess        — read revenue-model.md + customer pulse; compute runway, the binding
 *                      constraint status, and the single top action. Read-only.
 *   2. alert         — conditional breakpoint: fires ONLY when status is 'red'
 *                      (runway <= alert threshold OR the binding deal is overdue). Silent otherwise.
 *   3. log           — append a dated entry to docs/operations/revenue-pulse-log.md.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const asOf = inputs.asOf || todayISO();
  const runwayAlertWeeks = typeof inputs.runwayAlertWeeks === 'number' ? inputs.runwayAlertWeeks : 4;

  // PHASE 1 — assess financial health (read-only)
  const pulse = await ctx.task(assessFinancialsTask, { asOf, runwayAlertWeeks });

  // PHASE 2 — conditional alert breakpoint
  // Fires ONLY when the situation is critical. A healthy week is silent (minimal-breakpoints).
  if (pulse.status === 'red') {
    await ctx.breakpoint({
      title: `Revenue pulse — RED (${pulse.runwayWeeks ?? '?'} weeks runway)`,
      question: [
        `**As of**: ${asOf}`,
        `**Status**: 🔴 RED`,
        `**Runway**: ${pulse.runwayWeeks ?? 'unknown'} weeks  (alert threshold: ${runwayAlertWeeks})`,
        `**Monthly net**: ${pulse.monthlyNet ?? 'unknown'}`,
        ``,
        `**Binding constraint**: ${pulse.bindingConstraint}`,
        `**Its status**: ${pulse.bindingConstraintStatus}`,
        ``,
        ...(pulse.redReasons || []).map(r => `- ${r}`),
        ``,
        `**The one action that moves survival**: ${pulse.topAction}`,
        ``,
        `Approve to log this pulse and continue (you own the action), or reject to act on it now before logging.`,
      ].join('\n'),
      context: {
        runId: ctx.runId,
        files: [
          { path: 'docs/operations/revenue-model.md', format: 'markdown', label: 'Revenue model (source)' },
        ],
      },
    });
  }

  // PHASE 3 — append the dated pulse entry to the log
  const logged = await ctx.task(appendPulseLogTask, { asOf, pulse, runwayAlertWeeks });

  return {
    success: true,
    status: pulse.status,
    runwayWeeks: pulse.runwayWeeks ?? null,
    bindingConstraint: pulse.bindingConstraint,
    topAction: pulse.topAction,
    logPath: logged.logPath,
    metadata: { processId: 'voxera/revenue-pulse', timestamp: ctx.now() },
  };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const assessFinancialsTask = defineTask('assess-financials', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess runway + the binding constraint',
  description: 'Read the revenue model and customer pulse, compute current runway and the status of the deal/lever solvency depends on, and name the single highest-leverage action.',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CFO-minded chief of staff doing a fast survival check',
      task: 'Assess the company\'s current financial health from local files only and classify it green / amber / red.',
      context: { asOf: args.asOf, runwayAlertWeeks: args.runwayAlertWeeks },
      instructions: [
        'Read docs/operations/revenue-model.md in full. It is the financial monitor — pay attention to the "Inputs", "P&L", "Cash & runway", "Levers (ranked by value)", and "Survival actions" sections.',
        'Read docs/operations/customers/*.md (the per-customer pulse files) — capture each customer\'s health/status and any signal that affects revenue (a key deal unsigned/overdue, a churn risk, an expansion).',
        'Extract: runwayWeeks (number of weeks of runway, from the Cash & runway section — null if not stated); monthlyNet (the monthly profit or deficit, e.g. "-€5.4k/mo"); the BINDING CONSTRAINT = the single thing the model says solvency depends on (often the top lever or a specific deal/signature) + its current status (signed? overdue? by how long?).',
        'Classify status: "red" if runwayWeeks is a number <= runwayAlertWeeks, OR the binding constraint is an unresolved deal that is past its expected close date. "amber" if runwayWeeks is between runwayAlertWeeks and ~2x it, OR a customer health has declined without a closed action. "green" otherwise.',
        'Name topAction: the single highest-leverage action for survival right now (usually straight from the model\'s "Levers" or "Survival actions"). One sentence, concrete (e.g. "Get Customer XY to sign — converts the business from -€5.4k/mo to +€1.7k/mo").',
        'List redReasons: short bullet strings explaining a red classification (empty if not red).',
        'Do NOT modify any files. This task is strictly read-only.',
      ],
      outputFormat: 'JSON with status ("green"|"amber"|"red"), runwayWeeks (number|null), monthlyNet (string|null), bindingConstraint (string), bindingConstraintStatus (string), topAction (string), redReasons (array of strings), customerSignals (array of strings).',
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'bindingConstraint', 'bindingConstraintStatus', 'topAction'],
      properties: {
        status: { type: 'string', enum: ['green', 'amber', 'red'] },
        runwayWeeks: { type: ['number', 'null'] },
        monthlyNet: { type: ['string', 'null'] },
        bindingConstraint: { type: 'string' },
        bindingConstraintStatus: { type: 'string' },
        topAction: { type: 'string' },
        redReasons: { type: 'array', items: { type: 'string' } },
        customerSignals: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'assess'],
}));

export const appendPulseLogTask = defineTask('append-pulse-log', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Append the dated pulse entry to the log',
  description: 'Append a one-row dated entry capturing this pulse to docs/operations/revenue-pulse-log.md (creating the file with a header if it does not exist).',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ops scribe keeping the survival signal visible over time',
      task: 'Append this revenue pulse to the running log so trend is visible at a glance.',
      context: { asOf: args.asOf, pulse: args.pulse, runwayAlertWeeks: args.runwayAlertWeeks },
      instructions: [
        'Target file: docs/operations/revenue-pulse-log.md.',
        'If it does NOT exist, create it with frontmatter (title: "Revenue Pulse Log", version: 1, status: active, updated: <asOf>, owner: you), a one-line description, and a markdown table header: | Date | Status | Runway (wks) | Monthly net | Binding constraint status | Top action |',
        'Append ONE row for this pulse using the values in context.pulse (status as 🟢/🟡/🔴 + word). Keep newest rows at the BOTTOM (chronological) so the trend reads top-to-bottom.',
        'Update the frontmatter `updated` field to <asOf>. Do not bump version for a routine append.',
        'Keep the entry terse — this is a scannable log, not prose. Do not edit revenue-model.md or any other file.',
      ],
      outputFormat: 'JSON with logPath (string) and created (boolean — true if the file was newly created).',
    },
    outputSchema: {
      type: 'object',
      required: ['logPath'],
      properties: {
        logPath: { type: 'string' },
        created: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'log'],
}));
