---
title: Voice Calling
version: 1
status: active
updated: 2026-05-31
owner: you
---

# Voice Calling — v1.0

The voice-calling pillar. The differentiating capability of the v1 product. Generic at the architecture level, with Pflegebox as the worked example.

---

## 1. Scope

A workspace Operator (per `multi-agent-architecture.md`) can be a **voice-calling Operator** — one that places or receives phone calls and converses with humans in real time. This document covers:

- Telephony integration (Twilio)
- Voice agent runtime (Ultravox)
- The voice-calling Operator's runtime model
- Voicemail handling
- Mid-call tool use (CRM lookups, calendar booking, escalation)
- Live observability (listen-in, take-over)
- Cost tracking per call
- Compliance prompts and consent capture per jurisdiction
- DNC scrubbing
- Number pool management

What this doc is *not*: a Pflegebox-specific operational scale-up plan. The architecture supports scaling but the operational specifics live elsewhere.

---

## 2. Stack

### 2.1 Components

- **Twilio** — telephony (numbers, outbound dialing, inbound routing, recording, STIR/SHAKEN, DNC tooling, programmable voice). Other providers (Telnyx, Vonage) are architecturally swappable but Twilio is the v1 choice for maturity and DACH coverage.
- **Ultravox** — real-time voice agent runtime (speech-in, speech-out, model-agnostic LLM inference, low-latency conversation). Provides the voice loop; we own the orchestration around it.
- **Engine + DSL** — defines the Operator, its tools, its prompt, its outcome schema, its rubric. Standard Operator definition from the workflow DSL.
- **CRM substrate** — the workflow engine where leads, custom objects, decisions, and audit live.

### 2.2 Why this split

We don't build voice runtime from scratch (would take 6+ months and not be competitive). We don't lock ourselves into a vertically-integrated voice agent platform (Vapi/Retell) because:
- They constrain the agent orchestration model.
- They make us a wrapper rather than a CRM with calling.
- Ultravox gives us the voice loop with LLM choice and orchestration flexibility, which is the right trade-off.

The split: Twilio handles the wire; Ultravox handles the voice loop; we handle everything that makes it a CRM (lead context, mid-call tools, outcome capture, compliance, observability, cost discipline).

> *Decision recorded as [ADR-0007: Twilio + Ultravox for the v1 voice stack](../../decisions/ADR-0007-twilio-ultravox-voice-stack.md).*

---

## 3. The Voice-Calling Operator

A voice-calling Operator is an Operator (per `multi-agent-architecture.md` §3.4) with `channel: voice`. Its definition extends the standard Operator shape:

```yaml
agents:
  - id: pflegebox_outbound_qualifier_de
    label: Pflegebox Outbound Qualifier (DE)
    role: operator
    channel: voice                           # voice | email | sms | chat
    direction: outbound                      # outbound | inbound | bidirectional
    language: de-DE
    voice_profile: cartesia_de_female_warm   # workspace-level voice library
    autonomy_ceiling: hybrid

    tools:
      # Standard CRM tools
      - update_field
      - transition_lead
      - create_task
      # Voice-specific tools
      - book_calendar_slot
      - send_followup_email
      - escalate_to_human
      - confirm_decision_maker
      - capture_pflegegrad
      - voicemail_drop

    context_sections: [brand_voice, products, glossary, regulatory, outcome_definitions, calling_compliance]

    prompt_template: |
      You are placing an outbound call for {{identity.name}}.
      {{compiled_context}}
      Compliance: begin every call with the disclosure prompt for your jurisdiction.
      ...

    # Voice-specific configuration
    call_config:
      max_duration_seconds: 600              # hard ceiling
      silence_timeout_seconds: 10
      voicemail_detection: enabled
      voicemail_action: drop_message         # drop_message | hangup | schedule_callback
      voicemail_message_template: pflegebox_vm_de
      record_call: true                       # subject to consent capture
      transcription: realtime

    metrics:
      - { id: connect_rate, kind: ratio, target: 0.35 }
      - { id: qualification_rate_of_connected, kind: ratio, target: 0.40 }
      - { id: avg_call_duration_qualified, kind: duration, target: 180s }
      - { id: cost_per_qualified_lead, kind: money, target_max: 5.00 }
      - { id: rubric_compliance, kind: score, target: 0.9 }

    outcome_schema:
      type: object
      properties:
        connection_status:
          type: string
          enum: [connected_human, voicemail, no_answer, busy, disconnected, declined]
        decision_maker_reached: { type: boolean }
        qualified: { type: boolean }
        disqualification_reason: { type: string, enum: [no_pflegegrad, out_of_region, opted_out, ...] }
        pflegegrad_confirmed: { type: integer, minimum: 0, maximum: 5 }
        next_action: { type: string, enum: [transfer_to_closer, schedule_callback, send_info, end] }
        consent_to_recording: { type: boolean }
        consent_to_followup_contact: { type: boolean }

    rubric:
      - "Identified self and company at start of call (Sie form)"
      - "Captured recording consent before proceeding"
      - "Confirmed decision-maker before discussing eligibility"
      - "Avoided forbidden phrases from brand_voice"
      - "Captured Pflegegrad accurately"
      - "Respected opt-out requests immediately and ended call"
      - "Did not call outside permitted hours"
```

The Operator's `recommended_actions` from its Decision Record (per the two-log audit model) translate into engine transitions: `update_field`, `transition_lead`, `dispatch_primitive`. Voice-specific actions (`book_calendar_slot`, `escalate_to_human`) are tool calls invoked *during* the live call, before the Decision Record is finalized at call end.

---

## 4. Call Lifecycle

A call is a structured execution with phases, each emitting outbox events:

```
   Initiate  →  Connect  →  Converse  →  Outcome  →  Postprocess
```

### 4.1 Initiate

- Engine selects the next call to make from the workflow's queue (leads in the workflow stage where this Operator runs).
- Pre-call eligibility check: number not on DNC list, within permitted calling hours for the recipient's jurisdiction, lead in the right stage, no prior consent withdrawal.
- Number pool selection: choose an outbound caller-ID number with healthy reputation for the recipient's region.
- Twilio outbound call initiated via API; call SID captured.
- Outbox event: `CallInitiated(call_sid, lead_id, operator_id, from_number, to_number, scheduled_at)`.

### 4.2 Connect

- Twilio dials; Answering Machine Detection (AMD) runs.
- One of: connected to human, hit voicemail, no answer, busy, disconnected.
- On connect-to-human: Twilio streams audio to Ultravox session; Ultravox loads the Operator's prompt + tools.
- Outbox event: `CallConnected(call_sid, status, amd_result, connected_at)`.

### 4.3 Converse

The live conversation runs through Ultravox. During this phase:

- **Compliance disclosure prompt** is the first thing the Operator says (configured per jurisdiction, see §6).
- **Recording consent** is captured if the jurisdiction is two-party-consent (Germany, many EU states). Without consent, recording stops; the call may continue without recording per Operator config.
- **Tool calls** during the conversation are mid-call actions: `confirm_decision_maker`, `capture_pflegegrad`, `book_calendar_slot`, `send_followup_email`. Each tool call emits a `MidCallToolUsed` outbox event with the tool, parameters, and result.
- **Real-time transcript** streamed to a transcript buffer; visible to live observers (§7).
- **Silence and timeout handling:** if silence exceeds `silence_timeout_seconds`, the Operator probes; if it exceeds 2x, the call ends.
- **Hard call duration ceiling** enforced by Ultravox session limit.

### 4.4 Outcome

At call end (human hangup, agent hangup, timeout, or hard ceiling):

- Ultravox session terminates; final transcript captured.
- Operator's final reasoning produces a **Decision Record** with:
  - `loaded_context` (Business Context sections + lead snapshot + call config used)
  - `reasoning` (rubric self-assessment, observations from the call)
  - `decision.recommended_actions` (post-call state transitions: update_field on outcome schema, transition_lead, dispatch followup primitives)
  - `confidence`
- Engine applies the recommended actions, each emitting outbox events with `causing_decision_id`.
- Outbox event: `CallEnded(call_sid, duration_seconds, end_reason, decision_record_id, outcome_summary)`.

### 4.5 Postprocess

Asynchronously after the call:

- Recording (if captured) uploaded to object storage.
- Full transcript stored, linked to the call record and lead.
- Cost computed: telephony minutes (Twilio inbound + outbound legs) + Ultravox session cost (audio in/out duration) + LLM tokens consumed during the call + TTS character cost. Stored per call.
- If the call needs a followup (calendar booking confirmation, email, Pflegekasse paperwork dispatch), the primitives fire.
- Outbox event: `CallPostprocessed(call_sid, total_cost_eur, recording_url, transcript_id)`.

### 4.6 The Call Object

Each call is a workspace-scoped object instance (custom object kind: `call_record`), automatically created by the engine. It carries:

```yaml
call_record:
  id: call_...
  lead_id: lead_...
  operator_id: pflegebox_outbound_qualifier_de
  direction: outbound | inbound
  from_number: +49...
  to_number: +49...
  initiated_at, connected_at, ended_at
  duration_seconds
  end_reason: human_hangup | agent_hangup | timeout | hard_ceiling | error
  connection_status
  recording_url
  transcript_id
  outcome: { connection_status, qualified, decision_maker_reached, ... }   # from outcome_schema
  decision_record_id
  cost_breakdown:
    telephony_eur
    ultravox_eur
    llm_tokens_eur
    tts_eur
    total_eur
  jurisdiction
  compliance:
    recording_consent: yes | no | not_required
    disclosure_completed: bool
    opt_out_captured: bool
```

Call records are queryable like any custom object and participate in reports.

---

## 5. Voicemail Handling

Most outbound calls hit voicemail. The system handles this without consuming an Ultravox session:

- AMD (Answering Machine Detection) runs as part of Twilio's connection phase. If AMD detects voicemail with high confidence:
  - **`hangup`**: end the call (default for low-value campaigns).
  - **`drop_message`**: play a pre-recorded TTS message (configured per Operator) using Twilio's `<Play>` or `<Say>` verb, then hang up. No Ultravox session opened.
  - **`schedule_callback`**: hang up, schedule a retry in N hours/days per the Operator's retry policy.
- If AMD is low-confidence and the call connects to what looks like a person, Ultravox session opens normally. If it turns out to be a voicemail mid-conversation, the Operator detects this (a common challenge) and triggers the `voicemail_drop` tool, ending the session.

Voicemail messages are pre-recorded TTS (cached audio files in object storage) to avoid LLM/TTS cost on every voicemail hit.

The voicemail action is configurable per Operator. For Pflegebox, the default is `drop_message` with a 15-second German message inviting a callback.

---

## 6. Compliance and Consent

Compliance is enforced at the Operator level via two mechanisms: pre-call gating and in-call prompts.

### 6.1 Pre-call gating

Before any call is initiated, the engine checks:

- **Time-of-day**: recipient's jurisdiction's permitted calling hours. Germany permits 09:00-20:00 weekdays, restricted weekends; configurable per workspace.
- **DNC scrubbing**: the recipient's number is checked against:
  - National DNC lists where applicable (US: National DNC Registry; UK: TPS; Germany: Robinson-Liste).
  - Workspace-internal DNC list (recipients who have opted out from this workspace).
  - Per-Operator DNC list (recipients who have opted out from this specific calling campaign).
- **Prior consent**: for outbound calls in jurisdictions requiring prior opt-in (Germany § 7 UWG for B2C), the engine checks that consent exists on the lead. No consent → call blocked.
- **Frequency cap**: maximum N calls per recipient per period (per workspace and per Operator).

If any check fails, the call is not initiated. An outbox event `CallBlocked(reason)` is emitted; the lead may be re-queued or moved to a different stage per configuration.

### 6.2 In-call prompts

The Operator's prompt template includes a **disclosure block** at the start of every call, configured per jurisdiction:

- **Germany**: "Mein Name ist [agent name] und ich rufe im Auftrag von [company name] an. Sind Sie damit einverstanden, dass dieses Gespräch zu Qualitätszwecken aufgezeichnet wird?" Followed by explicit consent capture for recording.
- **US (TCPA)**: "This call is from [company]. We may record this call for quality and training purposes." (one-party consent in most states; two-party consent in some, configured per state).
- **UK**: similar disclosure, GDPR-compliant.

The disclosure and consent capture are *not* skippable by the agent — the rubric enforces this and the Critic flags any Decision Records where they were skipped.

### 6.3 Consent capture

Captured consent (or refusal) is stored on the call record and on the lead:

- `lead.consent_to_recording` (bool)
- `lead.consent_to_recording_captured_at` (timestamp)
- `lead.consent_to_followup_contact` (bool)
- `lead.do_not_call` (bool — set when opt-out captured)

A captured opt-out (`do_not_call: true`) automatically adds the number to the workspace-internal DNC list, immediately effective for any in-flight or future calls.

### 6.4 Recording

- Recording is governed by jurisdiction-aware consent.
- Recordings are encrypted at rest in object storage.
- Recording retention follows workspace policy (default 90 days for active use, archived for longer if compliance requires).
- Access to recordings is permission-gated; every access emits an outbox event.

### 6.5 Jurisdiction configuration

A `calling_compliance` Business Context section declares the per-jurisdiction rules:

```yaml
calling_compliance:
  germany:
    permitted_hours: { weekday: "09:00-20:00", saturday: "09:00-18:00", sunday: blocked }
    consent_required: prior_opt_in       # for B2C; B2B has different rules
    recording_consent: two_party
    dnc_lists: [robinson_liste, workspace_internal]
    disclosure_template: pflegebox_disclosure_de
  austria: { ... }
  uk: { ... }
  us:
    state_overrides: { CA: two_party_recording, ... }
```

v1 ships Germany fully configured; other DACH and selected EU/UK rules added as customers require them.

---

## 7. Live Observability

A CEO/marketing manager buying this product wants to **listen in on calls live** and **take over** when needed. This is a real product differentiator and a real engineering surface.

### 7.1 What's surfaced live

- **Active calls dashboard**: all currently-in-progress calls in the workspace, with caller, recipient (anonymized per permissions), duration, stage, live transcript snippets.
- **Per-call live view**: real-time transcript, agent rubric self-assessment, current call duration, current cost, mid-call tool calls happening.
- **Listen-in**: a user with permission can stream the live audio to their browser (Twilio supports call siphoning to a listener).
- **Take-over**: a user can replace the AI agent mid-call. Mechanism:
  - User clicks "take over" → Twilio bridges the user's audio into the call.
  - Ultravox session ends; the AI agent stops speaking.
  - The user continues the conversation manually.
  - The handover is recorded as an outbox event `OperatorReplacedByHuman(call_sid, taken_over_by_user_id, at_duration_seconds)`.
  - The remaining call duration is tagged "human-operated" in the call record.

### 7.2 SSE integration

Per `realtime-collaboration.md`, live updates flow via SSE. Active calls subscribe their UI to:
- Live transcript chunks (ephemeral, not in outbox).
- `MidCallToolUsed` outbox events.
- `CallEnded` event.

Live audio for listen-in is a separate WebRTC channel (Twilio's Media Streams), not SSE — audio is too high-bandwidth for SSE.

### 7.3 Sampling and review

At 1000s of calls/day, a user can't watch every call. The Operator dashboard supports:
- Random sampling for human review.
- Filtered review (calls flagged by the agent's own rubric self-assessment as below threshold).
- Recent calls with specific outcomes (e.g., all "qualified" calls in the last hour, all calls where opt-out was captured).

These views are the substrate for the Critic's later analysis and for the eval dataset curation flow.

---

## 8. Cost Tracking

Customers running 1k-20k+ calls/day care intensely about per-call cost. The system surfaces this:

### 8.1 Cost components per call

- **Telephony**: Twilio per-minute outbound + per-minute inbound (different rates per destination country). Plus per-call connection fees in some regions.
- **Ultravox session**: per-minute audio inbound and outbound.
- **LLM tokens**: input + output tokens consumed by the agent during the call, at the rate of the chosen model.
- **TTS**: characters synthesized (for non-Ultravox-managed TTS use cases).
- **Number lease**: amortized per-call cost of the outbound number (small but counts at volume).

### 8.2 Storage and aggregation

- Per-call cost stored on the `call_record` object in `cost_breakdown`.
- Real-time per-workspace cost meter: today's spend, this week's spend, projected month.
- Per-Operator cost dashboard: cost per call, cost per connected call, cost per qualified lead.
- Cost rolls into operator metrics; if `cost_per_qualified_lead` exceeds the target, the Critic flags it as a finding.

### 8.3 Budgets and alerts

- Workspaces can set monthly call budgets.
- At 80% of budget: warning notification.
- At 100% of budget: configurable action — block new calls, alert only, or escalate to admin.

---

## 9. Number Pool Management

A single outbound number cannot place high call volumes without getting marked as SPAM. The system manages a pool of numbers per workspace:

### 9.1 Pool composition

- Numbers are acquired through Twilio's number provisioning API.
- Numbers are tagged by region (matching recipient region for better deliverability), purpose (outbound campaign, callback line), and reputation tier.
- Workspace admins see the pool in an admin UI: numbers, daily/weekly/monthly call volume per number, current reputation status, flagged-as-SPAM history.

### 9.2 Rotation logic

- Outbound number selection per call uses round-robin within healthy numbers, with daily volume caps per number (default 200 outbound calls/day/number; configurable).
- Number warming: new numbers start with low daily caps that ramp over 2-4 weeks.
- Reputation tracking: numbers reported as SPAM (via Twilio's spam-likely feedback or manual flags from customers) are pulled from rotation.

### 9.3 STIR/SHAKEN and caller ID display

- Numbers are STIR/SHAKEN attested via Twilio.
- Caller ID display (name + number shown to recipient) is configurable per number.
- For DACH operations, German caller-ID display rules are followed.

### 9.4 Inbound on the same numbers

Outbound numbers also receive inbound callbacks. Inbound calls route through the workflow's inbound webhook handler (per `cross-cutting-patterns.md` §1), which may invoke an inbound Operator.

---

## 10. Calendar Booking Mid-Call

When the agent qualifies a lead and the next step is a meeting with a human closer, the agent books a calendar slot **during the call**:

- Tool: `book_calendar_slot(closer_id, time_window_preference)`.
- Implementation: integrates with Google Calendar / Outlook / Cal.com via the workspace's connected calendar of the closer.
- Mid-call flow: agent asks for time preferences → calls the tool → tool returns 3 available slots → agent offers them verbally → recipient picks → tool confirms the booking.
- Confirmation: a calendar event is created on the closer's calendar; a confirmation email/SMS is sent to the recipient; the lead's workflow advances to the next stage.
- Outbox events: `CalendarSlotBooked(call_sid, closer_id, scheduled_at)`.

This is one of the highest-leverage capabilities of the voice agent — it converts a qualified call into a committed meeting without manual handoff.

---

## 11. Integration with the Multi-Agent Architecture

The voice-calling Operator is an Operator role per `multi-agent-architecture.md`. Its specific extensions:

- **Decision Records** at call end, not per utterance. Internal LLM calls during the conversation are observability traces; the *outward decision* is the post-call set of recommended actions, captured as one Decision Record per call.
- **Confidence calibration**: the Operator's confidence score in its outcome (e.g., "qualified: true, confidence 0.85") is tracked and the Critic monitors calibration vs. actual downstream outcomes.
- **Critic analysis**: examines completed call Decision Records + linked outbox events (the call's downstream outcome — did the booked meeting happen? did the lead close?). Patterns surfaced go to the Promoter.
- **Promoter approval**: voice agent prompt changes go through the standard Promoter flow with eval runs against the curated call eval set.
- **Eval set**: anonymized call Decision Records with human-labeled "what should have happened" — the most valuable training and evaluation data the system collects.

---

## 12. Failure Modes

| Failure | Handling |
|---|---|
| Twilio outage | Calls queued, retries with backoff; admin alerted |
| Ultravox latency spike or outage | Active calls degrade (fall back to a simpler scripted flow or end gracefully); admin alerted |
| Number flagged as SPAM | Auto-removed from rotation; replacement number used; admin alerted |
| Recipient opts out mid-call | Agent acknowledges, ends call respectfully, immediately writes `do_not_call: true` |
| Agent says something forbidden (rubric violation) | Captured in Decision Record; Critic flags; Promoter reviews next batch |
| Voicemail mistakenly classified as human | Agent detects within first turns, triggers `voicemail_drop`, ends session |
| Call exceeds hard duration ceiling | Twilio terminates; outcome recorded with `end_reason: hard_ceiling` |
| Calendar booking tool returns no slots | Agent offers callback scheduling instead; lead remains in qualified state |
| Cost budget exceeded mid-day | New calls blocked; in-flight calls allowed to complete |

---

## 13. v1 Build Order

1. **Twilio integration foundation** (2-3 weeks): outbound dialing, basic call lifecycle, AMD, recording, outbound number provisioning.
2. **Ultravox integration** (2-3 weeks): session lifecycle, audio streaming, tool-use during calls, transcript capture.
3. **Voice-calling Operator definition** (1 week): DSL extensions, prompt compilation, outcome schema, rubric.
4. **Compliance and consent layer** (2-3 weeks): pre-call gating, in-call disclosure prompts, consent capture, DNC scrubbing, jurisdiction config (Germany first, structure for others).
5. **Voicemail handling** (1-2 weeks): AMD-based routing, pre-recorded message drop, mid-call detection fallback.
6. **Call record object + cost tracking** (1-2 weeks): outcome capture, cost breakdown computation, cost dashboards.
7. **Live observability** (2-3 weeks): active calls dashboard, live transcript, listen-in, take-over.
8. **Number pool management** (2 weeks): pool admin UI, rotation logic, reputation tracking, warming.
9. **Calendar booking integration** (1-2 weeks): Google Calendar / Cal.com tool integration during calls.

Total: ~4-5 months for a focused team of 2 engineers.

---

## 14. Open Questions

- **Inbound calling.** v1 focuses outbound; inbound is supported architecturally but not deeply tuned. Worth a dedicated v2 pass for inbound qualification flows.
- **Multi-Operator handoff during a call.** Can a qualifier Operator hand off live to a closer Operator (also AI)? Cleaner alternative: end the call, schedule the closer's call. Recommend the latter for v1.
- **Languages beyond German.** Voice agent quality varies significantly per language. v1 is German-tuned; English (UK/US) added in v2; French/Italian added when customers demand.
- **Custom voice cloning.** Workspaces may want their CEO's voice or a specific brand voice. ElevenLabs/Cartesia support this; integration is a v2 feature.
- **Real-time sentiment / emotion detection.** Useful signal for the Critic but adds inference cost per call. Defer to v2.
- **Co-pilot mode for human callers.** Instead of replacing humans, the AI assists a human caller with real-time prompts and CRM lookups. Different product surface; defer unless customer demand emerges.

## Changelog
- 2026-05-31 v1: imported from `/Users/ramzi/Downloads/files-6/voice-calling-v1.0.md`; frontmatter added (status active), inline "**Status:** v1.0" line removed in favor of frontmatter.
