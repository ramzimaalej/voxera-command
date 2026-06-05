/**
 * @process voxera/weekly-business-review
 * @description CEO weekly rhythm: gather state → per-customer pulse → coach pushback (accountability + priorities recommendations) → conditional reflection breakpoint → draft note → review → set priorities → archive.
 * @inputs { weekEnding?: string, skipCustomerCheck?: boolean, skipCoachPushback?: boolean }
 * @outputs { success, weeklyNotePath, customersReviewed, pushbackSurfaced, priorities }
 * @skill capture-decision .claude/skills/capture-decision/SKILL.md
 * @skill customer-pulse-update .claude/skills/customer-pulse-update/SKILL.md
 * @skill priorities-coach .claude/skills/priorities-coach/SKILL.md
 * @skill accountability-check .claude/skills/accountability-check/SKILL.md
 * @agent general-purpose
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Weekly business review for a bootstrapped CEO running two motions.
 *
 * Invoke on Friday (or end-of-week):
 *   /babysitter:call --process .a5c/processes/weekly-business-review.js#process \
 *     --inputs '{"weekEnding": "2026-05-31"}'
 *
 * Phases:
 *   1. gather-state         — pull the inputs the CEO needs to think (metrics, pulse files, recent ADRs, last week's commitments)
 *   2. customer-pulse       — loop over customers; CEO updates each pulse via breakpoint + skill
 *   3. coach-pushback       — agent runs accountability-check + priorities-coach skills; surfaces slippage, drift, recommendations
 *   3a. acknowledge-pushback — conditional breakpoint (fires ONLY if pushback found chronic slippers / red customers / past-due commitments)
 *   4. draft-note           — agent drafts the weekly note, informed by gathered state + pulse updates + pushback findings
 *   5. review-note          — CEO breakpoint: approve / refine
 *   6. set-priorities       — CEO sets next-week's top 3 (pushback's recommendations + one-thing question surfaced here)
 *   7. archive              — write to docs/operations/weekly-reviews/<date>.md, update the index
 *
 * State that's gathered (where possible) without external integrations:
 *   - Last week's weekly note (if any) — what was committed; check against what happened
 *   - Active ADRs (decisions) from the past week (read decisions/ list)
 *   - Current customer pulse docs (docs/operations/customers/*.md)
 *   - Active FEATs (in implementing or plan_approved status)
 *   - Open BUGs by severity
 *
 * Metrics input (MRR by motion, trials, CAC, etc.) is asked from the CEO
 * directly until integrations (Stripe, GA4, lead-vendor APIs) are wired up.
 */
export async function process(inputs, ctx) {
  const { weekEnding = todayISO(), skipCustomerCheck = false } = inputs;

  // PHASE 1 — gather state
  const state = await ctx.task(gatherStateTask, { weekEnding });

  // PHASE 2 — per-customer pulse loop (skippable if recently done)
  let customersReviewed = [];
  if (!skipCustomerCheck && state.customers.length > 0) {
    for (const customerFile of state.customers) {
      await ctx.breakpoint({
        title: `Customer pulse: ${customerFile.name}`,
        question: [
          `**Customer**: ${customerFile.name}`,
          `**Last update**: ${customerFile.lastUpdated || 'never'}`,
          `**Current health**: ${customerFile.health || 'unknown'}`,
          ``,
          `Pulse file: \`${customerFile.path}\``,
          ``,
          `Approve to update this pulse via the customer-pulse-update skill, or reject to skip this customer this week.`,
        ].join('\n'),
      });
      const update = await ctx.task(updateCustomerPulseTask, {
        customerFile: customerFile.path,
        weekEnding,
      });
      customersReviewed.push({
        name: customerFile.name,
        newHealth: update.newHealth,
        actionItems: update.actionItems,
      });
    }
  }

  // PHASE 3 — coach pushback (accountability-check + priorities-coach, synthesized)
  const pushback = await ctx.task(coachPushbackTask, {
    weekEnding,
    state,
    customersReviewed,
    skip: inputs.skipCoachPushback === true,
  });

  // PHASE 3a — conditional acknowledgment breakpoint
  // Fires only if pushback surfaced something that needs explicit decision.
  // For a clean week, this is silent — no breakpoint bloat per the user's minimal-breakpoints preference.
  const needsAcknowledgment =
    pushback.chronicSlippers.length > 0 ||
    pushback.pastDueCommitmentsToOthers.length > 0 ||
    pushback.redCustomerActions.length > 0;

  if (needsAcknowledgment) {
    await ctx.breakpoint({
      title: 'Coach pushback — needs acknowledgment',
      question: [
        `The coach surfaced ${pushback.chronicSlippers.length} chronic slipper(s), ${pushback.pastDueCommitmentsToOthers.length} past-due commitment(s) to others, and ${pushback.redCustomerActions.length} red-customer action(s) that haven't been addressed.`,
        ``,
        `**Chronic slippers** (3+ weeks without completion):`,
        ...pushback.chronicSlippers.slice(0, 5).map(s => `- "${s.commitment}" — ${s.weeksMoved} weeks. ${s.pointedQuestion}`),
        ``,
        `**Past-due commitments to others**:`,
        ...pushback.pastDueCommitmentsToOthers.slice(0, 5).map(c => `- ${c.person}: "${c.commitment}" (due ${c.dueDate})`),
        ``,
        `**Red customers without closed action items**:`,
        ...pushback.redCustomerActions.slice(0, 5).map(c => `- ${c.customer}: ${c.signal}`),
        ``,
        `For each item: decide kill / downgrade / commit. Approve to proceed (you'll address them in next-week priorities), or reject to think more before continuing.`,
      ].join('\n'),
      context: {
        runId: ctx.runId,
        files: [{ path: pushback.reportPath, format: 'markdown', label: 'Full coach pushback report' }],
      },
    });
  }

  // PHASE 4 — draft weekly note (now informed by pushback)
  const draft = await ctx.task(draftWeeklyNoteTask, {
    weekEnding,
    state,
    customersReviewed,
    pushback,
  });

  // PHASE 5 — review + refine
  await ctx.breakpoint({
    title: 'Review weekly note',
    question: [
      `**Week ending**: ${weekEnding}`,
      ``,
      `**Highlights**: ${draft.highlights.join('; ')}`,
      `**Surprises**: ${draft.surprises.join('; ') || 'none'}`,
      `**Blockers**: ${draft.blockers.join('; ') || 'none'}`,
      ``,
      `Draft note: \`${draft.draftPath}\``,
      ``,
      `Approve to finalize and set next-week priorities, or reject to refine.`,
    ].join('\n'),
    context: {
      runId: ctx.runId,
      files: [{ path: draft.draftPath, format: 'markdown', label: 'Draft weekly note' }],
    },
  });

  // PHASE 6 — next-week priorities (informed by pushback)
  await ctx.breakpoint({
    title: 'Set next-week priorities',
    question: [
      `What are the top 3 priorities for next week?`,
      ``,
      `**Coach's one-thing recommendation**: ${pushback.oneThing || '(no recommendation — coach was silent this week)'}`,
      ``,
      pushback.recommendedTop3.length > 0
        ? [
            `**Coach's recommended top-3** (you can take, modify, or override):`,
            ...pushback.recommendedTop3.map((p, i) => `${i + 1}. ${p}`),
            ``,
          ].join('\n')
        : ``,
      pushback.pointedQuestions.length > 0
        ? [
            `**Pointed questions to sit with**:`,
            ...pushback.pointedQuestions.map(q => `- ${q}`),
            ``,
          ].join('\n')
        : ``,
      `Reply with your actual priorities. Common shapes:`,
      `- One per motion + one platform/operational item`,
      `- All three on the bottleneck if there's a clear one`,
      `- Be specific (not "improve sales" — "close customer #4")`,
      ``,
      `Approval here records the priorities; rejection lets you re-think.`,
    ].filter(Boolean).join('\n'),
  });

  // PHASE 7 — archive
  const archived = await ctx.task(archiveWeeklyNoteTask, {
    weekEnding,
    draftPath: draft.draftPath,
  });

  return {
    success: true,
    weeklyNotePath: archived.finalPath,
    customersReviewed: customersReviewed.length,
    pushbackSurfaced: needsAcknowledgment,
    metadata: { processId: 'voxera/weekly-business-review', timestamp: ctx.now() },
  };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const gatherStateTask = defineTask('gather-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather state for the weekly review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CEO chief of staff pulling together the week\'s state',
      task: 'Gather everything the CEO needs to think about this week, from local files only (no external integrations yet).',
      context: { weekEnding: args.weekEnding },
      instructions: [
        'List docs/operations/customers/*.md — these are the per-customer pulse docs. For each, read the frontmatter to capture name, lastUpdated, health.',
        'Read the most recent weekly note in docs/operations/weekly-reviews/ (filename pattern: YYYY-MM-DD.md). Extract its "Next-week priorities" section — these are last week\'s commitments to check against.',
        'List decisions/ADR-*.md created or updated in the past 7 days (check frontmatter `date` field). These are the strategic decisions the CEO made or accepted recently.',
        'List docs/product/features/FEAT-*.md with status in {refining, plan_approved, implementing}. These are FEATs in motion.',
        'List docs/product/bugs/BUG-*.md with status in {reported, reproducing, fixing} and severity high or critical. These are the bugs that need CEO attention.',
        'Do NOT pull metrics (MRR, CAC, trials) — those come from the CEO in the breakpoints. Integrations are a future enhancement.',
        'Do NOT modify any files. This task is read-only.',
      ],
      outputFormat: 'JSON with customers (array of {name, path, lastUpdated, health}), lastWeekCommitments (array of strings), recentDecisions (array of {id, title}), activeFeats (array of {id, title, status}), criticalBugs (array of {id, title, status}).',
    },
    outputSchema: {
      type: 'object',
      required: ['customers'],
      properties: {
        customers: { type: 'array' },
        lastWeekCommitments: { type: 'array' },
        recentDecisions: { type: 'array' },
        activeFeats: { type: 'array' },
        criticalBugs: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'weekly-review', 'gather'],
}));

export const updateCustomerPulseTask = defineTask('update-customer-pulse', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update a customer pulse file',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CEO chief of staff capturing this week\'s customer signals',
      task: 'Update the customer pulse file with anything that changed this week.',
      context: args,
      instructions: [
        `Read the pulse file at ${args.customerFile}.`,
        'Follow the customer-pulse-update skill workflow (.claude/skills/customer-pulse-update/SKILL.md).',
        `Add a dated entry to the "## Pulse log" section dated ${args.weekEnding}. Capture: usage signals, support touch-points, expansion or churn risk, any action items.`,
        'Update the frontmatter `health` field if it changed (green / yellow / red). Update `updated` to the week ending date. Bump `version`.',
        'If the user has no new info this week, log "no significant change this week" and keep health the same.',
        'Do NOT invent signals. If you don\'t have information, say so.',
      ],
      outputFormat: 'JSON with newHealth (green|yellow|red), actionItems (array of strings), notesAdded (string), versionBumped (boolean).',
    },
    outputSchema: {
      type: 'object',
      required: ['newHealth'],
      properties: {
        newHealth: { type: 'string', enum: ['green', 'yellow', 'red', 'unknown'] },
        actionItems: { type: 'array', items: { type: 'string' } },
        notesAdded: { type: 'string' },
        versionBumped: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'weekly-review', 'customer'],
}));

export const coachPushbackTask = defineTask('coach-pushback', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coach pushback — accountability + priorities recommendations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CEO coach: direct, evidence-based, not agreeable. Surfaces what\'s slipping (backward) and what should be prioritized (forward).',
      task: 'Run the accountability-check workflow on past weeks, then run the priorities-coach workflow for the upcoming week, then synthesize.',
      context: args,
      instructions: [
        'If args.skip === true, output an empty pushback (all arrays empty, oneThing=null, summary="coach pushback skipped per inputs"). Stop.',
        '',
        'Otherwise, follow this sequence:',
        '',
        '1. **Accountability check** — follow the .claude/skills/accountability-check/SKILL.md workflow:',
        '   - Read the past 4 weekly notes in docs/operations/weekly-reviews/ (sorted by filename date desc).',
        '   - Extract every "Next-week priorities (top 3)" item; cross-reference with subsequent weeks for completion vs carry-over.',
        '   - Flag chronic slippers (3+ weeks without completion).',
        '   - Flag silently-dropped commitments (mentioned once, never again, no completion record).',
        '   - Extract every "Commitments to others" item with a due date; flag any past-due + not-closed.',
        '   - Scan customer pulse files (use args.state.customers); flag any with health yellow|red + unaddressed action items, OR no update in > 4 weeks.',
        '   - Identify strategic drift: did shipped work map to roadmap Now? Were major motions untouched?',
        '',
        '2. **Priorities recommendation** — follow the .claude/skills/priorities-coach/SKILL.md workflow:',
        '   - Read strategy.md, vertical-strategy-english-markets.md, roadmap.md (Now column), user profile (~/.a5c/user-profile.json).',
        '   - Combine with args.state (active FEATs, critical bugs, recent ADRs) and args.customersReviewed (fresh pulse).',
        '   - Rank candidates: must-do > motion-aligned > operational maintenance > opportunistic.',
        '   - Apply the one-thing test: if the CEO could do ONE thing this week, what is it?',
        '   - Produce recommendedTop3 with explicit reasoning.',
        '',
        '3. **Synthesize a pushback report** at `artifacts/' + taskCtx.effectId + '-pushback.md` containing both the accountability-check output and the priorities-coach output. Use the section structure from both skill files. This file is what the user sees at the conditional breakpoint.',
        '',
        '4. **Tone**: direct, evidence-based, no flattery. Examples of correct voice:',
        '   - "\'Close customer #4\' has been top-3 for 4 weeks. Kill, downgrade, or commit?"',
        '   - "ADR-0009 says English-markets is your major motion. 0 of last 4 weeks had an English-markets top-3 item. Defend or revise."',
        '   - "Customer-3 went yellow 3 weeks ago. No action item closed since. The longer you wait, the more this looks like avoidance."',
        '   Do not write "great work this week" or "consider also...". Be concrete.',
        '',
        '5. **Silence when clean**: if no chronic slippers, no past-due commitments, no red-customer signals unaddressed, and no strategic drift: say so plainly. Don\'t pad. oneThing recommendation can still be produced.',
        '',
        '6. **Pointed questions**: produce 1-3 questions the CEO should sit with before setting priorities. Pick the ones that sting most — questions they\'ve been avoiding.',
      ],
      outputFormat: 'JSON: { reportPath: string, summary: string, chronicSlippers: array of {commitment, weeksMoved, firstSeen, pointedQuestion}, droppedCommitments: array of {commitment, week}, pastDueCommitmentsToOthers: array of {person, commitment, dueDate}, redCustomerActions: array of {customer, signal, recommendation}, strategicDrift: array of strings, recommendedTop3: array of strings, oneThing: string|null, pointedQuestions: array of strings }.',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'chronicSlippers', 'pastDueCommitmentsToOthers', 'redCustomerActions', 'recommendedTop3', 'pointedQuestions'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
        chronicSlippers: { type: 'array' },
        droppedCommitments: { type: 'array' },
        pastDueCommitmentsToOthers: { type: 'array' },
        redCustomerActions: { type: 'array' },
        strategicDrift: { type: 'array' },
        recommendedTop3: { type: 'array', items: { type: 'string' } },
        oneThing: { type: ['string', 'null'] },
        pointedQuestions: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'weekly-review', 'coach-pushback'],
}));

export const draftWeeklyNoteTask = defineTask('draft-weekly-note', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft the weekly business review note',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CEO chief of staff drafting a weekly business review',
      task: 'Draft a concise weekly note from the gathered state, per-customer updates, and the coach pushback.',
      context: args,
      instructions: [
        'Use the template at docs/operations/templates/weekly-review-template.md as the structural starting point.',
        'Sections to fill in: (a) Last week\'s commitments + how each landed (use args.pushback.chronicSlippers + args.pushback.droppedCommitments to be accurate; do NOT mark slippers as "done"), (b) Highlights (good news, wins — max 3, no padding), (c) Surprises (anything unexpected; "no surprises" is a valid entry), (d) Blockers (things stuck on a person, decision, or dependency), (e) Customer pulse summary (one line per customer with health + key signal), (f) Active FEATs (titles + status), (g) Critical bugs (titles + status), (h) Decisions made this week (ADRs, by id + title).',
        'If args.pushback.strategicDrift is non-empty, surface the observations under Blockers or in a small "## Strategic drift noted" subsection. Do NOT bury them.',
        'Be terse. The note should fit on one screen. One bullet per item, not a paragraph.',
        'Do NOT invent metrics. If MRR / CAC / trial counts aren\'t in the gathered state, leave those slots as "[CEO to fill]".',
        'Do NOT pad with platitudes. If nothing surprising happened, write "no surprises".',
        'Match Voxera brand voice (per ../brand/brand-guidelines.md): plain-spoken, confident not loud, anti-hype, specific. No "synergies", "leveraged", "best-in-class".',
        `Write the draft to "artifacts/${taskCtx.effectId}-weekly-${args.weekEnding}.md".`,
      ],
      outputFormat: 'JSON with draftPath (string), highlights (array of strings, ≤3), surprises (array of strings, may be empty), blockers (array of strings, may be empty).',
    },
    outputSchema: {
      type: 'object',
      required: ['draftPath', 'highlights'],
      properties: {
        draftPath: { type: 'string' },
        highlights: { type: 'array', items: { type: 'string' } },
        surprises: { type: 'array', items: { type: 'string' } },
        blockers: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'weekly-review', 'draft'],
}));

export const archiveWeeklyNoteTask = defineTask('archive-weekly-note', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Archive the approved weekly note',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'doc editor',
      task: 'Move the approved draft to its final location in docs/operations/weekly-reviews/.',
      context: args,
      instructions: [
        `Read the approved draft at ${args.draftPath}.`,
        `Write its contents to docs/operations/weekly-reviews/${args.weekEnding}.md.`,
        'If a file at that path exists, do NOT overwrite — append a suffix (-2, -3, ...) and warn in the output.',
        'Update docs/operations/weekly-reviews/README.md to add an entry at the top of the index linking to the new note.',
      ],
      outputFormat: 'JSON with finalPath (string), indexUpdated (boolean), warnings (array of strings, may be empty).',
    },
    outputSchema: {
      type: 'object',
      required: ['finalPath'],
      properties: {
        finalPath: { type: 'string' },
        indexUpdated: { type: 'boolean' },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'weekly-review', 'archive'],
}));
