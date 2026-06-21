# Voxera Workspace

This folder is a multi-repo workspace. Sibling repos, one shared brain.

| Repo | Role | You run babysitter here to… |
|------|------|------------------------------|
| `voxera-command/` | Source of truth: vision, roadmap, features, bugs, **company-level decisions**, **business processes** (exec-only) | iterate on strategy/vision/brand/roadmap |
| `voxera-os/` | Shared **Workspace OS**: the generic engineering babysitter processes, **brand guidelines**, the cross-repo **ADR registry** | author/iterate engineering processes, brand, allocate ADR numbers |
| `voxera-crm/` | CRM product code — owns its **product engineering OS (`engineering-os/`: architecture + patterns + standards + gates) + technical ADRs (`decisions/`)** | build/iterate the CRM from specs |
| `voxera-infra/` | Infra/IaC code — owns its **infra ADRs (`decisions/`)** | build/iterate the cloud infrastructure |
| `voxera-website/` | Marketing site code | build/iterate the website from specs |
| `voxera-sales/` | Sales-consulting site code | build/iterate the sales site from specs |

**Cohesion rule:** strategy/vision are owned by `voxera-command`, brand + engineering processes by `voxera-os` and *referenced* by the others; product/technical architecture and decisions are owned by the code repo they constrain and live there. Nothing forks.

## The three OS layers

Every artifact in this workspace belongs to exactly one of three operating-system layers. Most "duplication" you might spot across them is deliberate layering — **read the actual files before concluding two things are the same.**

1. **Workspace OS — `voxera-os/` ("how we all work").** Shared, non-confidential: the *generic* engineering babysitter processes — the work-type taxonomy `design-feature` → `build-feature` · `improve-feature` · `fix-bug` · `pay-down-debt`, plus supporting `design-review` · `apply-infra` · `harvest-feature` (+ `_lib/`) — the process-authoring conventions (`.claude/rules/processes.md`), the brand guidelines (`docs/brand/`), and the cross-repo **ADR number registry** (`decisions/ADR-REGISTRY.md`). Any engineer or copywriter uses it without touching confidential business data.
2. **Business OS — `voxera-command/` ("why / what, for the business"), exec-only.** Vision, strategy, roadmap, company-level ADRs, CEO operations, and the business processes (`iterate-doc`, `iterate-vision`, `weekly-business-review`, `revenue-pulse`). Confidential — non-execs never need it (ADR-0014/0015).
3. **Product Engineering OS — one per code repo ("how THIS codebase must be built").** Lives *with the code it constrains* (the cohesion rule), never centralized. The richest is `voxera-crm/engineering-os/`: architecture standards + machine-readable checklists + **executable conformance gates** + reviewer agents + a subsystem ADR log + the bounded-context map + tech-debt/lessons ledgers. Sites and infra carry a lighter version.

### Two names that mean two things — don't conflate

- **"Engineering OS" lives at two altitudes.** `voxera-os` is the *shared* layer (how processes run + shared conventions). A code repo's `engineering-os/` is *product-specific* (how that one codebase must be structured). Both are legitimate; the product one correctly lives in the code repo, not in `voxera-os`.
- **There are two ADR tiers, both intentional.** Workspace-**federated** ADRs are `ADR-NNNN` (globally numbered via the `voxera-os` registry, stored in each repo's `decisions/`). A code repo may *also* keep a **subsystem** ADR set for its own engineering standards (e.g. `voxera-crm/engineering-os/standards/adr-<concern>.md`, indexed by `engineering-os/decisions/adr-log.md`) — these are not workspace-numbered and are blessed by the federated ADR that authorizes the subsystem (ADR-0019). Rule of thumb: a decision that constrains the whole workspace → `ADR-NNNN`; a decision internal to one repo's standards → that repo's subsystem set.
- **Processes can be generic *or* gate-aware.** `voxera-os` ships the generic baseline processes. A code repo with an `engineering-os/` may keep its own *gate-aware* processes that wire its conformance gates (e.g. the CRM's gate-aware `build-feature` / `fix-bug` / `pay-down-debt`). The local gate-aware version is canonical *for that repo*; the `voxera-os` version is the baseline for repos without an engineering OS. This is not a fork.

> **Before "fixing" the taxonomy:** renaming a subsystem ADR, centralizing a code repo's `engineering-os/` into `voxera-os`, or deleting a gate-aware process all *look* like cleanups but break deliberate layering. Confirm against the files first.

### Standard code-repo skeleton

Every code repo (`voxera-crm`, `voxera-website`, `voxera-sales`, `voxera-infra`) uses the same governance vocabulary, scaled to need — so the top level reads the same everywhere:

| Folder | Meaning | Scale |
|---|---|---|
| `engineering-os/` | Durable engineering knowledge + governance. CRM: **full** (architecture, patterns, reference, standards, gates, domain, learning, roadmap, operations). Sites + infra: **lean** (`patterns/` + `learning/`). | all code repos |
| `decisions/` | Technical ADRs, numbered from the `voxera-os` registry. One ADR home per repo. | all code repos |
| `features/` | Feature work, **folder-per-feature** with an anti-rot lifecycle (below). | feature-driven repos (crm, website, sales) — **not** infra, which is stage-driven via `apply-infra` |
| `.a5c/` · `.claude/` | Babysitter (`commands.json`, runs) · Claude Code harness (agents, rules, skills). | all code repos |

**Feature anti-rot lifecycle (don't let `features/` become a bag of files):**
`_template/` → active `FEAT-xxx-<slug>/` (spec, test-cases, plan, status, handoff) → **on DONE run `harvest-feature`** → durable knowledge promoted UP (patterns → `engineering-os/patterns/`, lessons → `learning/lessons-log`, debt → `tech-debt-inventory`, decisions → a `decisions/` ADR) → folder slimmed to `spec.md` + `outcome.md` and moved to `features/_archive/`. The `harvest-feature` process (`voxera-os/.a5c/processes/`) does this; working files stay recoverable in git history.

## Golden rules for any agent working here
1. **Canonical strategy lives in `voxera-command/docs/`. Reference it, never fork it.** If the website or CRM needs a fact about the product, read it from there.
2. **Process definitions are split by audience.** Engineering processes (`build-feature`, `fix-bug`, `design-review`) live in `voxera-os/.a5c/processes/` and code repos invoke them by relative path (`../voxera-os/...`); business processes (`iterate-doc`, `iterate-vision`, `weekly-business-review`, `revenue-pulse`) live in `voxera-command/.a5c/processes/`. Do not copy them.
3. **Specs drive work.** In code repos a feature is a folder `features/FEAT-xxx-<slug>/` (with `spec.md`); a bug is a `BUG-xxx`. Implementation runs take a spec path as input. DONE features are harvested + archived (see the lifecycle above), not left to pile up.
4. **Real decisions get an ADR — federated by domain.** Strategy/brand/vision/governance ADRs live in `voxera-command/decisions/`; product/technical ADRs live in the owning code repo's `decisions/` (CRM in `voxera-crm/decisions/`, infra in `voxera-infra/decisions/`). Numbers are global + permanent across the workspace; `voxera-os/decisions/ADR-REGISTRY.md` is the registry + allocator. Babysitter's run journal is execution history; ADRs are the strategic "why".
5. **Versioning = git.** One canonical file per doc with frontmatter (`version`, `status`, `updated`) + a changelog block. Freeze milestones with annotated tags (e.g. `vision-v2`), not `vision-final-final.md`.

## Typical loops
- **Vision/brand/roadmap:** `cd voxera-command && /babysitter:call iterate the vision doc: <what you want to change>`
- **CRM feature:** `cd voxera-crm && /babysitter:call --process ../voxera-os/.a5c/processes/build-feature.js#process implement features/FEAT-007-pipeline-view/spec.md`
- **Website fix:** `cd voxera-website && /babysitter:call --process ../voxera-os/.a5c/processes/fix-bug.js#process fix features/BUG-014-hero-cls.md`

<!-- BEGIN babysitter (project-install) -->
## Babysitter

This workspace has a babysitter project profile at `.a5c/project-profile.json` (generated by `project-install`). It complements the "Typical loops" above — those are the everyday entry points; this section is the operating contract.

**Canonical processes** are split by audience and invoked by relative path — never copy them into a repo. Engineering processes live in `voxera-os/.a5c/processes/` (invoked as `../voxera-os/...`):
- `design-review.js` — engineering design gate: per-discipline design → adversarial-review → converge loops producing a design dossier. Ships the **DDD → ERD → Prisma → GraphQL → Webhook → AI-agent → Analytics → OO → React → TDD** lenses (`*-designer`/`*-reviewer` agents in `voxera-crm/.claude/agents/`). Runs standalone, and gates `build-feature` before planning. Extend via `LENS_REGISTRY`.
- `build-feature.js` — build a `FEAT-xxx` spec (design-review gate → plan → implement → quality-gate loop).
- `fix-bug.js` — resolve a `BUG-xxx` spec.

Business processes live in `voxera-command/.a5c/processes/`:
- `iterate-doc.js` — converge on a doc (brand/roadmap/spec).
- `iterate-vision.js` — strategy/vision iteration.
- `weekly-business-review.js` — operating-cadence review.

Each process reads its quality gates from the **target repo's `.a5c/commands.json`** (lint/test/build/typecheck), so the same process adapts per repo.

**Default methodology:** spec-driven (`FEAT-xxx` / `BUG-xxx`) plus ATDD/TDD, with iterative-convergence quality gates — write the acceptance/test first, converge until gates pass. Features with data/domain/API/behavior impact additionally pass a **design-first gate** (`design-review.js`: DDD → ERD → Prisma → GraphQL → Webhook → AI-agent → Analytics → OO → React → TDD design + adversarial review) before any code is planned. See `voxera-crm/.claude/rules/engineering-design.md`.

**Autonomy:** semi-autonomous. Proceed without prompting on routine work, but **pause** (the `alwaysBreakOn` set) at: architecture choices, deploys, destructive git operations, and database migrations.

**Tracked remediation focus** (surfaced by git-history mining; candidates for `fix-bug` / refactor runs):
- **PP-001** — fragile ZModel→Prisma migrations; protected by a guarded migration gate.
- **PP-002** — committed generated GraphQL client + lockfiles bloating diffs.
- **PP-003** — duplicated per-product forms.
- **PP-004** — `ProspectsDetails` god component.

**Quality skills** available across the workspace: `code-review`, `verify`, `simplify`, `security-review`.
<!-- END babysitter (project-install) -->
