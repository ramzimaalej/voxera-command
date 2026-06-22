---
id: ADR-0022
title: Evolve the existing data-CRM into the AI-agent product via strangler-fig sequencing on the S0–S9 seams, not a rebuild
status: accepted
date: 2026-06-22
supersedes: []
superseded_by: null
affects:
  - docs/product/roadmap.md
  - docs/product/gap-analysis-crm-to-product.md
---

## Context
The full product thesis — Business Context substrate, the seven-agent runtime, the AI voice operator, engine-enforced compliance gates, and the configurator/DSL — is 100% blueprint sitting on top of a production, human-operated B2B CRM (lead/pipeline state machine, full activity/audit log, a Twilio/Telnyx/Ultravox human-calling substrate). The gap analysis collapses 52 gaps into 13 bets (B1–B13), and every net-new AI/product capability is sequenced to land on top of a strangler-fig restructuring phase (S0–S9) of the *live* codebase. This is the single load-bearing build-order bet the entire roadmap and gap analysis rest on, and the rationale — a bootstrapped 5-person team, two paying customers funding the work, and a production calling substrate worth keeping — is not reconstructable from any individual bet.

## Decision
Evolve the existing CRM into the AI-agent product by strangler-fig sequencing: each net-new capability is built on a restructuring phase (S0–S9) that carves the seam in the live code first, so agents write through the *same* API/RBAC/audit/outbox paths as humans and reuse the production calling substrate — rather than starting a greenfield rebuild or bolting the agent layer on as a side service.

## Alternatives considered
- **Greenfield rebuild separate from the CRM** — discards the production Twilio/Telnyx/Ultravox calling substrate, the lead/pipeline/audit model, and the customers funding development; unaffordable for a bootstrapped 5-person team and throws away proven, revenue-bearing code.
- **Bolt the agent layer on as a loosely-coupled side service without restructuring the CRM seams** — leaves agents unable to write through the same API/RBAC/audit as humans (violating the no-engine-privileges principle, GAP-13) and re-creates the duplicated-vertical rot (PP-003/TD-003) that the strangler phases are meant to retire.

## Consequences
- Positive:
  - Preserves the revenue-bearing production substrate (calling stack, lead/pipeline/audit) and the customers funding the build.
  - Agents share humans' write-path, RBAC, and audit by construction — the no-engine-privileges moat falls out of the architecture instead of being prompt-hoped.
  - Affordable for a 5-person bootstrapped team: incremental seams keep the product shippable and revenue-generating throughout the transition.
- Negative / risks:
  - Couples product velocity to restructuring debt — every net-new data-model gap (GAP-01/02/03/04) traverses the fragile ZModel→Prisma path (PP-001/TD-001) behind the guarded migration gate, which may force TD-001 remediation earlier than planned.
  - Strangler sequencing constrains build order (e.g. B6 compliance gate before B5 voice operator), delaying the most demo-able capability.
- Follow-ups (link FEAT/BUG ids):
  - Sequenced bet plan + S0–S9 phase mapping in docs/product/roadmap.md.
  - TD-001 fragility threshold tracked as gap-analysis open question #2.
