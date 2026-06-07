/**
 * @process voxera/design-review
 * @description Run discipline-specific design → adversarial-review → converge loops for a spec (DDD → ERD → Prisma → GraphQL → Webhook → AI-agent → Analytics → OO → React → TDD), producing a design dossier that gates implementation.
 * @inputs { spec: string, lenses?: string[], maxRevisions?: number }
 * @outputs { success, dossierPath, lenses: [{ id, verdict, score, revisions, findings }] }
 * @agent ddd-designer ../../../voxera-crm/.claude/agents/ddd-designer.md
 * @agent ddd-reviewer ../../../voxera-crm/.claude/agents/ddd-reviewer.md
 * @agent erd-designer ../../../voxera-crm/.claude/agents/erd-designer.md
 * @agent erd-reviewer ../../../voxera-crm/.claude/agents/erd-reviewer.md
 * @agent prisma-designer ../../../voxera-crm/.claude/agents/prisma-designer.md
 * @agent prisma-reviewer ../../../voxera-crm/.claude/agents/prisma-reviewer.md
 * @agent graphql-designer ../../../voxera-crm/.claude/agents/graphql-designer.md
 * @agent graphql-reviewer ../../../voxera-crm/.claude/agents/graphql-reviewer.md
 * @agent webhook-designer ../../../voxera-crm/.claude/agents/webhook-designer.md
 * @agent webhook-reviewer ../../../voxera-crm/.claude/agents/webhook-reviewer.md
 * @agent ai-agent-designer ../../../voxera-crm/.claude/agents/ai-agent-designer.md
 * @agent ai-agent-reviewer ../../../voxera-crm/.claude/agents/ai-agent-reviewer.md
 * @agent analytics-designer ../../../voxera-crm/.claude/agents/analytics-designer.md
 * @agent analytics-reviewer ../../../voxera-crm/.claude/agents/analytics-reviewer.md
 * @agent oo-designer ../../../voxera-crm/.claude/agents/oo-designer.md
 * @agent oo-reviewer ../../../voxera-crm/.claude/agents/oo-reviewer.md
 * @agent react-designer ../../../voxera-crm/.claude/agents/react-designer.md
 * @agent react-reviewer ../../../voxera-crm/.claude/agents/react-reviewer.md
 * @agent tdd-designer ../../../voxera-crm/.claude/agents/tdd-designer.md
 * @agent tdd-reviewer ../../../voxera-crm/.claude/agents/tdd-reviewer.md
 * @agent general-purpose
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Design-quality operating system for a FEAT/BUG spec.
 *
 * Run standalone from a code repo (journal lands there):
 *   cd voxera-crm
 *   /babysitter:call --process ../voxera-command/.a5c/processes/design-review.js#process \
 *     -- spec ../voxera-command/docs/product/features/FEAT-007-pipeline-view.md
 *
 * Or as the gated design phase inside implement-feature.js (the default path) — it imports
 * `designReview` and runs it before planning.
 *
 * For each applicable discipline ("lens") it runs a design → adversarial-review → converge
 * loop: the discipline's *-designer subagent produces a design, the *-reviewer subagent
 * adversarially reviews it (verdict + severity-ranked findings), and the designer revises
 * until the reviewer approves or `maxRevisions` is hit. Each later lens reads the approved
 * outputs of the earlier ones, so the domain shapes the data model shapes the schema.
 *
 * LENS_REGISTRY is the extension point. It covers the nine disciplines from the original
 * engineering-OS brief plus react:
 * ddd/erd/prisma/graphql/webhook/ai-agent/analytics/oo/react/tdd. Add a future lens by
 * appending an entry (plus its *-designer / *-reviewer subagents) — the orchestration below
 * never changes.
 */
const LENS_REGISTRY = [
  {
    id: 'ddd',
    title: 'Domain-Driven Design',
    designerAgent: 'ddd-designer',
    reviewerAgent: 'ddd-reviewer',
    appliesWhen:
      'the feature introduces or changes domain concepts, business rules/invariants, aggregates, or module/context boundaries (nearly all non-trivial backend features).',
    designGoal:
      'a persistence-ignorant domain model: bounded context, aggregates/entities/value objects, invariants and their enforcing layer, ubiquitous language, domain events, consistency boundaries, tenancy/authz.',
  },
  {
    id: 'erd',
    title: 'Entity-Relationship (data) model',
    designerAgent: 'erd-designer',
    reviewerAgent: 'erd-reviewer',
    appliesWhen:
      'the feature adds or changes persisted data — new entities, attributes, relationships, or query/access patterns.',
    designGoal:
      'a logical ERD: entities/attributes, relationships with cardinality and on-delete, keys, 3NF (with justified exceptions), and access-pattern-driven index intent with accountId tenancy.',
  },
  {
    id: 'prisma',
    title: 'Prisma / ZModel schema + migration',
    designerAgent: 'prisma-designer',
    reviewerAgent: 'prisma-reviewer',
    appliesWhen:
      'the ERD implies a change to libs/prisma-schema-backend/schema.zmodel (models, fields, relations, indexes, enums, access policies, or a migration).',
    designGoal:
      'a concrete ZModel design + a deterministic, review-safe migration plan (PP-001): models/fields/relations/indexes/policies and an additive-vs-destructive classification with expand/contract steps where needed.',
  },
  {
    id: 'graphql',
    title: 'GraphQL API contract',
    designerAgent: 'graphql-designer',
    reviewerAgent: 'graphql-reviewer',
    appliesWhen:
      'the feature exposes or changes the GraphQL API — new/changed Pothos types, queries, mutations, fields, or inputs (almost any feature with backend behavior surfaced to the client).',
    designGoal:
      'a Pothos/SDL contract that exposes the domain (not the database): types, paginated queries, intent-named mutations with input/payload+error types, deliberate nullability, field-level authorization, an N+1/DataLoader strategy, and an additive-or-deprecation evolution plan.',
  },
  {
    id: 'webhook',
    title: 'Webhook & third-party integration',
    designerAgent: 'webhook-designer',
    reviewerAgent: 'webhook-reviewer',
    appliesWhen:
      'the feature receives provider webhooks (Twilio/Telnyx/Ultravox, OAuth callbacks) or makes outbound third-party API calls — any integration boundary crossing into or out of Voxera.',
    designGoal:
      'a safe integration contract: inbound webhooks with signature verification, replay protection, idempotency under at-least-once delivery, fast-ack + async (BullMQ) processing, and deterministic tenant resolution; outbound clients with auth/secrets, timeouts, retries+backoff, circuit-breaking, and idempotency keys; plus SSRF/PII/observability handling.',
  },
  {
    id: 'ai-agent',
    title: 'AI / LLM agent design',
    designerAgent: 'ai-agent-designer',
    reviewerAgent: 'ai-agent-reviewer',
    appliesWhen:
      'the feature involves an LLM/AI agent — a voice agent (Ultravox/Twilio), a classifier/drafter, tool/function-calling, or any model-driven behavior. Skip for purely deterministic features.',
    designGoal:
      "a safe agent contract: objective + human-handoff boundary, model/modality choice with a latency/cost budget, system-prompt + trust boundary (prompt-injection defense), a tool/function-calling contract that runs inside the caller's authz/tenancy with confirmation+idempotency on writes, context/grounding + PII handling, a voice conversation state machine (turn-taking/barge-in/timeout/fallback/escalation), and an eval + observability plan.",
  },
  {
    id: 'analytics',
    title: 'Analytics & reporting',
    designerAgent: 'analytics-designer',
    reviewerAgent: 'analytics-reviewer',
    appliesWhen:
      'the feature produces metrics/KPIs, reporting, dashboards, or analytics — or emits events that reporting depends on. Skip for features with no measurement/reporting surface.',
    designGoal:
      'trustworthy analytics: single-source metric/KPI definitions, the instrumentation/event taxonomy to compute them, dimensions/measures, an aggregation + read-model strategy that never hammers the operational store and is tenant-scoped, correctness (no double counting, reproducible/backfillable), privacy, and a freshness-vs-cost plan.',
  },
  {
    id: 'oo',
    title: 'Object-oriented / SOLID structure',
    designerAgent: 'oo-designer',
    reviewerAgent: 'oo-reviewer',
    appliesWhen:
      'the feature adds or substantially changes code structure — new services/classes/modules or non-trivial frontend components. Especially when touching the PP-003 (duplicated forms) or PP-004 (ProspectsDetails god component) hotspots.',
    designGoal:
      'a SOLID code structure: single-responsibility units with DI-injected interfaces, composition over inheritance, shared abstractions over duplication (retiring/avoiding PP-003/PP-004), OCP extension points, sound Nx boundaries, and testable seams — without premature abstraction or over-engineering.',
  },
  {
    id: 'react',
    title: 'React / UI design',
    designerAgent: 'react-designer',
    reviewerAgent: 'react-reviewer',
    appliesWhen:
      'the feature adds or changes the frontend — React components, pages, hooks, forms, or screens. Skip for backend-only features.',
    designGoal:
      'a high-quality React/UI design: single-responsibility component tree with typed props, correct state/data-flow (urql for server state, no prop-drilling), sound hooks, Mantine/design-system reuse (avoiding PP-003/PP-004), all four UX states (loading/empty/error/permission), accessibility, justified rendering performance, and react-i18next for all user-facing text.',
  },
  {
    id: 'tdd',
    title: 'Test strategy (ATDD/TDD)',
    designerAgent: 'tdd-designer',
    reviewerAgent: 'tdd-reviewer',
    appliesWhen:
      'the feature changes observable behavior that must be proven by automated tests — essentially any feature with acceptance criteria (runs last, deriving the test plan from the settled design).',
    designGoal:
      'a test plan mapping every acceptance criterion to test cases at the right layer (unit/integration/GraphQL e2e/component/workflow), a failing-test-first (red→green) sequence, fixtures and mocking boundaries, edge/authz/regression/negative coverage, and determinism guarantees.',
  },
];

const lensById = (id) => LENS_REGISTRY.find((l) => l.id === id);

/**
 * Core routine. Callable standalone (via `process`) or inline from implement-feature.js.
 * @param {string} spec - path to the FEAT/BUG spec (relative to CWD).
 * @param {object} ctx - babysitter run context.
 * @param {object} [opts] - { lenses?: string[], maxRevisions?: number }.
 * @returns {Promise<{ dossierPath: string|null, lenses: object[] }>}
 */
export async function designReview(spec, ctx, opts = {}) {
  const maxRevisions = Number.isInteger(opts.maxRevisions) ? opts.maxRevisions : 2;

  // 1. Decide which lenses apply (explicit override, else detect from the spec).
  let lensIds;
  if (Array.isArray(opts.lenses) && opts.lenses.length) {
    lensIds = opts.lenses.filter((id) => lensById(id));
  } else {
    const detected = await ctx.task(detectLensesTask, {
      spec,
      registry: LENS_REGISTRY.map((l) => ({ id: l.id, title: l.title, appliesWhen: l.appliesWhen })),
    });
    lensIds = (detected.lenses || []).filter((id) => lensById(id));
  }

  // Preserve registry order (domain → data → schema) regardless of detection order.
  const active = LENS_REGISTRY.filter((l) => lensIds.includes(l.id));

  if (!active.length) {
    return { dossierPath: null, lenses: [] };
  }

  // 2. Per-lens design → review → converge loop.
  const results = [];
  const priorDesigns = []; // { id, title, path } of lenses already designed, fed to later lenses.

  for (const lens of active) {
    const designPath = `artifacts/design-${lens.id}.md`;

    await ctx.task(designLensTask, {
      lensId: lens.id,
      lensTitle: lens.title,
      designerAgent: lens.designerAgent,
      designGoal: lens.designGoal,
      spec,
      designPath,
      priorDesigns,
    });

    let review = await ctx.task(reviewLensTask, {
      lensId: lens.id,
      lensTitle: lens.title,
      reviewerAgent: lens.reviewerAgent,
      spec,
      designPath,
      priorDesigns,
    });

    let revisions = 0;
    while (review.verdict !== 'approved' && revisions < maxRevisions) {
      await ctx.task(reviseLensTask, {
        lensId: lens.id,
        lensTitle: lens.title,
        designerAgent: lens.designerAgent,
        spec,
        designPath,
        findings: review.findings || [],
        priorDesigns,
      });
      review = await ctx.task(reviewLensTask, {
        lensId: lens.id,
        lensTitle: lens.title,
        reviewerAgent: lens.reviewerAgent,
        spec,
        designPath,
        priorDesigns,
      });
      revisions++;
    }

    results.push({
      id: lens.id,
      title: lens.title,
      designPath,
      verdict: review.verdict,
      score: review.score,
      revisions,
      findings: review.findings || [],
      // Lens-specific risk flag: prisma → migrationRisk, graphql → breakingChange,
      // webhook → deliveryRisk, ai-agent → autonomyRisk, analytics → metricRisk,
      // oo → structureRisk, react → uiRisk, tdd → acCoverage.
      riskNote: review.migrationRisk
        ? `migration: ${review.migrationRisk}`
        : review.breakingChange
          ? `schema: ${review.breakingChange}`
          : review.deliveryRisk
            ? `delivery: ${review.deliveryRisk}`
            : review.autonomyRisk
              ? `autonomy: ${review.autonomyRisk}`
              : review.metricRisk
                ? `metrics: ${review.metricRisk}`
                : review.structureRisk
                  ? `structure: ${review.structureRisk}`
                  : review.uiRisk
                    ? `ui: ${review.uiRisk}`
                    : review.acCoverage
                      ? `coverage: ${review.acCoverage}`
                      : null,
    });
    priorDesigns.push({ id: lens.id, title: lens.title, path: designPath });
  }

  // 3. Assemble the dossier the plan/implement phases will read.
  const dossier = await ctx.task(assembleDossierTask, { spec, results });

  return { dossierPath: dossier.dossierPath, lenses: results };
}

/**
 * Standalone process wrapper: run the design review, then a single human gate to approve
 * the dossier before any implementation work begins.
 */
export async function process(inputs, ctx) {
  const { spec, lenses = null, maxRevisions = 2 } = inputs;

  if (!spec) {
    throw new Error('design-review requires { spec }');
  }

  const result = await designReview(spec, ctx, { lenses, maxRevisions });

  if (!result.lenses.length) {
    return {
      success: true,
      spec,
      dossierPath: null,
      lenses: [],
      note: 'No data/domain design lenses applied to this spec.',
      metadata: { processId: 'voxera/design-review', timestamp: ctx.now() },
    };
  }

  const unresolved = result.lenses.filter((l) => l.verdict !== 'approved');
  const summaryLines = result.lenses.map(
    (l) =>
      `- **${l.title}**: ${l.verdict} (score ${l.score}, ${l.revisions} revision${l.revisions === 1 ? '' : 's'})` +
      (l.riskNote ? ` — ${l.riskNote}` : ''),
  );

  await ctx.breakpoint({
    title: 'Approve design dossier',
    question: [
      `**Spec**: ${spec}`,
      ``,
      `Design lenses run (domain → data → schema):`,
      ...summaryLines,
      ``,
      unresolved.length
        ? `⚠️ ${unresolved.length} lens(es) did not reach "approved" after ${maxRevisions} revision(s). Review their findings in the dossier before approving.`
        : `All lenses approved by their adversarial reviewer.`,
      ``,
      'Approve to lock the design, reject to iterate further.',
    ].join('\n'),
    context: {
      runId: ctx.runId,
      files: [{ path: result.dossierPath, format: 'markdown', label: 'Design dossier' }],
    },
  });

  return {
    success: true,
    spec,
    dossierPath: result.dossierPath,
    lenses: result.lenses,
    metadata: { processId: 'voxera/design-review', timestamp: ctx.now() },
  };
}

export const detectLensesTask = defineTask('detect-design-lenses', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect which design disciplines apply to the spec',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'engineering lead triaging which design disciplines a spec needs',
      task: 'Read the spec and decide which design lenses apply. Bias toward including a lens when the spec plausibly touches it; exclude only when clearly irrelevant.',
      context: args,
      instructions: [
        `Read the spec at ${args.spec} in full (Why / What / Acceptance criteria).`,
        'For each lens in `registry`, decide if it applies using its `appliesWhen` description.',
        'The lenses are ordered domain → data → schema and are usually correlated: a feature that needs a new entity (erd) almost always needs ddd and prisma too.',
        'A pure copy/UI/config change with no persisted-data or domain-rule impact may return zero lenses.',
        'Return the applicable lens ids only.',
      ],
      outputFormat: 'JSON with lenses (array of lens id strings) and reasoning (short string).',
    },
    outputSchema: {
      type: 'object',
      required: ['lenses'],
      properties: {
        lenses: { type: 'array', items: { type: 'string' } },
        reasoning: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'design-review', 'detect'],
}));

export const designLensTask = defineTask('design-lens', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design: ${args.lensTitle}`,
  agent: {
    name: args.designerAgent,
    prompt: {
      role: `${args.lensTitle} designer for the Voxera CRM`,
      task: `Produce the ${args.lensTitle} design for the spec. Goal: ${args.designGoal}`,
      context: args,
      instructions: [
        `Read the spec at ${args.spec} in full.`,
        args.priorDesigns && args.priorDesigns.length
          ? `Read the approved prior-lens designs and stay consistent with them: ${args.priorDesigns
              .map((d) => `${d.title} (${d.path})`)
              .join(', ')}.`
          : 'This is the first lens; there are no prior designs to read.',
        'Read the relevant repo conventions (CLAUDE.md, .claude/rules/**, docs/patterns/**, and the existing code/schema your subagent definition points you to).',
        `Write the complete design as markdown to "${args.designPath}". Follow the output structure in your subagent definition.`,
        'This is a design artifact only — do not write production code, schema edits, or migrations.',
      ],
      outputFormat: 'JSON with designPath (string), summary (string), openQuestions (array of strings).',
    },
    outputSchema: {
      type: 'object',
      required: ['designPath'],
      properties: {
        designPath: { type: 'string' },
        summary: { type: 'string' },
        openQuestions: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'design-review', 'design', args.lensId],
}));

export const reviewLensTask = defineTask('review-lens', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adversarial review: ${args.lensTitle}`,
  agent: {
    name: args.reviewerAgent,
    prompt: {
      role: `adversarial ${args.lensTitle} reviewer for the Voxera CRM`,
      task: `Review the design at ${args.designPath} against the spec. Default to skepticism — "revise" until it earns "approved".`,
      context: args,
      instructions: [
        `Read the spec at ${args.spec} and the design at ${args.designPath}.`,
        args.priorDesigns && args.priorDesigns.length
          ? `Cross-check consistency with the approved prior-lens designs: ${args.priorDesigns
              .map((d) => `${d.title} (${d.path})`)
              .join(', ')}.`
          : 'This is the first lens; no prior designs to cross-check.',
        'Hunt for the failure modes listed in your subagent definition. Every finding cites a specific element of the design.',
        'Confirm every acceptance criterion in the spec has a home in the design.',
        'Any unresolved critical or high finding means verdict "revise".',
      ],
      outputFormat:
        'JSON with verdict ("approved"|"revise"), score (0-100), findings (array of {severity, issue, recommendation}), summary (string). Lens-specific optional risk flag: migrationRisk ("additive"|"destructive"|"unclear") for the prisma lens, breakingChange ("additive"|"breaking"|"unclear") for the graphql lens, deliveryRisk ("idempotent"|"at-risk"|"unclear") for the webhook lens, autonomyRisk ("bounded"|"unbounded"|"unclear") for the ai-agent lens, metricRisk ("trustworthy"|"questionable"|"unclear") for the analytics lens, structureRisk ("sound"|"smelly"|"unclear") for the oo lens, uiRisk ("solid"|"rough"|"unclear") for the react lens, acCoverage ("complete"|"gaps"|"unclear") for the tdd lens.',
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'score', 'findings'],
      properties: {
        verdict: { type: 'string', enum: ['approved', 'revise'] },
        score: { type: 'number', minimum: 0, maximum: 100 },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'issue'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              issue: { type: 'string' },
              recommendation: { type: 'string' },
            },
          },
        },
        migrationRisk: { type: 'string', enum: ['additive', 'destructive', 'unclear'] },
        breakingChange: { type: 'string', enum: ['additive', 'breaking', 'unclear'] },
        deliveryRisk: { type: 'string', enum: ['idempotent', 'at-risk', 'unclear'] },
        autonomyRisk: { type: 'string', enum: ['bounded', 'unbounded', 'unclear'] },
        metricRisk: { type: 'string', enum: ['trustworthy', 'questionable', 'unclear'] },
        structureRisk: { type: 'string', enum: ['sound', 'smelly', 'unclear'] },
        uiRisk: { type: 'string', enum: ['solid', 'rough', 'unclear'] },
        acCoverage: { type: 'string', enum: ['complete', 'gaps', 'unclear'] },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'design-review', 'review', args.lensId],
}));

export const reviseLensTask = defineTask('revise-lens', (args, taskCtx) => ({
  kind: 'agent',
  title: `Revise: ${args.lensTitle}`,
  agent: {
    name: args.designerAgent,
    prompt: {
      role: `${args.lensTitle} designer addressing reviewer findings`,
      task: `Revise the design at ${args.designPath} to resolve every reviewer finding. Make the smallest design changes that clear the findings.`,
      context: args,
      instructions: [
        `Read the current design at ${args.designPath} and the reviewer findings in context.findings.`,
        'Resolve every critical and high finding; address medium/low where reasonable.',
        'For any finding you disagree with, leave a one-line note in the design explaining why rather than silently ignoring it.',
        args.priorDesigns && args.priorDesigns.length
          ? `Keep the design consistent with the approved prior-lens designs: ${args.priorDesigns
              .map((d) => d.path)
              .join(', ')}.`
          : 'No prior-lens designs to reconcile.',
        `Overwrite "${args.designPath}" with the revised design (same structure).`,
      ],
      outputFormat: 'JSON with designPath (string), findingsAddressed (array of strings).',
    },
    outputSchema: {
      type: 'object',
      required: ['designPath'],
      properties: {
        designPath: { type: 'string' },
        findingsAddressed: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'design-review', 'revise', args.lensId],
}));

export const assembleDossierTask = defineTask('assemble-design-dossier', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble the design dossier',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'technical editor assembling a design dossier',
      task: 'Combine the per-lens design docs into a single dossier the planning/implementation phases will read.',
      context: args,
      instructions: [
        'Write the dossier to "artifacts/design-dossier.md".',
        'Start with frontmatter-free H1 "Design dossier — <spec>".',
        'Add a "Verdicts" summary table: lens | verdict | score | revisions | risk note (the `riskNote` field, if any — e.g. migration or schema-breaking risk).',
        'For each lens in `results` (in the order given), add a section that embeds the full content of its designPath file (read each file and inline it under a "## <lens title>" heading).',
        'After each lens section, add a "Reviewer findings" subsection listing any unresolved (critical/high) findings verbatim so the implementer cannot miss them. If none, write "All findings resolved.".',
        'Do not editorialize or change the design content — you are assembling, not redesigning.',
      ],
      outputFormat: 'JSON with dossierPath (string), lensCount (number).',
    },
    outputSchema: {
      type: 'object',
      required: ['dossierPath'],
      properties: {
        dossierPath: { type: 'string' },
        lensCount: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'design-review', 'dossier'],
}));
