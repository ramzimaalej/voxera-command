---
title: Product Architecture Strategy
version: 1
status: active
updated: 2026-06-16
owner: you
---

# Product Architecture Strategy — v1.0

> **Confidential — exec only.** This doc frames the CRM platform architecture (in `../../../voxera-crm/docs/architecture/`) but contains business specifics (customers, milestones), so it lives in `voxera-command`, not in the code repo. Engineer-facing architecture docs reference this conceptually, not by link.
>
> **Cohesion:** this is the *product/architecture* strategy. The **canonical company strategy is [`strategy.md`](./strategy.md)** and wins on company strategy. Reconcile the two via `iterate-vision`; do not let them fork.

This document sits above the architecture docs and frames them. The architecture docs answer "how does the system work." This one answers "what are we building, for whom, why now, and what are we not."

When this doc and the architecture docs disagree, this one wins.

---

## 1. The Bet, in One Sentence

We are building an **AI-native CRM for outbound-heavy regulated verticals, starting with Pflegebox in DACH, on a platform architecture that lets us expand into adjacent verticals without rebuilding**.

The product is a CRM. The differentiating capability is AI calling. The defensible moat is vertical depth in regulated markets that generalists can't easily enter. The optionality is the OS underneath.

---

## 2. The Wedge

### Vertical and geography

- **v1 vertical:** Pflegebox (free monthly care supplies in Germany funded by Pflegekassen under § 40 SGB XI). Two paying customers already, commission-based.
- **v2 verticals (year 2):** Adjacent DACH care/insurance — Hörgeräte (hearing aids), private health insurance, care services, mobility aids.
- **v3 verticals (year 3+):** English-speaking regulated markets (US/UK Medicare-adjacent, dental, specific insurance lines) — conditional on v1/v2 success.

### Sales motion

- **Outbound-heavy.** AI agents place outbound calls to inbound leads (paid search, partner referral, marketing lists) and qualify them through the funnel.
- **Hybrid close.** AI handles qualification; human handles closing where regulation or trust requires it.
- **Volume profile:** customers run 1k–20k+ calls/day per workspace.

### Buyer and user

- **Economic buyer:** CEO at SMB (5–30 person company).
- **User-buyer / day-to-day operator:** marketing manager, ops manager, or sales lead — whoever owns the outbound function.
- **Both are designed for.** CEO buys based on ROI demos and commission economics. Marketing/ops manager judges the daily product.

### Customer profile

- **Company size:** 10–30 reps (where "reps" includes AI agents replacing human SDRs).
- **Geography:** Germany/Austria/Switzerland for v1. UK/US for v2-3.
- **Sales cycle from first contact to signed contract:** 1–2 weeks.
- **Setup model:** 5-minute customer-facing setup call (we configure the rest with the Context Copilot behind the scenes, not pure self-serve).

---

## 3. Why This Wedge Wins

### Why regulated verticals

- **Generalist competitors (HubSpot, Pipedrive, Close, Salesforce SMB) won't enter.** The compliance, paperwork integration, and vertical workflow depth aren't worth their effort.
- **AI-SDR specialists (Clay, 11x, Artisan, Regie) compete on volume and outreach, not vertical depth.** They sell outreach tools, not CRMs that handle the full lifecycle including paperwork and signed enrollments.
- **AI voice infrastructure (Vapi, Retell, Bland) sells the runtime, not the workflow.** Customers using their products still need a CRM on top. We're that CRM, with the voice agent baked in.
- **Regulated verticals pay for compliance.** Pflegekassen paperwork integration, German § 7 UWG opt-in handling, GDPR Art. 9 special-category data — these are real costs that generalists avoid and customers will pay for.

### Why DACH first

- Two paying customers already.
- German-language voice agent tuning gives us a head start on competitors.
- DACH care market has clear adjacent verticals — Hörgeräte, private insurance, mobility — with similar buyer profiles and paperwork patterns.
- Lower competitive density vs. English-speaking markets where AI CRM tools are saturated.

### Why outbound calling specifically

- It's the highest-leverage capability for these customers — outbound qualification is the bottleneck in their funnel.
- AI calling is genuinely differentiated right now. Text-based AI is commodity. Voice agents that hold real conversations and handle objections in German are still a real engineering achievement.
- Customers can attribute revenue directly to the calling capability, which makes the ROI case unambiguous (commission models are possible because of this).

---

## 4. The Moat

Three layers, deepening over time:

### Vertical depth (immediate)

- Pflegekasse paperwork integration (partner PDF mappings, signature flows, submission workflows)
- German call disclosure rules, opt-in verification, DNC scrubbing
- Pflegegrad-aware qualification flows
- German-tuned voice agent prompts, brand voice, cultural norms (Sie/du, dignity, professionalism)
- Outcome definitions that match how the vertical actually thinks about wins and losses

### AI calling depth (year 1)

- The voice agent runtime tuned for this domain — voicemail detection, calendar booking during calls, mid-call CRM lookups, mid-call escalation to human, real-time observability
- Cost-per-call discipline that lets customers run high volume profitably
- The Critic/Promoter loop improving voice agent prompts continuously from real call data (year 2+)

### OS underneath (year 2+)

- The architecture is workflow-kind-agnostic from day one. v1 ships `linear_funnel` only, but the engine, audit, agent roster, and DSL are generic.
- Custom objects are workspace-scoped, decoupled from specific workflows.
- New verticals (Hörgeräte, private insurance) get added by configuring new workflow definitions, new operator definitions, and new compliance rules — not by rebuilding.
- The OS is invisible to v1 customers but enables fast expansion when the time comes.

---

## 5. What We Are Not

To prevent strategy drift, these are explicit non-competitions:

- **We are not a generic SMB CRM.** HubSpot/Pipedrive/Close own that space; we don't fight there.
- **We are not a voice agent infrastructure company.** Vapi/Retell/Bland sell runtimes; we use Ultravox as runtime and compete one level up.
- **We are not an AI SDR tool.** Clay/11x/Artisan sell outreach automation; we sell the CRM that holds the full lifecycle.
- **We are not a horizontal SMB OS.** Not yet. The OS underneath is pivot insurance and year 2+ optionality, not the v1 positioning.
- **We are not selling to enterprise.** SMB only in v1-2. Enterprise has different compliance, procurement, and integration requirements.
- **We are not selling outside regulated verticals in v1.** A generic B2B SaaS customer asking for our product gets politely declined or redirected — they're not the ICP.

---

## 6. Funding Posture

- **Bootstrapped.** Cash flow from Pflegebox commission revenue funds operations.
- **No external capital raised.** This is a structural choice for the next 12 months; revisit if growth exceeds what bootstrapping can fund.
- **Implication:** every architecture and product decision needs to defend its cost. The OS underneath has to be cheap to preserve, not expensive. We're paying for it in code discipline, not in feature delays.

---

## 7. Milestones

### 12 months

- Pflegebox customers scaled to operational maturity on the platform; commission revenue covers operating cost.
- 3–5 additional Pflegebox-shaped customers signed (same vertical, similar buyer profile).
- Voice calling at production reliability: voicemail handling, calendar booking, number pool management, live observability.
- Compliance posture documented and defensible for DACH operations.
- First Critic findings on voice agent prompts going through Promoter review.
- Internal architecture confirmed workflow-kind-agnostic; one experimental non-Pflegebox workflow exists in a dev workspace as proof.

### 24 months

- Expanded to one adjacent DACH vertical (likely Hörgeräte or private health insurance).
- 15–25 paying customers total across verticals.
- Multi-language voice agents (DE primary, EN secondary, FR/IT optional).
- Promoter automation tier 2 (low-risk auto-approval).
- Reporter agent shipped; user-defined reports operational.
- Onboarding self-serve enough for a Pflegebox customer to set up in <60 minutes with Copilot assistance.

### 36 months

- 3+ verticals in DACH operational.
- First English-speaking customers in regulated verticals (US dental, UK private health, or similar).
- Voice calling capability competitive with the strongest voice-agent specialists.
- The OS underneath is publicly described as a feature ("our platform handles your full workflow, not just your CRM").
- Decision to make: continue bootstrapping or raise growth capital for horizontal expansion.

---

## 8. Strategic Risks

| Risk | Mitigation |
|---|---|
| **Voice incumbents (Vapi/Retell) move up-stack into CRM territory** | Our moat is vertical depth and full-lifecycle CRM, not voice runtime. We use Ultravox; if voice gets commoditized further, that benefits us. |
| **HubSpot/generalists ship AI calling** | They'll do it shallow and generic. Our vertical depth (Pflegekasse paperwork, German compliance) is unreachable for them in any reasonable timeframe. |
| **DACH regulatory shift restricts AI cold-calling** | We're operating in inbound-then-outbound, not cold-calling, which is the higher-regulatory-risk zone. We track regulations and adjust. |
| **Bootstrapping limits speed of product development** | Pflegebox revenue is real and growing; we ship what we can fund. We refuse to over-build. |
| **OS preservation slows v1** | Architecture is mostly generic for free; rejection criterion for new features is "does this generalize?" The OS bet is a discipline, not a feature. |
| **We hit Pflegebox PMF and don't expand** | That's an acceptable outcome. A profitable, focused DACH vertical company is a good business. The OS is option value, not obligation. |
| **Expansion to adjacent vertical fails** | We learn the wedge isn't generalizable as we thought. Decide: deepen Pflegebox, try another adjacent vertical, or rethink the OS bet. |

---

## 9. How This Doc Relates to the Architecture Docs

| Strategy doc says | Architecture doc implications |
|---|---|
| AI-native CRM, voice-calling-first | New pillar: `voice-calling-v1.0.md` |
| OS underneath, vertical on top | Vocabulary generalization across all docs (Workflow not Pipeline, Process Instance not Lead at DSL level; CRM surface keeps user-facing labels) |
| Workflow-kind-agnostic | DSL declares `workflow_kind`; v1 ships `linear_funnel` only |
| Decoupled objects from workflows | Custom objects are workspace-scoped, referenced by workflows |
| Multiple terminal stages per workflow | Terminal stages declare disposition + reason taxonomy (generalizes lost-reasons) |
| Pflegebox is the v1 forcing function | Pflegebox example throughout the docs; v2 vertical examples deferred |
| 5-minute setup + Copilot behind the scenes | Context Copilot interview can be shorter for known verticals; templates ship as starting points |
| Bootstrapped, no v1 budget for nice-to-haves | v1 build order ruthlessly slim; Critic/Promoter/Reporter/sealed-forms/mini-forms/eval-set as v2+ |

The architecture docs preserve the long-term vision; this doc enforces the short-term focus.

## Changelog
- 2026-06-16 v1: relocated from voxera-crm architecture set into the confidential command repo (exec-only). Added frontmatter + cohesion banner pointing to canonical company strategy.md.
