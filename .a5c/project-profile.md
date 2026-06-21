# Project Profile: voxera-workspace

Voxera is a poly-repo 'workspace of repos' for an AI voice/telephony CRM aimed primarily at the German (DACH) care-insurance market. A single workspace root contains four sibling git repositories plus a shared babysitter orchestration layer in root .a5c/: voxera-command (the source-of-truth brain holding vision, brand, roadmap, company-level ADRs, and business babysitter process definitions), voxera-crm (the CRM product — an Nx monorepo with a NestJS 10 + GraphQL/Pothos + Prisma 6 backend and a React 18 + Vite + Mantine frontend, integrating Twilio/Telnyx/Ultravox voice), voxera-website (an Astro 6 static-first marketing site on Cloudflare Pages with EN/DE i18n and Pages Functions), and voxera-infra (Terraform 1.9.8 IaC targeting GCP via Cloud Foundation Fabric modules). Code repos reference voxera-command by relative path and never fork its content; specs drive all work and real decisions are captured as ADRs.

> Last updated: 2026-06-05T23:30:00.000Z | Version: 1

## Goals

- **velocity** [high]: Ship features faster across the CRM and website by leaning on spec-driven babysitter implementation runs (FEAT-xxx/BUG-xxx) and removing review/merge friction. (active)
- **quality** [high]: Raise code quality, especially in high-churn CRM areas (Prospects/Pipelines/Leads frontend), by decomposing god components and extracting shared abstractions. (active)
- **data-layer** [high]: Tame data-layer friction by making the recurring ZModel->Prisma migration workflow reliable and reproducible so schema changes stop breaking and needing re-fixes. (active)
- **documentation** [medium]: Keep strategy and docs in sync: maintain vision/brand/roadmap plus ADRs in voxera-command as the single source of truth, referenced (never forked) by code repos. (active)

## Tech Stack

### Languages

- TypeScript (Primary: CRM backend (NestJS), frontend (React), website Astro/Functions, shared libs)
- JavaScript (ESM) (Build/config + babysitter process definitions (.js))
- HCL (Terraform) (IaC in voxera-infra)
- GraphQL (SDL) (CRM API contract (schema.graphql), generated from Pothos)
- Markdown (Canonical docs, specs, ADRs, rules)
- CSS (Hand-written site.css (website); Mantine + PostCSS (CRM))

### Frameworks

- NestJS 10 [Backend framework (CRM)]
- Apollo Server 4 + Pothos (code-first, custom nestjs-pothos drivers) [GraphQL server (CRM)]
- Prisma 6 [ORM / data-model source of truth (CRM)]
- ZenStack + CASL [Authorization (CRM)]
- React 18 [Frontend UI (CRM)]
- Mantine 7/8 [Design system (CRM)]
- Redux Toolkit [State management (CRM)]
- urql + GraphQL Code Generator [GraphQL client + typed codegen (CRM)]
- BullMQ + @nestjs/schedule [Jobs/queues/scheduling (CRM)]
- Passport (JWT, Google OIDC, LinkedIn) [Auth (CRM)]
- OpenTelemetry [Observability/tracing (CRM)]
- Twilio + Telnyx + Ultravox [Voice/telephony (CRM)]
- Astro 6 [Static site generator (website)]
- Cloudflare Pages Functions [Serverless endpoints (website)]
- Terraform Cloud Foundation Fabric v34.1.0 [IaC module library (infra)]
- @a5c-ai/babysitter-sdk [AI workflow orchestration (workspace)]

### Databases

- PostgreSQL (+ pgvector) (Primary relational DB (CRM via Prisma; docker-compose test; GCP Cloud SQL). PGlite for in-memory test.)
- Redis (Queue backend / cache (BullMQ, CRM))
- Cloudflare KV (BETA_KV) (Edge KV for beta-signup dedup / rate limiting (website))
- Google Cloud Storage (Object storage: Terraform remote state + app file storage)

### Infrastructure

- Google Cloud Platform [Primary cloud (Cloud Run, Cloud SQL, Secret Manager, Artifact Registry, GCS); region europe-west3 (Frankfurt, DACH residency)]
- Terraform + Cloud Foundation Fabric v34.1.0 [IaC; bootstrap + per-env; GCS remote state]
- Cloudflare Pages + Functions [Website hosting + edge serverless]
- Docker / docker-compose [CRM local + test runtime; Testcontainers]
- SendGrid [Transactional email (website + CRM)]
- Cloudflare Turnstile + KV [Spam protection + rate limiting (website)]
- Nx Cloud [Remote build cache (CRM)]
- GitHub [Source hosting + CI (voxera-crm)]

**Build tools:** Nx 19 (CRM task runner + Nx Cloud), Rspack/Webpack (CRM backend), Vite 5 (CRM frontend), Astro CLI (website), Wrangler 4 (Cloudflare Pages), Terraform 1.9.8 (infra), GraphQL Code Generator, Prisma CLI, Jest + ts-jest (backend), Vitest (frontend), Cypress (e2e), Storybook 7

**Package managers:** npm (all JS/TS repos; CRM uses Nx), Terraform module registry (infra)

## Architecture

**Pattern:** Poly-repo 'workspace of repos'. A single workspace root contains four sibling repositories (each its own git repo) plus a shared babysitter orchestration layer in root .a5c/. voxera-command is the source-of-truth brain (strategy docs, company-level ADRs, business babysitter process definitions) and voxera-os holds the engineering process definitions; code repos reference them by relative path and never fork their content.
**Data flow:** Specs originate in the code repo that implements them (FEAT/BUG); company-level ADRs live in voxera-command. A babysitter run is invoked from a code repo pointing at a spec path + a process in voxera-os/.a5c/processes; journals land in the invoking repo's .a5c while process defs stay canonical. In the CRM, Prisma schema is the data-model source of truth -> Prisma client + Pothos types -> NestJS resolvers/services expose GraphQL -> frontend consumes via codegen + urql. PostgreSQL is the DB; Redis/BullMQ handle jobs; a transactional outbox drives async events. Website is static Astro on Cloudflare Pages; forms hit Pages Functions calling SendGrid (Turnstile + KV rate-limit). Terraform/GCP provisions runtime (Cloud Run, Cloud SQL, Secret Manager) with state in GCS.

### Modules

| Module | Path | Description |
|--------|------|-------------|
| voxera-command | `voxera-command` | Source of truth: vision, brand, roadmap, company-level ADRs (decisions/), operations, and business babysitter process definitions (iterate-doc, iterate-vision, weekly-business-review in .a5c/processes/). Markdown-heavy; no application code. |
| voxera-crm | `voxera-crm` | CRM product. Nx monorepo: apps/backend (NestJS 10 + GraphQL via Pothos/Apollo + Prisma 6/PostgreSQL) and apps/frontend (React 18 + Vite + Mantine + Redux Toolkit + urql). Shared libs/. Voice: Twilio, Telnyx, Ultravox. Owns its platform architecture (docs/architecture/, docs/implementation/) + product/technical ADRs (decisions/). Depends on voxera-command. |
| voxera-website | `voxera-website` | Marketing site. Astro 6 static-first on Cloudflare Pages; dynamic JSON endpoints as Pages Functions (contact, beta-signup, SendGrid, Turnstile). EN/DE i18n via public/i18n.json. Depends on voxera-command. |
| voxera-infra | `voxera-infra` | IaC. Terraform 1.9.8 targeting GCP via Cloud Foundation Fabric modules (v34.1.0). bootstrap/ creates project + GCS remote-state bucket; environments/dev/ composes project, APIs, service accounts. |
| .a5c | `.a5c` | Shared babysitter runtime at workspace root (@a5c-ai/babysitter-sdk ^0.0.187). Holds runs/, cache/, logs/. Process definitions are canonical in voxera-os/.a5c/processes/ (engineering: build-feature, fix-bug, design-review) and voxera-command/.a5c/processes/ (business: iterate-doc, iterate-vision, weekly-business-review). |

**Entry points:** `voxera-crm/apps/backend/src/main.ts (NestJS bootstrap; tracing.ts loads OpenTelemetry)`, `voxera-crm/apps/backend/src/app/app.module.ts (NestJS root module)`, `voxera-crm/apps/frontend/src/main.tsx (React root; App.tsx + Router.tsx)`, `voxera-website/src/pages/ (Astro routing) + functions/api/*.ts (Pages Functions)`, `voxera-infra/environments/dev/main.tf (+ bootstrap/main.tf)`, `voxera-os/.a5c/processes/{build-feature,fix-bug,design-review}.js`, `voxera-command/.a5c/processes/{iterate-doc,iterate-vision,weekly-business-review}.js`

## Team

- **Ramzi Maalej** (Owner / founder-engineer): voxera-crm telephony (Twilio/Telnyx, dialer, SMS, transcription), voxera-website, voxera-command docs (vision/brand/roadmap/ADRs), voxera-infra (Terraform/GCP), PR merges/integration, lint/type/test fixes
- **Youssef Kammoun** (CRM core engineer): voxera-crm leads/pipelines/contracts, Prisma/ZModel schema + migrations (datasphera removal), auth, GraphQL/schema, frontend + backend tests
- **Aymen Gondech** (CRM dialer engineer): voxera-crm power dialer / run-pause, cross-cutting callbacks, assignee/account fixes

## Workflows

### Babysitter vision/brand/roadmap iteration

Strategy docs in voxera-command/docs iterated via babysitter processes. Canonical, never forked.
**Triggers:** manual

1. cd voxera-command
2. /babysitter:call iterate the vision doc: <change>
3. capture ADRs in decisions/

### Babysitter feature implementation

FEAT-xxx specs drive implementation in product repos.
**Triggers:** manual, spec path as input

1. cd voxera-crm
2. /babysitter:call implement features/FEAT-xxx/spec.md

### Babysitter bug fix

BUG-xxx specs drive fixes.
**Triggers:** manual, spec path as input

1. cd voxera-website
2. /babysitter:call fix features/BUG-xxx-<slug>.md

### Git branch + PR workflow

Default branch master/main. PRs run PR Checks; pushes to master run Master Checks. No CODEOWNERS/branch-protection file found. Branch off default before committing; commit/push only when asked.
**Triggers:** pull_request, push

1. branch
2. PR (pr.yml gates)
3. merge to master (master.yml)

### Website deploy (Cloudflare Pages)

Astro build then wrangler pages deploy; no GitHub Actions in website repo (Cloudflare Pages git integration or manual wrangler). Auto-deploys on push to main.
**Triggers:** manual / Cloudflare Pages git connection

1. npm run deploy
2. astro build && wrangler pages deploy dist

### Terraform infra workflow

Bootstrap creates ops project + GCS state bucket + Terraform SA; per-env (dev) uses GCS remote state. No infra CI pipeline present.
**Triggers:** manual

1. gcloud ADC
2. terraform init/plan/apply bootstrap
3. migrate state to GCS
4. per-env apply

## Tools

### Linting

- ESLint (Nx flat overrides, airbnb-typescript, @nx plugins) (`voxera-crm/.eslintrc.json`)
- Stylelint (stylelint-config-standard-scss, postcss-preset-mantine) (`voxera-crm/apps/frontend/.stylelintrc.json`)
- ESLint 9 flat (typescript-eslint, eslint-plugin-astro, jsx-a11y, no-restricted-imports) (`voxera-website/eslint.config.js`)

### Testing

- Jest (Nx getJestProjects, backend/Nest) (`voxera-crm/jest.config.ts`)
- Vitest (frontend, jsdom, coverage-v8) (`voxera-crm/vitest.config.ts`)
- Vitest workspace (`voxera-crm/vitest.workspace.mjs`)
- Cypress (devDependency) (`voxera-crm/package.json`)
- Testcontainers + supertest (integration, Postgres) (`voxera-crm/package.json`)
- astro check (typecheck; no dedicated test runner) (`voxera-website/package.json`)

### Formatting

- Prettier (singleQuote) (`voxera-crm/.prettierrc`)
- EditorConfig (`voxera-crm/.editorconfig`)
- ESLint --fix (website; no Prettier) (`voxera-website/package.json`)

## Services

- **PostgreSQL (+ pgvector)** (database) - postgresql (dev compose / testcontainers; GCP Cloud SQL in infra)
- **Redis** (queue/cache (BullMQ, nestjs cache-manager)) - redis://localhost:6379
- **Jaeger / OpenTelemetry** (tracing/observability) - OTLP 4317/4318
- **Honeycomb** (observability (secret slot + MCP/skills present; planned)) - https://api.honeycomb.io
- **Google Cloud Platform** (cloud (Cloud Run, Cloud SQL, GCS, Secret Manager, Artifact Registry; europe-west3)) - https://console.cloud.google.com
- **GCS Terraform state bucket** (remote state backend) - gs://voxera-tf-state-<suffix>
- **Cloudflare Pages + Functions + KV (BETA_KV)** (hosting/edge/serverless (website)) - https://usevoxera.com
- **Twilio** (voice/SMS) - https://api.twilio.com
- **Telnyx** (voice/SMS) - https://api.telnyx.com
- **Ultravox** (AI voice agent) - n/a
- **SendGrid** (email (website + CRM)) - https://api.sendgrid.com
- **Cloudflare Turnstile** (CAPTCHA/bot protection) - https://challenges.cloudflare.com
- **Google OAuth / OIDC** (auth) - n/a
- **LinkedIn OAuth2** (auth) - n/a
- **AWS S3 / Google Cloud Storage** (object storage (uploads)) - n/a
- **Google Analytics 4** (web analytics) - https://www.google-analytics.com
- **Nx Cloud** (CI build cache) - https://cloud.nx.app

## CI/CD

**Provider:** GitHub Actions
**Config files:** `voxera-crm/.github/workflows/master.yml`, `voxera-crm/.github/workflows/pr.yml`

### Pipelines

- **Master Checks (master.yml)**
  Stages: install (npm ci --force, node 20, cache) -> backend-lint -> frontend-lint -> backend-test -> frontend-test -> backend-build -> frontend-build
- **PR Checks (pr.yml)**
  Stages: install -> backend-lint -> frontend-lint -> frontend-typecheck -> generate-schema-client (prisma generate + GraphQL codegen) -> backend-test (vitest coverage report) -> frontend-test (coverage report)

## Pain Points

- **high** [data-layer / build]: ZModel<->Prisma migration workflow is fragile; repeated 'fixed zmodel and migrations issue' commits.
  - Remediation: Make the ZModel->Prisma migration path deterministic and CI-verified: add a single canonical generate+migrate script, gate PRs on a clean 'migrate diff' (fail if schema and migrations drift), regenerate from schema.zmodel as the only source of truth, and document the workflow in voxera-crm/docs/patterns/. Targets goal-data-layer-1.
- **medium** [tooling / review-quality]: Committed generated GraphQL client and lockfiles dominate diffs, undermining review.
  - Remediation: Stop committing generated GraphQL client artifacts (apps/frontend/src/graphql/gql/graphql.ts, gql.ts) — gitignore them and regenerate in CI/build (the PR pipeline already runs prisma generate + GraphQL codegen). Keep schema.graphql as the only checked-in contract. Keep package-lock.json but isolate dependency bumps into their own PRs to reduce review noise. Targets goal-velocity-1.
- **medium** [frontend architecture / DRY]: Per-product duplicated form components (JsonSchemaFormPflegebox / JsonSchemaFormHausnotrufsystem, TaskDataForm twins) edited in lockstep, signaling missing abstraction.
  - Remediation: Extract a single config/schema-driven JsonSchemaForm component parameterized per insurance product (Pflegebox, Hausnotrufsystem) so domain differences live in data/config, not duplicated TSX. Targets goal-quality-1.
- **medium** [frontend architecture]: ProspectsDetails.page.tsx is a high-churn god component (~42 touches).
  - Remediation: Decompose ProspectsDetails.page.tsx into focused child components/hooks (header, activity, forms, pipeline) with isolated data fetching, reducing coupling and regression surface. Targets goal-quality-1.
- **low** [testing infra]: Dual test frameworks (Jest + Vitest) configured simultaneously in the CRM.
- **low** [release process]: No release tags / versioning anywhere, contradicting the workspace golden rule to freeze milestones with annotated tags.
- **low** [repo hygiene]: Inconsistent author identities for the same people fragment contribution stats.

## Bottlenecks

- Generated GraphQL client files committed to repo and re-touched constantly at voxera-crm: apps/frontend/src/graphql/gql/graphql.ts, gql.ts, schema.graphql (very high)
  Impact: Bloats diffs, hides real changes, creates merge conflicts; inflates avg commit size
- Lockfile/manifest churn committed alongside features at voxera-crm: package-lock.json, package.json (high)
  Impact: Frequent conflict surface and review noise
- Prospects detail page is a change magnet (god component) at voxera-crm: apps/frontend/src/pages/Prospects/ProspectsDetails.page.tsx (~42 touches) (very high)
  Impact: Repeatedly edited single large component — coupling/regression hotspot
- ZModel/Prisma schema and migrations repeatedly broken and re-fixed at voxera-crm: libs/prisma-schema-backend/schema.zmodel, prisma/schema.prisma (medium-high)
  Impact: Fragile schema/migration workflow
- Domain JSON-schema forms duplicated per insurance product at voxera-crm: JsonSchemaFormPflegebox.tsx & JsonSchemaFormHausnotrufsystem.tsx, TaskDataForm twins (medium-high)
  Impact: Parallel near-identical files edited in lockstep — copy-paste burden
- Site-wide layout/style/i18n files concentrate website changes at voxera-website: src/styles/site.css, public/i18n.json, layouts/SiteLayout.astro, wrangler.toml (medium)
  Impact: Any copy/layout tweak reopens the same few files

## Conventions

### Naming

- **specs:** FEAT-xxx-<slug>.md / BUG-xxx-<slug>.md (3-digit, permanent numbers) with templates
- **decisions:** ADR-NNNN-<slug>.md, federated by domain — company ADRs in voxera-command/decisions/, product/technical in the owning code repo's decisions/ (voxera-crm, voxera-infra). Numbers are 4-digit, global + permanent across all repos; voxera-os/decisions/ADR-REGISTRY.md is the registry + allocator
- **crmFeatures:** voxera-crm/features/<feature-id>/ with fixed artifact set
- **nxProjects:** 'backend' and 'frontend' under apps/; reusable code in libs/
- **terraform:** main.tf/variables.tf/outputs.tf/providers.tf/versions.tf/backend.tf; environments/<env>/ + bootstrap/
- **websiteRoutes:** Astro file-based src/pages; Pages Functions functions/api/<name>.ts; private helpers underscore-prefixed
- **branches:** voxera-crm uses two coexisting schemes: developer-prefixed 'rm/<topic>' and issue-number-prefixed '<issue#>-<kebab-description>'; voxera-website uses 'site/<topic>'

### Git

- **model:** Versioning = git. One canonical file per doc; freeze milestones with annotated tags (e.g. vision-v2), never *-final.md copies.
- **frontmatter:** Canonical docs carry frontmatter (version, status, updated) + a changelog block
- **commitFooter:** Commits end with Co-Authored-By trailer; PR bodies end with Generated-with-Claude-Code line; branch off default before committing; commit/push only when asked
- **deployGates:** babysitter alwaysBreakOn includes 'deploy'; website auto-deploys on push to main via Cloudflare Pages
- **observedPractice:** PR-merge-driven in voxera-crm (~73/300 subjects carry (#NNN)); issue number encoded in branch + subject; mostly free-form imperative subjects (Conventional Commits rare); no Co-Authored-By trailers observed historically; no release tags in any repo (main treated as continuously deployed)

**Import order:** Governed by eslint-plugin-import (airbnb-typescript) in CRM; default builtin/external then internal grouping > Nx module-boundary constraints restrict cross-project imports (apps not imported by libs) > Website: do not import from public/ in components; use astro:assets + content collections

**Error handling:** CRM: @pothos/plugin-errors for typed GraphQL errors, true-myth (Result/Maybe), class-validator/zod for input validation. Website Functions: validate request shape (400 on bad input), verify Turnstile, KV rate-limit, return 500 with stable error code (never raw stack), structured console.error (no PII/secrets).

**Testing:** CRM: test-cases.md is the validation contract; every acceptance criterion maps to >=1 test. Jest+ts-jest (backend), Vitest+testing-library (frontend), Cypress (e2e), Testcontainers/PGlite (DB). Cover happy path, edge cases, authz boundaries, regressions. Tests ship with the feature in the same PR ('with tests'). A feature is not complete with failing tests. Website gate: astro check + npm run build.

### Additional Rules

- Golden rule: Canonical strategy lives in voxera-command/docs/ — reference it, never fork it; if the website or CRM needs a product fact, read it from there. If spec and code disagree, spec wins.
- Golden rule: Process definitions live once — engineering processes (build-feature, fix-bug, design-review) in voxera-os/.a5c/processes/, business processes (iterate-doc, iterate-vision, weekly-business-review) in voxera-command/.a5c/processes/; code repos invoke them by relative path, never copy.
- Golden rule: Specs drive work — a feature is a FEAT-xxx.md, a bug is a BUG-xxx.md; implementation runs take a spec path as input. Do not implement from chat alone.
- Golden rule: Real decisions get an ADR, federated by domain — strategy/brand/vision/governance ADRs in voxera-command/decisions/, product/technical ADRs in the owning code repo's decisions/ (voxera-crm, voxera-infra). Numbers are global + permanent; voxera-os/decisions/ADR-REGISTRY.md is the registry. Babysitter's run journal is execution history, ADRs are the strategic why.
- Golden rule: Versioning = git — one canonical file per doc with frontmatter (version, status, updated) + changelog; freeze milestones with annotated tags, not *-final-final.md copies.
- CRM SDLC gating: no production code until features/<feature-id>/status.json === PLAN_APPROVED; never skip approval checkpoints.
- Prisma schema is the source of truth: change schema first, then generate migrations + GraphQL.
- Website: static-first (no SSR adapter without an ADR); dynamic data via Pages Functions; islands use most restrictive client directive; never edit/commit dist/.
- Website perf budget: LCP <2.0s, INP <200ms, CLS <0.05, Lighthouse >=90, <50KB JS/route; a11y WCAG 2.2 AA; brand verbs stay English in EN/DE.
- Infra: pin Fabric modules (v34.1.0) and Terraform (.terraform-version 1.9.8); remote state in GCS with per-env prefixes.
- German (DE) is a first-class locale; UI strings + domain forms expected translated (Pflegebox, Hausnotruf, Pflegegrade).

## Repositories

- **voxera-workspace** [`.`]
- **voxera-command** [`voxera-command`]
- **voxera-crm** [`voxera-crm`]
- **voxera-website** [`voxera-website`]
- **voxera-infra** [`voxera-infra`]
