---
title: AI-Native Platform Requirements
version: 1
status: active
updated: 2026-11-08
owner: you
---

# AI-Native Platform Requirements

> The product requirements for turning Voxera from "a CRM with AI features" into "a business knowledge platform
> that happens to generate a CRM". Source: the owner's **AI-Native CRM Refactoring Blueprint v1.0** (2026-11-08),
> transcribed with stable ids in the CRM repo at
> [`voxera-crm/engineering-os/architecture/ai-native-refactoring-blueprint-v1.0.md`](../../../voxera-crm/engineering-os/architecture/ai-native-refactoring-blueprint-v1.0.md).
> This document states *what the product must do* and maps it to roadmap bets (B14–B23) and gaps (GAP-55..84).
> The engineering *how* is the CRM plan
> [`ai-native-refactor-plan.md`](../../../voxera-crm/engineering-os/roadmap/ai-native-refactor-plan.md) and
> ADR-0080..0084.

## Owner rulings (2026-11-08)

1. **Follow the blueprint in full.** Every concept in it is a requirement below.
2. **The whole platform is event-sourced**, with the event store in **Postgres** (ADR-0080, ADR-0081). Same day:
   **every change to data** is an event, for audit and traceability (ADR-0085); deleted accounts are wiped nightly
   with a confirmation to the owner (ADR-0086). All of ADR-0080..0086 are accepted.
3. **Voice strategy follows the blueprint:** onboarding is asynchronous and multimodal by default; Copilot Live
   (built, DONE 2026-11-08, unreleased) becomes an optional mode and moves toward day-to-day use (ADR-0083).

## Product principle

> Do not build a CRM that happens to use AI. Build a business knowledge platform that happens to generate a CRM.

The interview is performed once, the knowledge is validated once, every feature consumes the same knowledge. The
CRM, the calling/email/support agents, automations, reports and dashboards are all **projections** of one
Canonical Business Knowledge Model (CBKM).

## Requirements

Ids in brackets are the blueprint ids; each row names the bet that delivers it.

### R1 — Knowledge platform (bet B16)

| # | Requirement | Blueprint | Gap |
|---|---|---|---|
| R1.1 | The CBKM is the system of record for how a customer operates, covering Organization, Products, Customers, Sales, Marketing, Customer Success, Support, Communication, Compliance, Terminology, Processes, KPIs/Reporting, Integrations, AI Behavior, Knowledge Base and Automations. | BP-K, BP-COV-2, BP-SC-2 | GAP-55 |
| R1.2 | Knowledge is stored as typed facts, each with evidence (which answer, document or record it came from) and a confidence score. | BP-FR-03, BP-FR-06, BP-FR-11 | GAP-55 |
| R1.3 | Every fact moves through Extracted → Inferred → Reviewed → Validated → Approved → Published → Consumed; only Approved knowledge drives artifacts or AI behaviour. | BP-L-1/2 | GAP-56 |
| R1.4 | Every answer passes a review pipeline (intent, extraction, completeness, specificity, operational readiness, consistency, dependencies, confidence, approval); a failure produces a targeted follow-up question. | BP-R-1/2, BP-FR-04/08 | GAP-57 |
| R1.5 | Contradictions between facts are detected automatically and must be resolved before approval. | BP-FR-05, BP-V-3 | GAP-58 |
| R1.6 | Missing dependencies are detected (e.g. a calling agent needs calling-hours rules). | BP-V-5, BP-C-6 | GAP-59 |
| R1.7 | The interview is complete only when every required domain reaches its confidence threshold; coverage is shown continuously. | BP-COV-1/3, BP-FR-07 | GAP-60 |
| R1.8 | The Copilot is a set of single-purpose stages: orchestrator, planner, extraction, domain expert, review, consistency, gap analysis, confidence, recommendation, workspace builder. | BP-M | GAP-61 |
| R1.9 | Interview sessions persist independently of conversations; knowledge is versioned and published as immutable versions. | BP-FR-01/02, BP-NFR-03 | GAP-55 |
| R1.10 | Nothing downstream reads raw conversation history; the conversation layer never creates CRM artifacts. | BP-K-4, BP-A-1/2, BP-SC-1 | GAP-55 |

### R2 — Interview experience (bet B17)

| # | Requirement | Blueprint | Gap |
|---|---|---|---|
| R2.1 | Users can type, record voice messages, upload documents, point at their website, import CRM/email data and upload meeting transcripts; all become evidence for structured knowledge. | BP-UX-1/2 | GAP-62 |
| R2.2 | Onboarding is asynchronous by default: pause and resume at any time with state kept. | BP-VS-1/2 | GAP-62 |
| R2.3 | Three interview modes: Guided (default, one question at a time), Business Discovery (talk freely, then targeted follow-ups), Collaborative Design (review, correct and ask "why" inline). | BP-IM | GAP-63 |
| R2.4 | Continuous live voice is optional, and offered mainly for day-to-day CRM use. | BP-VS-3 | — (ADR-0083) |

### R3 — Workspace generation (bet B18)

| # | Requirement | Blueprint | Gap |
|---|---|---|---|
| R3.1 | From approved knowledge, generate CRM objects, fields, relationships, pipelines, views, dashboards and permissions. | BP-G-1, BP-FR-09 | GAP-64 |
| R3.2 | Generate automation: workflows, routing, assignment, notifications, triggers. | BP-G-2 | GAP-65 |
| R3.3 | Generate knowledge artifacts: FAQs, playbooks, prompt context, documentation. | BP-G-4 | GAP-66 |
| R3.4 | Generation is deterministic: the same published knowledge yields the same workspace. | BP-NFR-04 | GAP-67 |
| R3.5 | Every artifact answers: why was I created, which answers created me, which business rules I implement, which agents depend on me. | BP-P-4, BP-FR-11, BP-SC-9 | GAP-68 |
| R3.6 | A readiness report is produced before activation; production provisioning is refused while critical knowledge is missing. | BP-V-9, BP-C-10, BP-FR-12 | GAP-69 |
| R3.7 | No artifact is created straight from a prompt; requests to change the workspace become proposed knowledge changes. | BP-P-2 | GAP-84 |

### R4 — AI agents (bets B19, B22)

| # | Requirement | Blueprint | Gap |
|---|---|---|---|
| R4.1 | Every AI agent is generated from the CBKM and declares required knowledge, prompts, workflows, integrations, permissions and a readiness threshold. | BP-AG-1/2, BP-FR-10 | GAP-70 |
| R4.2 | The interview continues until enabled agents meet their readiness scores. | BP-AG-3 | GAP-70 |
| R4.3 | All agents consume the same business model and the same interaction history. | BP-P-3, BP-UI-2, BP-SC-4 | GAP-70, GAP-75 |
| R4.4 | Customer-facing agents, in order: calling, qualification, email, support, meeting assistant, renewal; plus SMS. | BP-RM-5, BP-G-3 | GAP-79 |
| R4.5 | New AI capabilities arrive without redesigning the interview. | BP-SC-8 | GAP-70 |

### R5 — Integrations and interactions (bets B20, B21)

| # | Requirement | Blueprint | Gap |
|---|---|---|---|
| R5.1 | An Integration Capability Registry tracks each capability (Email, Phone, SMS, Calendar, Meetings, Notes, Documents, …) per workspace in states Not Available, Available, Connected, Configured, Operational, Error. | BP-I-2/3 | GAP-71 |
| R5.2 | Knowledge and generated workflows never depend on integration availability; workflows are generated before integrations connect. | BP-I-1/4, BP-SC-5 | GAP-71 |
| R5.3 | Providers sit behind abstractions; business logic names no provider. | BP-RM-3, BP-SC-6, BP-NFR-07 | GAP-72 |
| R5.4 | An authentication framework connects third-party accounts (OAuth, token refresh, revocation). | BP-RM-3 | GAP-73 |
| R5.5 | Inbound provider events are normalized into provider-neutral events. | BP-RM-3 | GAP-74 |
| R5.6 | One interaction model for email, phone, SMS, meetings, notes and future channels. | BP-UI-1, BP-SC-7 | GAP-75 |
| R5.7 | Channels in order: notes & timeline, email, calendar & meetings, phone, SMS. | BP-RM-4 | GAP-75..78 |

### R6 — Continuous evolution (bet B23)

| # | Requirement | Blueprint | Gap |
|---|---|---|---|
| R6.1 | The platform learns from workspace activity and proposes knowledge improvements through the same review and approval path. | BP-P-5, BP-C-11 | GAP-80 |

### R7 — Platform qualities (bets B14, B15 and all)

| # | Requirement | Blueprint | Gap |
|---|---|---|---|
| R7.1 | **Every change to data** is recorded as an event and state is derived from events (Postgres store); nothing — code, job, webhook, console or migration — can change a table without an event. | BP-ES-1..5 | GAP-81, GAP-82 |
| R7.1a | Every change records who made it, on whose behalf, under which permission, why, and from which knowledge; history is tamper-evident. | BP-ES-6/7 | GAP-81 |
| R7.2 | Personal data in events is erasable (crypto-shredding). | BP-ES-3 | GAP-81 |
| R7.2a | When an account is deleted it closes at once, a nightly job wipes all of its data, and the owner receives a confirmation of what was removed and what remains elsewhere (backups up to 30 days, invoices at Stripe). | BP-ES-8 | GAP-81 |
| R7.2b | **Fundamental:** everyone viewing the same lead — or any record or list — sees changes as they happen (within about a second), whether a person, an agent or an automation made them, and never sees data they are not allowed to read. | BP-RT-1 | GAP-81 |
| R7.3 | Versioned prompts; prompt evaluation and regression testing. | BP-NFR-02/11 | GAP-70 |
| R7.4 | Multi-model AI with cost-aware routing. | BP-NFR-08/12 | GAP-83 |
| R7.5 | Enterprise availability, auditability, explainability, tenant isolation, human approval, end-to-end observability. | BP-NFR-01/05/06/09/10/13 | GAP-81, GAP-68 |

## Success criteria

The refactor is done when: conversation is no longer the source of truth; the CBKM is the system of record; every
CRM artifact is generated from approved knowledge; every agent consumes the same model; business logic is
independent of providers; integrations sit behind abstractions; interactions share one model; new AI capabilities
need no interview redesign; every artifact is explainable, auditable and traceable (BP-SC-1..9). The CRM plan §14
names the test or gate that proves each one.

## Changelog

- 2026-11-08 v1: first version, from the Refactoring Blueprint v1.0 and the owner rulings of the same day.
