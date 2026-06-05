---
id: ADR-0010
title: GCP as primary cloud, managed with Fabric modules (not CFT, not FAST)
status: accepted
date: 2026-05-31
supersedes: []
superseded_by: null
affects:
  - voxera-infra/
  - voxera-command/.claude/rules/terraform.md
---

## Context

`voxera-infra/` needs a primary cloud and a Terraform pattern. The choice affects every infrastructure decision downstream — hosting (Cloud Run / GKE / Fargate / EC2), Postgres (Cloud SQL / RDS / Neon / Supabase), object storage (GCS / S3 / R2), secret management, observability backend integration, and the operational complexity of state + IAM + networking.

Constraints:
- **Bootstrapped, 1 engineer, 5-person team.** Operational overhead has to stay small. No room for an enterprise landing zone.
- **Two parallel motions (DACH + English-markets) per [ADR-0009].** Both motions share the same product / backend, so the infra is shared.
- **Voice + telephony heavy** (Twilio + Ultravox per [ADR-0007]). Webhooks need stable egress; outbound calling needs sub-second latency to the voice runtime.
- **EU data residency for DACH customers** (Pflegekassen data is GDPR Art. 9 special-category). Need regions in EU.
- **Existing app dependencies** include `@google-cloud/storage` (GCS in `package.json`) — the team has prior GCP usage.
- **Cloudflare already in use** for the marketing site (Pages + Functions per `voxera-website/wrangler.toml`). Cloudflare stays for the website; not the primary cloud for the CRM backend.

Two coupled choices to make:
1. **Which cloud?** AWS, GCP, or Azure?
2. **Which Terraform pattern on it?** Roll-your-own modules, CFT (Cloud Foundation Toolkit / terraform-google-modules), Fabric modules (cloud-foundation-fabric/modules), or FAST (cloud-foundation-fabric/fast — full landing-zone bootstrap).

## Decision

**Primary cloud: Google Cloud Platform.**

**Terraform pattern: Fabric modules (`github.com/GoogleCloudPlatform/cloud-foundation-fabric/modules/*`)** with a hand-rolled two-stage composition:

- **Stage 1 — `voxera-infra/bootstrap/`** (run once, per organization): creates the ops project, the Terraform state GCS bucket, the Terraform service account, billing alerts, and core API enablement. State for this stage starts local, migrates to the bucket it creates via `terraform init -migrate-state`.
- **Stage 2 — `voxera-infra/environments/<env>/`** (run per environment): per-env GCP project + APIs + workload resources (Cloud SQL, GCS buckets, Cloud Run, Secret Manager, IAM). Initial scaffold creates only the project + APIs + service accounts; real workloads (database, hosting) are added as commented stubs that the implementer activates when the underlying decisions are made.

Initially: only `environments/dev/` exists. `staging/` and `prod/` are added by copying `dev/` when needed.

## Alternatives considered

- **AWS** — strong product breadth, mature Terraform ecosystem. Rejected because (a) the team has more GCP exposure already (GCS in deps), (b) GCP's per-project isolation model maps more cleanly to per-env separation than AWS's per-account-or-per-VPC approach, (c) AWS's IAM is materially more complex and a 1-engineer team will pay for it in operational time, (d) Cloud Run beats Fargate for a containerized NestJS backend on cost + latency at this scale.
- **Azure** — fine for enterprise; the team has no Azure exposure and no reason to learn it.
- **CFT modules (`terraform-google-modules/*` on the Registry)** — Google's older official module collection. Quality is good but inconsistent across modules; less cohesive than Fabric. Larger blast radius for breaking changes between modules. Rejected for cohesion.
- **FAST (cloud-foundation-fabric/fast)** — opinionated multi-stage landing zone (org / billing / networking / security / project factory). Excellent if you have 20+ projects, multiple teams, and an opinionated landing-zone topology. Rejected: a 5-person bootstrapped startup running 1–3 GCP projects doesn't need or want a landing zone. The cost of adopting FAST now is months of operational overhead that buys nothing until headcount is 10x.
- **Roll-your-own modules** — full control, no upstream dependency. Rejected: building production-quality GCP modules (VPC, IAM, KMS, Cloud SQL with HA, GCS with lifecycle, project factory) is a multi-week effort that duplicates what Fabric already gives us at no cost.
- **Pulumi / CDKTF instead of Terraform HCL** — better tooling for some patterns. Rejected: Terraform's ecosystem (modules, providers, state backends, plan output, well-documented patterns) is unmatched, and switching languages doesn't unlock anything for this size of infra.

## Consequences

- **Positive:**
  - Production-quality modules from day one. Cloud SQL, GCS, project factory, IAM, networking — all already battle-tested in Fabric.
  - Cohesive module surface — Fabric modules share input/output conventions, so composition is predictable.
  - GCP's per-project isolation maps cleanly to per-env separation. The two-stage pattern scales from 1 env to N without restructuring.
  - Cloud Run + Cloud SQL + Secret Manager + GCS covers the voxera-crm backend's needs at startup-friendly cost (low-tier dev env should run well under $50/mo).
  - EU regions available for GDPR / DACH data residency (`europe-west3` Frankfurt, `europe-west4` Amsterdam).
  - GCP's free tier is generous; dev env can run nearly free with the right resource sizing.

- **Negative / risks:**
  - **Fabric module version pinning** — modules pull from a GitHub ref. The ref must be pinned (e.g., `?ref=v34.1.0`) to avoid surprise breaking changes. Bumping the ref is a deliberate event with its own PR.
  - **No automatic landing-zone safety net.** FAST would give us org-level constraints (allowed locations, required labels, IAM policies) for free; without it, we enforce by hand-rolled discipline in `.claude/rules/gcp.md` and code review.
  - **Adopting Fabric makes future migration harder.** If we later decide to leave GCP for AWS, the Terraform code is GCP-specific and would be a near-rewrite. This is the cost of using cloud-specific high-quality modules instead of cloud-agnostic primitives; we accept it.
  - **GCP-Cloudflare seam.** The marketing site stays on Cloudflare Pages; the product runs on GCP. Cross-stack secret/DNS coordination is a manual touch-point (e.g., updating the API base URL on Cloudflare when the GCP backend URL changes). Document the handoff in `voxera-infra/README.md` and the per-app `wrangler.toml`.
  - **Cost discipline required.** Cloud SQL + Cloud Run + GCS in production can grow quickly. Billing alerts are configured in bootstrap; revisit thresholds quarterly.
  - **Service account key handling.** Best practice is workload identity federation for CI/CD; until that's wired up, Terraform locally uses application-default credentials (gcloud auth) and CI uses a service account key (stored in CI secrets, rotated quarterly).

- **Follow-ups:**
  - Provision an actual GCP organization + billing account before running `bootstrap/`. The bootstrap stage assumes both exist.
  - Decide on Cloud SQL vs Neon for Postgres. Default in the dev env is a commented Cloud SQL stub; if Neon is preferred for dev (cheaper, branching), document that and skip the Cloud SQL provisioning.
  - Decide on Cloud Run vs GKE for backend hosting. Default scaffold is Cloud Run (right answer for a NestJS backend at this scale).
  - Wire up workload identity federation for CI (GitHub Actions) so service account keys can be retired.
  - Add a `terraform-apply` entry to `breakpointTolerance.alwaysBreakOn` for any babysitter process that wraps Terraform (per `voxera-infra/.claude/rules/terraform.md`).

## Relationship to prior ADRs

- **Depends on [ADR-0007]** (Twilio + Ultravox voice stack): the GCP backend hosts the orchestration; voice runtime stays at Twilio + Ultravox.
- **Depends on [ADR-0009]** (two-motion structure): both motions share the same GCP backend; only the marketing-site path is cloud-split (Cloudflare for site, GCP for product).
- **Constrains [ADR-0002]** (custom state machine on Postgres): the Postgres lives on GCP — likely Cloud SQL with HA in prod, possibly Neon for dev. The state machine code is portable; the hosting is GCP-specific.
