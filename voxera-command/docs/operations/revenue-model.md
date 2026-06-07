---
title: Revenue Model
version: 3
status: active
updated: 2026-06-07
owner: you
---

# Revenue model — financial health monitor

A small, transparent model of Voxera's commission economics. It answers: **Are we profitable? What's the binding constraint? How much runway is left? How many leads must we inject?**

Figures are for the **Customer XY** contract (live 2026-06-08). See [`customers/customer-xy.md`](./customers/customer-xy.md).

> **Headline (v3):** ~**€6.8k/month underwater** at 4 closed/day → 1.6 confirmed/day, financed by a credit line that's **80% drawn**. **Runway ≈ 3 weeks.** Sales can't reach break-even (12.5 closed/day) that fast, so **the runway must be fixed directly and now** — extend credit / raise cash / cut burn — in parallel with lifting the sales conversion rate.

## The funnel (where the numbers attach)

```
AI voice ~7,000 calls/day → ~50 qualified leads/day → reps work ~40/day → 4 closed/day → 1.6 CONFIRMED/day
                                  ▲ ~10/day stall here (→ 700 backlog)   (400 calls,        (40% of closed)
                                                                          10 calls/lead)     € paid here: €90/€95
```

- The payer pays **per confirmed deal**. **Confirmed = closed × 40%** = 1.6/day.
- The AI generates ~50 qualified/day but reps only work ~40/day → the ~10/day surplus stalls and, over ~3 months, became the **700-deal dead pile**.

## Inputs (edit these; everything recomputes)

| Input | Value | Note |
|---|---|---|
| Sales reps | **2** | confirmed |
| Rep calls/day (actual) | **200 each → 400 team** | ~6h of calling (100 calls / 3h) |
| Rep call capacity | 250 each (500 team) | full 7.5h (8h − 30min pause) → only ~25% headroom left |
| Calls per lead | **10** | dials before a lead closes or is killed |
| Closed deals/day (team) | **4** | 1% call→close (4÷400); 10% lead→close (4÷40 worked) |
| Confirmation rate (of closed) | **40%** | confirmed = closed × 40% |
| **Confirmed/day** | **1.6** | = 4 × 40% — what XY pays on |
| Price — Pflegebox / Hausnotruf | €90 / €95 | mix 70/30 → **€91.50 blended** |
| Call cost (AI voice) | $250/day ≈ **€230/day** | $1=€0.92; calls run **5 days/week** |
| Fixed expenses | **€5,000/mo** | includes sales salaries |
| Working days/month | ~22 | 5 days/week |
| Pipeline (stuck/"dead") | **700 deals** | reactivatable, but only after a **3-month cold period** |
| Cash reserves | **€0** | financed by a credit line |
| Credit line | **$25,000 limit, $20,000 drawn** | headroom **$5,000 ≈ €4,600** |
| Credit interest | **15% APR** | ≈ $250/mo (€230) on the drawn balance |

**Blended price** (70/30) = 0.7×€90 + 0.3×€95 = **€91.50/confirmed**.

## P&L at current run-rate (1.6 confirmed/day)

| Line | Per month |
|---|---:|
| Revenue (1.6 × €91.50 × 22) | **€3,221** |
| Call cost (€230 × 22) | −€5,060 |
| Fixed (incl. salaries) | −€5,000 |
| **Operating profit** | **−€6,839** ⚠️ |

## Cash & runway — ~3 weeks ⚠️

No reserves; the monthly loss is **borrowed** against a credit line that's already **80% drawn**.

- **Headroom left:** $25,000 − $20,000 = **$5,000 ≈ €4,600**.
- **Monthly burn:** operating loss €6,839 + interest (~€230) ≈ **€7,070/month**.
- **Runway = €4,600 ÷ €7,070 ≈ 0.65 months ≈ ~3 weeks.**

This is the binding fact of the business. Reaching break-even (12.5 closed/day) takes longer than 3 weeks (below), so **runway must be addressed directly and immediately**.

*(FX: $1 = €0.92, assumed. Interest grows slightly as the last $5k is drawn — negligible over 3 weeks. Confirm whether the €5,000 fixed already includes this interest; modelled here as on top.)*

## Break-even

- Total cost = €5,000 + €5,060 = **€10,060/mo**. Each confirmed/day = €2,013/mo; each closed/day (at 40%) = **€805/mo**.
- **Break-even = 12.5 closed/day = 5.0 confirmed/day** — **3.1× today's 4**.

| Closed/day | Confirmed/day | Monthly profit* |
|---:|---:|---:|
| **4 (today)** | 1.6 | **−€6,839** |
| 5 (full calling) | 2.0 | −€6,034 |
| 10 | 4.0 | −€2,008 |
| **12.5 (break-even)** | 5.0 | ~€0 |
| 15 | 6.0 | +€2,018 |
| 20 | 8.0 | +€6,044 |

\* profit = 805 × closed/day − €10,060.

## Sales is the bottleneck — and it's conversion, not calling time

Reps already call **200/day each (400 team)** — ~80% of the 250/day capacity. Only ~25% more dialing is available; the real problem is **how little converts**:

- **Call→close ≈ 1%** (4 ÷ 400). **Lead→close ≈ 10%** (4 closed ÷ 40 leads worked).
- **Full calling time** (200 → 250/rep) ≈ +25% dials → ~5 closed/day. Helpful, not enough.
- **Break-even (12.5 closed/day)** with 2 reps needs lead→close to roughly **triple (10% → ~30%)**, or **~5 reps** at today's conversion. Neither lands in 3 weeks.

### Levers (ranked)
1. **Conversion.** 10% lead→close is low — scripts, speed-to-lead, objection handling, lead quality. Tripling it → ~12 closed/day ≈ break-even with the current 2 reps. Takes weeks; start now, but it won't save the 3-week runway alone.
2. **Full calling time** (200 → 250/rep): quick ~+25% (~5 closed/day).
3. **Raise the 40% confirmation rate** — qualify harder before "closed."
4. **Add reps** — each ≈ +2.5 closed/day at current conversion; expensive and slow to ramp.

## Survival actions (next 3 weeks) — runway first

Sales can't reach break-even before the line runs out, so protect the runway directly:

1. **Secure cash now** — extend/raise the credit line or inject capital. It's the only lever faster than the burn.
2. **Cut burn** — the biggest controllable cost is the **€5,060/mo AI call spend**. The AI makes ~50 qualified/day but reps work only ~40/day (the surplus dies). Trim AI volume to match capacity → save ~15–20% (~€1k/mo) and stop feeding the dead pile.
3. **Run the conversion + calling-time levers in parallel** — the path to break-even once runway is bought.
4. **The 700 backlog is locked for 3 months** — it returns as lead supply ~September, not now. Don't count on it to reduce lead spend yet.

## How many leads to inject per day

Inject to **match what reps can work** — no more, or you regrow the dead pile.

- Reps work **400 calls ÷ 10 calls/lead ≈ 40 leads/day** today (≈50/day at full calling time).
- The AI generates **~50 qualified/day** — slightly more than reps can work, so ~10/day stall.
- **Target injection ≈ 40/day now** (≈50/day once reps are at full calling time). The **700 backlog can't help — locked for a 3-month cold period** — so you do need fresh leads daily.
- Quick win: trim AI generation from ~50 → ~40/day to match supply to capacity (cuts call cost; see Survival actions).

## How to recompute

```
confirmed_day = closed_day * confirm_rate
revenue_month = confirmed_day * blended_price * working_days
profit_month  = revenue_month − call_cost_day_eur*working_days − fixed_month
breakeven_closed_day = (call_cost_day_eur*working_days + fixed_month) / (blended_price*working_days*confirm_rate)
monthly_burn  = max(0, −profit_month) + credit_interest_month
runway_months = (credit_limit − drawn_balance) / monthly_burn
leads_worked_day = team_calls_day / calls_per_lead   # = inject target
```

## Open questions (smaller now)

- FX rate to lock ($1 = €0.92 assumed); does the €5,000 fixed already include credit interest?
- After XY goes live (2026-06-08), replace assumed product mix (70/30) and the 40% confirmation with week-1 actuals.

## Changelog
- 2026-06-07 v3: quantified runway — credit line $25k limit / $20k drawn / 15% APR → ~€4.6k headroom, ~€7.07k/mo burn → **~3 weeks runway**. Updated funnel with confirmed actuals: 2 reps × 200 calls/day, 10 calls/lead → ~40 leads worked/day, 1% call→close / 10% lead→close; 700 backlog locked for a 3-month cold period; calls run 5 days/week. Reframed bottleneck from "idle calling time" to **low conversion**, and added a "Survival actions" section (runway first). Confirmed 1.6 confirmed/day reading (closed 4 × 40%).
- 2026-06-07 v2: corrected inputs (€5,000 fixed incl. salaries; 4 closed/day; 40% of closed → 1.6 confirmed/day); showed ~€6.8k/mo loss, break-even 12.5 closed/day; added cash/credit-line note.
- 2026-06-06 v1: initial model (assumed 8 confirmed/day, €3,500 fixed) — superseded.
