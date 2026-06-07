---
title: Customer XY
slug: customer-xy
version: 1
status: active
health: unknown        # signed; operation goes live 2026-06-08 — no live signals yet
since: "2026-06-08"     # first day of the commission relationship
updated: 2026-06-06
owner: you
motion: dach
plan: "Performance / commission — €90 per confirmed Pflegebox customer, €95 per confirmed Hausnotruf customer"
mrr_usd: null          # commission-based; no fixed MRR. Revenue = €90×confirmed Pflegebox + €95×confirmed Hausnotruf.
primary_contact: "Ahmed Abida — relationship champion (confirm he carries over from the prior payers)"
secondary_contact: ""
---

# Customer XY

> **Real account name TBD** — "Customer XY" is a placeholder. Replace `title`/`slug`/filename with the real name once confirmed.

## Summary
Customer XY is the single commission customer that replaces both prior DACH payers (Kurapacket / Pflegebox and lifeo / Hausnotruf) from 2026-06-08. They buy both product lines at a higher rate than the prior payers: **€90 per confirmed Pflegebox customer** and **€95 per confirmed Hausnotruf customer**. The same Voxera calling operation (~7,000 calls/day across both lines) now feeds confirmations to this one account.

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

### 2026-06-06 — unknown (signed; goes live 2026-06-08)
- **Signed.** Customer XY replaces both prior payers (Kurapacket, lifeo) on a single contract covering both product lines, at higher rates: €90/confirmed Pflegebox, €95/confirmed Hausnotruf. Go-live 2026-06-08.
- Same calling operation continues (~7,000 calls/day). The change is commercial (one higher-paying customer instead of two at €80), not operational.
- No live performance signals yet — health stays `unknown` until the first confirmations land under XY's terms.
- See `../revenue-model.md` for the unit economics under the new rates.
- Action items below.

## Open action items

- [ ] **you**: confirm Customer XY's real legal name + replace the placeholder (due 2026-06-09)
- [ ] **you**: confirm whether Ahmed Abida is the contact on XY too, and capture XY's economic buyer (due 2026-06-09)
- [ ] **you**: after go-live, record the first-week confirmed/day per product line and set health from real signals (due 2026-06-15)
- [ ] **you**: confirm the product mix (assumed ~70/30 Pflegebox/Hausnotruf) against actuals (due 2026-06-15)

## Closed action items (recent)

_(none yet)_

## Risks + watch-outs

- **Concentration risk**: XY is now the *only* customer. One contract = 100% of commission revenue. A single-customer base is the dominant business risk — diversify once the operation is stable.
- **Margin holds only if sales throughput holds**: revenue scales with confirmed/day, which is capped by sales-agent capacity (currently ~8/day) well below the funnel's ~20/day ceiling. See revenue model.
- **Unproven terms**: the €90/€95 rates and product mix are contracted but not yet observed in production. Validate in week 1.
- **Pflegekassen paperwork / UWG §7** compliance — same existential churn risk as the prior payers.

## Expansion / upsell signals

- Higher per-confirmed rates already secured vs the prior payers — XY values the lead quality. Room to push volume (more sales capacity) rather than price.

## Changelog
- 2026-06-06 v1: created. Customer XY replaces Kurapacket + lifeo from 2026-06-08 at €90/confirmed Pflegebox, €95/confirmed Hausnotruf.
