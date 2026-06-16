---
title: Kurapacket
slug: kurapacket
version: 4
status: churned
health: red
since: "2026-01-01"   # unconfirmed start date
churned_on: "2026-06-06"   # contract closed; loss confirmed 2026-06-13. Pflegebox now has no active payer (Customer XY not yet signed).
updated: 2026-06-13
owner: you
motion: dach
plan: "Performance / commission — €80 per confirmed new customer (Pflegebox line)"
mrr_usd: null         # commission-based; no fixed MRR. Revenue = €80 × confirmed new customers.
primary_contact: "Ahmed Abida — primary contact / relationship champion"
secondary_contact: ""
---

# Kurapacket

## Summary
Kurapacket is a Pflegebox supplier — they sell the free monthly care-supply boxes (Pflegehilfsmittel) funded by the Pflegekassen under §40 SGB XI. Voxera runs outbound qualification for them on a pure performance basis: we get paid €80 for every confirmed new customer we bring in on the Pflegebox line. What they care about most is a steady flow of confirmed new customers at a cost that beats their other acquisition channels.

## Account context

- **Industry / vertical**: Pflegebox supplier (free monthly care supplies funded by Pflegekassen under §40 SGB XI)
- **Product line we sell for them**: Pflegebox
- **Size**: unknown — confirm
- **Geography**: Germany
- **Use case**: Outbound qualification of leads — Voxera's voice agents call prospects and qualify them as potential Pflegebox customers
- **Key integrations**: Pflegekassen paperwork flow (to confirm); lead source / hand-off mechanism to confirm
- **Volume profile**: ~3,500 outbound calls/day → ~25 qualified potential customers/day
- **Commercial terms**: Performance-based — €80 per **confirmed** new customer on the Pflegebox line
- **Compliance frame**: GDPR Art. 9 (special-category health data), UWG §7 (cold-calling restrictions), Pflegekassen §40 SGB XI paperwork rules

## Champions + stakeholders

- **Ahmed Abida** — primary contact, champions day-to-day communication with the account. _(Confirm whether internal Voxera-side account owner or payer-side contact.)_

## Pulse log (newest first)

### 2026-06-13 — red
- **Loss confirmed.** The Kurapacket churn is now confirmed — they are gone as a payer on the Pflegebox line.
- **Correction to the 2026-06-06 entry**: that entry framed the loss as a clean migration of the Pflegebox operation to "Customer XY" at €90/confirmed from 2026-06-08. That framing was premature. As of today, Customer XY is **not yet signed** (still in negotiation — see `customer-xy.md`), so the Pflegebox line currently has **no active paying customer**. This is a live revenue gap, not a clean handover.
- Action item: decide where Pflegebox confirmations are billed in the interim (or pause the line). See below.

### 2026-06-06 — churned
- **Contract closed.** Voxera ended its commission contract with Kurapacket. The Pflegebox calling operation transitions to a new customer, **Customer XY** (see `customer-xy.md`), at a higher rate — **€90 per confirmed Pflegebox customer** (vs €80 here) — starting **2026-06-08**.
- Not a service failure: replaced by a better-paying customer for the same product line. The ~3,500 calls/day Pflegebox operation continues under XY.
- The open baseline action items below are now moot (no longer an active account).

### 2026-06-05 — green
- **Baseline established.** Captured the real account identity and commercial model: Kurapacket pays Voxera **€80 per confirmed new customer** on the **Pflegebox** line.
- **Operations**: ~3,500 outbound calls/day producing ~25 qualified potential customers/day. That's roughly a 0.7% call→qualified rate.
- **Stakeholder**: Ahmed Abida is the primary contact championing communication with the account.
- No churn, support-escalation, or pricing-friction signals at this time → green. This is a setup/baseline entry, not a satisfaction read.
- **Key unknown to close**: the qualified→confirmed conversion rate. On a €80-per-confirmed deal, that number is what decides whether 3,500 calls/day is profitable. We have qualified/day (~25) but not confirmed/day yet.
- Action items: confirm start date; establish qualified→confirmed conversion + daily confirmed count; confirm Ahmed's side (internal vs payer); schedule baseline check-in.

## Open action items

- [ ] **you**: Pflegebox confirmations are still being produced by the calling operation, but Kurapacket is gone and Customer XY isn't signed — confirm where Pflegebox confirmations are billed in the interim, or pause the line (due 2026-06-16)
- [ ] **you**: confirm actual contract start date with Ahmed (due 2026-06-12)
- [ ] **you**: establish the qualified→confirmed conversion rate and confirmed-customers/day — the core profitability metric (due 2026-06-12)
- [ ] **you**: confirm whether Ahmed Abida is internal Voxera-side or payer-side, and capture the economic buyer if different (due 2026-06-12)
- [ ] **you**: schedule baseline check-in call with the account (due 2026-06-12)

## Closed action items (recent)

_(none yet)_

## Risks + watch-outs

- **Margin risk (performance model)**: revenue is €80 × confirmed customers; cost is ~3,500 calls/day. If the qualified→confirmed conversion is low, operating cost can outrun revenue. Track conversion closely.
- **Pflegekassen paperwork / compliance** is the single biggest churn risk in this vertical — if the §40 SGB XI flow breaks, the value proposition evaporates.
- **UWG §7** cold-calling compliance — any operational drift here is existential.

## Expansion / upsell signals

- Potential to add a second product line (e.g., Hausnotruf, mirroring the lifeo account) if the Pflegebox line proves out.

## Changelog
- 2026-06-13 v4: loss confirmed — health → red. Corrected the 2026-06-06 "clean migration to Customer XY" framing: XY is not yet signed, so the Pflegebox line currently has no active payer. Flagged the interim Pflegebox billing gap.
- 2026-06-06 v3: contract closed — status → churned, health → unknown. Pflegebox operation moves to Customer XY at €90/confirmed from 2026-06-08.
- 2026-06-05 v2: filled in scaffold with real account (Kurapacket, Pflegebox line); recorded €80/confirmed-customer commission model, ~3,500 calls/day → ~25 qualified/day, Ahmed Abida as primary contact; set health green; renamed from `pflegebox-payer-1.md`.
- 2026-05-31 v1: scaffold file created. Awaiting rename + fill-in.
