---
title: Voxera Vision
version: 2
status: active
updated: 2026-06-20
owner: you
---

# Voxera Vision

> The durable north star. Strategy (the *current* bet, motions, and milestones) lives in
> [`../strategy/strategy.md`](../strategy/strategy.md); the architecture principles that implement
> this vision live with the CRM code. This doc is the compass above both — what stays true as the
> verticals and tactics change.

## North star

**Voxera is an AI-native CRM whose core capability is AI calling** — built for outbound-heavy SMBs
in verticals that generalist CRMs underserve, on a **workflow-kind-agnostic platform (an SMB OS
underneath)** that grows into new verticals by *configuration, not by rebuilding*.

The product is a CRM. The differentiator is AI calling. The moat is vertical depth — regulated
(DACH care) and high-velocity (English-market real estate, home services, insurance) — that
generalists can't easily reach. The OS underneath is optionality: invisible to early customers,
the thing that lets one engine serve every vertical without forking.

## Who it's for (ICP)

**Outbound-heavy SMBs (roughly 1–30 reps, where "reps" can be AI agents) whose growth is bottlenecked
on calling and qualifying leads fast, in the right language and compliance frame.**

- **Economic buyer:** the CEO/owner of a 5–30 person company, who buys on ROI and commission economics.
- **Day-to-day user:** the ops / marketing / sales lead who owns the outbound function.
- **Job to be done:** respond to and qualify *every* lead the moment it arrives, run the full lifecycle
  through to a signed outcome, and do it without standing up (and managing) a team of human SDRs.
- **The pain today:** generic CRMs don't place the calls or carry the vertical's paperwork, compliance,
  and outcome definitions; leads go cold before anyone responds; every missed call is lost revenue.

Two motions, one product (see [`../strategy/strategy.md`](../strategy/strategy.md) §1a): **DACH/Pflegebox**
(regulated care, founder-led, UWG §7-compliant) and **English-speaking markets** (real estate, home
services, insurance; paid-search-led). Same engine, audit model, and agent roster; different lead
source, vocabulary, and compliance frame.

> *Wedge + workflow-kind-agnostic-platform decision: [ADR-0008](../../decisions/ADR-0008-pflegebox-wedge-on-workflow-agnostic-platform.md). Parallel English-markets motion: [ADR-0009](../../decisions/ADR-0009-english-markets-parallel-motion.md).*

## Positioning

For **outbound-heavy SMBs in verticals that generic CRMs underserve**, Voxera is the **AI-native CRM
with calling built in** that **qualifies every lead in their language and compliance frame and runs the
full lifecycle to a signed outcome** — unlike:

- **generic SMB CRMs** (HubSpot, Pipedrive, Close) — no calling, no vertical depth; we never compete as "the same thing, cheaper";
- **voice-agent infrastructure** (Vapi, Retell, Bland) — a runtime, not a CRM; we *use* a runtime and compete one level up;
- **AI-SDR / outreach tools** (Clay, 11x, Artisan) — outreach automation, not the system of record that holds the whole lifecycle.

## Principles

The durable design philosophy. (Full architecture principles P1–P13 live with the CRM code; these are the load-bearing few.)

- **Predictability through context quality, not agent cleverness.** A well-articulated Business Context is the substrate; agents interpret it. Vague context → vague behavior, surfaced honestly, never hidden. Reducing the friction of *describing your business well* is the deepest moat.
- **Constraint over capability.** A fixed agent roster (defined in code), scoped tool surfaces, autonomy ceilings, and *no engine privileges* — every agent action flows through the same API, RBAC, and audit a human would. Reliability comes from constraint, not from emergent "agent swarms."
- **Every agent action is a proposal.** Configurations, DSL changes, prompt deltas, reports — nothing commits without a user-visible diff and an approval (one click when the proposal is good). We choose one-click *trust* over zero-touch *opacity*.
- **Observability beats automation.** Users tolerate AI mistakes when they can see every action with its rationale and intervene easily. Full automation is a v2+ capability gated by evidence, never the default pitch.
- **Trustworthy numbers.** Reports are computed DSL artifacts rendered by a standard engine — never LLM-generated numbers shown to a customer or used for a decision.
- **Workflow-kind-agnostic engine, vertical-shipped product.** The engine, DSL, audit, and agent roster are process-agnostic from day one; the product ships one vertical at a time with CRM-flavored labels. A new vertical is a configuration, not a rebuild — *generalize or reject*.
- **Vertical depth and compliance are the moat, not a checkbox.** Pflegekasse paperwork, UWG §7 / GDPR Art. 9, TCPA — the regulated/edge work generalists avoid is exactly what customers pay for.
- **Bootstrapped discipline.** No external capital for now; every architecture and product decision defends its cost. We preserve the OS in code discipline, not in feature delays.

## What we are NOT doing

Scope guardrails — as load-bearing as the vision itself (see [`../strategy/strategy.md`](../strategy/strategy.md) §5).

- **Not a generic / horizontal SMB CRM.** We compete on vertical fit and AI calling, never on "what HubSpot does, cheaper."
- **Not a voice-agent infrastructure company.** We consume a runtime (Twilio + Ultravox) and compete one level up.
- **Not an AI-SDR / outreach tool.** We are the CRM that holds the full lifecycle, not an outreach add-on.
- **Not selling to enterprise.** SMB only — enterprise procurement, integration, and compliance are a different company.
- **Not zero-touch automation, agent swarms, or dynamic agent spawning.** Fixed roster; proposal-and-approve.
- **Not a no-code form builder, general code execution in workflows, custom model training, or an agent marketplace.** Those are explicitly other people's problems.
- **Not a CRM that works without a Business Context.** A workspace with an empty Context is broken by design.
- **Not running cold outbound in DACH.** UWG §7 means the DACH motion is inbound-then-outbound; the English-markets motion is paid-search-led with TCPA-compliant outbound.

## Changelog
- 2026-06-20 v2: filled the vision from the source-of-truth foundation docs (`architecture-vision-and-principles-v1.0` §1–§4) reconciled with the current two-motion strategy (`strategy.md` v3 / ADR-0009). North star, ICP, positioning, principles, and non-goals authored; status → active.
- 2026-05-27 v1: initial draft (skeleton).
