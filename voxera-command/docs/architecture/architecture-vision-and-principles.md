---
title: Architecture: Vision and Principles
version: 1
status: active
updated: 2026-05-31
owner: you
---

# Architecture: Vision, Principles, and Pflegebox Grounding — v1.0

This is the foundational document. Other design docs implement what's stated here. When those docs and this one disagree, this one wins.

---

## 1. Vision

An **AI-native CRM for outbound-heavy regulated verticals**, starting with Pflegebox in DACH and expanding to adjacent care/insurance verticals over time. Built on a **process-agnostic platform architecture (an SMB OS underneath)** that lets us expand without rebuilding.

The product is a CRM. The differentiating capability is AI calling. The defensible moat is vertical depth in regulated markets that generalists can't easily enter. The OS underneath is optionality and pivot insurance — invisible to v1 customers, valuable from v2 onward.

The strategic frame for this whole document set is in `strategy.md`. When that doc and this one disagree, that one wins on strategy; this one wins on architecture.

Concretely, v1: a Pflegebox seller in Germany should be able to describe their business — products, customers, regulatory frame, sales motion, brand voice — and have a working CRM with an AI outbound calling agent (in German), an inbound triage agent, a workflow that reflects the Pflegekasse paperwork cycle, and reports tracking qualification rate. The system should improve over time by observing what works.

---

## 2. The Bet

The wedge, the buyer, the moat, the milestones, and the competitive positioning are in `strategy.md`.

For architecture purposes, the bets we are making are:
- **High-quality structured business descriptions can drive predictable agent behavior.** Better than generic agents discovering the domain on their own, better than hand-configured CRMs that don't know the domain at all.
- **Agent reliability comes from constraint, not capability.** Fixed roster, scoped tool surfaces, autonomy ceilings, mandatory diff review, full audit.
- **Observability beats automation.** Users tolerate AI mistakes when they see every action with rationale and can intervene easily.
- **The OS underneath is preserved through architectural discipline, not through shipping breadth.** The DSL, engine, audit, agent roster, and real-time infrastructure are process-agnostic from day one. v1 ships one workflow kind (`linear_funnel`); future kinds are extension points.

We are betting against:
- **Dynamic agent spawning, "agent swarms," and emergent multi-agent behavior.** Fixed roster.
- **Full automation as the marketing pitch.** One-click approval, not zero-touch.
- **Generic intelligence solving domain problems.** Without a well-articulated Business Context, the system should be honest about its limits.
- **Generic SMB CRM positioning.** We are *not* HubSpot/Pipedrive/Close in v1. See `strategy.md` for the wedge.

---

## 3. Principles

These constrain every design decision downstream.

### P1. Predictability through context quality, not agent cleverness

The Business Context is the substrate. Agents are interpreters. If the Context is concrete and well-articulated, agents behave predictably. If it's vague, agents behave vaguely — and we surface that, we don't hide it.

The Context Copilot exists precisely because we don't trust users to write good Business Contexts unaided. Reducing the friction of *describing your business well* is the product's deepest moat.

### P2. Fixed agent roster, per-workspace tailoring

Seven roles, defined in code: Orchestrator (Brain), Context Copilot, Configurator, Operator (templated), Critic, Promoter, Reporter. The Brain selects which roles to instantiate per workspace and parameterizes them from the Business Context. It does not invent new agent kinds.

The user-facing narrative can still be "the Brain delegates to specialists" — but underneath, the surface area is testable.

> *Decision recorded as [ADR-0004: Fixed roster of seven agent roles, no runtime agent creation](../../decisions/ADR-0004-fixed-agent-roster.md).*

### P3. Every agent decision is a proposal

The Brain proposes pipeline configurations. The Configurator proposes DSL changes. The Critic proposes prompt deltas. The Reporter proposes report definitions. The Context Copilot proposes Business Context edits. Nothing commits without a user-visible diff and an approval action (which can be one click when the proposal is good).

This is **the** friction-vs-trust trade-off. We choose one-click trust over zero-friction opacity.

### P4. Two logs, cleanly separated: data changes (outbox) and agent reasoning (Decision Records)

The system maintains two audit logs. The **outbox** carries every data change by any actor (human, agent, system) — drives audit, automations, external webhooks, analytics. **Decision Records** capture agent reasoning steps that produce outward actions — drives the Critic, evals, the Promoter's "why" surface. The two are linked: outbox events from agents carry `causing_decision_id`; Decision Records list their `outcome_refs.outbox_event_ids`. Neither log pollutes the other.

Details in `cross-cutting-patterns.md`.

> *Decision recorded as [ADR-0003: Two-log audit model](../../decisions/ADR-0003-two-log-audit-model.md).*

### P5. Agents have no engine privileges

Every agent action flows through the same engine API a human would use. Same RBAC, same audit, same idempotency, same rate limits. This is what makes auditability real instead of nominal.

### P6. Workflows are the operational substrate

Pipelines with stages, forms, triggers, primitives — defined in the workflow DSL — are how work happens. Agents *participate in* workflows by emitting transitions; they don't bypass them. Even an outbound sales agent's actions appear as transitions and primitive invocations on a lead's workflow.

### P7. Inbound events flow through a four-stage pipeline: Receive, Persist, Analyze, Act

Webhooks, emails, SMS replies, call completions — every inbound signal flows through this pipeline. Each stage emits its own outbox events. Persistence happens before analysis (so analysis is replayable). Analysis produces a Decision Record artifact before action runs (so understanding is auditable separately from behavior).

### P8. Decision-Record-produced artifacts

Every agent-produced artifact — Business Context edits, DSL diffs, prompt delta proposals, report drafts — carries `produced_by_decision_id` referencing the agent's Decision Record. Replay, critique, and audit are uniform across the agent roster.

### P9. The Critic proposes, the Promoter (human, in v1) decides

The Critic observes interactions and produces structured improvement proposals against metrics, outcome schemas, and rubrics derived from the Business Context. It does not modify production prompts. A human Promoter reviews proposals with full context — the supporting Decision Records, the rationale, eval results — and approves, edits, or rejects.

Automated promotion exists as a v2-v3 capability, gated by quantitative thresholds, never as a default.

### P10. Reports are DSL artifacts, not ad-hoc LLM queries

Natural language → report definition → standard rendering engine. The Reporter agent translates intent to definition. The definition is versioned, predictable, cheap to refresh. We never serve LLM-generated numbers in front of customers.

### P11. Pflegebox is the v1 forcing function

v1 must demonstrably run a Pflegebox CRM well — outbound calling in German, Pflegekasse paperwork integration, § 7 UWG compliance, full lifecycle from inbound inquiry to enrollment. Every architecture decision should be testable against this.

Pflegebox is the *forcing function*, not the ceiling. The architecture remains process-agnostic; v1 just ships only what Pflegebox needs.

> *Wedge + agnostic-platform decision recorded as [ADR-0008: Pflegebox / DACH as v1 wedge on a workflow-kind-agnostic platform](../../decisions/ADR-0008-pflegebox-wedge-on-workflow-agnostic-platform.md).*

### P12. Real-time collaboration with last-writer-wins per data piece

Multiple users can view and edit the same data simultaneously. Updates from any source (other users, agents, the system) surface live to all viewers via an SSE push channel. Operational edits resolve concurrent writes via last-writer-wins at field-level (lead/object fields), record-level (forms), or document-level (workflow task scratchpad). Configuration editing uses section-level write locks with read-through streaming, so observers see the lock-holder's uncommitted edits live. Audit truth is preserved: overwritten writes remain in the outbox.

Details in `realtime-collaboration.md`.

### P13. Workflow-kind-agnostic architecture, vertical-shipped product

The engine, DSL, agent roster, audit, and real-time infrastructure are process-agnostic from day one. The DSL declares a workflow's topology kind (`linear_funnel` is the only kind shipped in v1; future kinds are documented extension points). Custom objects are workspace-scoped and decoupled from specific workflows. Terminal stages declare disposition + reason taxonomy generically.

User-facing labels are still CRM-flavored ("Lead," "Pipeline," "Stage") in v1 because that's what the buyer sees. The internal vocabulary is generic (Process Instance, Workflow, Workflow Stage). This split keeps the OS bet preserved at low cost.

> *Vocabulary split decision recorded as [ADR-0005: Generic internal DSL vocabulary with per-workflow user-facing label presets](../../decisions/ADR-0005-generic-dsl-vocabulary-with-presets.md).*

---

## 4. Non-Goals

- **General-purpose code execution within workflows.** We do declarative DSL configuration, not run-arbitrary-JS. (Zapier/n8n own that space.)
- **Marketplace of community-built agents.** Roster fixed in code.
- **Custom AI model training.** Prompts and Business Context are the customization surface.
- **No-code form builder.** JSON Forms with Mantine renderer; we don't reinvent.
- **CRM that works without a Business Context.** A workspace with an empty Context is broken by design.
- **Generic SMB CRM positioning in v1.** See `strategy.md` — we serve regulated DACH verticals first.
- **Enterprise sales motion in v1.** SMB only. Enterprise procurement, integration, and compliance demands are different.

---

## 5. The Pflegebox Reference Implementation

### 5.1 Business Context (excerpt)

```yaml
business_context:
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
        eligibility:
          - "Pflegegrad ≥ 1, recognized by MDK"
          - "Residence in Germany or Austria"
          - "Authorized representative if recipient cannot consent"

  customers:
    segments:
      - id: family_caregiver
        decision_criteria: [trust, paperwork_ease, reliability]
      - id: direct_recipient
        decision_criteria: [discretion, dignity, convenience]

  sales_motion:
    kind: outbound_then_close
    channels: [paid_search_inbound, partner_referral, outbound_call]
    avg_cycle_days: 7
    qualification_handled_by: ai
    closing_handled_by: human

  regulatory:
    frameworks: [GDPR, SGB_XI_§40, TKG_§7_UWG, BDSG]
    notes: |
      Outbound calls require prior opt-in. Email outreach requires
      double opt-in. Pflegegrad data is GDPR Art. 9 special category.

  brand_voice:
    register: warm_professional_de
    forbidden_phrases: ["limited time", "act now", "discount"]
    cultural_notes: "Formal Sie by default. Respect dignity of elderly."

  outcome_definitions:
    qualified: "Pflegegrad ≥ 1 confirmed, DE/AT address, decision-maker reached"
    won: "Enrollment signed, first delivery scheduled, Pflegekasse paperwork submitted"
    lost: "Disqualified, opted out, or no contact after policy escalation"
```

### 5.2 What the system instantiates from this context

After Business Context approval, the Brain dispatches the Configurator. It emits a diff containing:

- **Custom objects**: `Pflegegrad_Assessment`, `Pflegekasse_Application`, `Care_Recipient`, `Authorized_Representative`
- **Pipeline**: `pflegebox_funnel` with stages: `new_inquiry → qualification → eligibility_check → paperwork → enrollment_signed → first_delivery → active` (positive: `active`), `lost` (negative with reasons: `no_pflegegrad`, `out_of_region`, `opted_out`, `no_response`, `competitor`)
- **Forms**: contact info, Pflegegrad confirmation, eligibility checklist, Pflegekasse application (sealed on signature), enrollment confirmation
- **Operators**: `pflegebox_qualifier` (outbound, AI, autonomy: hybrid), `pflegebox_inbound_triage` (inbound, AI, autonomy: hybrid). No closer Operator — closing is human per the Business Context.
- **Primitives**: `send_qualification_email_de`, `send_pflegekasse_paperwork_signature`, `schedule_callback_de`
- **Automations**: route inbound paid-search inquiries to qualification; escalate to human closer after qualification; reminder for unsigned paperwork at +3d, +7d, +14d
- **Reports**: weekly qualification funnel, Pflegegrad distribution of leads, time-to-paperwork-completion, lost-reason breakdown

The user reviews this diff in one screen — sectioned, with rationale, with estimated impact. They approve. The workspace is operational.

### 5.3 Success criteria

- A first lead can flow through end-to-end within an hour of workspace creation.
- The qualifier Operator handles inbound paid-search calls in German, respects opt-in rules, captures Pflegegrad correctly, hands off to a human closer with structured context.
- The inbound triage Operator routes email inquiries to the right stage based on content.
- After 50 calls, the Critic surfaces a concrete proposal with supporting Decision Records as evidence.
- The Promoter reviews the proposal, runs eval against a curated 20-call set, approves with one click.
- Weekly reports render correctly without LLM-generated numbers; admin trusts the dashboard.

If the architecture can't deliver this, it's not done.

---

## 6. Architectural Pillars

Eight pillars, each detailed in a dedicated v1.0 document. The strategy doc sits above all of them.

| Pillar | Owns | Detailed in |
|---|---|---|
| **Strategy** | Wedge, buyer, moat, milestones, what we are and aren't competing with | `strategy.md` |
| **Workflow DSL** | Declarative shape of workflows, objects, forms, triggers, primitives, agents, reports, business context | `workflow-dsl.md` |
| **Execution Engine** | Durable workflow state, transitions, suspension/resumption, scheduling, version migration | `execution-architecture.md` |
| **Forms Layer** | JSON Forms + Mantine renderer set, custom widgets, validation, sealing UX | `forms-renderer-scope.md` |
| **Automations & Events** | Domain events, subscribers, automations as cross-workflow recipes | `automations-and-events.md` |
| **Multi-Agent Architecture** | Brain, seven roles, Business Context, configuration/operation/critique loops, eval curation | `multi-agent-architecture.md` |
| **Cross-Cutting Patterns** | Inbound webhook pipeline, two-log audit model, Promoter observability | `cross-cutting-patterns.md` |
| **Real-Time Collaboration** | SSE push channel, LWW-per-data-piece for operational edits, section locks for configuration editing, presence indicators | `realtime-collaboration.md` |
| **Voice Calling** | Twilio + Ultravox integration, voice-calling Operator runtime, voicemail, calendar booking mid-call, live observability, cost tracking, compliance per jurisdiction, DNC, number pool | `voice-calling.md` |

Plus this document, which sits above the pillars and dictates principles; and `strategy.md`, which sits above everything.

---

## 7. Considerations and Trade-Offs

The decisions that earned their place by surviving alternatives.

### 7.1 Postgres state machine over Temporal/Inngest

A general-purpose durable workflow engine looked attractive but lost on three points: (1) version migration of in-flight leads is dramatically simpler when we own the state model; (2) the DSL is constrained enough that we don't need general-purpose workflow code; (3) the multi-agent architecture creates more interaction with the workflow engine than a typical Temporal app, and the impedance mismatch would compound.

Trade-off accepted: more code we own and operate, in exchange for stronger version migration story and tighter agent integration.

### 7.2 Fixed agent roster over dynamic spawning

The current state of multi-agent systems is unreliable enough that "the Brain spins off whatever sub-agents it needs" is a marketing line, not a build plan. We commit to seven roles. The Brain selects and parameterizes; it does not invent.

Trade-off accepted: less flexibility for edge cases, in exchange for testability, debuggability, and predictable cost.

### 7.3 JSON Forms over a custom forms library

JSON Forms is mature. We build a renderer set with Mantine and custom widgets, not a forms engine. The hardest call here is whether to extend `jsonforms-mantine` or build the renderer from `@jsonforms/react` core — that's resolved by a one-week prototyping gate against the hardest realistic form.

Trade-off accepted: dependence on JSON Forms' evolution, in exchange for years of saved work.

### 7.4 Diff-review approval over autonomous action

We could have agents act and let users undo. We could have agents propose and require approval. We chose the latter as default. The user can configure higher autonomy (yolo mode) per role, but the default product surface is "proposal + diff + one-click approve."

Trade-off accepted: more clicks, in exchange for trust durability.

### 7.5 Predictable reports over LLM-at-view-time

Reports are DSL artifacts rendered by a standard engine. The Reporter agent translates natural language to definitions, but the *numbers* are computed by code, not generated by a model. Non-negotiable for any data shown to customers or used for business decisions.

Trade-off accepted: less expressiveness for one-off questions (use the Brain console for those), in exchange for trustworthy numbers.

### 7.6 Human Promoter in v1

Auto-promoting prompt changes is the kind of feature that looks clean in a demo and explodes in production. Human-in-the-loop with strong observability for v1. Automated promotion ships only after eval infrastructure is mature and quantitative gates are well-calibrated.

Trade-off accepted: slower improvement velocity, in exchange for not destroying user trust with a regression we couldn't see coming.

### 7.7 Both onboarding paths: template-first and Copilot-interview

Templates give fastest time-to-value. Interview gives best fit-to-business. Ship both, template-first default for users matching a vertical, Copilot-interview for users who don't or want deeper customization.

Trade-off accepted: more onboarding surface to maintain, in exchange for serving both new-vertical and existing-vertical users well.

### 7.8 Two audit logs over one universal model

An early proposal was a single universal Given/When/Then audit event for every actor. Rejected because most outbox events have no meaningful "Given" (e.g., scheduled job firing), and agent decisions need richer structure (alternatives considered, confidence, autonomy gating). Separating data changes (outbox) from agent reasoning (Decision Records) and linking them explicitly is cleaner on every dimension.

Trade-off accepted: two logs to operate, in exchange for a clean schema in each that serves its consumers well.

### 7.9 LWW-per-field over CRDT for real-time collaboration

CRDTs handle merging more robustly in pathological cases but add significant complexity and payload overhead. LWW-per-field (with field/record/document granularity tuned per data kind) is pragmatic, well-understood, and sufficient for CRM-style concurrent edits. Audit truth is preserved because overwritten writes remain in the outbox.

Trade-off accepted: occasional silent overwrites (mitigated by overwrite notifications), in exchange for dramatically simpler client and server implementation.

### 7.10 SSE over WebSockets for real-time push

Server-Sent Events are HTTP-friendly, simpler operationally, and sufficient for fan-out of outbox events plus presence/lock ephemeral signals. WebSockets are reserved for v2+ if bi-directional features demand them.

Trade-off accepted: one-way push only, in exchange for simpler operations.

### 7.11 Section-level locks over CRDT co-editing for configuration

Configuration editing is high-stakes and infrequent. Section-level write locks with read-through streaming give clear semantics ("only one author at a time, but everyone sees the work") with minimal complexity. CRDT co-editing on structured DSL would be costly to build and the benefit is marginal at the edit frequency we expect.

Trade-off accepted: occasional waiting for another user, in exchange for clean save semantics and audit trail.

---

## 8. Cross-Cutting Concerns

### 8.1 Multi-tenancy

Workspace is the tenancy boundary. Row-level isolation in shared tables. Per-workspace rate limits and cost budgets. Schema-per-tenant reserved for enterprise tiers if needed.

### 8.2 Security

- Encrypted fields use envelope encryption with workspace-scoped keys.
- Hashed fields support equality lookup only.
- Outbound webhooks signed with HMAC, secret in a managed secrets store.
- All agent tool calls flow through the same RBAC as human actions.
- Outbox is append-only, retention per workspace policy.
- Decision Records access gated separately from outbox access; replay/eval gated separately again.

### 8.3 Observability

- Every transition emits structured logs.
- Outbox lag per subscriber is an SLO.
- Per-operator dashboards show live metrics, recent activity, outcome distributions.
- Cost-per-interaction observable per operator role.
- Decision Record confidence calibration tracked over time.

### 8.4 Internationalization

The Business Context declares language. Operator prompts compile in the right language. Forms support per-locale labels. Reports support locale-aware formatting. JSON Forms is i18n-capable; the renderer set preserves this.

### 8.5 Compliance

GDPR, SGB XI, and other frameworks declared in the Business Context drive operational policies (consent capture, encrypted fields, retention). Per-workspace compliance configurations; no one-size-fits-all.

---

## 9. Open Questions

- **Multi-language operators per workspace.** Per-language operators vs. one operator with a language parameter. Recommend per-language for prompt quality; needs design.
- **Operator-to-operator handoff.** Clean handoff model required; should not smell like dynamic spawning.
- **Real-time vs batched Critic.** Two tiers or just batched?
- **Cost transparency to end users.** Show, hide, bill? Business-model decision.
- **Template marketplace.** First-party only, or curated community contributions?
- **Cross-workspace learning.** Could improvements in one workspace inform another? Privacy implications significant; recommend defer.
- **On-prem / regional deployments.** Significant ops investment for EU customers requiring this.

---

## 10. How to Read the Rest of the Documents

- Read `strategy.md` first. It frames what we're building, for whom, and why.
- Then this document. Principles and considerations.
- For *what the system does*: `workflow-dsl.md`.
- For *how it runs*: `execution-architecture.md`.
- For *how users see and fill forms*: `forms-renderer-scope.md`.
- For *how events flow*: `automations-and-events.md`.
- For *how the AI works*: `multi-agent-architecture.md`.
- For *audit, webhook handling, observability*: `cross-cutting-patterns.md`.
- For *live updates, concurrent edits, presence, configuration locks*: `realtime-collaboration.md`.
- For *Twilio + Ultravox calling, voice agent runtime, voicemail, calendar booking, compliance, cost tracking*: `voice-calling.md`.

Every other document should be reconcilable with the principles in §3 and the strategy in `strategy.md`. When they aren't, those two win.

## Changelog
- 2026-05-31 v1: imported from `/Users/ramzi/Downloads/files-6/architecture-vision-and-principles-v1.0.md`; frontmatter added (status active), inline "**Status:** v1.0" line removed in favor of frontmatter.
