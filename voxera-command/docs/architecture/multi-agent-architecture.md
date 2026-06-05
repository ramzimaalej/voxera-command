---
title: Multi-Agent Architecture and Workspace Brain
version: 1
status: active
updated: 2026-05-31
owner: you
---

# Multi-Agent Architecture & Workspace Brain — v1.0

**Vocabulary note.** Per `workflow-dsl.md`, the internal vocabulary is generic ("workflow," "process instance"); the v1 CRM user-facing labels are "Pipeline," "Lead." References below use whichever is clearer in context.


---

## 1. Design Principles

These constrain every downstream decision in this document.

1. **Predictability comes from the quality of the Business Context, not from agent cleverness.** The system is reliable when the user has described their domain well. The agents are interpreters of a structured artifact, not improvisers.
2. **The agent roster is fixed; per-workspace tailoring is parameterization, not creation.** Seven roles, defined in code. The Brain selects which to instantiate and how to configure them — it does not invent new agent types at runtime.
3. **Every Brain decision is a proposal, not a fait accompli.** The user reviews diffs before anything changes. The agents' job is to make the diff so good that approval is one click most of the time.
4. **Every agent action is auditable through the two-log model** — outbox for data changes, Decision Records for reasoning. See `cross-cutting-patterns.md`.
5. **The Business Context is a structured artifact, not a chat history.** Versioned, sectioned, viewable, editable. The Brain is the orchestrator that reads/writes it. The Context is the product surface.
6. **Decision-Record-produced artifacts.** Every agent-produced artifact (Business Context edits, DSL diffs, prompt deltas, report drafts) carries `produced_by_decision_id` linking to the agent's Decision Record.

> *Roster decision (principle 2) recorded as [ADR-0004: Fixed roster of seven agent roles, no runtime agent creation](../../decisions/ADR-0004-fixed-agent-roster.md). Two-log audit (principle 4) recorded as [ADR-0003: Two-log audit model](../../decisions/ADR-0003-two-log-audit-model.md).*

---

## 2. The Business Context

The single most important artifact in the system. Lives in one place, versioned, owned by the workspace admin, queryable by every agent.

### 2.1 Structured sections

```yaml
business_context:
  version: 7
  produced_by_decision_id: ad_...        # Copilot's Decision Record at last edit

  identity:
    name: Pflegebox Direkt GmbH
    domain: home_care_supplies
    regions: [DE, AT]
    languages: [de-DE]
    timezone: Europe/Berlin

  offering:
    products:
      - id: monthly_pflegebox
        label: Pflegebox (monatlich)
        description: |
          Free monthly delivery of care supplies for individuals with
          recognized Pflegegrad ≥ 1, funded by Pflegekassen up to
          €42/month under § 40 SGB XI.
        eligibility_rules: ...
        pricing_model: insurance_reimbursed
    bundles: [...]

  customers:
    segments:
      - id: family_caregiver
        description: Adult children arranging care for elderly parent
        decision_criteria: [trust, ease_of_paperwork, reliability]
      - id: direct_recipient
        description: Care recipient managing their own supplies
        decision_criteria: [discretion, dignity, convenience]

  value_propositions:
    - "Zero out-of-pocket cost when Pflegegrad is recognized"
    - "Monthly auto-delivery, no re-ordering"
    - "Paperwork handled on the customer's behalf"

  sales_motion:
    kind: outbound_then_close
    channels: [paid_search_inbound, partner_referral, outbound_call]
    avg_cycle_days: 7
    closing_handled_by: human
    qualification_handled_by: ai

  brand_voice:
    register: warm_professional
    tone_notes: |
      Respectful of dignity. Avoid pressure tactics. German cultural
      norms — formal "Sie" by default, switch to "du" only if invited.
    forbidden_phrases: ["limited time offer", "act now"]

  regulatory:
    frameworks: [GDPR, SGB_XI, TKG_consent]
    notes: |
      Outbound calls require prior opt-in under § 7 UWG. Email outreach
      requires double opt-in. Pflegegrad data is health data — special
      category under GDPR Art. 9.

  glossary:
    Pflegegrad: "Care level 1-5 assigned by MDK; determines benefit eligibility"
    Pflegekasse: "Statutory long-term care insurance fund"
    MDK: "Medizinischer Dienst der Krankenversicherung"

  outcome_definitions:
    won: "Customer enrolled, first delivery scheduled, Pflegekasse paperwork submitted"
    lost: "Customer disqualified, opted out, or no response after policy escalation"
    qualified_lead: "Confirmed Pflegegrad ≥ 1, German address, decision-maker reached"

  operational_policies:
    working_hours: Mon-Fri 09:00-18:00 CET
    out_of_hours_behavior: "Operators send polite deferral, schedule callback"
    escalation:
      - trigger: "customer requests human"
        action: "transfer to closer, mark urgent"

  decision_memory:
    - date: 2026-03-14
      decision: "Removed 'discount' framing — confused customers about insurance funding"
      effect: "Qualification rate up 18% over 2 weeks"
```

### 2.2 Properties

- **Versioned.** Every edit increments the version.
- **Audited.** Section changes emit outbox events (`ContextSectionProposed`, `ContextSectionEdited`). The user sees a changelog.
- **Partially structured.** Schema-validated at the top level (sections must exist) but most leaves are free-text the agents read.
- **Authored with help.** The Context Copilot interviews the user to fill this in.

---

## 3. The Seven Agent Roles

Fixed in code. Per-workspace tailoring through configuration.

### 3.1 Orchestrator (the Brain)

The user-facing agent. Reads the Business Context, understands user intent, decides which sub-agent to invoke. Mostly tool-using; doesn't do heavy domain reasoning itself.

- **Tools:** dispatch to other agents, read/write Business Context (with diff approval), query workspace state, surface results.
- **Persistence:** maintains conversation continuity with the user across sessions, but durable knowledge lives in the Business Context.
- **Failure mode to avoid:** trying to do the work itself.

### 3.2 Context Copilot

The interviewer. Helps the user write a complete and well-articulated Business Context.

- **Modes:**
  - **Cold start interview:** structured walkthrough of every Business Context section.
  - **Gap audit:** scans existing Business Context for ambiguity, contradictions, missing sections.
  - **Reactive editing:** user says "we just changed our pricing model" → Copilot identifies which sections need updates.
- **Tools:** read/propose-write Business Context sections; ingest reference documents.
- **Output:** every Copilot edit is a Business Context section diff with `produced_by_decision_id` referencing the Copilot's Decision Record. The Decision Record captures: trigger, loaded context, reasoning (what gap, why this edit), recommended actions (the diff), confidence.
- **Lifecycle:** user reviews diff → outbox event `ContextSectionProposed(causing_decision_id=...)` → user approves → outbox event `ContextSectionEdited` → new Business Context version.

### 3.3 Configurator

Translates Business Context + user intent into DSL artifacts.

- **Tools:** the design-time tool surface (`object.create`, `pipeline.add_stage`, `form.create`, `agent.create`, etc.).
- **Output:** every Configurator output is a DSL diff produced by a Configurator Decision Record. Decision Record captures trigger (user intent), loaded context (Business Context + current workspace state), reasoning (which artifacts are needed and why), recommended actions (the full diff with rationale per change), confidence, alternatives considered.
- **Lifecycle:** outbox events for each artifact (`PipelineProposed`, `ObjectProposed`, etc.) with `causing_decision_id`. On approval: corresponding `*Applied` events.

### 3.4 Operator (templated)

Runtime agent that performs actual work inside workflows — outbound sales, qualification, inbound triage, scheduling, follow-up. Many *instances* per workspace, one *role* in the codebase.

- **Defined by:** name, purpose, tool surface, autonomy ceiling, prompt (compiled from Business Context + role-specific instructions), evaluation metrics, outcome schema, rubric.
- **Stored as:** an agent definition in the DSL (`workflow-dsl.md` §11).
- **Created by:** the Configurator, on instruction from the Brain.
- **Produces:** a Decision Record for every outward decision. The Decision Record carries `recommended_actions`; the engine reads these and dispatches transitions, each emitting outbox events with `causing_decision_id`.

### 3.5 Critic

Observes Operator behavior, scores it against the Operator's metrics and outcome schema, identifies failure patterns, proposes prompt deltas. Runs out-of-band on completed interactions.

**Inputs (per analysis batch):**

- **Decision Records** for the target Operator over a time window (e.g., last 7 days, last 500 decisions). The Critic queries the Decision Record log, filtered by `agent.id` and time range.
- **Linked outbox events** via `outcome_refs.outbox_event_ids` for each Decision Record — showing what actually happened downstream.
- **Outcome records** filled at interaction completion (by automation, by the Operator's self-assessment in its Decision Record, or by a human downstream).
- **Operator metrics** (qualification rate, rubric compliance, etc.) computed from outbox events over the window.
- **Operator prompt version** at the time of each Decision Record (in the Decision Record itself).
- **Business Context version** at the time (in the Decision Record).

**Outputs:**

- **Structured critique** against the Operator's rubric, with specific Decision Record IDs as evidence.
- **Aggregated patterns**: clusters of failures, common missed objections, confidence/outcome mismatches.
- **Prompt delta proposals**: each carries `produced_by_decision_id` pointing to the Critic's own Decision Record.

**Critical constraint:** the Critic does **not** modify production prompts. It produces *candidates* that flow to the Promoter.

**Operational details:**
- Batch cadence configurable (default hourly).
- Minimum evidence threshold ≥5 Decision Records per proposal.
- Rate limiting: default max 3 proposals per Operator per week.
- Pattern deduplication against pending and recently-rejected proposals.
- Confidence calibration as a standing analysis ("when Operator said 0.9, was outcome correct 90% of the time?").

### 3.6 Promoter

The role that decides whether Critic-proposed prompt deltas ship. In v1, this is a human role with strong tooling support — no Decision Records, no agent reasoning. In v2-v3, narrow automation tiers are added.

#### What the Promoter does

- **Review** a proposal: read the diff, the Critic's structured rationale, the Critic's own Decision Record, drill into supporting evidence Decision Records.
- **Evaluate**: run the proposed prompt against a curated eval set (mandatory in v1), see before/after results per scenario with rubric scores.
- **Decide**: approve as-is, edit-then-approve, or reject with a reason.
- **Rollout**: choose a deployment mode (canary at small traffic %, immediate full, scheduled).
- **Monitor** the guard period: watch operator metrics; one-click rollback if regression detected.

#### What the Promoter sees

UI built on top of the two-log audit model:

```
PROPOSAL DETAIL
├── Diff: prompt v4 → proposed prompt
│
├── Rationale (from the proposal)
│   ├── Summary
│   ├── Observed pattern
│   ├── Hypothesized cause
│   └── Change mechanism
│
├── Critic's Decision Record (drillable)
│   ├── Loaded context (Decision Records analyzed, metrics window)
│   ├── Alternatives considered
│   ├── Confidence in the proposal
│   └── Rubric self-assessment
│
├── Supporting Evidence (list of decision_record_ids)
│   └── Each clickable → full Decision Record + linked outbox events
│       showing real-world outcome
│
├── Eval Panel
│   ├── Curated eval set selector (per Operator role)
│   ├── "Run eval" button
│   └── Results: current vs proposed, per-scenario verdicts, regressions
│
└── Decision Panel
    ├── Approve / Edit-then-approve / Reject
    ├── Reason capture (required)
    └── Rollout: canary % | full immediate | scheduled
```

#### What the Promoter produces

The Promoter does not produce Decision Records (per the scoping rule: those are for agents). Promoter actions emit outbox events with `actor.kind: human`:

```yaml
event_type: PromptProposalApproved | PromptProposalRejected |
            PromptProposalEdited | PromptDeployed | PromptRolledBack |
            EvalRunRequested | GuardPeriodStarted | GuardPeriodCompleted

aggregate:
  kind: prompt_proposal | prompt_deployment
  id: pdp_... | dpl_...

actor:
  kind: human
  id: user_xyz

payload:
  reason: "..."
  eval_run_id: er_...
  rollout_mode: canary_10pct | full | scheduled

causing_decision_id: null
references_decision_id: ad_critic_...  # Critic's Decision Record
```

#### Bounds and safeguards

- **Eval-required-before-approval (v1 default):** configurable per Operator, default-on.
- **Reason required:** every approve, reject, edit captures a reason.
- **Guard period:** every deployment starts a configurable guard period (default 7 days). Operator metrics monitored against pre-deployment baseline.
- **Auto-rollback on threshold breach:** during guard period, if metrics regress beyond thresholds, deployment auto-rolled back, Promoter notified.
- **Rollback always available:** even after guard period, rollback to any prior prompt version from the Operator's prompt history.
- **No silent deployment:** workspace notifications on deployment, guard-period completion, and rollback.
- **Permission gating:** `prompt_proposal.approve` separate from `prompt_proposal.review`.

#### Evolution: v1 → v2 → v3

- **v1: human-only Promoter.** Goal: build trust, accumulate eval set, calibrate confidence.
- **v2: narrow automation tiers.** Auto-approve eligible if: proposal kind on whitelist, Critic confidence ≥ threshold, eval shows improvement with zero regressions, Critic track record above threshold, Operator autonomy ≤ ceiling. Still emits outbox events with `system` actor.
- **v3: full automation with human exception handling.** Most proposals auto-approve; humans handle exceptions. Workspace owners configure tolerance.

v1 is built such that v2 is a small step and v3 a tunable extension, not a rebuild.

### 3.7 Reporter

Translates natural-language report requests into DSL report definitions.

- **Output:** every report draft is produced by a Reporter Decision Record. Loaded context includes the Business Context, the workspace's existing data shape, and the user's request. Reasoning captures: which data sources, why this aggregation, which visualization fits, refresh cadence rationale.
- **Lifecycle:** outbox event `ReportProposed(causing_decision_id=...)` → user approves → `ReportApplied` → renderable.
- **Why not LLM-at-view-time:** consistent answers, predictable performance, debuggable, cheap to refresh, no hallucinated numbers.

### 3.8 Universal Pattern: Decision-Record-Produced Artifacts

Every agent that produces an artifact does so as the outcome of a Decision Record. The artifact carries `produced_by_decision_id`.

| Agent | Artifact | Carries `produced_by_decision_id` |
|---|---|---|
| Orchestrator | Dispatch instructions (internal) | yes |
| Context Copilot | Business Context section diffs | yes |
| Configurator | DSL diffs | yes |
| Operator | Recommended actions (in flight) | yes (the Decision Record itself) |
| Critic | Prompt delta proposals | yes |
| Reporter | Report definition drafts | yes |
| Promoter | *(human role, no Decision Records)* | — |

This makes replay, critique, and audit uniform across the agent roster.

**Scoping rule:** Decision Records are produced **only for outward decisions**. Internal multi-step reasoning within a single agent invocation is observability traces, not Decision Records.

---

## 4. How the Brain Tailors the Skeleton

When a workspace is set up:

1. **Context Copilot interviews the user** → Business Context v1 drafted, user approves.
2. **Brain reads the Business Context** and decides which Operator roles are needed. For Pflegebox: outbound qualifier (AI), closer (human, no operator), inbound triage (AI).
3. **Brain dispatches to Configurator** to create pipelines, objects, forms, automations, and operator agent definitions.
4. **Configurator emits a diff** spanning all artifacts.
5. **On approve, the workspace is operational.**

Operator prompts compile from:
- Role-specific instructions (in code)
- Business Context sections, scoped to what's relevant for the role
- Workspace-specific overrides the user can edit
- Tool definitions

When the Business Context changes, the Brain identifies affected operator prompts and proposes recompilation. User approves; new prompt ships through the Promoter flow.

---

## 5. The Configuration Loop

```
user describes intent in natural language
       │
       ▼
Brain reads Business Context, decides which sub-agent(s)
       │
       ▼
Configurator (or Context Copilot, Reporter) drafts artifacts
       │
       ▼
Diff presented to user — JSON Forms-rendered review UI:
  - What's being added/changed/removed
  - Rationale for each change
  - Estimated impact (e.g. "affects 412 in-flight leads")
       │
       ├── user edits in natural language ("but also handle returning customers")
       │     └── sub-agent revises diff, present again
       │
       ├── user approves → changes commit to workspace
       │
       └── user rejects → no change, optional reason captured
```

Friction goal: when the system has a good Business Context, the diff is mostly approved with one click.

---

## 6. The Operational Loop

```
event arrives (inbound call, scheduled trigger, lead state change)
       │
       ▼
Engine routes to the appropriate Operator instance (or human task)
       │
       ▼
Operator runs (with autonomy ceiling enforced):
  - reads relevant Business Context sections
  - produces a Decision Record (loaded_context, reasoning, decision)
  - autonomy gating applied based on decision.confidence
       │
       ▼
Engine reads decision.recommended_actions, dispatches each as a transition
  - each transition emits outbox event with causing_decision_id
       │
       ▼
Decision Record's outcome_refs updated with the emitted outbox event IDs
       │
       ▼
User observes in real-time dashboard; can intervene at any point
```

User-visible control: per-operator timeline view showing every Decision Record with its rationale and the resulting outbox events. One-click "take over" puts the operator in human-controlled mode.

---

## 7. The Critique Loop

```
Operator runs → emits Decision Records → recommends actions
                                       ↓
Engine executes actions → emits outbox events
                                       ↓
Downstream outcomes recorded in outbox
                                       ↓
─────────────────────────────────────────────────────────
                                       ↓
Periodic Critic batch:
  ├── Query Decision Records for the Operator over time window
  ├── Join with outbox events via outcome_refs
  ├── Compute metric aggregates from outbox
  ├── Identify patterns
  └── Produce prompt delta proposals
                                       ↓
Each proposal carries:
  ├── produced_by_decision_id → Critic's own Decision Record
  └── supporting_evidence → list of decision_record_ids
                                       ↓
Promoter inbox
                                       ↓
Promoter reviews:
  ├── Reads proposal + rationale
  ├── Drills into Critic's Decision Record
  ├── Drills into each supporting evidence Decision Record
  ├── Runs eval against curated set (mandatory v1)
  └── Approves / Edits / Rejects
                                       ↓
On approval → outbox: PromptProposalApproved → PromptDeployed
                                       ↓
Guard period (metrics monitored against baseline)
                                       ↓
Auto-rollback on threshold breach OR ratified after guard period
```

### 7.1 What you need to make this real

**Metrics per Operator role.** Defined in the Operator's agent definition. Examples:
- Outbound qualifier: qualification rate, time-to-qualify, call duration, rubric compliance score
- Inbound triage: routing accuracy, time-to-route, customer satisfaction
- Scheduler: booking rate, no-show rate, time-to-book

**Outcome schema per Operator role.** Filled at interaction end (by automation, the Operator's self-assessment in its Decision Record, or a downstream human).

**Rubrics.** Compiled from the Business Context (brand_voice, regulatory, sales_motion).

**Eval infrastructure.** §8 below.

---

## 8. Eval Dataset Curation

The curated eval set per Operator role is the safety net for prompt changes. It accumulates organically from production.

**Source:** anonymized Decision Records with human-labeled expected outcomes.

**Curation flow:**

1. **Candidate identification.** Anywhere a Decision Record is visible — Operator dashboards, Promoter UI, audit log — a "promote to eval set" affordance exists. Suggested candidates:
   - Decision Records with non-trivial outcomes (won/lost, specific stage transitions)
   - Decision Records flagged by humans during operator take-over
   - Decision Records cited as supporting evidence by the Critic
   - Decision Records with confidence/outcome mismatches

2. **Anonymization.** Promoting strips PII per a configurable redaction policy (lead names, contact details, encrypted fields). The redaction is itself logged.

3. **Labeling.** A human (typically a domain expert) labels the expected outcome: what *should* the Operator have decided here?

4. **Storage.** Eval scenarios live in a workspace-scoped eval set keyed by Operator role. Versioned. Includes:
   - Anonymized loaded context (the input)
   - Labeled expected decision (the target)
   - Expected rubric scores
   - Original Decision Record reference (for traceability)

5. **Rotation.** Eval sets partitioned into **active** and **holdout**. Active shown to Promoter during routine eval. **Holdout reserved for periodic blind testing — never shown to Promoter during routine eval, never used to inform Critic proposals.** Rotation between active and holdout quarterly per workspace policy.

6. **Coverage tracking.** System tracks coverage against production variation — clusters of Decision Records under-represented in the eval set. The Critic flags coverage gaps as findings.

**Why this is mostly free:** the substrate (anonymizable Decision Records with structured outcomes) is produced by normal operation. The added work is labeling, which is high-leverage.

**Cold start:** before production data exists, the Configurator + Context Copilot collaboratively draft initial eval scenarios from the Business Context (e.g., "given an inbound asking about Pflegegrad 3 eligibility, the qualifier should respond X"). Coarse but better than nothing for first deployment. Replaced by real anonymized scenarios as production data accumulates.

**Promotion permission:** `eval_set.promote` controls who can add scenarios. Typically Promoter role or designated curator.

---

## 9. DSL Extensions

The workflow DSL includes agents, reports, and business context as first-class entities. See `workflow-dsl.md` §11, §12, §13.

---

## 10. Observability & Control Surfaces

- **Brain console** — chat with the Orchestrator. Sees proposed diffs inline. Approves/edits.
- **Business Context editor** — section-by-section view. Direct edits or Copilot-assisted.
- **Operator dashboards** — one per Operator role. Live interactions, metric trends, outcome distributions, recent activity timeline, Decision Record drill-ins.
- **Promoter inbox** — Critic-proposed prompt deltas with rationale, evidence Decision Records, eval scores.
- **Audit log** — full outbox stream with filtering; Decision Record drill-ins where actions originated from agents.
- **Reports** — rendered from DSL definitions; user-configurable dashboards built from individual reports.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Business Context drifts into vague boilerplate, agents become generic | Context Copilot does gap audits, surfaces ambiguity, requires concrete examples; rubrics fail loudly when Context can't support them |
| Critic proposes prompt changes that look better in isolation but degrade overall performance | Eval set + Promoter approval; never auto-deploy without quantitative gate; guard period |
| Operators take actions the user didn't expect | Autonomy ceilings per Operator, enforced by engine; "take over" affordance always available; full Decision Record audit |
| Brain "delegates" but actually loops, costs balloon, latency degrades | Fixed roster, no dynamic spawning; explicit hop counter on agent-to-agent calls; per-workspace cost budgets surfaced in UI |
| Workspace cold-start with thin Business Context produces weak Operators | Vertical template library — user picks closest match, Copilot adapts |
| User loses trust after a bad agent action | Friction is one-click approval, not zero; every action shown in real-time dashboard; "take over" works mid-action; full audit |
| Multi-tenant cost runaway from agent usage | Per-workspace rate limits, model tier selection per role, observable cost-per-interaction metrics |
| Eval set overfitting | Active/holdout partition; periodic blind testing on holdout; rotation |
| Critic proposes too much, approval fatigue | Minimum evidence threshold; rate limits per Operator; aggregated similar findings |

---

## 12. Build Order

**Phase 1 — foundation (no AI loops yet)**
- Business Context schema, editor, versioning
- DSL extensions (agents, reports, business context)
- Engine support for agent invocation as a transition kind
- Outbox + agent_decisions infrastructure
- One vertical template (Pflegebox) hardcoded as proof point

**Phase 2 — configuration agents**
- Context Copilot (interview mode)
- Configurator (diff generation, approval flow)
- Brain orchestrator wiring these together
- User-facing chat UI with diff review

**Phase 3 — operational agents**
- Operator runtime with autonomy enforcement
- Decision Record production
- Outcome recording, metric collection
- Operator dashboards
- One real Operator working end-to-end (e.g. outbound qualifier)

**Phase 4 — critique loop**
- Outcome schema infra
- Metric pipeline
- Critic v1 (batch analysis, structured critiques, prompt delta proposals)
- Promoter UI (manual approval, eval runner against curated set)
- Eval set curation flow

**Phase 5 — reporting & polish**
- Reporter agent
- Report rendering engine
- Dashboard builder

**Phase 6+ — automation maturity**
- Promoter automation tiers (low-risk auto-promote)
- Synthetic eval generation
- Cross-workspace template marketplace

---

## 13. Open Questions

- **Context Copilot reference document ingestion.** Should it accept PDFs, recordings, websites?
- **Template marketplace policy.** Community contributions? Curation cost matters.
- **Multi-language Operators.** Per-language vs single Operator with language parameter? Recommend per-language.
- **Operator-to-operator handoff.** Need clean handoff model that doesn't smell like dynamic spawning.
- **Real-time vs batched Critic.** Hourly batches sufficient for most metrics. Some signals want faster intervention. Two tiers, or just batched?
- **Cost transparency to end users.** Show LLM cost? Hide? Bill? Business model question.

## Changelog
- 2026-05-31 v1: imported from `/Users/ramzi/Downloads/files-6/multi-agent-architecture-v1.0.md`; frontmatter added (status active), inline "**Status:** v1.0" line removed in favor of frontmatter.
