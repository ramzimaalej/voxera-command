---
title: Customer XY
slug: customer-xy
version: 2
status: pre-customer    # in negotiation; not yet signed
health: unknown         # no signed contract yet
since: null             # relationship not yet started — set on signature
updated: 2026-06-13
owner: you
motion: dach
plan: "Performance / commission (in negotiation, unsigned) — €100 per confirmed Pflegebox customer, €110 per confirmed Hausnotruf customer"
mrr_usd: null          # commission-based; no fixed MRR. Proposed (unsigned): €100×confirmed Pflegebox + €110×confirmed Hausnotruf.
primary_contact: "Ahmed Abida — relationship champion (confirm he carries over from the prior payers)"
secondary_contact: ""
---

# Customer XY

> **Real account name TBD** — "Customer XY" is a placeholder. Replace `title`/`slug`/filename with the real name once confirmed.

## Summary
Customer XY is a prospective commission customer in **active negotiation** (not yet signed). The proposed deal covers both product lines at higher rates than the prior payers: **€100 per confirmed Pflegebox customer** and **€110 per confirmed Hausnotruf customer**. The earlier plan — that XY would replace both prior payers from 2026-06-08 — has not materialized: Kurapacket is confirmed lost, but lifeo remains an active Hausnotruf payer at €80 (see `lifeo.md`), and XY's contract is still being negotiated.

## Account context

- **Industry / vertical**: Pflegehilfsmittel — both Pflegebox (free monthly care supplies, §40 SGB XI) and Hausnotruf (home emergency-call systems, §40 SGB XI)
- **Product lines we sell for them**: Pflegebox (€90/confirmed) + Hausnotruf (€95/confirmed)
- **Size**: unknown — confirm
- **Geography**: Germany
- **Use case**: Outbound qualification — Voxera's voice agents qualify prospects, human sales agents close, confirmations are billed per product line
- **Volume profile**: ~7,000 outbound calls/day total (~3,500 Pflegebox + ~3,500 Hausnotruf) → ~50 qualified/day; product mix of confirmations runs ~70/30 Pflegebox-heavy
- **Commercial terms**: Performance-based — €90 per confirmed Pflegebox customer, €95 per confirmed Hausnotruf customer. Starts 2026-06-08.
- **Compliance frame**: GDPR Art. 9 (special-category health data), UWG §7 (cold-calling), Pflegekassen §40 SGB XI

## Champions + stakeholders

- **Ahmed Abida** — relationship champion on the prior payers; _confirm he carries over to Customer XY and capture the economic buyer on XY's side._

## Pulse log (newest first)

### 2026-06-13 — unknown (in negotiation; not signed)
- **Not signed — still negotiating.** The 2026-06-06 "signed, go-live 2026-06-08" entry was premature. Customer XY is **not yet confirmed**; the deal is still in negotiation. Status reverted active → pre-customer.
- **Rates on the table moved up**: now negotiating **€100 per confirmed Pflegebox contract** and **€110 per confirmed Hausnotruf contract** (vs the €90/€95 recorded on 2026-06-06).
- **Consequence**: because XY isn't signed and Kurapacket is confirmed lost, the **Pflegebox line currently has no active payer** (lifeo, the Hausnotruf payer, is still active at €80 — see `lifeo.md`). XY is no longer "the only customer."
- **Leverage**: the operation **signed 49 new contracts** this week (30 Pflegebox + 19 Hausnotruf) with **1,051 leads** in the bottom of the funnel — concrete throughput to negotiate from (note: payers bill on *confirmed*, not signed).
- Action items below.

### 2026-06-06 — unknown (signed; goes live 2026-06-08)
- **Signed.** Customer XY replaces both prior payers (Kurapacket, lifeo) on a single contract covering both product lines, at higher rates: €90/confirmed Pflegebox, €95/confirmed Hausnotruf. Go-live 2026-06-08.
- Same calling operation continues (~7,000 calls/day). The change is commercial (one higher-paying customer instead of two at €80), not operational.
- No live performance signals yet — health stays `unknown` until the first confirmations land under XY's terms.
- See `../revenue-model.md` for the unit economics under the new rates.
- Action items below.

## Open action items

- [ ] **you**: close the Customer XY negotiation (proposed €100 Pflegebox / €110 Hausnotruf) — or set and hold a walk-away rate (due 2026-06-20)
- [ ] **you**: while XY is unsigned and Kurapacket is gone, decide where Pflegebox confirmations are billed in the interim, or pause the line (due 2026-06-16)
- [ ] **you**: confirm Customer XY's real legal name + replace the placeholder (due 2026-06-09)
- [ ] **you**: confirm whether Ahmed Abida is the contact on XY too, and capture XY's economic buyer (due 2026-06-09)
- [ ] **you**: after go-live, record the first-week confirmed/day per product line and set health from real signals (due 2026-06-15)
- [ ] **you**: confirm the product mix (assumed ~70/30 Pflegebox/Hausnotruf) against actuals (due 2026-06-15)

## Closed action items (recent)

_(none yet)_

## Risks + watch-outs

- **Deal risk**: XY is unsigned and in active price negotiation (€100/€110 proposed). No revenue until signed; the negotiation could stall or fall through. Set a walk-away rate.
- **Pflegebox payer gap**: with Kurapacket lost and XY unsigned, the Pflegebox line has no active payer. lifeo still covers Hausnotruf at €80, so XY is *not* the only customer — but Pflegebox confirmations currently have nowhere to bill.
- **Margin holds only if sales throughput holds**: revenue scales with confirmed/day, which is capped by sales-agent capacity (currently ~8/day) well below the funnel's ~20/day ceiling. See revenue model.
- **Unproven terms**: the €90/€95 rates and product mix are contracted but not yet observed in production. Validate in week 1.
- **Pflegekassen paperwork / UWG §7** compliance — same existential churn risk as the prior payers.

## Expansion / upsell signals

- Higher per-confirmed rates already secured vs the prior payers — XY values the lead quality. Room to push volume (more sales capacity) rather than price.

## Changelog
- 2026-06-13 v2: reversed premature "signed" framing — status active → pre-customer; deal still in negotiation. Proposed rates moved up to €100/confirmed Pflegebox, €110/confirmed Hausnotruf (from €90/€95). Noted Pflegebox line currently has no active payer (Kurapacket lost, XY unsigned); lifeo still active so XY is not the only customer.
- 2026-06-06 v1: created. Customer XY replaces Kurapacket + lifeo from 2026-06-08 at €90/confirmed Pflegebox, €95/confirmed Hausnotruf.
