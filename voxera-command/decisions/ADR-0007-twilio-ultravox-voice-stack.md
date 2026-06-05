---
id: ADR-0007
title: Twilio + Ultravox for the v1 voice stack — split the wire, the voice loop, and the CRM
status: accepted
date: 2026-05-31
supersedes: []
superseded_by: null
affects:
  - docs/architecture/voice-calling.md
  - docs/strategy/strategy.md
---

## Context

Voice calling is the differentiating capability of v1 (per `strategy.md` §1, §3). Building it from scratch — telephony, real-time speech, low-latency LLM voice loop — would take 6+ months and not be competitive. Buying an end-to-end vertically-integrated voice agent platform (Vapi, Retell, Bland) ships faster but reduces us to a wrapper over someone else's runtime, with their orchestration constraints baked in.

The product is a CRM with calling, not a calling tool. The split matters.

## Decision

Three-layer split for v1:

- **Twilio** — telephony layer. Numbers, outbound dialing, inbound routing, recording, STIR/SHAKEN, DNC tooling, programmable voice. DACH coverage is the v1 driver. Other providers (Telnyx, Vonage) are architecturally swappable.
- **Ultravox** — voice agent runtime. Real-time speech-in / speech-out, model-agnostic LLM inference, low-latency conversation. Provides the voice loop; we choose the underlying LLM.
- **Voxera engine + DSL + CRM substrate** — Operator definition, tools (CRM lookups, calendar booking, escalation, jurisdiction-specific compliance prompts, voicemail drop), outcome capture, observability (listen-in, take-over), cost tracking, DNC scrubbing, number-pool management.

The voice-calling Operator is just an Operator (per [[ADR-0004]]) with `channel: voice`. Same DSL shape, same outcome schemas, same Decision Records, same audit.

## Alternatives considered

- **Vapi / Retell / Bland (vertically integrated voice platforms)** — fastest to first call, but they constrain the agent orchestration model and make us a wrapper. Switching costs are high once leads flow through their runtime. Rejected.
- **Build the voice runtime in-house** — 6+ months minimum, not competitive on latency, and the speech stack is not where we differentiate. Rejected.
- **Twilio + a different runtime (LiveKit Agents, Deepgram Voice Agents, Pipecat)** — viable; the architecture treats Ultravox as the v1 choice but the orchestration is structured so the runtime is swappable if Ultravox falters or pricing shifts.

## Consequences

- Positive:
  - Time-to-first-call is weeks, not quarters.
  - We control everything that makes it a *CRM* — lead context, mid-call tools, outcome capture, compliance, cost discipline.
  - LLM choice stays ours; we are not locked to whatever model the runtime vendor ships.
  - The voice Operator is one Operator template, not a separate subsystem — audit and Decision Records are uniform.
- Negative / risks:
  - Two vendor dependencies (Twilio + Ultravox) instead of one. Outage blast radius doubles.
  - Per-call cost = Twilio + Ultravox + LLM tokens + our infra. Cost-tracking discipline (per `voice-calling.md` §scope) must catch surprises before they hurt unit economics.
  - DACH coverage and German-language quality are continuously evaluated — if either degrades, we revisit.
- Follow-ups:
  - Define swap-out plan for the voice runtime (Ultravox → alternative) before the second vertical ships.
  - Per-call cost dashboard live before customer #4.
