---
id: ADR-0005
title: Generic internal DSL vocabulary with per-workflow user-facing label presets
status: accepted
date: 2026-05-31
supersedes: []
superseded_by: null
affects:
  - docs/architecture/workflow-dsl.md
  - docs/architecture/architecture-vision-and-principles.md
  - docs/strategy/strategy.md
---

## Context

The v1 product is a CRM (Pipelines, Leads, Stages, Won/Lost). The strategic bet is a workflow-kind-agnostic platform underneath, so v2/v3 verticals (Hörgeräte, insurance, mobility aids, eventually non-care verticals) can ship without rebuilding (P13). If the engine, DSL, and tables hard-code CRM terminology, the OS bet is dead on arrival.

But the v1 buyer sees a CRM. Surfacing "Process Instance" or "Workflow Kind" in the UI would be user-hostile and would compromise the wedge.

## Decision

Split vocabulary by layer:

- **Internal / DSL / engine / tables / outbox / audit** — generic terminology: *Workflow*, *Workflow Stage*, *Process Instance*, *Workflow Kind*, *Terminal Stage Disposition*, *Exit Reason*. The DSL author and the engine never see CRM-flavored labels.
- **User-facing** — per-workflow-kind presets map internal terms to vertical-appropriate labels. The v1 CRM (Pflegebox preset) renders as: *Pipeline*, *Stage*, *Lead*, *Won / Lost*, *Lost reason*.

The mapping is configured in the workflow-kind preset, not hard-coded in the UI. A future workflow kind (e.g., a case-management vertical) ships its own label preset without touching the engine.

## Alternatives considered

- **CRM terminology everywhere** — simplest for v1, but burns the OS bet. Every future vertical pays the rewrite tax. Rejected.
- **Generic terminology everywhere, including UI** — preserves the bet but ships a CRM that calls leads "process instances." User-hostile. Rejected.
- **Per-tenant vocabulary overrides** — too granular; the cost of customization at tenant level outweighs the benefit. Workflow-kind-level presets are the right granularity.

## Consequences

- Positive:
  - The OS bet is preserved at near-zero cost in v1.
  - Adding a vertical adds a label preset, not an engine fork.
  - Internal terminology stays consistent across the DSL, the outbox event types, and the Decision Record schema — no translation layer in the data path.
- Negative / risks:
  - Contributors must hold both vocabularies in mind. Documentation and code review must catch slips (e.g., a `lead_id` column where `process_instance_id` belongs).
  - User-facing copy can drift if the preset isn't the single source of truth for labels.
- Follow-ups:
  - Lint rule: no CRM-flavored identifiers (`lead_*`, `pipeline_*`) in engine, DSL, or outbox code paths.
  - Document the preset contract when the second workflow kind is designed.
