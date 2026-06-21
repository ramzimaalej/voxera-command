---
title: Product Architecture Strategy
version: 2
status: active
updated: 2026-06-20
owner: you
---

# Product Architecture Strategy

> **Confidential — exec only.** This is the *architecture-facing* strategy: the bridge between the
> canonical company strategy and the CRM platform architecture docs (in
> `../../../voxera-crm/docs/architecture/` + `voxera-crm/engineering-os/`). It contains business
> specifics, so it lives in `voxera-command`, not the code repo. Engineer-facing architecture docs
> reference it conceptually, not by link.
>
> **Precedence:** the canonical company strategy is [`strategy.md`](./strategy.md) and it **wins on
> company strategy** (the bet, the two motions, verticals, customer profile, milestones, what-we-are-not).
> This doc **does not restate** those — it points to them, and adds only what the *architecture* must do
> to serve them. This doc in turn **wins over the architecture docs** on architecture strategy. So:
> `strategy.md` › this doc › the architecture docs. (Reconciled to the two-motion strategy 2026-06-20;
> previously this doc carried the superseded single-motion v1.0 framing.)

---

## 1. The architecture bet

The company bet — an AI-native CRM with AI calling as the core capability, run via **two parallel
motions** (DACH/Pflegebox + English-speaking markets), on a workflow-kind-agnostic platform — is
stated canonically in [`strategy.md`](./strategy.md) §1 and §1a. Read it there.

For architecture purposes, that bet reduces to four wagers the platform is built to honor:

- **Structured business descriptions drive predictable agent behavior** — better than generic agents discovering the domain, better than hand-configured CRMs that don't know it.
- **Agent reliability comes from constraint, not capability** — fixed roster, scoped tools, autonomy ceilings, mandatory diff review, full audit.
- **Observability beats automation** — users tolerate AI mistakes when every action is visible with rationale and easy to intervene on.
- **The OS underneath is preserved through architectural discipline, not shipped breadth** — the DSL, engine, audit, agent roster, and real-time infra are process-agnostic from day one; v1 ships one workflow kind (`linear_funnel`), other kinds are extension points.

> *Wedge + workflow-kind-agnostic-platform decision: [ADR-0008](../../decisions/ADR-0008-pflegebox-wedge-on-workflow-agnostic-platform.md). Parallel English-markets motion: [ADR-0009](../../decisions/ADR-0009-english-markets-parallel-motion.md).*

---

## 2. What the architecture must support

The full wedge, buyer, customer profile, and geographies are in [`strategy.md`](./strategy.md) §2 and §1a.
The load-bearing facts the **architecture** is sized for:

- **Two motions on one product.** Same engine, audit model ([ADR-0003]), agent roster ([ADR-0004]), voice stack ([ADR-0007]); they differ only in lead source, vocabulary preset ([ADR-0005]), and compliance frame. The architecture must not fork per motion.
- **Outbound-heavy + hybrid close.** AI places outbound calls to inbound leads and qualifies; humans close where regulation or trust requires. Both an AI qualifier and a clean AI→human handoff are first-class.
- **High volume.** 1k–20k+ calls/day per workspace — cost-per-call discipline and per-workspace rate/cost budgets are architectural requirements, not tuning.
- **Two onboarding paths.** A 5-minute customer-facing setup call for DACH (Context Copilot behind the scenes) **and** a ~30-minute self-serve trial with per-vertical templates for English markets. Templates + Copilot-interview both ship.
- **Span of customer size.** Solo agents (English-markets real estate) through 30-rep DACH SMBs, where "reps" includes AI agents.
- **Two compliance frames.** UWG §7 / GDPR Art. 9 / Pflegekasse paperwork (DACH) and TCPA / CMS / state rules (English markets), declared per workspace in the Business Context — never hard-coded.

---

## 3. Why outbound calling is the center of gravity

(Why *regulated verticals* and *why DACH first* are company-strategy questions — see [`strategy.md`](./strategy.md) §3. The architecture-relevant reasons calling is the core capability:)

- It's the highest-leverage capability for these customers — outbound qualification is the funnel bottleneck.
- AI calling is genuinely differentiated today: text-based AI is commodity; voice agents that hold real conversations and handle objections (in German *and* English) are still a real engineering achievement — and the moat we invest the platform in.
- Revenue attributes directly to the calling capability, which is what makes commission economics (and the ROI demo) work.

---

## 4. The moat, as architecture

Three layers, deepening over time. (The *business* moat framing is in [`strategy.md`](./strategy.md) §4; this is how the platform realizes it.)

### Vertical depth (immediate)
- Per-vertical compliance + paperwork as configuration: Pflegekasse PDF mappings / signature / submission flows (DACH); TCPA consent + DNC discipline (English markets).
- Vertical-tuned voice-agent prompts, brand voice, cultural norms (Sie/du and dignity for DACH; speed-of-response scripts for RE/HS).
- Outcome definitions and reason taxonomies that match how each vertical actually scores wins and losses.

### AI calling depth (year 1)
- Voice-agent runtime tuned for the domain — voicemail detection, calendar booking mid-call, mid-call CRM lookups, mid-call human escalation, live observability.
- Cost-per-call discipline that lets customers run high volume profitably.
- The Critic/Promoter loop improving prompts continuously from real call data (year 2+).

### OS underneath (proven across both motions)
- Workflow-kind-agnostic from day one: engine, audit, agent roster, DSL all generic; v1 ships `linear_funnel` only.
- Custom objects are workspace-scoped, decoupled from specific workflows.
- A new vertical (Hörgeräte, private insurance, or a new English-market line) is added by configuring workflow + operator + compliance definitions — **not** by rebuilding. The year-1 proof point is the same engine demonstrably serving four verticals across two motions (Pflegebox + real estate + home services + insurance) without a fork.

---

## 5. Architecture non-goals

Market/positioning non-competes (not a generic SMB CRM, not voice infrastructure, not an AI-SDR tool,
SMB-not-enterprise, no DACH cold-outbound) are in [`strategy.md`](./strategy.md) §5. The **architecture-level**
non-goals (from `architecture-vision-and-principles-v1.0` §4):

- **No general-purpose code execution in workflows.** Declarative DSL, not run-arbitrary-JS (Zapier/n8n own that).
- **No marketplace of community-built agents.** Roster fixed in code.
- **No custom model training.** Prompts + Business Context are the customization surface.
- **No no-code form builder.** JSON Forms + Mantine renderer; we don't reinvent.
- **No CRM that works without a Business Context.** An empty-Context workspace is broken by design.
- **No zero-touch automation / agent swarms / dynamic spawning.** Proposal-and-approve; fixed roster.

---

## 6. Funding posture — the architecture implication

Bootstrapped, no external capital for now (see [`strategy.md`](./strategy.md) §6). For architecture this
means one rule: **every decision defends its cost.** The OS underneath has to be *cheap to preserve* —
paid for in code discipline (the "does this generalize?" rejection criterion), not in feature delays.

---

## 7. Architecture milestones

Business targets (ARR run-rate, per-vertical MRR, customer counts) are in [`strategy.md`](./strategy.md) §7.
The **platform/architecture** milestones that must land to make those targets buildable:

### 12 months
- Voice calling at production reliability for **DE and EN**: voicemail handling, calendar booking, number-pool management, live observability.
- Compliance posture documented and defensible for both frames (UWG §7 / GDPR / Pflegekasse; TCPA).
- First Critic findings on voice-agent prompts going through Promoter review.
- **Workflow-kind-agnostic claim proven** — the engine demonstrably serves four verticals across two motions without forking (the architecture claim in [ADR-0008] becomes a demonstrated fact).

### 24 months
- One adjacent DACH vertical configured (Hörgeräte or private health insurance) — config, not rebuild.
- Multi-language voice agents (DE + EN first-class; FR/IT optional on DACH expansion).
- Promoter automation tier 2 (low-risk auto-approval).
- Reporter agent shipped; user-defined reports operational.
- Onboarding self-serve enough for any vertical to set up in <60 minutes with per-vertical templates + Copilot.

### 36 months
- 3+ DACH verticals operational; English-markets verticals mature (see [`strategy.md`](./strategy.md) §7).
- Voice calling competitive with the strongest voice-agent specialists.
- The OS underneath is publicly described as a feature ("handles your full workflow, not just your CRM").

---

## 8. Architecture-relevant risks

Business/market risks and mitigations are in [`strategy.md`](./strategy.md) §8. The two that are
fundamentally *architecture* bets:

| Risk | Mitigation |
|---|---|
| **Voice incumbents (Vapi/Retell) move up-stack into CRM territory** | Our moat is vertical depth + full-lifecycle CRM, not voice runtime. We consume a runtime ([ADR-0007]); further voice commoditization benefits us. |
| **OS preservation slows v1** | The architecture is mostly generic for free; the rejection criterion for new features is "does this generalize?". The OS bet is a discipline, not a feature — so it costs code clarity, not shipped time. |

---

## 9. How this maps to the architecture docs

This is the unique job of this doc — translating the strategy into architecture obligations:

| Strategy says | Architecture implication |
|---|---|
| AI-native CRM, voice-calling-first | Dedicated pillar: `voice-calling-v1.0.md` |
| Two motions, one product | No per-motion fork: shared engine/audit/roster; motion differs only by vocabulary preset, lead source, compliance config |
| OS underneath, vertical on top | Generic internal vocabulary (Workflow / Process Instance / Workflow Stage at the DSL level); CRM-flavored labels (Lead / Pipeline / Stage) at the user surface |
| Workflow-kind-agnostic | DSL declares `workflow_kind`; v1 ships `linear_funnel` only; other kinds are documented extension points |
| Decoupled objects from workflows | Custom objects are workspace-scoped, referenced by workflows |
| Multiple terminal stages per workflow | Terminal stages declare disposition + reason taxonomy (generalizes lost-reasons) |
| Per-workspace compliance frames | Compliance declared in the Business Context drives operational policy; no one-size-fits-all |
| 5-min setup (DACH) + self-serve trial (English markets) | Context Copilot interview shortens for known verticals; per-vertical templates ship as starting points |
| Bootstrapped, cost-disciplined | v1 build order ruthlessly slim; Critic/Promoter/Reporter/sealed-forms/eval-set are v2+ |

The architecture docs preserve the long-term vision; `strategy.md` enforces the short-term focus; this doc keeps the two in sync.

## Changelog
- 2026-06-20 v2: reconciled to the two-motion strategy ([`strategy.md`](./strategy.md) v3 / [ADR-0009]). Removed the superseded single-motion framing (English markets as a year-3+ conditional "v3"; DACH-regulated-only; "10–30 reps"; DACH-only milestones) and the duplicated company-strategy sections (wedge, why-wins, what-we-are-not, business milestones, business risks) — these now point to `strategy.md` as canonical. Refocused the doc on its distinct role: the architecture-facing strategy (architecture bet, requirements, moat-as-architecture, architecture non-goals/milestones/risks, and the strategy→architecture mapping). Added explicit precedence (`strategy.md` › this doc › architecture docs).
- 2026-06-16 v1: relocated from voxera-crm architecture set into the confidential command repo (exec-only). Added frontmatter + cohesion banner pointing to canonical company strategy.md.
