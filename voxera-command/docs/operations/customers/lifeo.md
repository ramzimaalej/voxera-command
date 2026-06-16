---
title: lifeo
slug: lifeo
version: 4
status: active
health: yellow
since: "2026-01-01"   # unconfirmed start date
updated: 2026-06-13
owner: you
motion: dach
plan: "Performance / commission — €80 per confirmed new customer (Hausnotruf line)"
mrr_usd: null         # commission-based; no fixed MRR. Revenue = €80 × confirmed new customers.
primary_contact: "Ahmed Abida — primary contact / relationship champion"
secondary_contact: ""
---

# lifeo

## Summary
lifeo sells **Hausnotruf** — home emergency-call systems, a Pflegehilfsmittel also funded by the Pflegekassen under §40 SGB XI (monthly subsidy for subscribers with a Pflegegrad). Voxera runs outbound qualification for them on the same performance basis as Kurapacket: €80 per confirmed new customer on the Hausnotruf line. Note this account is **not** a Pflegebox payer — the product line is Hausnotruf, which is the main way they differ from Kurapacket and a useful second vertical to learn from.

## Account context

- **Industry / vertical**: Hausnotruf provider (home emergency-call systems; Pflegehilfsmittel funded by Pflegekassen under §40 SGB XI)
- **Product line we sell for them**: Hausnotruf
- **Size**: unknown — confirm
- **Geography**: Germany
- **Use case**: Outbound qualification of leads — Voxera's voice agents call prospects and qualify them as potential Hausnotruf customers
- **Key integrations**: Pflegekassen subsidy / paperwork flow (to confirm); lead source / hand-off mechanism to confirm
- **Volume profile**: ~3,500 outbound calls/day → ~25 qualified potential customers/day
- **Commercial terms**: Performance-based — €80 per **confirmed** new customer on the Hausnotruf line
- **Compliance frame**: GDPR Art. 9 (special-category health data), UWG §7 (cold-calling restrictions), Pflegekassen §40 SGB XI rules

## Champions + stakeholders

- **Ahmed Abida** — primary contact, champions day-to-day communication with the account (same champion as Kurapacket). _(Confirm whether internal Voxera-side account owner or payer-side contact.)_

## Pulse log (newest first)

### 2026-06-13 — yellow
- **Not churned — partnership continues.** No formal termination letter has been received from lifeo. The 2026-06-06 "contract closed / migrated to Customer XY" entry was premature: lifeo is **still an active payer** on the Hausnotruf line at **€80 per signed & confirmed contract** (unchanged). Status reverted churned → active.
- **Why yellow, not green**: continuation is currently only *implicit* (absence of a termination letter), not formally reconfirmed, and a migration away was recently anticipated. Confirm lifeo's intent in writing before treating this as solid.
- **Operational context (workspace-wide this week)**: the calling operation **signed 49 new contracts** this week (30 Pflegebox + 19 Hausnotruf) with **1,051 leads** in the bottom of the funnel. Note **signed ≠ billable** — lifeo bills on *confirmed* Hausnotruf at €80, so only the confirmed share of the 19 Hausnotruf signings pays out. Get the signed→confirmed rate.
- Action items below.

### 2026-06-06 — churned
- **Contract closed.** Voxera ended its commission contract with lifeo. The Hausnotruf calling operation transitions to a new customer, **Customer XY** (see `customer-xy.md`), at a higher rate — **€95 per confirmed Hausnotruf customer** (vs €80 here) — starting **2026-06-08**.
- Not a service failure: replaced by a better-paying customer for the same product line. The ~3,500 calls/day Hausnotruf operation continues under XY.
- The open baseline action items below are now moot (no longer an active account).

### 2026-06-05 — green
- **Baseline established.** Captured the real account identity and commercial model: lifeo pays Voxera **€80 per confirmed new customer** on the **Hausnotruf** line.
- **Correction to prior framing**: this account was scaffolded as "Pflegebox Payer #2", but lifeo sells **Hausnotruf**, not Pflegebox. Vertical and product line updated accordingly.
- **Operations**: ~3,500 outbound calls/day producing ~25 qualified potential customers/day (~0.7% call→qualified rate) — same shape as Kurapacket.
- **Stakeholder**: Ahmed Abida is the primary contact championing communication with the account.
- No churn, support-escalation, or pricing-friction signals at this time → green. Setup/baseline entry, not a satisfaction read.
- **Key unknown to close**: the qualified→confirmed conversion rate — the number that decides whether 3,500 calls/day is profitable at €80/confirmed. We have qualified/day (~25) but not confirmed/day yet.
- Action items: confirm start date; establish qualified→confirmed conversion + daily confirmed count; confirm Ahmed's side; schedule baseline check-in.

## Open action items

- [ ] **you**: get lifeo to confirm partnership continuation in writing — no termination letter received, but continuation is currently only implicit (due 2026-06-20)
- [ ] **you**: of this week's 19 signed Hausnotruf contracts, establish the signed→confirmed rate — only confirmed contracts bill to lifeo at €80 (due 2026-06-20)
- [ ] **you**: confirm actual contract start date with Ahmed (due 2026-06-12)
- [ ] **you**: establish the qualified→confirmed conversion rate and confirmed-customers/day — the core profitability metric (due 2026-06-12)
- [ ] **you**: confirm whether Ahmed Abida is internal Voxera-side or payer-side, and capture the economic buyer if different (due 2026-06-12)
- [ ] **you**: schedule baseline check-in call with the account (due 2026-06-12)
- [ ] **you**: refine strategy.md "Wedge" — it frames the v1 vertical as Pflegebox with "two paying customers," but one of the two (lifeo) is Hausnotruf, not Pflegebox. Route via iterate-doc/iterate-vision (due 2026-06-12)

## Closed action items (recent)

_(none yet)_

## Risks + watch-outs

- **Margin risk (performance model)**: revenue is €80 × confirmed customers; cost is ~3,500 calls/day. If qualified→confirmed conversion is low, operating cost can outrun revenue.
- **Vertical-edge risk**: Hausnotruf differs from Pflegebox (recurring subsidy vs monthly supplies, different qualification questions). Watch for edge cases that only show up on this line.
- **Pflegekassen subsidy / compliance** is the biggest churn risk in this vertical.
- **UWG §7** cold-calling compliance — operational drift here is existential.

## Expansion / upsell signals

- Potential to add a Pflegebox line (mirroring Kurapacket) if Hausnotruf proves out — same champion, same calling operation.

## Changelog
- 2026-06-13 v4: reversed premature churn — status churned → active, health → yellow. No termination letter received; lifeo is still an active Hausnotruf payer at €80/confirmed. Removed churned_on. Noted weekly operation throughput (49 signed, 1,051 leads bottom-of-funnel) pending per-line attribution.
- 2026-06-06 v3: contract closed — status → churned, health → unknown. Hausnotruf operation moves to Customer XY at €95/confirmed from 2026-06-08.
- 2026-06-05 v2: filled in scaffold with real account (lifeo, **Hausnotruf** line — corrected from the "Pflegebox Payer #2" placeholder); recorded €80/confirmed-customer commission model, ~3,500 calls/day → ~25 qualified/day, Ahmed Abida as primary contact; set health green; renamed from `pflegebox-payer-2.md`.
- 2026-05-31 v1: scaffold file created. Awaiting rename + fill-in.
