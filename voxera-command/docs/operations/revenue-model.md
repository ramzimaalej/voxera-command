---
title: Revenue Model
version: 7
status: active
updated: 2026-06-14
owner: you
---

# Revenue model — financial health monitor

A small, transparent model of Voxera's commission economics. It answers: **Are we profitable? What's the binding constraint? How much is the pipeline worth? How many leads must we inject?**

As of **2026-06-14** the payer picture (see customer pulse files):

- **lifeo** — **active**, pays **€80 per confirmed Hausnotruf contract**. The only live payer. ([`customers/lifeo.md`](./customers/lifeo.md))
- **Pflegebox line** — **no active payer.** Kurapacket is confirmed lost; Customer XY is not yet signed. Pflegebox confirmations are produced but **unbillable (€0)**. ([`customers/kurapacket.md`](./customers/kurapacket.md))
- **Customer XY** — **in negotiation, unsigned.** Proposed **€100 per confirmed Pflegebox**, **€110 per confirmed Hausnotruf**. ([`customers/customer-xy.md`](./customers/customer-xy.md))

> **Headline (v7):** The operation **signs ~49 contracts/week** (30 Pflegebox + 19 Hausnotruf), near the 50/week target. Payers bill on **confirmed**, and confirmation rates are now known per line — **Hausnotruf 70%, Pflegebox 40%** → **~25 confirmed/week**. With the Pflegebox line at €0, today's billable revenue is **~€4.7k/month vs ~€10.1k cost → ~−€5.4k/month** (runway ~3.5 weeks). **Signing Customer XY flips the business to ~+€1.7k/month profit.** The Pflegebox payer is the single decisive lever; the higher 70% Hausnotruf confirmation already helps lifeo, while Pflegebox at 40% has the most headroom to lift.

## The funnel (where the numbers attach)

```
AI voice ~7,000 calls/day → ~50 qualified/day → reps work ~40/day → ~49 SIGNED/week → CONFIRMED (per-line rate)
                                  ▲ surplus stalls → 1,051-lead backlog        € paid only on confirmed, per line:
                                                                               Hausnotruf €80 (lifeo) · Pflegebox €0
```

- The payer pays **per *confirmed* contract**, per product line. **Signed ≠ billable** — a signed contract must clear confirmation (e.g. Pflegekasse paperwork) first.
- **This week: 49 signed = 30 Pflegebox + 19 Hausnotruf.** Confirmed = signed × line confirmation rate (**HN 70%, PB 40%**) = **13.3 HN + 12.0 PB ≈ 25 confirmed/week** (~52% blended).
- **1,051 leads sit in the bottom of the funnel** — must still pass *both* the signed and confirmed gates.

## Inputs (edit these; everything recomputes)

| Input | Value | Note |
|---|---|---|
| Signed/week (observed) | **49** | 30 Pflegebox + 19 Hausnotruf; sustained run-rate after the scale-up |
| Signed/week (target) | **50** | the new operating expectation — nearly met this week |
| **Confirmation rate — Hausnotruf** | **70%** | signed→confirmed (known) |
| **Confirmation rate — Pflegebox** | **40%** | signed→confirmed (known); most headroom to lift |
| Confirmed/week | **~25.3** | 13.3 Hausnotruf + 12.0 Pflegebox |
| Price — Hausnotruf (lifeo) | **€80** | **active payer** |
| Price — Pflegebox | **€0 today** | no payer; **€100 if XY signs** |
| Price — XY proposed (unsigned) | €100 Pflegebox / €110 Hausnotruf | negotiation target |
| Call cost (AI voice) | $250/day ≈ **€230/day** | $1=€0.92; 5 days/week → ~€5,060/mo |
| Fixed expenses | **€5,000/mo** | includes sales salaries |
| Working days/month | ~22 | 5 days/week (~4.4 weeks/mo) |
| Bottom-of-funnel pipeline | **1,051 leads** | replaces the old 700 "dead pile" figure — confirm overlap |
| Cash reserves | **€0** | financed by a credit line |
| Credit line | **$25,000 limit, $20,000 drawn** | headroom **$5,000 ≈ €4,600** |
| Credit interest | **15% APR** | ≈ €230/mo on the drawn balance |

**Total monthly cost** = €5,060 call + €5,000 fixed = **€10,060/mo**.
Monthly signed: 132 Pflegebox + 83.6 Hausnotruf. **Confirmed/mo: 52.8 Pflegebox + 58.5 Hausnotruf.**

## P&L — at 49 signed/week, HN 70% / PB 40% confirmation

| Line | Confirmed/mo | Today price | Today rev | XY price | XY rev |
|---|---:|---:|---:|---:|---:|
| Hausnotruf | 58.5 | €80 | €4,682 | €110 | €6,437 |
| Pflegebox | 52.8 | €0 | €0 | €100 | €5,280 |
| **Revenue** | | | **€4,682** | | **€11,717** |
| Cost | | | −€10,060 | | −€10,060 |
| **Operating profit** | | | **−€5,378** ⚠️ | | **+€1,657** ✅ |

- **Today (lifeo only):** ~**−€5.4k/month**. Better than the flat-40% estimate (the 70% Hausnotruf rate helps), but still underwater — lifeo's Hausnotruf alone can't cover fixed + call cost.
- **If XY signs:** ~**+€1.7k/month** — the business turns profitable. The Pflegebox line going from €0 to €100/confirmed adds **€5,280/month**, and Hausnotruf re-pricing €80→€110 adds another ~€1,755/month.
- **lifeo-only break-even** would need ~**41 signed Hausnotruf/week** (vs 19 today) — ~2.1× current Hausnotruf volume. Not reachable soon → **a Pflegebox payer is essential, not optional.**

## Cash & runway

No reserves; the loss is borrowed against a credit line **80% drawn** (€4,600 headroom).

- **Today:** burn ≈ €5,378 + €230 interest ≈ **€5,600/mo** → runway ≈ €4,600 ÷ €5,600 ≈ **~3.5 weeks** ⚠️.
- **If XY signs:** profitable — the credit line can begin repaying; runway stops being the binding constraint.

**Securing XY (or any Pflegebox payer) is simultaneously the runway fix and the path to profit.** Move on it inside the runway window.

## What's the pipeline worth? (1,051 bottom-of-funnel leads)

Leads must clear **both** gates (lead→signed, then the per-line confirmation). Using this week's 61/39 signed mix → **~643 Pflegebox / ~408 Hausnotruf** leads if all signed. Applying the known confirmation rates (PB 40%, HN 70%):

**Ceiling — if every lead signs, then confirms at line rates:**

| Priced at | Pflegebox (643→257 conf) | Hausnotruf (408→286 conf) | **Total** |
|---|---:|---:|---:|
| Today (€0 / €80) | €0 | €22,848 | **€22,848** |
| XY signed (€100 / €110) | €25,720 | €31,416 | **€57,136** |

**Risk-adjusted by lead→signed rate (confirmation already applied), at XY prices:**

| lead→signed | Value @ XY | Value @ today (€0 / €80) |
|---:|---:|---:|
| 100% (ceiling) | €57,136 | €22,848 |
| 50% | €28,568 | €11,424 |
| 25% | €14,284 | €5,712 |
| 10% | €5,714 | €2,285 |

⚠️ The **lead→signed** rate for these 1,051 leads is still unmeasured — pick the row once known. The confirmation gates are now real (PB 40% / HN 70%). **~55% of the pipeline's value at XY prices is the Pflegebox half — all of it locked behind signing a Pflegebox payer.**

## Levers (ranked by value)

1. **Sign a Pflegebox payer (XY or other).** Turns ~−€5.4k/mo into ~+€1.7k/mo and unlocks ~€25k of pipeline value. The decisive move.
2. **Lift the Pflegebox confirmation rate (40%).** Most headroom of the two — each 10 points of PB confirmation ≈ +13 confirmed/mo. Worth €0 today, but ~€1.3k/mo once XY signs. Understand *why* PB confirms at 40% vs HN's 70% (paperwork? Pflegekasse rejections? qualification?).
3. **Reconfirm lifeo in writing** — the only live revenue (€4.7k/mo) rests on an account with no signed continuation.
4. **Grow signed volume / conversion** (v3 sales levers) — compounds once both prices are non-zero.

## Survival actions (next few weeks)

1. **Close the XY Pflegebox deal** (or find an interim Pflegebox payer). Runway fix *and* the switch to profitability.
2. **Get lifeo's continuation in writing** — don't let the one live payer lapse on a missing letter.
3. **Investigate the 40% Pflegebox confirmation rate** — the biggest controllable upside once a payer exists.
4. **Mind the runway (~3.5 weeks)** — secure cash in parallel until XY closes.

## How to recompute

```
confirmed_hn_wk   = signed_hn_wk * 0.70
confirmed_pb_wk   = signed_pb_wk * 0.40
revenue_month     = (confirmed_pb_wk*pb_price + confirmed_hn_wk*hn_price) * 4.4
profit_month      = revenue_month − call_cost_day_eur*working_days − fixed_month
pipeline_value    = leads * mix_share * lead_to_signed * line_confirm_rate * price   # per line, summed
```

## Open questions

- Real **lead→signed** rate for the 1,051 pipeline leads (the last unmeasured gate; used to value the pipeline).
- **Why** does Pflegebox confirm at 40% vs Hausnotruf 70% — Pflegekasse paperwork, customer drop-off, qualification? Determines how liftable PB is.
- Does the 1,051 pipeline include or replace the old 700 "dead pile" (locked for a 3-month cold period)?
- FX rate to lock ($1 = €0.92 assumed); does the €5,000 fixed already include credit interest?

## Changelog
- 2026-06-14 v7: applied known per-line confirmation rates — **Hausnotruf 70%, Pflegebox 40%** (~52% blended, ~25 confirmed/week). Today ~−€5.4k/mo (lifeo only); **XY-signed turns profitable at ~+€1.7k/mo**; runway ~3.5 weeks. lifeo-only break-even needs ~41 signed HN/week. Re-valued the pipeline with line-rate confirmation. Reframed the confirmation lever around Pflegebox's 40% (most headroom).
- 2026-06-13 v6: corrected signed-vs-confirmed — the 49/week are **signed**; payers bill on **confirmed**. Re-derived on a flat 40% confirmation assumption; established the two compounding gates (Pflegebox payer + confirmation rate).
- 2026-06-13 v5: confirmed the scale-up — 49/week is the sustained run-rate (not a spike), against a new 50/week target; dropped the v3 1.6/day assumption.
- 2026-06-13 v4: corrected payer/price state — lifeo active (€80 Hausnotruf), Pflegebox unbillable (Kurapacket lost, XY unsigned), XY prospective €100/€110.
- 2026-06-07 v3: quantified runway (credit line $25k/$20k/15% APR → ~3 weeks); reframed bottleneck to low conversion; added "Survival actions."
- 2026-06-07 v2: corrected inputs (€5,000 fixed incl. salaries; 4 closed/day; 40% of closed → 1.6 confirmed/day); break-even 12.5 closed/day.
- 2026-06-06 v1: initial model (assumed 8 confirmed/day, €3,500 fixed) — superseded.
</content>
