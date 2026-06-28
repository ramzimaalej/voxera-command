---
title: Strategy
version: 4
status: active
updated: 2026-06-27
owner: you
---

# Strategy — v2.0

This document sits above the architecture docs and frames them. The architecture docs answer "how does the system work." This one answers "what are we building, for whom, why now, and what are we not."

When this doc and the architecture docs disagree, this one wins.

---

## 1. The Bet, in One Sentence

We are building an **AI-native CRM with AI calling as the core capability, run via two parallel GTM motions: a DACH care-services motion (founder-led, UWG §7-compliant — Hausnotruf as the durable line, Pflegebox as a sunsetting entry bridge) and an English-speaking-markets motion (three SMB verticals — real estate, home services, insurance — paid-search-led)**, on a workflow-kind-agnostic platform that serves both without forking.

The product is a CRM. The differentiating capability is AI calling. The defensible moat varies per motion: regulated-vertical depth (DACH care services) and speed-of-response wedges (English-market verticals). The platform optionality is the OS underneath — same engine, same audit model, same agent roster, per-vertical labels and operators.

> *Original wedge + workflow-kind-agnostic-platform decision recorded as [ADR-0008: Pflegebox / DACH as v1 wedge on a workflow-kind-agnostic platform](../../decisions/ADR-0008-pflegebox-wedge-on-workflow-agnostic-platform.md). Parallel English-markets motion added per [ADR-0009: English-speaking markets GTM in parallel with the DACH motion](../../decisions/ADR-0009-english-markets-parallel-motion.md). The DACH durable line has since shifted from Pflegebox to Hausnotruf — Pflegebox is now a sunsetting bridge (see §2); this shift likely warrants its own ADR + a deeper iterate-vision pass.*

---

## 1a. Two parallel motions

| | **DACH care services** | **English-speaking markets** |
|---|---|---|
| Geography | Germany / Austria / Switzerland | US / UK / CA / AU / IE |
| Language | German (primary) | English |
| Lead motion | Inbound-then-outbound, UWG §7-compliant; founder-led | Paid search + landing pages; "AI calls the lead in 30 seconds" demo as central conversion |
| Verticals | Hausnotruf (durable v1 line), Pflegebox (sunsetting entry bridge, winds down by end-2027), then adjacent DACH care/insurance (Hörgeräte, private health, mobility) | Real estate (Q1), home services (Q2), insurance (Q2+) |
| Compliance frame | UWG §7, GDPR Art. 9, Pflegekassen paperwork | TCPA, CMS (Medicare), state insurance + real-estate rules |
| Wedge | Regulated-vertical depth + German-language voice | Speed of lead response + per-vertical pain |
| Buyer | CEO + ops manager at 5–30 person SMB | Solo agent (RE), owner-operator (HS), independent agent (Ins) |
| ACV target | $1,500+/mo per workspace | $149–$1,500/mo (RE highest, HS lowest) |
| Founder time | Continues at current pace (motion is stabilized) | 60% RE / 25% HS / 15% Ins of the time-not-on-DACH |

Both motions share the product, engine, design system, voice stack (Twilio + Ultravox per [ADR-0007]), audit model ([ADR-0003]), agent roster ([ADR-0004]). They differ in lead source, sales-motion shape, vocabulary preset ([ADR-0005]), and compliance frame.

Detailed playbook for the English-markets motion: [`vertical-strategy-english-markets.md`](./vertical-strategy-english-markets.md).

---

## 2. The Wedge

### Vertical and geography

**DACH motion:**
- **v1 durable line:** Hausnotruf (home emergency-call systems — a Pflegehilfsmittel funded by the Pflegekassen under §40 SGB XI). One active paying customer today (**lifeo**, commission-based at €80 per confirmed Hausnotruf contract), plus prospects in negotiation (Customer XY, DVP — unsigned). This is the durable go-forward DACH line.
- **v1 entry bridge:** Pflegebox (free monthly care supplies in Germany funded by Pflegekassen under § 40 SGB XI). This was the original v1 entry wedge, but the **Pflegebox market is sunsetting — it winds down by end-2027** — and its former payer (Kurapacket) churned 2026-06-13, so the Pflegebox line currently has no active payer. Any Pflegebox revenue is now a time-boxed bridge, not the durable basis for the DACH motion.
- **v2 verticals (year 2):** Adjacent DACH care/insurance — Hörgeräte (hearing aids), private health insurance, care services, mobility aids.

**English-markets motion** (running in parallel from now, per [ADR-0009](../../decisions/ADR-0009-english-markets-parallel-motion.md)):
- **Real estate (Q1 launch):** Solo agents and small brokerages. The 5-minute-rule wedge: most agents can't answer Zillow / Realtor.com leads fast enough; Voxera answers in 30 seconds.
- **Home services (Q2 expand):** Cleaners, plumbers, HVAC, electricians, landscapers, recurring services. The missed-calls wedge: every missed call is a lost job.
- **Insurance (Q2+ launch):** Independent Medicare / final expense / life / P&C agents. The lead-cost wedge: agents pay $15–$80 per lead and only work a fraction; Voxera works them all, TCPA-compliant.

### Sales motion

- **Outbound-heavy.** AI agents place outbound calls to inbound leads (paid search, partner referral, marketing lists) and qualify them through the funnel.
- **Hybrid close.** AI handles qualification; human handles closing where regulation or trust requires it.
- **Volume profile:** customers run 1k–20k+ calls/day per workspace.

### Buyer and user

- **Economic buyer:** CEO at SMB (5–30 person company).
- **User-buyer / day-to-day operator:** marketing manager, ops manager, or sales lead — whoever owns the outbound function.
- **Both are designed for.** CEO buys based on ROI demos and commission economics. Marketing/ops manager judges the daily product.

### Customer profile

- **Company size:** 1–30 reps (where "reps" includes AI agents replacing human SDRs). Solo agents (English-markets RE) at the small end; DACH SMB at the large end.
- **Geography:** Germany/Austria/Switzerland for the DACH motion. US/UK/CA/AU/IE for the English-markets motion.
- **Sales cycle from first contact to signed contract:** Days for English-markets (paid-search → trial → self-serve close); 1–2 weeks for DACH (founder-led with setup call).
- **Setup model:** 5-minute customer-facing setup call for DACH (Context Copilot behind the scenes). For English markets: ~30-minute self-serve trial with per-vertical templates ready-to-go; concierge available on day 3 for trials that haven't activated.

---

## 3. Why This Wedge Wins

### Why regulated verticals

- **Generalist competitors (HubSpot, Pipedrive, Close, Salesforce SMB) won't enter.** The compliance, paperwork integration, and vertical workflow depth aren't worth their effort.
- **AI-SDR specialists (Clay, 11x, Artisan, Regie) compete on volume and outreach, not vertical depth.** They sell outreach tools, not CRMs that handle the full lifecycle including paperwork and signed enrollments.
- **AI voice infrastructure (Vapi, Retell, Bland) sells the runtime, not the workflow.** Customers using their products still need a CRM on top. We're that CRM, with the voice agent baked in.
- **Regulated verticals pay for compliance.** Pflegekassen paperwork integration, German § 7 UWG opt-in handling, GDPR Art. 9 special-category data — these are real costs that generalists avoid and customers will pay for.

### Why DACH first

- A live, paying DACH account already (**lifeo**, Hausnotruf, €80/confirmed commission), with further DACH prospects in negotiation (Customer XY, DVP).
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

- **We are not a generic SMB CRM.** HubSpot/Pipedrive/Close own the horizontal SMB space; we compete on vertical fit and AI calling, never on "we do what they do, cheaper."
- **We are not a voice agent infrastructure company.** Vapi/Retell/Bland sell runtimes; we use Ultravox as runtime and compete one level up.
- **We are not an AI SDR tool.** Clay/11x/Artisan sell outreach automation; we sell the CRM that holds the full lifecycle.
- **We are not a horizontal SMB OS.** Not yet. The OS underneath is pivot insurance and platform-leverage for the two motions, not the year-1 positioning.
- **We are not selling to enterprise.** SMB only. Enterprise has different compliance, procurement, and integration demands.
- **We are not selling into truly unregulated, undifferentiated SMB SaaS.** Each vertical we serve has a clear pain we address better than a generalist can — Pflegekassen paperwork (DACH), 5-minute-rule lead response (RE), missed-calls + review requests (HS), TCPA-compliant AI dialing (Ins). A "generic B2B SaaS company that just wants a CRM" is not the ICP.
- **We do not run a cold-outbound motion in DACH.** UWG §7 restricts unsolicited cold-calling to consumers; the DACH motion is inbound-then-outbound. The English-markets motion runs paid-search-led with TCPA-compliant outbound — different jurisdiction, different rules, same product.

---

## 6. Funding Posture

- **Bootstrapped.** Cash flow from DACH commission revenue (today: lifeo's Hausnotruf line) funds operations.
- **No external capital raised.** This is a structural choice for the next 12 months; revisit if growth exceeds what bootstrapping can fund.
- **Implication:** every architecture and product decision needs to defend its cost. The OS underneath has to be cheap to preserve, not expensive. We're paying for it in code discipline, not in feature delays.

---

## 7. Milestones

### 12 months — combined target ≈ $1.7M ARR run-rate

**DACH motion:**
- Hausnotruf line scaled to operational maturity on the platform; commission revenue covers operating cost. (Today: lifeo live at €80/confirmed; Customer XY / DVP in negotiation.)
- 3–5 additional DACH-care customers signed (Hausnotruf-shaped or adjacent, similar buyer profile). Any residual Pflegebox revenue treated as a time-boxed bridge ahead of the end-2027 market sunset.
- Voice calling at production reliability for DE: voicemail handling, calendar booking, number pool management, live observability.
- DACH compliance posture documented and defensible (UWG §7, GDPR, Pflegekasse paperwork).

**English-markets motion** (per the per-vertical targets in `vertical-strategy-english-markets.md` §5.1):
- Real estate: $80K MRR by month 12 (paid acquisition stable, one MLS region expanded to several, first brokerage closes).
- Home services: $40K MRR by month 12 (all 5 sub-verticals running; review-request feature shipped).
- Insurance: $25K MRR by month 12 (soft launch in Q2, IMO partnership in motion, TCPA cornerstone resource live).
- Combined English-markets MRR ≈ $145K → ~$1.7M ARR run-rate.

**Platform:**
- First Critic findings on voice-agent prompts going through Promoter review.
- Workflow-kind-agnostic claim **proven** — the engine demonstrably serves four distinct verticals (Hausnotruf + RE + HS + Ins) without forking. This was an architecture claim in [ADR-0008]; year 1 makes it a demonstrated fact.

### 24 months

- DACH: expanded to one adjacent vertical (Hörgeräte or private health insurance).
- English markets: real estate dominant (>50% of English MRR), home services profitable, insurance reaching escape velocity via IMO partnerships.
- 50–100 paying customers total across both motions.
- Multi-language voice agents (DE + EN as first-class; FR/IT optional based on DACH expansion).
- Promoter automation tier 2 (low-risk auto-approval).
- Reporter agent shipped; user-defined reports operational.
- Onboarding self-serve enough for any vertical to set up in <60 minutes with per-vertical templates + Copilot assistance.

### 36 months

- DACH: 3+ verticals operational.
- English markets: established player in real estate; growing in home services; insurance partnerships compounding.
- Voice calling capability competitive with the strongest voice-agent specialists.
- The OS underneath is publicly described as a feature ("our platform handles your full workflow, not just your CRM").
- Decision to make: continue bootstrapping (likely yes if both motions hit plan) or raise growth capital for horizontal expansion.

---

## 8. Strategic Risks

| Risk | Mitigation |
|---|---|
| **Voice incumbents (Vapi/Retell) move up-stack into CRM territory** | Our moat is vertical depth and full-lifecycle CRM, not voice runtime. We use Ultravox; if voice gets commoditized further, that benefits us. |
| **HubSpot/generalists ship AI calling** | They'll do it shallow and generic. Our vertical depth (Pflegekasse paperwork, German compliance) is unreachable for them in any reasonable timeframe. |
| **DACH regulatory shift restricts AI cold-calling** | We're operating in inbound-then-outbound, not cold-calling, which is the higher-regulatory-risk zone. We track regulations and adjust. |
| **Pflegebox market sunsets (end-2027), stranding bridge revenue** | Already priced in: Hausnotruf is the durable DACH line, Pflegebox is treated as a time-boxed bridge only. The go-forward model rests on Hausnotruf economics (the live lifeo account), not on Pflegebox. |
| **Bootstrapping limits speed of product development** | DACH Hausnotruf commission revenue is real; we ship what we can fund. We refuse to over-build. |
| **OS preservation slows v1** | Architecture is mostly generic for free; rejection criterion for new features is "does this generalize?" The OS bet is a discipline, not a feature. |
| **We hit DACH-care PMF and don't expand** | That's an acceptable outcome. A profitable, focused DACH care-services company is a good business. The OS is option value, not obligation. |
| **Expansion to adjacent vertical fails** | We learn the wedge isn't generalizable as we thought. Decide: deepen the DACH care line, try another adjacent vertical, or rethink the OS bet. |

---

## 9. How This Doc Relates to the Architecture Docs

| Strategy doc says | Architecture doc implications |
|---|---|
| AI-native CRM, voice-calling-first | New pillar: `voice-calling.md` |
| OS underneath, vertical on top | Vocabulary generalization across all docs (Workflow not Pipeline, Process Instance not Lead at DSL level; CRM surface keeps user-facing labels) |
| Workflow-kind-agnostic | DSL declares `workflow_kind`; v1 ships `linear_funnel` only |
| Decoupled objects from workflows | Custom objects are workspace-scoped, referenced by workflows |
| Multiple terminal stages per workflow | Terminal stages declare disposition + reason taxonomy (generalizes lost-reasons) |
| DACH care (Hausnotruf, with Pflegebox as bridge) is the v1 forcing function | DACH care example throughout the docs; v2 vertical examples deferred |
| 5-minute setup + Copilot behind the scenes | Context Copilot interview can be shorter for known verticals; templates ship as starting points |
| Bootstrapped, no v1 budget for nice-to-haves | v1 build order ruthlessly slim; Critic/Promoter/Reporter/sealed-forms/mini-forms/eval-set as v2+ |

The architecture docs preserve the long-term vision; this doc enforces the short-term focus.

## Changelog
- 2026-06-27 v4: reconciled stale Pflegebox / "two paying customers" facts with reality — Kurapacket (the Pflegebox payer) churned 2026-06-13 and the Pflegebox market is sunsetting by end-2027, so the durable DACH line is now **Hausnotruf** (live via **lifeo** at €80/confirmed) with Pflegebox reframed as a time-boxed entry bridge. Replaced both "two paying customers already" claims (§2 Wedge, §3 Why DACH first) with the accurate "1 active Hausnotruf payer (lifeo) + prospects in negotiation (XY, DVP)." Updated §1 Bet, the §1a two-motion table, §6 Funding, §7 Milestones, and §8 Risks to read Hausnotruf-as-durable / Pflegebox-as-bridge. Factual-reconciliation pass only — the two-motion structure, English-market sections, and moat thesis are unchanged.
- 2026-06-18 v3: removed a duplicated '## 2. The Wedge' header.
- 2026-05-31 v2: added the two-motion structure (DACH + English-speaking markets in parallel) per [ADR-0009](../../decisions/ADR-0009-english-markets-parallel-motion.md). New §1a "Two parallel motions" table. §1 The Bet rewritten to acknowledge both motions. §2 Wedge expanded with the three English-market verticals (real estate Q1, home services Q2, insurance Q2+). §5 "What We Are Not" updated — softened the strict regulated-verticals-only clause; added explicit "no DACH cold-outbound" line. §7 Milestones expanded to include English-market MRR targets ($80K + $40K + $25K = $145K by month 12). Customer profile updated for the dual sales-motion + self-serve trial path. Backlink to ADR-0009 added in §1.
- 2026-05-31 v1: imported from `/Users/ramzi/Downloads/files-6/strategy-v1.0.md`; frontmatter added (status active), inline "**Status:** v1.0" line removed in favor of frontmatter.
