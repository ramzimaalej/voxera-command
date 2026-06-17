---
id: ADR-0014
title: Split the engineering operating system into voxera-os; keep voxera-command exec-only
status: accepted
date: 2026-06-16
supersedes: []
superseded_by: null
affects:
  - voxera-command/CLAUDE.md
  - voxera-command/.a5c/processes/
  - ../voxera-crm/CLAUDE.md
  - ../voxera-website/CLAUDE.md
  - ../voxera-infra/CLAUDE.md
  - ../voxera-sales/
---

## Context

`voxera-command` is the source of truth for confidential business state — company strategy, financials, the revenue model (~3.5 weeks runway as of 2026-06-14), per-customer pulse, and weekly reviews. It *also* holds the babysitter engineering processes (`implement-feature`, `fix-bug`, `design-review`) and the product specs (FEAT/BUG) that engineers implement.

This couples confidential data to everyday engineering. Today `voxera-crm/CLAUDE.md` (and the other code repos) instruct engineers to read specs from `../voxera-command/docs/` and invoke processes from `../voxera-command/.a5c/processes/`. **No one can work on the CRM, website, sales site, or infra without checking out the confidential repo.** As the team grows beyond executives, that is unacceptable: a contractor or non-exec engineer would gain access to financials and customer data they should not see.

The workspace already commits to a federation principle (decisions and architecture live next to the code they constrain). Confidentiality just makes the same principle load-bearing for *processes* too.

## Decision

Split the operating system along the confidentiality boundary:

- **`voxera-command`** stays **exec-only**: vision, company strategy, brand, operations (financials/customers/weekly), company-level ADRs, the roadmap (which references specs by ID), and the **business** processes that operate on confidential docs and are run by execs (`iterate-vision`, `iterate-doc`, `weekly-business-review`, and the planned `revenue-pulse`).
- **`voxera-os`** (new sibling repo) holds the **shared engineering operating system**: the engineering babysitter processes (`implement-feature`, `fix-bug`, `design-review`, and planned `refactor`, `apply-infra`), a shared `.a5c/processes/_lib/` (gate/verify/tracking/adr helpers), and the cross-repo engineering rules/conventions. Code repos reference `../voxera-os/.a5c/processes/...`.
- **Specs follow the code:** a FEAT/BUG is implemented by engineers, so it lives in the repo that implements it (`voxera-crm/features/` is already this pattern; FEAT-001/002 move to `voxera-website`). The confidential roadmap references them by ID across the boundary — IDs leak nothing.

Net invariant: **an engineer clones `voxera-os` + their code repo, never `voxera-command`.**

## Alternatives considered

- **Keep processes in `voxera-command`** (status quo) — rejected: directly violates the confidentiality requirement; every engineer needs the confidential repo.
- **Vendor processes as a git submodule into each code repo** — rejected as default: avoids the `../` sibling dependency but adds submodule friction on every clone/update and risks version skew across repos. `voxera-os` keeps a single source with no per-repo pinning.
- **Publish processes as an npm/CLI package each repo installs** — rejected for now: most decoupled but heaviest to set up and slows iteration on the processes themselves at this stage. Revisit if `voxera-os` needs independent versioning per consumer.
- **Move processes *into* the most-used code repo (`voxera-crm`)** — rejected: website/sales/infra also consume them; this would fork or create a wrong-owner dependency.

## Consequences

- Positive:
  - Confidential business data is isolated; non-exec engineers get exactly what they need and nothing more.
  - Reinforces the existing federation principle (decisions/architecture/specs/processes all live next to the work they serve).
  - The shared `_lib/` extraction that `voxera-os` enables removes the `loadGateTask`/verify duplication between `implement-feature` and `fix-bug`.
- Negative / risks:
  - One more repo to set up and keep wired; the workspace `README.md` and every code repo's `CLAUDE.md` must be re-pointed from `../voxera-command/...` to `../voxera-os/...`.
  - Specs moving to code repos means the roadmap ↔ spec link now crosses a repo boundary (by ID); tooling that assumed a single specs folder must be updated.
  - `product-architecture-strategy.md` (formerly `strategy-v1.0.md`) is confidential and stays in `voxera-command`; engineer-facing architecture docs reference it conceptually, not by link.
- Follow-ups:
  - Stand up `voxera-os`; move `implement-feature`/`fix-bug`/`design-review` + extract `_lib/`.
  - Re-point `CLAUDE.md` references in voxera-crm, voxera-website, voxera-sales, voxera-infra.
  - Move FEAT-001/FEAT-002 to `voxera-website/features/`.
  - Create `voxera-crm/decisions/` and record the phantom ADRs (ADR-0002–0007, 0011, 0013) from the now-placed `docs/architecture/` set.
