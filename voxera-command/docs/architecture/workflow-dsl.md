---
title: Workflow DSL
version: 1
status: active
updated: 2026-05-31
owner: you
---

# Workflow DSL — v1.0

Conventions: YAML for the human/agent-facing form, JSON Schema for validation. JSON Logic for activation rules and conditional expressions. Field references use dot-paths: `instance.<field>` (lead/process instance fields), `<object_alias>.<field>`, `task.<field>` (workflow scratchpad), `context.<field>` (runtime: `current_stage`, `time_in_stage`, `entered_at`, etc.). All IDs are stable slugs; labels are display-only.

**Vocabulary note.** The DSL uses generic internal vocabulary that preserves the OS bet (per `architecture-vision-and-principles.md` P13):

| Internal/DSL term | User-facing label in v1 CRM (Pflegebox preset) |
|---|---|
| Workflow | Pipeline |
| Workflow stage | Stage |
| Process instance | Lead |
| Workflow kind | (not surfaced) |
| Terminal stage disposition | Won / Lost |
| Exit reason | Lost reason |

The internal terminology stays generic regardless of vertical. User-facing labels are configured per workflow kind preset.

> *Decision recorded as [ADR-0005: Generic internal DSL vocabulary with per-workflow user-facing label presets](../../decisions/ADR-0005-generic-dsl-vocabulary-with-presets.md).*

---

## 1. Custom Objects (workspace-scoped, workflow-agnostic)

Custom objects are workspace-level entities. They exist independently of any workflow and can be referenced by any workflow in the workspace. Each field declares storage mode.

```yaml
objects:
  - id: quote
    label: Quote
    fields:
      - { id: premium,        type: money,  storage: plain }
      - { id: coverage_amount,type: money,  storage: plain }
      - { id: carrier,        type: string, storage: plain }
      - { id: status,         type: enum,   storage: plain,
          options: [draft, sent, accepted, rejected] }

  - id: application
    label: Application
    fields:
      - { id: applicant_ssn,  type: string, storage: encrypted }
      - { id: applicant_dob,  type: date,   storage: plain }
      - { id: email_hash,     type: string, storage: hashed }
```

`storage` values: `plain | hashed | encrypted`. Hashed fields are one-way (used for dedup / lookup). Encrypted fields are reversible by authorized roles.

The same object can participate in multiple workflows. A `Customer` object could be referenced by a sales workflow, a support workflow, and an invoicing workflow simultaneously.

---

## 2. Workflow

```yaml
workflows:
  - id: pflegebox_funnel
    label: Pflegebox Funnel              # user-facing label
    workflow_kind: linear_funnel         # v1 ships only linear_funnel
    version: 3
    produced_by_decision_id: ad_...      # Configurator's Decision Record

    participating_objects:
      - { object: pflegegrad_assessment, alias: pg_assessment, cardinality: one  }
      - { object: pflegekasse_application, alias: pk_app, cardinality: one  }
      - { object: care_recipient, alias: recipient, cardinality: one  }
      - { object: authorized_representative, alias: rep, cardinality: one  }

    entry_stage: new_inquiry
    positive_exit_stage: active
    negative_exit_stage: lost

    entry_stage: new_inquiry
    terminal_stages: [active, lost]      # multiple terminal stages allowed

    stages: [...]              # see §3
    workflow_forms: [...]      # see §4 (workflow-wide forms)
    exit_reasons: [...]        # see §5 (reason taxonomies per terminal stage)
    field_change_triggers: [...]  # see §6.1
    webhook_handlers: [...]    # see §6.2 (full pipeline detail in cross-cutting doc)
    domain_events: [...]       # see §7
    sealing_rules: [...]       # see §8
```

### 2.1 Workflow Kinds

The DSL declares a workflow's topology. v1 ships **only `linear_funnel`**. Other kinds are documented as extension points for future versions; the engine, audit, and DSL are designed to support them without rebuilding.

| Kind | Topology | Status |
|---|---|---|
| `linear_funnel` | Ordered stages, Back/Next navigation, single entry, one or more terminal stages | **v1 — shipped** |
| `dag` | Directed acyclic graph; stages have predecessor sets; gates evaluated on entry | v2+ |
| `parallel_branches` | Multiple concurrent sub-paths that converge or terminate independently | v2+ |
| `recurring_review` | Periodic re-evaluation of a process instance (e.g., quarterly account review) | v2+ |
| `escalation_tree` | Branching by severity/category with escalation paths | v2+ |

v1's `linear_funnel` corresponds to the original "Pipeline" model from v0 of this doc.

---

## 3. Stages

```yaml
stages:
  - id: new_inquiry
    label: New Inquiry
    order: 10
    forms:
      - { form: contact_info_form, required: true  }
      - { form: lead_source_form,  required: false }

    time_triggers:
      - id: stale_no_contact
        anchor: stage_entry
        after: 2d
        calendar: business         # business | calendar
        condition: { "==": [ { "var": "instance.last_contact_at" }, null ] }
        action:
          primitive: send_qualification_email_de

      - id: auto_disqualify
        anchor: stage_entry
        after: 14d
        action:
          transition_to: lost
          exit_reason: no_response

  - id: qualification
    order: 20
    forms:
      - { form: pflegegrad_confirmation_form, required: true }

  - id: eligibility_check
    order: 30
    forms:
      - { form: eligibility_checklist_form, required: true }

  - id: paperwork
    order: 40
    forms:
      - { form: pflegekasse_application_form, required: true }

  - id: enrollment_signed
    order: 50

  - id: first_delivery
    order: 60

  # Terminal stages declare disposition and exit-reason taxonomy
  - id: active
    terminal: true
    disposition: positive            # positive | negative | neutral
    order: 100
    # No exit_reasons block → no reason required on entry

  - id: lost
    terminal: true
    disposition: negative
    order: 110
    exit_reason_taxonomy: pflegebox_lost_reasons   # references §5
```

Backward movement: stages are linearly ordered; Back/Next obeys `order`. Moving backward fires `stage_skipped` events for any stages traversed (synthetic, for analytics).

---

## 4. Workflow-Wide Forms

```yaml
workflow_forms:
  - form: lead_forecast
    sticky: top              # top | bottom | null (null = inline by order)
    order: 1
    required: false
    required_from_stage: paperwork

  - form: gdpr_consent
    sticky: bottom
    order: 1
    required: true
```

Field order rule: when `sticky` is set, `order` only orders forms within that location. When inline, `order` interleaves with stage forms.

---

## 5. Exit Reason Taxonomies

A terminal stage with `disposition: negative` (or `neutral`) typically requires an exit reason to be captured on entry. Reasons are defined as named taxonomies, referenced by stages.

```yaml
exit_reason_taxonomies:
  - id: pflegebox_lost_reasons
    reasons:
      - id: no_pflegegrad
        label: Kein Pflegegrad
        capture_form: lost_no_pflegegrad_form     # optional mini-form

      - id: out_of_region
        label: Außerhalb DE/AT

      - id: opted_out
        label: Abgemeldet

      - id: no_response
        label: Keine Antwort

      - id: competitor
        label: An Wettbewerber verloren
        capture_form: lost_competitor_form        # captures competitor name
```

A terminal stage with `disposition: positive` typically doesn't require a reason but can declare one if needed (e.g., a `won` stage with a reason taxonomy distinguishing channel: direct, referral, partner).

Multiple terminal stages with their own taxonomies generalize the v0 "lost reasons" concept. A recruiting workflow could have terminal stages `hired`, `rejected_by_candidate` (with its own taxonomy), `rejected_by_company` (with its own taxonomy), and `withdrew`.

---

## 6. Triggers

### 6.1 Field-change triggers (workflow-level, fire from anywhere)

```yaml
field_change_triggers:
  - id: pflegegrad_confirmed
    when:
      field: instance.pflegegrad
      condition: { ">=": [ { "var": "after" }, 1 ] }
    action:
      transition_to: eligibility_check
```

### 6.2 Webhook handlers (four-stage pipeline)

Each webhook flows through Receive → Persist → Analyze → Act. The Analyze stage produces a Decision Record; the Act stage reads it and dispatches engine transitions. Full mechanics in `cross-cutting-patterns.md` §1.

```yaml
webhook_handlers:
  - id: inbound_email_general
    source: email

    receive:
      auth: hmac_provider_default
      max_payload_kb: 512

    persist:
      normalize: standard_email
      routing:
        - match_instance_by_field: instance.email
          to: inbound.sender
      unrouted_action: queue_for_triage

    analyze:
      operator: pflegebox_inbound_triage
      fallback_on_timeout:
        kind: deterministic_rule
        rules:
          - if: { "contains": [ inbound.body_text, "abbestellen" ] }
            classify_as: opt_out

    act:
      autonomy: inherit_from_operator
      approval_required_if:
        confidence_lt: 0.7
```

---

## 7. Custom Domain Events

Events are emitted into the outbox; delivery to subscribers (webhooks, automations) is detailed in `automations-and-events.md`.

```yaml
domain_events:
  - id: enrollment_completed
    fires_on:
      - { type: stage_entered, stage: enrollment_signed }
    payload:
      lead_id: lead.id
      pflegegrad: lead.pflegegrad
      pflegekasse: pk_app.pflegekasse_name
```

---

## 8. Form Sealing

```yaml
sealing_rules:
  - form: pflegekasse_application_form
    seal_when:
      - { type: signature_completed, document: pflegekasse_paperwork }
      - { type: stage_entry, stage: enrollment_signed }
    unseal:
      permission: workflow.form.unseal
      reason_required: true
      resealing: on_save           # on_save | manual | never
```

Edit semantics: auto-save by default; edits mutate the form data; the outbox emits `FormSaved` events with before/after diffs. Sealed forms reject writes unless explicitly unsealed.

---

## 9. Form Definition (JSON Forms + Mantine renderer)

```yaml
forms:
  - id: pflegegrad_confirmation_form
    label: Pflegegrad Bestätigung
    target:
      type: lead                   # lead | task | object
      # For type=object:
      # object: pflegegrad_assessment
      # mode: create | edit

    schema: { ... }                # JSON Forms data schema
    ui_schema: { ... }             # JSON Forms UI schema (Mantine-rendered)

    activation:
      and:
        - { "!=": [ { "var": "lead.source" }, "imported" ] }
```

`target.type: task` writes to the workflow execution scratchpad — for transient data not worth promoting to a domain object.

---

## 10. Primitives

Single definition, callable by human or agent.

```yaml
primitives:
  - id: send_qualification_email_de
    type: send_email
    to: lead.email
    from: workspace.outbound_email
    template:
      subject: "Ihre Anfrage zur Pflegebox"
      body_md: |
        Sehr geehrte/r {{lead.full_name}},
        vielen Dank für Ihre Anfrage...
    on_complete:
      - update_field: { field: lead.last_contact_at, value: now() }

  - id: send_pflegekasse_paperwork_signature
    type: signature_request
    document:
      kind: pdf_fill
      source_pdf: partners/pflegekasse_form_v4.pdf
      field_mapping:
        applicant_full_name: lead.full_name
        applicant_dob:       pk_app.applicant_dob
        pflegegrad:          lead.pflegegrad
    recipients:
      - { role: signer, email: lead.email, name: lead.full_name }
    on_complete:
      - update_field: { field: pk_app.signed_at, value: now() }
      - transition_to: enrollment_signed
    on_decline:
      - create_task: { assignee: lead.assigned_agent_id, title: "Signature declined" }
    timeout:
      after: 14d
      action:
        primitive: send_signature_reminder_de
```

Primitive types: `send_email | send_sms | make_call | signature_request`. Execution suspends the workflow on dispatch; resumption is event-driven (delivery confirmation, signature completion, inbound reply matched to the awaiting state, or timeout).

---

## 11. Agent Definitions (Operators)

Operators are runtime agents that perform work inside workflows. Defined as first-class DSL entities.

```yaml
agents:
  - id: pflegebox_qualifier
    label: Pflegebox Qualifier (DE)
    role: operator
    channel: voice                     # voice | email | sms | chat (per voice-calling.md)
    direction: outbound                # outbound | inbound | bidirectional
    compatible_workflow_kinds: [linear_funnel]
    purpose: "Reach inbound leads and confirm Pflegegrad eligibility via outbound call"
    language: de-DE
    voice_profile: cartesia_de_female_warm   # workspace voice library
    autonomy_ceiling: hybrid           # cannot be set above this by users
    produced_by_decision_id: ad_...    # Configurator's Decision Record at creation

    tools:
      - make_call
      - update_field
      - transition_lead
      - create_task
      - book_calendar_slot
      - escalate_to_human
      - capture_pflegegrad
      - voicemail_drop

    context_sections: [brand_voice, products, glossary, regulatory, outcome_definitions, calling_compliance]

    prompt_template: |
      You are placing an outbound call for {{identity.name}}.
      {{compiled_context}}
      Begin every call with the disclosure prompt for your jurisdiction...

    prompt_version: 4
    prompt_history: [...]              # version log

    # Voice-specific call config (see voice-calling.md §3)
    call_config:
      max_duration_seconds: 600
      silence_timeout_seconds: 10
      voicemail_detection: enabled
      voicemail_action: drop_message
      voicemail_message_template: pflegebox_vm_de
      record_call: true
      transcription: realtime

    metrics:
      - { id: connect_rate, kind: ratio, target: 0.35 }
      - { id: qualification_rate_of_connected, kind: ratio, target: 0.40 }
      - { id: avg_call_duration_qualified, kind: duration, target: 180s }
      - { id: cost_per_qualified_lead, kind: money, target_max: 5.00 }
      - { id: rubric_compliance, kind: score, target: 0.9 }

    outcome_schema:
      type: object
      properties:
        connection_status: { type: string, enum: [connected_human, voicemail, no_answer, busy, disconnected, declined] }
        decision_maker_reached: { type: boolean }
        qualified: { type: boolean }
        disqualification_reason: { type: string, enum: [no_pflegegrad, out_of_region, opted_out, ...] }
        pflegegrad_confirmed: { type: integer, minimum: 0, maximum: 5 }
        next_action: { type: string, enum: [transfer_to_closer, schedule_callback, send_info, end] }
        consent_to_recording: { type: boolean }
        consent_to_followup_contact: { type: boolean }

    rubric:
      - "Identified self and company at start of call (Sie form)"
      - "Captured recording consent before proceeding"
      - "Confirmed decision-maker before discussing eligibility"
      - "Avoided forbidden phrases from brand_voice"
      - "Captured Pflegegrad accurately"
      - "Respected opt-out requests immediately and ended call"
```

Per-workspace prompts compile from `context_sections` of the Business Context plus `prompt_template`. New prompt versions ship through the Promoter flow (see `multi-agent-architecture.md`).

Voice-specific runtime mechanics (call lifecycle, voicemail handling, mid-call tools, live observability, cost tracking) live in `voice-calling.md`. Operator definitions with `channel: voice` are full Operators per the multi-agent architecture; the voice-calling doc covers what's added on top.

---

## 12. Report Definitions

Reports are DSL artifacts. The Reporter agent translates natural language to definitions; rendering is by a standard engine, not LLM-at-view-time.

```yaml
reports:
  - id: qualification_funnel_weekly
    label: Weekly Qualification Funnel
    produced_by_decision_id: ad_...    # Reporter's Decision Record

    data_sources:
      - kind: workflow_events
        workflow: pflegebox_funnel

    filters:
      time_range: last_7d

    aggregations:
      - { kind: count_by_stage }
      - { kind: conversion_rate, from: new_inquiry, to: qualification }
      - { kind: conversion_rate, from: qualification, to: enrollment_signed }

    visualization: funnel_chart

    refresh: daily

    delivery:
      - { kind: dashboard }
      - { kind: email, to: workspace.admins, schedule: "Mon 09:00 Europe/Berlin" }
```

---

## 13. Business Context (workspace-scoped artifact)

Versioned. Sectioned. Schema-validated at the top level; free-form at the leaves. Read by every agent role at compile time. Authored by the user with help from the Context Copilot.

```yaml
business_context:
  version: 7
  produced_by_decision_id: ad_...    # Copilot's Decision Record at last edit

  identity: { ... }
  offering: { ... }
  customers: { ... }
  value_propositions: [ ... ]
  sales_motion: { ... }
  brand_voice: { ... }
  regulatory: { ... }
  glossary: { ... }
  outcome_definitions: { ... }
  operational_policies: { ... }
  decision_memory: [ ... ]
```

Full schema in `multi-agent-architecture.md` §2.

---

## 14. Agent Tool-Call Surface (Configuration-Time)

The design-time agents emit configuration via tools rather than raw DSL:

- `object.create` / `object.add_field` / `object.update_field`
- `workflow.create` / `workflow.add_stage` / `workflow.set_terminal_stage`
- `workflow.add_participating_object`
- `form.create` / `form.set_target` / `form.set_activation`
- `stage.add_form` / `stage.add_time_trigger`
- `workflow.add_field_change_trigger` / `workflow.add_webhook_handler`
- `workflow.add_exit_reason_taxonomy`
- `workflow.add_sealing_rule`
- `primitive.create`
- `workflow.add_workflow_form`
- `agent.create` / `agent.update_prompt`
- `report.create`
- `business_context.edit_section`
- `workflow.publish_version` (triggers migration mapping flow)

Each tool returns the resulting DSL fragment; the orchestrator validates against JSON Schema before commit. Each tool invocation is part of a Decision Record's `recommended_actions`; on user approval, the DSL fragment is applied and an outbox event fires (`WorkflowApplied`, `AgentApplied`, etc.) with `causing_decision_id` pointing back.

---

## 15. Versioning & Migration

- Each workflow publish bumps `version`.
- In-flight process instances migrate to the new version on next interaction.
- Configurator proposes a field mapping **only when new fields were added** in the new version. Admin approves/edits before migration runs.
- Removed/renamed fields: explicit admin decision required (data preserved in `task` scratchpad keyed by old field id for safety).
- Migration emits `WorkflowMigrated` outbox events with before/after diffs.

Agent definitions, report definitions, and business context follow the same pattern: versioned, with diffs, with explicit migration where needed.

---

## 16. Field Reference Grammar

- `instance.<field>` — process instance fields (in CRM v1 UI, surfaced as "lead fields")
- `<object_alias>.<field>` — participating object fields (form context resolves which instance for 1:many)
- `task.<field>` — workflow scratchpad (per-execution, transient)
- `context.<field>` — runtime values: `current_stage`, `time_in_stage`, `entered_at`, etc.
- `inbound.<field>` — for webhook handler analyze/persist stages, references the normalized inbound payload
- `payload.<field>` — for automation triggers, references the domain event payload
- `workspace.<field>` — workspace-level values: `outbound_email`, `admins`, etc.
- `identity.<field>` — Business Context identity section (used in prompt templates)

## Changelog
- 2026-05-31 v1: imported from `/Users/ramzi/Downloads/files-6/workflow-dsl-v1.0.md`; frontmatter added (status active), inline "**Status:** v1.0" line removed in favor of frontmatter.
