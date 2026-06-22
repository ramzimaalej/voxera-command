# product-refactor-roadmap — process description

**Process id:** `voxera/product-refactor-roadmap`
**Entry:** `.a5c/processes/product-refactor-roadmap.js#process`
**Repo / CWD:** `voxera-command` (business process — exec-run; may read confidential vision/strategy and read down into `../voxera-crm`).

## What it produces

1. **Gap-analysis dossier** — new doc at `docs/product/gap-analysis-crm-to-product.md`: target-product capability inventory vs. current-CRM capability map, a categorized + sized + risk-tagged gap backlog, the RICE ranking, and the sequenced-bets summary.
2. **Rewritten roadmap** — `docs/product/roadmap.md` rewritten as the full CRM → product roadmap, expressed as Shape-Up appetite bets across Now / Next / Later, preserving the existing two-motion (DACH + English) structure and live items (FEAT-001/002), version-bumped with a changelog line.
3. **ADR(s)** — 0–3 federated ADRs for the load-bearing build-order decisions, filed in the owning repo per the federation rule, globally numbered, registered, and backlinked.

## The problem it solves

The vision/strategy describe an AI-native CRM whose differentiator is AI calling; the demo prototype (`/Users/ramzi/Downloads/voxera-demo/my-app/src/App.jsx`) is the clickable target product (Business Context → Configurator → agent roster → live-call takeover → Decision Records → Critic/Promoter loop → engine-enforced compliance). The current CRM is a strong **data backbone** (49 Prisma models, IAM/RBAC, pipeline, contacts, activity log, power-dialer, Twilio/Telnyx telephony + transcription) with **no AI-agent layer**. This process does a rigorous **target → current → gap → prioritize → sequence → write** pass to turn that delta into a buildable, strategy-consistent roadmap.

## Design choices (from the interview)

| Decision | Choice | How it shows up |
|---|---|---|
| Deliverables | Gap dossier + rewritten roadmap.md + ADRs (no FEAT stubs) | Phases 6–8; FEATs are only *pointed to* by ID per ADR-0014 |
| Framing | Shape-Up appetite bets | Phase 5 emits bets (appetite / problem / solution sketch / rabbit holes) |
| Build approach | Brownfield, honor existing phases | Phases 2 & 5 read and reconcile `engineering-os/roadmap/restructuring-roadmap.md` + tech-debt ledger |
| Prioritization | RICE | Phase 4 scores every gap; Phase 5 sequences RICE-rank ⨯ dependency |

RICE and Shape-Up are reconciled: **RICE ranks and selects**, **Shape-Up expresses** the selected work as fixed-appetite, no-date bets bucketed to the strategy's 12/24/36-month milestones.

## Phases

| # | Phase | Kind | Output |
|---|---|---|---|
| 1 | Define target product | agent | capability inventory (themes) |
| 2 | Map current CRM | agent | current-state map + existing phases/debt |
| — | **Gate 1** | breakpoint | approve target ↔ current framing |
| 3 | Gap analysis | agent | categorized GAP backlog |
| 3b | Review + refine (≤2) | agent loop | completeness/strategy-fit ≥ 85 |
| — | **Gate 2** | breakpoint | approve gap backlog |
| 4 | RICE prioritization | agent | ranked, scored backlog |
| 5 | Shape-Up sequencing | agent | betting table (Now/Next/Later) |
| — | **Gate 3** | breakpoint | approve sequencing (architecture decision) |
| 6 | Draft dossier + roadmap | agent ×2 | two drafts in `artifacts/` |
| 6b | Review + refine (≤2) | agent loop | consistency+brand+feasibility ≥ 85 |
| — | **Gate 4** | breakpoint | approve & apply (or dry-run exit) |
| 7 | Apply both docs | agent | canonical docs written + verified |
| 8 | Decision check → ADR gate → write | agent + breakpoint | 0–3 federated ADRs |

## Inputs

```jsonc
{
  "demoPath":      "/Users/ramzi/Downloads/voxera-demo/my-app",   // target prototype
  "crmRepoPath":   "../voxera-crm",                                // current state
  "roadmapPath":   "docs/product/roadmap.md",
  "gapDossierPath":"docs/product/gap-analysis-crm-to-product.md",
  "visionPath":    "docs/vision/vision.md",
  "strategyPath":  "docs/strategy/strategy.md",
  "dryRun":        false                                            // true = stop after Gate 4, write nothing
}
```

## Output

```jsonc
{
  "success": true,
  "roadmapPath": "docs/product/roadmap.md",
  "newRoadmapVersion": 4,
  "gapDossierPath": "docs/product/gap-analysis-crm-to-product.md",
  "gapCount": 0, "betCount": 0,
  "adrsCreated": []
}
```

## Library composition

- **software-architecture / migration-strategy** → the brownfield spine (current → target → gap → strategy → roadmap → validate).
- **product-management / quarterly-roadmap** + **rice-prioritization** → RICE scoring + roadmap-document generation.
- **methodologies / shape-up** → appetite bets (fixed appetite, variable scope, no dates).
- **voxera-command / iterate-vision** → the doc-frontmatter/changelog + ADR-capture conventions (`general-purpose` agent, `artifacts/` drafts, refine loops, `extract-adr`).

## Guardrails

- **Plan-mode artifact:** this run is authored but **not created/executed** by `/babysitter:plan`. To run it: `/babysitter:call --process .a5c/processes/product-refactor-roadmap.js#process --inputs '{...}'`.
- All agent tasks use `general-purpose` (the only installed general agent; matches `iterate-vision.js`).
- Confidentiality holds: a *business* process here may read down into the engineering repo; it never makes an engineering process read up into `voxera-command`.
- Canonical docs are written only after Gate 4; everything before is in `artifacts/`. Versioning + changelog follow `.claude/rules/docs.md`; ADRs follow `.claude/rules/adrs.md` (global numbering, federated by domain).
