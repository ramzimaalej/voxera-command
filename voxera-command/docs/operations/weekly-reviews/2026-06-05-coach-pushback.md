---
title: Coach pushback — week ending 2026-06-05
version: 1
status: active
updated: 2026-06-07
owner: you
---

> **⚠️ Point-in-time snapshot — some conclusions superseded.** This is the coach pushback generated *during* the weekly review, **before** the Customer XY transition and the revised financials were known. It reflects the state as of 2026-06-05 (Kurapacket + lifeo active at €80/confirmed, conversion unknown). Kept for the record of the week's reasoning; **do not treat its numbers as current**. What changed since:
> - Kurapacket + lifeo **churned** 2026-06-06; replaced by **Customer XY** (€90/€95) — see [`../customers/customer-xy.md`](../customers/customer-xy.md).
> - The "unknown confirmed/day" question is now answered: **4 closed/day → 1.6 confirmed/day**, operation **~€6.8k/mo underwater**, **~3-week runway** — see [`../revenue-model.md`](../revenue-model.md) and the corrected note [`2026-06-05.md`](./2026-06-05.md).

---

# Weekly review — coach pushback (week ending 2026-06-05)

This is the **first** weekly review. There is no prior weekly note to cross-reference, so the backward-looking accountability picture is, by definition, mostly empty — and I'm not going to invent slippage to fill the page. The one real backward-looking signal is below under Strategic drift. The forward-looking half is where the work is.

---

## Accountability check — first week (ending 2026-06-05)

**Cadence:** This is review #1. `docs/operations/weekly-reviews/` holds only a README — no past notes exist. Nothing has had time to slip.

### Chronic slippers (3+ weeks)
None possible. No prior weekly notes exist, so no priority has been carried across weeks.

### Silently dropped
None possible. No prior commitments to drop.

### Past-due commitments to others
None. No prior weekly note recorded any commitment to a third party. Note: every open customer action item (below) is owned by you and tracked, not a commitment owed to an external party — and none is past due yet.

### Customer-pulse signals
Both accounts are **green**, both freshly updated 2026-06-05. No green→yellow→red transition exists in either pulse log. No churn, support-escalation, or pricing-friction signal in either file. These are baseline/setup entries, not satisfaction reads — treat the green as "no data yet," not "confirmed healthy."

Open action items exist but are **not** past-due and **not** declines. Logging them so they don't quietly age:

- **Kurapacket** (Pflegebox, `docs/operations/customers/kurapacket.md`) — 4 open items, all due 2026-06-12: confirm contract start date; establish qualified→confirmed conversion + confirmed/day; confirm whether Ahmed Abida is Voxera-side or payer-side; schedule baseline check-in.
- **lifeo** (Hausnotruf, `docs/operations/customers/lifeo.md`) — 5 open items, all due 2026-06-12: same four as above, **plus** "refine `strategy.md` Wedge — it frames v1 as Pflegebox with 'two paying customers,' but lifeo sells Hausnotruf, not Pflegebox."

The single most load-bearing unknown across **both** files is the same: the **qualified→confirmed conversion rate**. The whole business runs on €80 per *confirmed* customer against a cost base of ~3,500 calls/day per account (~7,000 total). You know qualified/day (~25 each). You do **not** know confirmed/day. Until you do, you cannot say whether either account is profitable — and you are currently treating "green" as if you do.

### Strategic drift — the one real backward-looking observation

**12 ADRs decided (ADR-0001 … ADR-0012). 0 FEATs in motion. 0 work shipped this week.**

- FEAT-001 (Astro vertical landing templates) and FEAT-002 (`/real-estate` page) are the **only two items in the roadmap "Now" column** — and both are still `status: draft`. Nothing is `refining`, `plan_approved`, or `implementing`.
- FEAT-002 is blocked on FEAT-001 (`implements: [FEAT-001]`), and FEAT-001 is blocked on nothing — it's draft purely because no one has started it.
- ADR-0009 names the English-markets motion as a co-equal motion to DACH and the entire roadmap "Now" column is English-markets work. Yet zero English-markets work is in motion. The decision was made; the build hasn't started.

This is the honest read: **the setup window produced a lot of decisions and zero shipped product.** Decisions are cheap; they don't generate revenue or learning. That's expected for a setup window — but if next week produces a 13th ADR and still no FEAT in `implementing`, that's a pattern, not a phase.

### Review cadence
Weekly notes in the period: this is the first. None skipped. This review establishes the cadence — keep it.

### Pointed questions (sit with these before setting priorities)
1. 12 decisions are recorded; 0 are converting into shipped work. What specifically turns FEAT-001 from `draft` into `implementing` next week — and if nothing does, why is it in the "Now" column at all?
2. Both customers are "green," but you don't know the qualified→confirmed rate — the one number that decides if €80/confirmed beats your call-cost. Are you calling them green because they're healthy, or because you haven't looked?
3. ADR-0009 commits you to running DACH **and** English-markets in parallel as a solo-ish founder. Which motion actually gets your hours next week? "Both" is not an answer — name the split.

---

## Priorities coach — recommended top 5 for week ending 2026-06-12

State going in: no active FEATs, no open critical bugs (BUG-001 is `fixed`), two green-but-unmeasured DACH accounts, an English-markets motion fully decided (ADR-0009) but not started, roadmap "Now" = FEAT-001 + FEAT-002. User profile: `autonomyLevel: autonomous`, `breakpointTolerance: minimal`, expert TypeScript/React/NestJS — i.e., you can build the English-markets pages fast yourself.

### #1 — Establish the qualified→confirmed conversion rate for both accounts
**Why**: This is the highest-leverage thing on the board and it isn't even on the roadmap. Both pulse files name it as "the number that decides whether 3,500 calls/day is profitable" (`kurapacket.md` line 46, `lifeo.md` line 46). You have ~7,000 calls/day of cost running against revenue you cannot currently quantify. Every other priority — building landing pages, signing new logos — assumes the core unit economics work. If confirmed/day is too low, the €80 model is underwater and the right move is to fix conversion before scaling anything. You cannot make a single good resource-allocation decision next week without this number.
**Definition of done**: A confirmed/day figure (or qualified→confirmed %) for Kurapacket and lifeo, written into both pulse logs, with a one-line read on whether each account is above or below break-even at €80/confirmed.
**Cost**: ~2–4 founder-hours. Blocking dependency: Ahmed Abida (the data source). Get on a call with him — this also closes three of the four other open items per account at once.

### #2 — Move FEAT-001 from `draft` to `implementing`
**Why**: FEAT-001 is one of two items in the roadmap "Now" column and it blocks FEAT-002 (the `/real-estate` page) and every other vertical page. ADR-0009 made the English-markets motion a committed bet; it has produced zero code. FEAT-001 is the foundational unblock — Astro templates for the vertical landing system. You're an expert in this stack; the gate is starting, not capability. Until this ships, the entire English-markets motion is decided-but-dead.
**Definition of done**: FEAT-001 spec refined to `plan_approved` (or further), and the implementing run started in `voxera-website` via `implement-feature.js`. "Started and in motion" is the bar for this week, not necessarily "merged."
**Cost**: ~1 founder-hour to refine the spec + approve the plan; the build itself runs semi-autonomously per your autonomy profile. Real cost is the decision to spend the week's English-markets hours here vs. on DACH.

### #3 — Close the Kurapacket/lifeo baseline action items (the non-conversion ones)
**Why**: Nine open action items across the two accounts, all due 2026-06-12 (next Friday). Four per account are factual gaps that make the accounts un-managed: unconfirmed start date, unconfirmed whether Ahmed is Voxera-side or payer-side (you don't currently know who the economic buyer is), and no baseline check-in scheduled. These aren't past-due yet, but they all come due the day this priority window closes. Most close in the same conversation as #1.
**Definition of done**: All four baseline items per account marked closed in both pulse files (start date, Ahmed's side + economic buyer, check-in scheduled, conversion captured via #1).
**Cost**: Folds into the #1 call. ~1 hour of follow-up to write it up.

### #4–5 — bench
- **Fix the strategy.md Pflegebox/Hausnotruf framing** (lifeo open item, due 2026-06-12) — `strategy.md` §2 still says "v1 vertical: Pflegebox… two paying customers," but lifeo sells Hausnotruf. It's a real factual error in the source-of-truth strategy doc. On the bench only because it's a 20-minute `iterate-doc` fix with no revenue consequence this week — but close it before it propagates into website copy or a pitch.
- **Draft FEAT-002's plan** — useful prep, but pointless to start until FEAT-001 (#2) is actually in motion, since FEAT-002 `implements: [FEAT-001]`. Bench it until #2 clears.

### The one-thing test
If you could do only ONE thing this week: **#1 — get the qualified→confirmed conversion number from Ahmed.** Reasoning: it's a 2-hour call that simultaneously tells you whether your only revenue stream is profitable, closes the majority of both customers' open action items, and is the precondition for every scaling decision (including whether English-markets is even the right place to spend the week). Building a landing page for a motion while not knowing if your existing motion makes money is optimizing the wrong end.

### Tradeoffs surfaced
- **#1 + #3 are DACH-motion work; #2 is English-markets.** Doing #1 first means the English-markets build (#2) starts mid-week, not Monday. That's the right order: measure the motion that already has revenue before pouring hours into the motion that has none. But be explicit — this week tilts DACH, contra a naive even split.
- **What gets sacrificed:** FEAT-002 (`/real-estate` page) does not ship this week and shouldn't be forced — it's correctly blocked on FEAT-001.
- **Not on the list, deliberately:** signing new Pflegebox-shaped logos, IMO/insurance partnership outreach, home-services page. All are real strategy items (`strategy.md` §7, English-markets §5.1) but all are premature until (a) you know the existing accounts are profitable and (b) the first vertical page exists as a conversion surface. Chasing logos before the conversion math is known is how a commission model quietly loses money at scale.

## Changelog
- 2026-06-07 v1: preserved from the babysitter run artifact (`artifacts/01KTFKDY6D3RZ95E0CKRK2YVDE-pushback.md`) into the permanent weekly-reviews record, with a superseded-snapshot header. Content unchanged from generation.
