ca# Voxera workspace

This folder runs Voxera. Four repos, two parallel go-to-market motions, one set of tools.

Voxera is an **AI-native CRM with AI calling as the core capability**, run in two motions (per [ADR-0009](./voxera-command/decisions/ADR-0009-english-markets-parallel-motion.md)): DACH/Pflegebox (founder-led, UWG §7-compliant) + English-speaking markets (paid-search-led, three SMB verticals — real estate, home services, insurance). The product is one codebase; the motions differ in lead source, vocabulary, and compliance frame.

This README is the leverage guide: *how to use* the agents, skills, processes, rules, and docs that have been set up. For Claude-specific instructions, see `CLAUDE.md` (auto-loaded into every session). For strategic context, start at [`voxera-command/docs/strategy/strategy.md`](./voxera-command/docs/strategy/strategy.md).

---

## The shape

```
voxera-workspace/                   <- you are here
├── voxera-command/                 strategy, decisions, processes, brand, operations
│   ├── docs/strategy/              strategy.md + vertical-strategy-english-markets.md
│   ├── docs/architecture/          system docs (vision-and-principles, execution, voice-calling, …)
│   ├── docs/operations/            CEO ops: weekly reviews, customer pulse, templates
│   ├── docs/product/               roadmap.md + features/ (FEAT-xxx) + bugs/ (BUG-xxx)
│   ├── docs/brand/                 brand guidelines (voice, palette, writing rules)
│   ├── decisions/                  ADR-0001 … ADR-NNNN (the strategic "why")
│   ├── .a5c/processes/             babysitter process .js files (workflows)
│   └── .claude/skills/             local skills (extract-adr, capture-decision, …)
├── voxera-crm/                     CRM product (NestJS + Pothos + Prisma + Mantine, Nx monorepo)
│   ├── apps/{backend, frontend}/
│   ├── libs/                       shared TS libs (Pothos, Prisma schema, shared-types)
│   ├── features/<id>/              per-feature SDLC artifacts (spec / test-cases / plan)
│   ├── docs/patterns/              concrete code-pattern documentation
│   └── .claude/{agents,skills,rules}/   feature SDLC stack + per-domain rules
├── voxera-website/                 marketing site (Astro on Cloudflare Pages)
│   ├── src/{pages, components}/
│   ├── functions/                  Cloudflare Pages Functions (api endpoints)
│   └── .claude/{agents,skills,rules}/   brand voice reviewer + i18n + per-tech rules
└── voxera-infra/                   Terraform code for GCP infrastructure (Fabric modules)
    ├── bootstrap/                  one-time: ops project, state bucket, terraform SA
    ├── environments/dev/           per-env: project, APIs, workload scaffolding
    └── .claude/rules/              terraform + gcp + security rules
```

**External services**: GCP (primary cloud, per [ADR-0010](./voxera-command/decisions/ADR-0010-terraform-gcp-fabric-modules.md)) + Cloudflare (marketing site only) + Twilio + Ultravox (voice stack, [ADR-0007](./voxera-command/decisions/ADR-0007-twilio-ultravox-voice-stack.md)) + SendGrid + Honeycomb.

---

## What's where (at a glance)

| Repo | What's installed | Source-of-truth doc |
|---|---|---|
| **voxera-command** | 5 processes, 7 skills, 4 rules | [voxera-command/CLAUDE.md](./voxera-command/CLAUDE.md) |
| **voxera-crm** | 6 subagents, 7 SDLC skills, 8 rules, ESLint w/ Nx tags + type-aware rules | [voxera-crm/.claude/CLAUDE.md](./voxera-crm/.claude/CLAUDE.md) |
| **voxera-website** | 1 subagent (brand-voice), 1 skill (i18n parity), 4 rules, ESLint flat config | [voxera-website/CLAUDE.md](./voxera-website/CLAUDE.md) |
| **voxera-infra** | 3 rules (terraform, security, gcp) | [voxera-infra/CLAUDE.md](./voxera-infra/CLAUDE.md) |
| **User-level** | `code-reviewer` agent at `~/.claude/agents/`; profile at `~/.a5c/user-profile.json` | n/a |

---

## By task: "I want to do X — what do I run?"

### Strategy + decisions

| Task | Where to do it | How |
|---|---|---|
| Capture a decision I just made (chat-shape) | `voxera-command` | `capture-decision` skill — prompts for missing pieces, drafts ADR |
| Extract a decision from a long spec doc | `voxera-command` | `extract-adr` skill |
| Iterate the vision / brand / strategy doc | `voxera-command` | `/babysitter:call iterate <doc>: <change>` (runs `iterate-vision.js` — brand gate + ADR detection) |
| Iterate any other doc (lightweight) | `voxera-command` | `/babysitter:call --process .a5c/processes/iterate-doc.js#process --inputs '{"docPath":"...","change":"..."}'` |
| Roadmap edit | `voxera-command` | Use iterate-doc on `docs/product/roadmap.md` |

### Product + engineering

| Task | Where to do it | How |
|---|---|---|
| Draft a FEAT-xxx spec | `voxera-command` | Copy `docs/product/features/FEAT-000-template.md`; follow [specs.md rule](./voxera-command/.claude/rules/specs.md) |
| Implement a FEAT end-to-end (in code repo) | `voxera-crm` or `voxera-website` | `/babysitter:call implement ../voxera-command/docs/product/features/FEAT-xxx.md` |
| File a BUG-xxx | `voxera-command` | Copy `docs/product/bugs/BUG-000-template.md`; include the regression-test contract |
| Fix a BUG test-first | `voxera-crm` or `voxera-website` | `/babysitter:call fix ../voxera-command/docs/product/bugs/BUG-xxx.md` |
| PR-style code review on a diff | any repo | Spawn `code-reviewer` agent via Task tool (loads target repo's CLAUDE.md + rules + ADRs first) |
| Generate spec / tests / plan within voxera-crm | `voxera-crm` | `/new-feature`, `/refine-feature-spec`, `/generate-test-cases`, `/generate-implementation-plan` (the local skills) |

### Marketing + brand

| Task | Where to do it | How |
|---|---|---|
| Review copy against brand voice | `voxera-website` | Spawn `brand-voice-reviewer` agent via Task tool |
| Lint copy against brand rules (read-only check) | `voxera-command` | `brand-conformance` skill |
| Check EN ↔ DE parity in i18n.json | `voxera-website` | `i18n-parity-check` skill |
| Update the brand guidelines doc | `voxera-command` | `/babysitter:call iterate docs/brand/brand-guidelines.md: <change>` |

### Customer + CEO ops

| Task | Where to do it | How |
|---|---|---|
| Weekly business review (Friday rhythm) | `voxera-command` | `/babysitter:call --process .a5c/processes/weekly-business-review.js#process` |
| Update a customer pulse file | `voxera-command` | `customer-pulse-update` skill (or auto-invoked by weekly review) |
| Structure raw meeting notes | `voxera-command` | `meeting-notes` skill |
| What should I work on this week? | `voxera-command` | `priorities-coach` skill |
| What's been slipping? | `voxera-command` | `accountability-check` skill |

### Infra

| Task | Where to do it | How |
|---|---|---|
| First-time GCP bootstrap | `voxera-infra/bootstrap/` | Fill `terraform.tfvars`, `terraform init && terraform apply`, migrate state per README |
| Provision dev env workloads | `voxera-infra/environments/dev/` | Uncomment commented stubs in `main.tf` as decisions get made |
| Add a new GCP environment | `voxera-infra/environments/` | `cp -r dev/ staging/`, edit `backend.tf` prefix + tfvars |
| Plan + apply infra changes | `voxera-infra/<stage>/` | `terraform plan` → review → `terraform apply` (never `-auto-approve`) |

### Operational

| Task | Where to do it | How |
|---|---|---|
| Set up babysitter for a new machine | any repo | `/babysitter:user-install` |
| Set up babysitter for a project | any repo | `/babysitter:project-install` (optional but produces richer profile) |
| Check run health | any repo | `/babysitter:doctor` |
| Plan a run without executing | any repo | `/babysitter:plan ...` |

---

## By cadence: when to run what

### Daily (as it happens, not scheduled)

- **Customer touch-point** → `customer-pulse-update` for that customer's file.
- **Decision made in a chat / call / Slack** → `capture-decision` (drafts an ADR; you confirm).
- **Meeting that produced real content** → `meeting-notes` (extracts decisions + action items + commitments to others).
- **Reading code, want a check** → spawn `code-reviewer` agent.

### Weekly (Friday or end-of-week — non-negotiable)

- **`weekly-business-review` process** — gather state → per-customer pulse → coach pushback → draft note → set next-week's top 3.
- The accountability layer is what holds you to your own commitments. Skipping a week is the leading indicator of operational drift.

### Monthly

- **Review accumulated ADRs** — anything that should propagate to strategy.md or a pattern doc?
- **Health-trend review** across customer pulse files — any pattern across the 3? (e.g., 2 of 3 mentioned the same friction)
- **Cost dashboard** — Cloudflare + GCP. Top 5 line items should be expected.
- **Brand-voice spot-check** — run `brand-conformance` over recent website / blog / customer-facing copy.

### Quarterly

- **Strategy iteration** — `/babysitter:call iterate strategy.md: <change>` if real strategic learning has happened.
- **Milestone check** against [`strategy.md`](./voxera-command/docs/strategy/strategy.md) §7 — DACH vs English-markets vs platform on track?
- **Vertical-strategy iteration** — `vertical-strategy-english-markets.md` for the English-markets playbook.
- **Pricing review** (one-time, defer).
- **Dependency audit** — npm / Cloudflare / GCP provider versions; Fabric module ref bump.

### As-needed

- **Open an ADR** when a real strategic / architectural choice gets made. Use `capture-decision` for chat-shape decisions, `extract-adr` for ones lurking in long docs.
- **Open a FEAT** when work spans more than a day and has acceptance criteria. Use the [features template](./voxera-command/docs/product/features/FEAT-000-template.md).
- **Open a BUG** when something's wrong with a regression-test contract clear enough that `fix-bug.js` could pick it up cold.

---

## By role: hat-switching for a 5-person team

You wear multiple hats. The tooling supports that without forcing context-switches.

### As CEO
- **Mornings**: review yesterday's customer touches → `customer-pulse-update` per customer.
- **Throughout the week**: `capture-decision` after any strategic call; `meeting-notes` after meaty meetings.
- **Friday**: `weekly-business-review` process. The coach-pushback layer (priorities-coach + accountability-check) surfaces what you've been avoiding.
- **Monthly**: read accumulated ADRs + customer pulse trends.
- **Quarterly**: strategy iteration, milestone vs reality check.

### As COO / ops
- **Customer pulse maintenance** is the highest-leverage thing — every customer touched in a week gets a pulse update.
- **Commitments tracking** — the weekly note's "Commitments to others" section + `accountability-check` skill keep these from dropping.

### As engineering (you, until you hire)
- **FEAT-driven development**: spec → test-cases → plan → implement, gated at each phase. Use the babysitter `implement-feature.js` process OR the local crm skills (`/new-feature` etc.) — both respect the same gates.
- **Bug-fixing test-first**: `fix-bug.js` writes the failing regression test before the fix.
- **Patterns first, not principles**: when in doubt, [`voxera-crm/docs/patterns/`](./voxera-crm/docs/patterns/) is the source-of-truth for how to write code in this repo.
- **The rules in `.claude/rules/`** auto-load every session — they're the invariants the codebase relies on.

### As marketing copy + brand
- Every page / email / OG card → `brand-voice-reviewer` agent before merge.
- i18n changes → `i18n-parity-check` skill (EN ↔ DE).
- Brand-guidelines edits → `iterate-vision.js` process (brand gate fires).

### As infra
- Plan-before-apply, always. No `-auto-approve`.
- ADR before adopting a new provider or destructive infra pattern (e.g., remote state backend change).
- Cost discipline — review the budget alerts when they fire, not just at month-end.

---

## Getting started

### First time on this machine
1. `/babysitter:user-install` (if not yet — there's a profile at `~/.a5c/user-profile.json` already from this session).
2. `cd voxera-command/.a5c/processes && npm install` (installs the babysitter SDK so processes can import `defineTask`).
3. Install Terraform 1.9.8 + gcloud CLI (only if you're going to touch infra).
4. `gcloud auth login && gcloud auth application-default login` (only for infra).

### First time as a new collaborator (future hire)
1. Read this README + [workspace `CLAUDE.md`](./CLAUDE.md). 10 minutes.
2. Read [`voxera-command/docs/strategy/strategy.md`](./voxera-command/docs/strategy/strategy.md). 15 minutes — the bet, the two motions, the milestones.
3. Skim [`voxera-command/decisions/`](./voxera-command/decisions/) — at least ADR-0001, 0008, 0009, 0010. These are the load-bearing strategic + architectural choices.
4. Open the repo relevant to your role and read its `CLAUDE.md` (or `.claude/CLAUDE.md` for voxera-crm).
5. Skim the relevant `.claude/rules/*.md` — auto-loaded every session, so behavior follows them whether you know them or not. Knowing them lets you push back when they're wrong.
6. For engineering: skim [`voxera-crm/docs/patterns/`](./voxera-crm/docs/patterns/) — these are the concrete how-to docs the rules reference.

### First time setting up GCP infra
- See [`voxera-infra/README.md`](./voxera-infra/README.md) "Bringing this up from scratch" — sequenced bootstrap → dev env walkthrough.

---

## The 0 → $1M arc

Where you are now (per [BRAND.md](./voxera-website/docs/marketing/BRAND.md) + [strategy.md](./voxera-command/docs/strategy/strategy.md)):
- 5 people. 3 customers in production (private beta). Bootstrapped.
- Year-1 target: ~$1.7M combined ARR run-rate ($80K + $40K + $25K MRR English markets + DACH).

### Stage 1 — Foundation set (now, done)
Canonical docs, ADR log, code conventions, infra scaffolded, CEO operations layer wired up. You're here.

### Stage 2 — 0 → $500K combined ARR (next 6 months)
- **Activate FEAT-001** (Astro landing-page template translation) — blocks every English-markets vertical page.
- **Activate FEAT-002** (`/real-estate` page) — paid-search-led real estate launch.
- **Run weekly reviews every Friday** without exception — the rhythm compounds. Skip none.
- **Fill in the 3 customer pulse scaffolds** with real names; first weekly review picks them up automatically.
- **Run `bootstrap/` + `environments/dev/`** in voxera-infra once you have a GCP org + billing account.
- **Activate Cloud SQL / Cloud Run stubs** in `environments/dev/main.tf` as backend hosting decisions are made (likely an ADR for Cloud SQL vs Neon first).
- **Launch real estate paid-search** in one MLS region (Phoenix / Austin / Tampa / Charlotte). Stay disciplined on CAC.

### Stage 3 — $500K → $1M+ ARR (6-12 months)
- **Draft FEAT-003 (home services) + FEAT-004 (insurance)**. Run `implement-feature.js` for each.
- **Staging env** — `cp -r voxera-infra/environments/dev/ staging/`.
- **First non-founder engineer hire**: the docs/patterns + `.claude/rules` + per-repo CLAUDE.md handle onboarding. They read this README first, then their repo's CLAUDE.md, then the relevant patterns.
- **Insurance vertical** needs TCPA compliance work in the backend first — separate FEAT, gated on legal review.
- **Customer pulse files** become the primary CS surface — 10+ customers means health-trend dashboards matter.

### Stage 4 — $1M+ (year 2)
- **Adjacent DACH vertical** (Hörgeräte or private health) — per `strategy.md` §7 24-month milestone.
- **Multi-language voice agents** — EN first-class alongside DE.
- **Promoter automation tier 2** — low-risk auto-approval per `architecture/multi-agent-architecture.md`.
- **Formal OKRs** start mattering at ~8-12 people. Add `docs/operations/okrs/` then.
- **Workload identity federation** for CI (retire service account keys).
- **Cloud SQL HA (REGIONAL availability)** in prod once revenue justifies it.

The strategy doc's §7 milestones are the canonical "what's next at each stage." This section is the operational mapping.

---

## Where to dig deeper

### The "why" (decisions)
[`voxera-command/decisions/`](./voxera-command/decisions/) — ADR-0001 to ADR-0010. Each one frames a strategic / architectural choice with alternatives considered + consequences. Read in order, or filter by what touches your area.

### The "how" (patterns + rules)
- **voxera-crm patterns** — [`voxera-crm/docs/patterns/`](./voxera-crm/docs/patterns/) — backend-nest-modules, frontend-mantine, graphql-pothos, prisma-data-access, nx-boundaries, authorization-with-casl, observability-otel. 2,700+ lines of concrete how-to.
- **Rule files** — `.claude/rules/*.md` in each repo. Auto-loaded; codify the invariants.
- **Skill files** — `.claude/skills/<name>/SKILL.md` in each repo. Each one documents when to invoke it + the workflow.

### The "what's running" (processes)
[`voxera-command/.a5c/processes/README.md`](./voxera-command/.a5c/processes/README.md) — catalog of every babysitter process with where to invoke it from + what it does.

### The "what's coming" (roadmap)
[`voxera-command/docs/product/roadmap.md`](./voxera-command/docs/product/roadmap.md) — Now / Next / Later, grouped by motion.

---

## Anti-patterns (what we deliberately don't do)

- **Don't fork strategy into a code repo.** Canonical strategy lives in `voxera-command/docs/`. Reference, never duplicate.
- **Don't skip the regression test in `fix-bug.js`.** The whole point of test-first is the test pre-existing the fix.
- **Don't open a FEAT without acceptance criteria.** "Improve the dashboard" is not a spec.
- **Don't extract an ADR for a non-decision.** Policy / convention statements go in CLAUDE.md or `.claude/rules/`; ADRs are for real forks-in-the-road.
- **Don't skip the weekly review for more than a week.** When the accountability-check stops detecting slippage because there's no data, you've lost the rhythm.
- **Don't bypass the code-reviewer agent for non-trivial changes.** It loads the repo's CLAUDE.md + rules + ADRs before reviewing — generic code-review tools don't.
- **Don't migrate to remote terraform state without an ADR.** This is a load-bearing operational choice.
- **Don't add a third motion before the existing two are converting.** ADR-0009's 60/25/15 founder-time split assumes 2 motions; concentration matters.
- **Don't pre-build org-chart structure** (OKRs, hiring pipelines, advisor reports). The `docs/operations/` README lists what NOT to pre-create.
- **Don't use the babysit skill inside a delegated task.** It only orchestrates from the top. Inside a Task-delegated subagent, do the work directly.
- **Don't auto-approve any breakpoint.** The whole point of the gate is the human; auto-approving is the same as removing it.

---

## When the system gets in your way

Every system here is designed to be challenged. If a rule is wrong: change the rule (+ commit), don't work around it. If a process is too heavy: change the process (+ ADR for why). If a skill is unused after a month: kill it (+ note in the appropriate README).

The compounding value comes from the system being **trustworthy** — when `accountability-check` flags something, it matters; when `brand-voice-reviewer` blocks copy, the block is right; when `priorities-coach` recommends a top-3, it's reasoned. Trust erodes if the system cries wolf. Maintain the discipline.

---

## Changelog

- 2026-05-31 v1: initial. Documents the full set of agents, skills, processes, rules, and operational rhythms set up across the workspace. Maps day-to-day usage by task, by cadence, and by role. Sequences the 0 → $1M+ arc.
