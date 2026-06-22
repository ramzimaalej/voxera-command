/**
 * @process voxera/product-refactor-roadmap
 * @description Craft a full product roadmap to evolve the current voxera-crm into the full-fledged
 *   product shown by the demo prototype. Brownfield, gap-analysis-first: synthesize a target-product
 *   capability inventory (vision + strategy + demo), map the current CRM, compute a categorized gap
 *   backlog, RICE-score it, sequence it as Shape-Up appetite bets aligned to the strategy milestones
 *   (honoring the existing engineering-os restructuring-roadmap), then write a gap-analysis dossier +
 *   rewrite docs/product/roadmap.md + capture the load-bearing build-order decisions as ADRs.
 * @inputs { demoPath?: string, crmRepoPath?: string, roadmapPath?: string, gapDossierPath?: string, visionPath?: string, strategyPath?: string, dryRun?: boolean }
 * @outputs { success: boolean, roadmapPath: string, newRoadmapVersion?: number, gapDossierPath: string, gapCount?: number, betCount?: number, adrsCreated: string[] }
 * @skill extract-adr ../../.claude/skills/extract-adr/SKILL.md
 * @skill brand-conformance ../../../voxera-os/.claude/skills/brand-conformance/SKILL.md
 * @skill priorities-coach ../../.claude/skills/priorities-coach/SKILL.md
 * @agent general-purpose
 *
 * Composition (libraries this process draws on, adapted to the voxera-command doc conventions):
 *   - software-architecture/migration-strategy  → current-state → target-state → gap-analysis spine (brownfield)
 *   - product-management/quarterly-roadmap       → RICE prioritization + roadmap-document generation
 *   - product-management/rice-prioritization     → scoring model
 *   - methodologies/shape-up                     → appetite-framed bets (no dates; fixed appetite, variable scope)
 *   - voxera-command/iterate-vision              → doc frontmatter/changelog bump + ADR capture conventions
 *
 * Path note: runs with CWD = voxera-command repo root. This is a BUSINESS process (exec-run): it may
 * read the confidential vision/strategy here and read DOWN into ../voxera-crm (engineering, non-confidential).
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    demoPath = '/Users/ramzi/Downloads/voxera-demo/my-app',
    crmRepoPath = '../voxera-crm',
    roadmapPath = 'docs/product/roadmap.md',
    gapDossierPath = 'docs/product/gap-analysis-crm-to-product.md',
    visionPath = 'docs/vision/vision.md',
    strategyPath = 'docs/strategy/strategy.md',
    dryRun = false,
  } = inputs;

  const startTime = ctx.now();
  ctx.log('info', 'Starting CRM → full-product roadmap (gap-analysis-first, brownfield, Shape-Up bets).');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 1 — Target product definition (vision + strategy + demo → capability inventory)
  // ──────────────────────────────────────────────────────────────────────────
  const target = await ctx.task(defineTargetProductTask, {
    demoPath, visionPath, strategyPath,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 2 — Current-state capability map (the live CRM + its engineering-os)
  // ──────────────────────────────────────────────────────────────────────────
  const current = await ctx.task(mapCurrentStateTask, {
    crmRepoPath, targetSummaryPath: target.summaryPath,
  });

  // GATE: frame agreed before gap analysis (target completeness + current coverage)
  await ctx.breakpoint({
    title: 'Approve target ↔ current framing',
    question: [
      `**Target product** — ${target.capabilityCount} capabilities across ${target.themeCount} themes (from vision + strategy + demo).`,
      `**Current CRM** — ${current.capabilityCount} capabilities mapped; AI-agent layer present: **${current.aiLayerPresent ? 'yes' : 'no'}**.`,
      `Existing engineering-os phases reconciled: ${current.existingPhaseCount}; tracked tech-debt items: ${current.techDebtCount}.`,
      ``,
      'Approve this framing to run the gap analysis, or reject with corrections (missing capabilities, mis-mapped current state).',
    ].join('\n'),
    context: {
      runId: ctx.runId,
      files: [
        { path: target.summaryPath, format: 'markdown', label: 'Target product capability inventory' },
        { path: current.summaryPath, format: 'markdown', label: 'Current CRM capability map' },
      ],
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 3 — Gap analysis (target − current = categorized, sized, risk-tagged backlog)
  // ──────────────────────────────────────────────────────────────────────────
  let gap = await ctx.task(gapAnalysisTask, {
    targetSummaryPath: target.summaryPath,
    currentSummaryPath: current.summaryPath,
  });

  // PHASE 3b — completeness/strategy-fit review + refine loop (close the widest loop: cover the WHOLE demo, invent nothing)
  let gapReview = await ctx.task(gapReviewTask, {
    gapPath: gap.gapPath, targetSummaryPath: target.summaryPath, currentSummaryPath: current.summaryPath,
  });
  let gapRefines = 0;
  while (gapReview.score < 85 && gapRefines < 2) {
    const refined = await ctx.task(gapRefineTask, { gapPath: gap.gapPath, issues: gapReview.issues });
    gap = { ...gap, gapPath: refined.gapPath || gap.gapPath };
    gapReview = await ctx.task(gapReviewTask, {
      gapPath: gap.gapPath, targetSummaryPath: target.summaryPath, currentSummaryPath: current.summaryPath,
    });
    gapRefines++;
  }

  // GATE: approve the gap backlog
  await ctx.breakpoint({
    title: 'Approve gap backlog',
    question: [
      `**${gap.gapCount} gaps** across categories: ${gap.categories.join(', ')}.`,
      `Completeness + strategy-fit score: **${gapReview.score}/100**${gapReview.issues.length ? ` (notes: ${gapReview.issues.slice(0, 3).join('; ')})` : ''}.`,
      `Critical gaps: ${gap.criticalCount}.`,
      ``,
      'Approve to prioritize, or reject with direction.',
    ].join('\n'),
    context: {
      runId: ctx.runId,
      files: [{ path: gap.gapPath, format: 'markdown', label: 'Gap backlog' }],
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 4 — RICE prioritization (against the two motions + bootstrapped discipline + moat)
  // ──────────────────────────────────────────────────────────────────────────
  const rice = await ctx.task(ricePrioritizationTask, {
    gapPath: gap.gapPath, strategyPath, visionPath,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 5 — Shape-Up sequencing (RICE rank → appetite bets, honoring existing phases)
  // ──────────────────────────────────────────────────────────────────────────
  const bets = await ctx.task(shapeUpSequencingTask, {
    ricePath: rice.ricePath,
    currentSummaryPath: current.summaryPath,
    strategyPath,
  });

  // GATE: the core architecture-sequencing decision (alwaysBreakOn: architecture choices)
  await ctx.breakpoint({
    title: 'Approve bet sequencing (betting table)',
    question: [
      `**${bets.betCount} bets** sequenced as appetites across horizons (Now / Next / Later ↔ 12/24/36-mo milestones).`,
      `Now: ${bets.nowCount} · Next: ${bets.nextCount} · Later: ${bets.laterCount}.`,
      `Reconciled with existing engineering-os restructuring-roadmap phases: ${bets.reconciledPhaseNote}.`,
      ``,
      'This is the load-bearing sequencing decision. Approve to draft the docs, or reject with re-sequencing direction.',
    ].join('\n'),
    context: {
      runId: ctx.runId,
      files: [
        { path: rice.ricePath, format: 'markdown', label: 'RICE-scored backlog' },
        { path: bets.betsPath, format: 'markdown', label: 'Appetite bets + betting table' },
      ],
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 6 — Draft the two deliverables (gap dossier + rewritten roadmap)
  // ──────────────────────────────────────────────────────────────────────────
  const gapDraft = await ctx.task(draftGapDossierTask, {
    gapDossierPath,
    targetSummaryPath: target.summaryPath,
    currentSummaryPath: current.summaryPath,
    gapPath: gap.gapPath,
    ricePath: rice.ricePath,
    betsPath: bets.betsPath,
  });

  const roadmapDraft = await ctx.task(draftRoadmapTask, {
    roadmapPath,
    betsPath: bets.betsPath,
    strategyPath,
    gapDossierPath,
  });

  // PHASE 6b — consistency + brand-voice + feasibility review + refine loop
  let docsReview = await ctx.task(docsReviewTask, {
    roadmapDraftPath: roadmapDraft.draftPath,
    gapDraftPath: gapDraft.draftPath,
    visionPath, strategyPath,
    currentSummaryPath: current.summaryPath,
  });
  let docRefines = 0;
  while (docsReview.score < 85 && docRefines < 2) {
    await ctx.task(docsRefineTask, {
      roadmapDraftPath: roadmapDraft.draftPath,
      gapDraftPath: gapDraft.draftPath,
      issues: docsReview.issues,
    });
    docsReview = await ctx.task(docsReviewTask, {
      roadmapDraftPath: roadmapDraft.draftPath,
      gapDraftPath: gapDraft.draftPath,
      visionPath, strategyPath,
      currentSummaryPath: current.summaryPath,
    });
    docRefines++;
  }

  // GATE: final approval to write the canonical docs
  await ctx.breakpoint({
    title: 'Approve & apply roadmap + gap dossier',
    question: [
      `Drafts ready. Consistency + brand + feasibility score: **${docsReview.score}/100**${docsReview.issues.length ? ` (notes: ${docsReview.issues.slice(0, 3).join('; ')})` : ''}.`,
      `Will write: \`${roadmapPath}\` (version bump + changelog) and \`${gapDossierPath}\` (new doc).`,
      ``,
      'Approve to apply, or reject with direction.',
    ].join('\n'),
    context: {
      runId: ctx.runId,
      files: [
        { path: roadmapDraft.draftPath, format: 'markdown', label: 'Proposed roadmap.md' },
        { path: gapDraft.draftPath, format: 'markdown', label: 'Proposed gap-analysis dossier' },
      ],
    },
  });

  if (dryRun) {
    return {
      success: true, applied: false, reason: 'dry-run',
      roadmapPath, gapDossierPath,
      gapCount: gap.gapCount, betCount: bets.betCount, adrsCreated: [],
      metadata: { processId: 'voxera/product-refactor-roadmap', timestamp: startTime },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 7 — Apply both docs (frontmatter bump + changelog per docs.md)
  // ──────────────────────────────────────────────────────────────────────────
  const applied = await ctx.task(applyDocsTask, {
    roadmapPath, roadmapDraftPath: roadmapDraft.draftPath,
    gapDossierPath, gapDraftPath: gapDraft.draftPath,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 8 — Decision check + ADR capture for the load-bearing build-order bets
  // ──────────────────────────────────────────────────────────────────────────
  const decision = await ctx.task(decisionCheckTask, {
    betsPath: bets.betsPath, gapDossierPath, roadmapPath,
  });

  const adrsCreated = [];
  if (decision.decisions && decision.decisions.length > 0) {
    await ctx.breakpoint({
      title: 'Record ADR(s) for roadmap decisions?',
      question: [
        `Detected ${decision.decisions.length} load-bearing decision(s) worth an ADR:`,
        ``,
        ...decision.decisions.slice(0, 4).map((d, i) => `${i + 1}. **${d.title}** → owning repo: \`${d.owningRepo}\``),
        ``,
        'Approve to capture these as federated ADRs; reject to skip (you can run extract-adr later).',
      ].join('\n'),
    });
    for (const d of decision.decisions.slice(0, 4)) {
      const adr = await ctx.task(writeAdrTask, { decision: d, gapDossierPath, roadmapPath });
      if (adr && adr.adrPath) adrsCreated.push(adr.adrPath);
    }
  }

  return {
    success: true,
    roadmapPath,
    newRoadmapVersion: applied.newRoadmapVersion,
    gapDossierPath,
    gapCount: gap.gapCount,
    betCount: bets.betCount,
    adrsCreated,
    metadata: { processId: 'voxera/product-refactor-roadmap', timestamp: startTime },
  };
}

// ════════════════════════════════════════════════════════════════════════════
// TASK DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

export const defineTargetProductTask = defineTask('define-target-product', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1 — Define the target product (vision + strategy + demo)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'product strategist who turns a vision, a strategy, and a clickable prototype into a precise capability inventory',
      task: 'Synthesize the durable target-product definition the roadmap must reach: every capability the full product needs, traced to its source and its strategic reason.',
      context: args,
      instructions: [
        `Read ${args.visionPath} and ${args.strategyPath} in full (north star, ICP, positioning, principles, non-goals, two motions, milestones).`,
        `Read the demo prototype at ${args.demoPath}/src/App.jsx in full — it is the clickable target product. Enumerate EVERY distinct flow, screen, feature, domain entity, and AI-agent concept it demonstrates.`,
        'Build a capability inventory grouped into themes (e.g. Onboarding & Business Context, Agent runtime & Decision Records, Voice calling, Lead lifecycle & audit, Critic/Promoter improvement loop, Compliance gates, Reporting, Platform/DSL, Design system).',
        'For each capability: a crisp name, what it does (user-facing), the SOURCE (vision §, strategy §, and/or demo flow/screen), and the strategic WHY (which moat layer or motion it serves).',
        'Respect the non-goals in vision/strategy — do NOT list capabilities the docs explicitly exclude (no agent swarms, no generic CRM, no enterprise, no no-code builder, etc.).',
        'Honestly distinguish capabilities that are core-to-vision vs. demo-only flourishes.',
        `Write the full inventory to "artifacts/${taskCtx.effectId}-target-product.md" (markdown, tables per theme).`,
      ],
      outputFormat: 'JSON with summaryPath (run-relative), capabilityCount (number), themeCount (number), themes (array of strings).',
    },
    outputSchema: {
      type: 'object',
      required: ['summaryPath', 'capabilityCount', 'themeCount'],
      properties: {
        summaryPath: { type: 'string' },
        capabilityCount: { type: 'number' },
        themeCount: { type: 'number' },
        themes: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'target-state', 'discovery'],
}));

export const mapCurrentStateTask = defineTask('map-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2 — Map the current CRM capability state',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'staff engineer auditing an existing codebase to establish ground truth for a roadmap',
      task: 'Produce an accurate map of what the CRM does TODAY, against the same theme structure as the target inventory.',
      context: args,
      instructions: [
        `Read the target inventory at ${args.targetSummaryPath} to mirror its themes.`,
        `Inventory the live CRM at ${args.crmRepoPath}: the Prisma/ZModel schema (libs/prisma-schema-backend/), the backend bounded contexts (apps/backend/src/app/), the frontend routes/pages (apps/frontend/src/), and the AI/voice integration (Twilio/Telnyx/Ultravox) actually wired.`,
        `Read the existing engineering knowledge: ${args.crmRepoPath}/engineering-os/roadmap/ (restructuring-roadmap), engineering-os/learning/ (tech-debt-inventory, lessons-log), and ${args.crmRepoPath}/decisions/ (technical ADRs). Capture the existing phase plan and tech-debt ledger verbatim enough to reconcile against.`,
        'For each target theme, state what exists today, its maturity (none / stub / partial / production), and the concrete evidence (file paths, model/module names).',
        'Explicitly determine whether an AI-agent layer exists (Business Context entity, Decision Record log, agent roster, Configurator/DSL, Critic/Promoter). Report present/absent with evidence.',
        `Write the full map to "artifacts/${taskCtx.effectId}-current-state.md".`,
      ],
      outputFormat: 'JSON with summaryPath, capabilityCount (number), aiLayerPresent (boolean), existingPhaseCount (number), techDebtCount (number).',
    },
    outputSchema: {
      type: 'object',
      required: ['summaryPath', 'capabilityCount', 'aiLayerPresent'],
      properties: {
        summaryPath: { type: 'string' },
        capabilityCount: { type: 'number' },
        aiLayerPresent: { type: 'boolean' },
        existingPhaseCount: { type: 'number' },
        techDebtCount: { type: 'number' },
      },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'current-state', 'audit'],
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3 — Gap analysis (target − current)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'enterprise architect specializing in gap analysis and brownfield transformation planning',
      task: 'Compute the gap backlog: every capability the target needs that the current CRM lacks or only partially has.',
      context: args,
      instructions: [
        `Read ${args.targetSummaryPath} and ${args.currentSummaryPath}.`,
        'For each target capability, classify: MET (parity), PARTIAL (exists but short of target), or MISSING. Drop MET items; keep PARTIAL + MISSING as gaps.',
        'Give each gap: id (GAP-NN), category (data-model / agent-layer / voice-runtime / frontend / compliance / improvement-loop / reporting / platform-dsl / ops), one-line description, currentState, targetState, demo-evidence (the flow/screen that proves it is wanted), dependencies (other GAP ids), complexity (low/med/high), and risk (low/med/high).',
        'Cross-reference each gap with the existing CRM tech-debt items and restructuring-roadmap phases — note where an existing phase already covers part of the gap (brownfield reuse), so nothing is double-counted.',
        'Do not invent gaps for explicitly-excluded non-goals.',
        `Write the backlog (one table per category + a summary) to "artifacts/${taskCtx.effectId}-gap-backlog.md".`,
      ],
      outputFormat: 'JSON with gapPath, gapCount (number), criticalCount (number), categories (array of strings).',
    },
    outputSchema: {
      type: 'object',
      required: ['gapPath', 'gapCount', 'categories'],
      properties: {
        gapPath: { type: 'string' },
        gapCount: { type: 'number' },
        criticalCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'gap-analysis'],
}));

export const gapReviewTask = defineTask('gap-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3b — Adversarial completeness + strategy-fit review of the gap backlog',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'skeptical reviewer whose job is to find what the gap analysis missed or invented',
      task: 'Score the gap backlog for completeness against the whole demo and fidelity to the strategy.',
      context: args,
      instructions: [
        `Read ${args.gapPath}, ${args.targetSummaryPath}, ${args.currentSummaryPath}.`,
        'Completeness check: walk EVERY target capability/demo flow and confirm it is either marked MET in the current map or present as a gap. List any uncovered capability as an issue.',
        'Invention check: flag any gap that corresponds to a stated non-goal or has no demo/vision/strategy source.',
        'Soundness check: flag mis-classified MET/PARTIAL/MISSING calls, missing dependencies, or implausible complexity/risk tags.',
        'Score 0-100. 100 = ships as-is; 85 = small fixes; <85 = real coverage holes. Return concrete, addressable issues (GAP id or capability name + the problem).',
      ],
      outputFormat: 'JSON with score (0-100), issues (array of strings), strengths (array of strings).',
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
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'review', 'quality-gate'],
}));

export const gapRefineTask = defineTask('gap-refine', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3b — Refine the gap backlog against review issues',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'analyst revising a gap backlog against reviewer feedback',
      task: 'Resolve every issue with the minimum change; do not introduce unrelated scope.',
      context: args,
      instructions: [
        `Read the current backlog at ${args.gapPath}.`,
        'For each item in `issues`, make the minimum correction (add a missing gap, remove an invented one, fix a classification/dependency/tag).',
        `Write the corrected backlog back to ${args.gapPath}.`,
      ],
      outputFormat: 'JSON with gapPath (string), changesApplied (array of strings).',
    },
    outputSchema: {
      type: 'object',
      required: ['gapPath'],
      properties: { gapPath: { type: 'string' }, changesApplied: { type: 'array', items: { type: 'string' } } },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'refine'],
}));

export const ricePrioritizationTask = defineTask('rice-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4 — RICE prioritization of the gap backlog',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'prioritization expert applying RICE against a bootstrapped, two-motion strategy',
      task: 'Score and rank every gap with RICE (Reach × Impact × Confidence ÷ Effort).',
      context: args,
      instructions: [
        `Read ${args.gapPath}, ${args.strategyPath}, ${args.visionPath}.`,
        'Reach: how many customers/motions a gap touches (DACH/Pflegebox, RE, HS, Insurance). Impact: contribution to the differentiator (AI calling) and the moat (vertical depth, AI-calling depth, OS-underneath). Confidence: evidence strength (demo-proven, strategy-mandated, speculative). Effort: from the gap complexity + dependencies, in person-weeks for a 5-person bootstrapped team.',
        'Honor bootstrapped discipline: every high-effort item must defend its cost; reject/deprioritize anything that fails the "does this generalize / serve a motion now" test.',
        'Compute RICE score per gap; produce a ranked table (highest first) with each factor, the score, and a one-line rationale. Note dependency-forced ordering where RICE rank and build order disagree.',
        `Write the ranked, scored backlog to "artifacts/${taskCtx.effectId}-rice.md".`,
      ],
      outputFormat: 'JSON with ricePath, topRanked (array of {gapId, score} up to 10).',
    },
    outputSchema: {
      type: 'object',
      required: ['ricePath'],
      properties: {
        ricePath: { type: 'string' },
        topRanked: { type: 'array', items: { type: 'object', properties: { gapId: { type: 'string' }, score: { type: 'number' } } } },
      },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'prioritization', 'rice'],
}));

export const shapeUpSequencingTask = defineTask('shape-up-sequencing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5 — Sequence into Shape-Up appetite bets',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'product lead translating a ranked backlog into Shape-Up bets on a brownfield codebase',
      task: 'Convert RICE-ranked gaps into appetite-framed bets, ordered by dependency and aligned to the strategy milestones, honoring the existing engineering-os phases.',
      context: args,
      instructions: [
        `Read ${args.ricePath}, ${args.currentSummaryPath}, ${args.strategyPath}.`,
        'Group related gaps into BETS. Each bet has: title, appetite (small-batch ≈ 1–2 weeks, or big-batch ≈ one 6-week cycle), the problem, a solution sketch (fat-marker, not a spec), rabbit holes / no-gos, the gaps it closes (GAP ids), dependencies (other bets), and the RICE basis.',
        'Sequence by dependency first, RICE second — the agent layer (Business Context entity → Decision Record log → operator runtime) must precede the surfaces that depend on it; reuse existing restructuring-roadmap phases (S1–S9) wherever they already advance a bet, and say so explicitly so the roadmap is buildable today rather than a rewrite.',
        'Bucket bets into horizons: Now (next ~6-week cycle, maps to the 12-month milestone), Next (this year, 12-mo), Later (24/36-mo). Keep continuity with the existing two-motion (DACH + English) roadmap structure.',
        'Respect bootstrapped reality: the Now bucket must be genuinely fundable by a 5-person team in one cycle.',
        `Write the betting table + bet write-ups to "artifacts/${taskCtx.effectId}-bets.md".`,
      ],
      outputFormat: 'JSON with betsPath, betCount, nowCount, nextCount, laterCount, reconciledPhaseNote (string).',
    },
    outputSchema: {
      type: 'object',
      required: ['betsPath', 'betCount'],
      properties: {
        betsPath: { type: 'string' },
        betCount: { type: 'number' },
        nowCount: { type: 'number' },
        nextCount: { type: 'number' },
        laterCount: { type: 'number' },
        reconciledPhaseNote: { type: 'string' },
      },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'sequencing', 'shape-up'],
}));

export const draftGapDossierTask = defineTask('draft-gap-dossier', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6 — Draft the gap-analysis dossier',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'technical writer producing a voxera-command strategy doc',
      task: 'Assemble the standalone gap-analysis dossier from the phase artifacts, following the repo doc conventions.',
      context: args,
      instructions: [
        `Read ${args.targetSummaryPath}, ${args.currentSummaryPath}, ${args.gapPath}, ${args.ricePath}, ${args.betsPath}.`,
        'Read .claude/rules/docs.md and compose a doc with valid frontmatter (title, version: 1, status: active, updated: today, owner: you) and a closing `## Changelog` with a v1 line.',
        'Structure: Executive summary → Target product (capability inventory) → Current CRM (capability map) → Gap backlog (categorized tables) → RICE prioritization (ranked table) → Sequenced bets (summary; the full roadmap lives in roadmap.md) → Open questions.',
        `Write the full dossier to "artifacts/${taskCtx.effectId}-gap-dossier.md" (this is a DRAFT; it is applied to ${args.gapDossierPath} only after approval).`,
      ],
      outputFormat: 'JSON with draftPath (string).',
    },
    outputSchema: { type: 'object', required: ['draftPath'], properties: { draftPath: { type: 'string' } } },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'draft', 'doc'],
}));

export const draftRoadmapTask = defineTask('draft-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6 — Draft the rewritten product roadmap',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'product lead rewriting the canonical roadmap doc',
      task: 'Rewrite docs/product/roadmap.md as the full CRM → product roadmap, expressed as Shape-Up appetite bets across Now/Next/Later, honoring the existing two-motion structure.',
      context: args,
      instructions: [
        `Read the current ${args.roadmapPath} (preserve its frontmatter shape, two-motion framing, and the "check the box when merged / FEAT lives in the implementing repo" convention) and ${args.betsPath} and ${args.strategyPath}.`,
        'Read .claude/rules/docs.md. Keep the doc canonical: one file, frontmatter, Changelog.',
        'Rewrite the Now / Next / Later sections so they carry the sequenced bets (each bet: title, appetite, the gaps it closes, dependencies, and a pointer to a future FEAT id to be drafted in the implementing code repo per ADR-0014 — do NOT author FEAT specs here).',
        `Add a one-line link to the gap-analysis dossier at ${args.gapDossierPath}.`,
        'Preserve existing in-flight items (FEAT-001, FEAT-002) and the DACH/English motion grouping; integrate the new product-evolution bets alongside them, do not delete live work.',
        `Write the proposed full doc to "artifacts/${taskCtx.effectId}-roadmap.md" (DRAFT; applied only after approval). Do not bump the version here — the apply phase does that.`,
      ],
      outputFormat: 'JSON with draftPath (string), changesSummary (string).',
    },
    outputSchema: {
      type: 'object',
      required: ['draftPath'],
      properties: { draftPath: { type: 'string' }, changesSummary: { type: 'string' } },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'draft', 'doc'],
}));

export const docsReviewTask = defineTask('docs-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6b — Consistency + brand-voice + feasibility review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'reviewer enforcing strategy coherence, brand voice, and brownfield feasibility',
      task: 'Score the two drafts for internal consistency, brand voice, and buildability against the real codebase.',
      context: args,
      instructions: [
        `Read ${args.roadmapDraftPath} and ${args.gapDraftPath}.`,
        `Read ${args.visionPath}, ${args.strategyPath}, and ../voxera-os/docs/brand/brand-guidelines.md.`,
        `Feasibility: cross-check the sequencing in the drafts against the current-state map at ${args.currentSummaryPath} — flag any bet that ignores a hard dependency, contradicts the existing restructuring-roadmap, or assumes capabilities that do not exist yet.`,
        'Consistency: flag positioning contradictions, scope creep into stated non-goals, broken milestone alignment, or drift from the two-motion model.',
        'Brand: run brand-conformance checks (forbidden phrases, hype, voice). Verify docs.md conventions (frontmatter + Changelog present and well-formed).',
        'Score 0-100 (100 ships as-is; 85 small fixes; <85 rework). Return concrete file:section issues.',
      ],
      outputFormat: 'JSON with score (0-100), issues (array of strings), strengths (array of strings).',
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
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'review', 'quality-gate'],
}));

export const docsRefineTask = defineTask('docs-refine', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6b — Refine the drafts against review issues',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'editor revising roadmap + dossier drafts against reviewer feedback',
      task: 'Resolve every issue with the minimum change, preserving the rest of each draft.',
      context: args,
      instructions: [
        `Read the drafts at ${args.roadmapDraftPath} and ${args.gapDraftPath}.`,
        'For each item in `issues`, make the minimum change required to resolve it, in whichever draft it applies to.',
        'Do not introduce new scope beyond the issues. Write each refined draft back to its same path.',
      ],
      outputFormat: 'JSON with refined (boolean), changesApplied (array of strings).',
    },
    outputSchema: {
      type: 'object',
      required: ['refined'],
      properties: { refined: { type: 'boolean' }, changesApplied: { type: 'array', items: { type: 'string' } } },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'refine'],
}));

export const applyDocsTask = defineTask('apply-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7 — Apply both docs (frontmatter bump + changelog)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'doc editor applying approved drafts per docs.md conventions',
      task: 'Write the gap dossier as a new doc and the roadmap as a version-bumped rewrite; verify both landed.',
      context: args,
      instructions: [
        `Write the approved gap-dossier draft (${args.gapDraftPath}) to ${args.gapDossierPath}. It is a new doc: keep version 1, status active, updated today, and its v1 Changelog line.`,
        `For the roadmap: read the current ${args.roadmapPath} to capture its version, then write the approved draft (${args.roadmapDraftPath}) to ${args.roadmapPath}, incrementing frontmatter version by 1, setting updated to today (ISO), and appending one dated Changelog bullet describing the CRM→product roadmap rewrite.`,
        'Re-read both files and verify frontmatter + Changelog are well-formed; report any mismatch.',
      ],
      outputFormat: 'JSON with success (boolean), newRoadmapVersion (number), gapDossierWritten (boolean), verified (boolean).',
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'newRoadmapVersion', 'verified'],
      properties: {
        success: { type: 'boolean' },
        newRoadmapVersion: { type: 'number' },
        gapDossierWritten: { type: 'boolean' },
        verified: { type: 'boolean' },
      },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'apply', 'doc'],
}));

export const decisionCheckTask = defineTask('decision-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8 — Detect load-bearing roadmap decisions worth an ADR',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'architecture reviewer with low tolerance for ADR-bloat, who knows the federated ADR rules',
      task: 'Identify the few build-order / architecture-sequencing decisions in this roadmap that merit a federated ADR, and the repo each belongs to.',
      context: args,
      instructions: [
        `Read ${args.betsPath} and the applied docs (${args.gapDossierPath}, ${args.roadmapPath}).`,
        'A real decision has: a fork in the road, consequences that propagate, and reasoning future-you would want. Bias toward NO; expect 0–3 total.',
        'Candidates likely include: "evolve the data-CRM into the agent product via strangler sequencing rather than rebuild", "Business Context + Decision Record as the foundational v-next entities", "agent-layer build order precedes surface work". Only include ones that truly clear the bar.',
        'Apply the workspace federation rule: strategy/build-order/GTM → owning repo voxera-command (decisions/); technical agent-layer/schema/runtime architecture → voxera-crm (decisions/). Set owningRepo accordingly for each.',
        'For each: title (one-line decision statement), owningRepo, a one-paragraph context, and 2–3 alternatives considered.',
      ],
      outputFormat: 'JSON with decisions (array of {title, owningRepo, context, alternatives[]}) — may be empty.',
    },
    outputSchema: {
      type: 'object',
      required: ['decisions'],
      properties: {
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'owningRepo'],
            properties: {
              title: { type: 'string' },
              owningRepo: { type: 'string', enum: ['voxera-command', 'voxera-crm'] },
              context: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'gate', 'adr-detection'],
}));

export const writeAdrTask = defineTask('write-adr', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8 — Write a federated ADR',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADR author following the federated voxera workspace decision-log conventions',
      task: 'Create the next globally-numbered ADR in the owning repo, fill it from the template, add a backlink.',
      context: args,
      instructions: [
        'Use the extract-adr skill at .claude/skills/extract-adr/SKILL.md as the workflow, and .claude/rules/adrs.md for the invariants.',
        'Pick the next ADR number GLOBALLY across the workspace: scan voxera-command/decisions/ADR-*.md and ../voxera-*/decisions/ADR-*.md, take highest + 1 (zero-padded to 4 digits). Numbers are permanent.',
        `Create ADR-XXXX-<slug>.md in the owning repo's decisions/ folder (owningRepo = "${args.decision.owningRepo}"; for voxera-crm use ../voxera-crm/decisions/), from that repo's _template.md.`,
        'Fill: id, title, status: accepted, date today, affects (include the roadmap + dossier paths), Context, Decision, Alternatives considered (from the provided alternatives), Consequences.',
        `Add the row to the registry in voxera-command/decisions/README.md (or the voxera-os ADR-REGISTRY if that is the allocator), and add a backlink blockquote in ${args.gapDossierPath}.`,
        'Return the ADR path and number.',
      ],
      outputFormat: 'JSON with adrPath (string), adrNumber (number), owningRepo (string), backlinkAdded (boolean).',
    },
    outputSchema: {
      type: 'object',
      required: ['adrPath'],
      properties: {
        adrPath: { type: 'string' },
        adrNumber: { type: 'number' },
        owningRepo: { type: 'string' },
        backlinkAdded: { type: 'boolean' },
      },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['roadmap', 'adr', 'apply'],
}));
