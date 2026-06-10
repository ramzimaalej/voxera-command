---
title: Operations docs
version: 2
status: active
updated: 2026-06-09
owner: you
---

# Operations docs

Day-to-day running of the Voxera business. Strategy lives in `../strategy/` and the company-level decision log in `../../decisions/`. Product/platform architecture lives with the code that owns it (CRM in `../../../voxera-crm/docs/architecture/`, infra in `../../../voxera-infra/`). This folder is for **operational rhythm** — weekly reviews, customer pulse, meeting notes, OKRs (when added).

For a 5-person bootstrapped startup, this is intentionally lightweight. Add structure when you feel its absence; don't pre-build for headcount you don't have.

## Layout

```
docs/operations/
├── README.md                          this file
├── weekly-reviews/                    one file per week (YYYY-MM-DD.md)
│   └── README.md                      index, newest first
├── customers/                         one file per customer
│   └── README.md                      index of active + churned customers
├── meetings/                          (optional) one file per meeting worth keeping
└── templates/
    ├── weekly-review-template.md
    ├── customer-pulse-template.md
    └── meeting-notes-template.md
```

## How it flows

The **weekly business review** (Friday or end-of-week) is the spine:

1. Run `/babysitter:call --process .a5c/processes/weekly-business-review.js#process --inputs '{"weekEnding": "YYYY-MM-DD"}'`.
2. The process gathers state, loops over customers (invoking the `customer-pulse-update` skill per customer), drafts a weekly note, asks you to approve + set next-week priorities, and archives to `weekly-reviews/<date>.md`.

In between, **decisions, meetings, and customer signals** flow into the right place:
- A decision → `capture-decision` skill → drafted ADR. Strategy/brand/company-wide decisions land in `../../decisions/`; product/technical decisions are routed to the owning code repo's `decisions/` (see `../../.claude/rules/adrs.md`).
- A meeting → `meeting-notes` skill → structured notes, optionally saved to `meetings/`.
- A customer signal → `customer-pulse-update` skill → appended to the customer's pulse file.

## What does NOT live here

- Strategy (lives in `../strategy/`).
- Architecture (CRM platform architecture lives in `../../../voxera-crm/docs/architecture/`; infra in `../../../voxera-infra/`).
- Decisions (company-wide ADRs live in `../../decisions/`; product/technical ADRs live in the owning code repo's `decisions/`).
- Features / bugs (live in `../product/features/` and `../product/bugs/`).
- Brand (lives in `../brand/`).
- Code repos (`voxera-crm`, `voxera-website`, `voxera-infra`).

Operations is the *rhythm* layer above everything else.

## When this folder grows

Things to add when you feel the absence:
- **`okrs/`** — quarterly OKRs when you start setting them. (Skip until you have a real team meeting where they'd matter.)
- **`1-on-1s/`** — per-report prep + history. (Skip until you have direct reports beyond your co-founder.)
- **`advisor-updates/`** — monthly or quarterly. (Skip until you have advisors.)
- **`competitive/`** — per-competitor brief, updated when they ship something material.
- **`pricing/`** — when pricing decisions get more than once a year.

Don't pre-create empty folders. The skill / process catalog above is what's worth automating today.

## See also

- `../../.a5c/processes/weekly-business-review.js` — the weekly-rhythm process.
- `../../.claude/skills/capture-decision/` — quick decision → draft ADR.
- `../../.claude/skills/meeting-notes/` — raw notes → structured output.
- `../../.claude/skills/customer-pulse-update/` — update a customer pulse file.
- `../strategy/strategy.md` — the canonical strategic frame this is operationalizing.

## Changelog
- 2026-06-09 v2: updated cross-references after the domain-cohesion reorg — CRM platform architecture moved to `voxera-crm/docs/architecture/`, infra to `voxera-infra/`; ADR capture now routes product/technical decisions to the owning code repo's `decisions/` (federated decision log).
- 2026-05-31 v1: initial. Set up alongside the weekly-business-review process + capture-decision / meeting-notes / customer-pulse-update skills.
