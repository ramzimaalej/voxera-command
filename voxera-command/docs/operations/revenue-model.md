---
title: Revenue Model
version: 17
status: active
updated: 2026-06-27
owner: you
---

# Revenue model — financial health monitor

A small, transparent model of Voxera's commission economics. It answers: **Are we profitable? What's the binding constraint? What has to change to survive?**

**Structural change (v8):** the **Pflegebox market is sunsetting — it winds down by end of 2027.** The go-forward product is **Hausnotruf only.** This retires the v7 thesis that "signing a Pflegebox payer (Customer XY) is the decisive lever": any Pflegebox revenue is now a **time-boxed bridge with a hard end-2027 expiry**, not a durable basis for survival. The business must stand on Hausnotruf economics.

**Baseline change (v11):** the operating baseline is reset from this-week's actual (20 signed) to the **40 signed/week target** — a reasonable run-rate on **fresh** AI leads (the team has hit it before). 40/week = **8 signed/day = 16% lead→signed** (2× the 8% the team gets grinding the stale backlog). The entire gap between "underwater" and "profitable" is fresh-lead conversion.

As of **2026-06-21** the payer picture:

- **lifeo** — active, pays **€80 per confirmed Hausnotruf contract**. The only live payer; the spine of the go-forward model. ([`customers/lifeo.md`](./customers/lifeo.md))
- **Pflegebox** — **sunsetting (winds down by end of 2027).** No durable value; excluded from the go-forward P&L. Residual Pflegebox revenue before the sunset is a bonus, never a plan.
- **Customer XY** — in negotiation, unsigned. Durable value is now the **€110 Hausnotruf** price (a +37.5% re-price over lifeo's €80), **not** the €100 Pflegebox (which expires with the market). ([`customers/customer-xy.md`](./customers/customer-xy.md))

> **Headline (v11):** Hausnotruf-only, **operating baseline = 40 signed/week** (8/day = 16% lead→signed on fresh AI leads). At the **70% confirmation** rate that's **28 confirmed/week ≈ 123/month × €80 = ~€9.9k/mo revenue**, against the **~€9.7k/mo** cost base (€5.75k AI calling engine + €3.94k salaries & office) → **~break-even at €80 (+€0.2k/mo operating) and ~+€3.9k/mo at €110.** At 16% conversion the engine is **right-side up**: each signed Hausnotruf costs ~€33 in lead-gen and returns ~€56 at €80 → **+€23/signed**. The two levers that turn break-even into durable profit: **(1) hold fresh-lead conversion at ≥16%** (keep reps on fresh AI output, not the stale backlog) and **(2) re-price toward €110**. ⚠️ This week's *actual* was 20 signed (8% conversion, ~−€4.8k/mo, ~4 weeks runway) — the gap to baseline is entirely fresh-lead conversion.

## Scenario ladder (at a glance)

All at 70% confirmation. "Profit" = monthly operating profit; the engine scales linearly at €5.23/lead, salaries fixed at €3,937/mo.

| Scenario | Signed/wk | Signed/day | Fresh leads/day | Conversion | Profit @ €80 | Profit @ €110 | Feasible? |
|---|---:|---:|---:|---:|---:|---:|---|
| This week (actual) | 20 | 4 | 50 | 8% | **−€4.8k** ⚠️ | −€2.9k | yes (but losing) |
| **Baseline (target)** | **40** | **8** | **50** | **16%** | **+€0.2k** (break-even) | **+€3.9k** | yes — 2 reps |
| Profitable target | 60 | 12 | 75 | 16% | **+€2.2k** | +€7.8k | yes — 2 reps near cap (~38/rep/day) |
| Scale | 100 | 20 | 125 | 16% | **+€6.3k** | +€15.6k | needs 3rd rep *or* ~25% conversion |

The ladder is one story: **at 16% fresh-lead conversion, every step up in volume is profit-positive** — the constraint shifts from conversion (8%→16%) to rep capacity (~64/week ceiling for 2 reps), then to headcount. Below ~9% conversion the signs flip and volume *loses* money. Detail for each row is in the scenario sections below.

## The funnel (where the numbers attach)

```
AI voice engine → 50 qualified leads/day      ($300/day = $6 ≈ €5.2 per qualified lead)
   → reps SIGN ~40 Hausnotruf/week (baseline)  (16% lead→signed on fresh leads; 20 this week at 8%)
   → CONFIRMED at 70%  → ~28 confirmed/week → €80 each (lifeo)
   ────────────────────────────────────────────────────────────────────
   Pflegebox: SUNSETTING (gone by end-2027) → €0 durable value, excluded.
```

- The payer pays **per *confirmed* Hausnotruf contract**. Signed ≠ billable — a signed contract must clear confirmation (Pflegekasse / paperwork) first.
- **Baseline: 40 signed/week (target).** Confirmed = 40 × 70% = **28/week**. *(This week's actual was 20 signed.)*
- Lead supply is **not** the bottleneck: the engine qualifies **250 leads/week** (50/day × 5). The lever is **holding 16% conversion on fresh leads** — it sags to ~8% when reps work the aged backlog.

## Inputs (edit these; everything recomputes)

| Input | Value | Note |
|---|---|---|
| Signed/week (Hausnotruf, baseline) | **40** | target run-rate on fresh leads = 8/day = 16% conversion; **this week's actual was 20** |
| Confirmation rate — Hausnotruf | **70%** | carried from v7 (signed→confirmed); re-measure to confirm |
| Confirmed/week | **28** | 40 × 70% |
| Confirmed/month | **~123** | 28 × 4.4 weeks |
| Price — Hausnotruf (lifeo) | **€80** | active payer |
| Price — Hausnotruf (XY proposed, unsigned) | **€110** | +37.5% re-price — the durable XY value |
| AI calling engine | **$300/day ≈ €261/day** | qualifies 50 leads/day → $6 ≈ €5.2/qualified lead; 5 days/wk → **~€5,750/mo** |
| Salaries + office (Tunis) | **13,300 TND ≈ €3,937/mo** | itemised below |
| Working days/month | ~22 | 5 days/week (~4.4 weeks/mo) |
| Cash reserves | **€0** | financed by a credit line |
| Credit line | **$25,000 limit, $20,000 drawn** | headroom $5,000 ≈ **€4,355** |
| Credit interest | **15% APR** | ≈ €218/mo on the drawn balance |
| FX (2026-06-21, live mid-market) | **$1 = €0.871 · 1 TND = €0.296** | was $1 = €0.92 in v7 — the weaker dollar cuts the engine cost in € |

**Salaries & office (monthly, 1 TND = €0.296):**

| Role | TND | EUR |
|---|---:|---:|
| Manager | 4,200 | €1,243 |
| Sales rep (full-time) | 3,500 | €1,036 |
| Sales rep (part-time) | 2,500 | €740 |
| Engineer | 2,000 | €592 |
| Office | 1,100 | €326 |
| **Total fixed** | **13,300** | **€3,937** |

**Total monthly cost** = €5,750 engine + €3,937 fixed = **~€9,687/mo** (the AI engine is **59%** of total cost).

## P&L — Hausnotruf only, 40 signed/week (baseline), 70% confirmation

| Line | Confirmed/mo | Price | Revenue |
|---|---:|---:|---:|
| Hausnotruf (lifeo, €80) | 123 | €80 | **€9,856** |
| — same volume at XY's €110 | 123 | €110 | €13,552 |
| Cost (engine + fixed) | | | −€9,687 |
| **Operating profit — €80** | | | **+€169/mo** (break-even) |
| **Operating profit — €110** | | | **+€3,865/mo** ✅ |

- **Baseline at €80:** razor-thin break-even (~+€0.2k/mo operating; roughly flat once the ~€218/mo credit interest is netted). Volume finally covers the cost base — but with no margin of safety.
- **At €110:** ~**+€3.9k/mo** — real profit; the credit line can begin repaying.
- **This week's actual (20 signed, 8%)** ran **~−€4.8k/mo**. The entire gap to the €80 break-even is fresh-lead conversion (8% → 16%), not price.

## Unit economics — right-side up at 16% conversion

| Metric | €80 | €110 |
|---|---:|---:|
| Cost per qualified lead | €5.2 ($6) | €5.2 |
| Lead→signed (fresh) | 16% | 16% |
| Qualified leads per signed | 6.25 | 6.25 |
| **Engine cost per signed** | **€33** | **€33** |
| Expected revenue per signed (price × 70%) | €56 | €77 |
| **Margin per signed (engine only, pre-salary)** | **+€23** ✅ | **+€44** ✅ |

At 16% conversion the **engine pays for itself comfortably** — each signed Hausnotruf costs ~€33 in lead-gen and returns ~€56 at €80. The risk is conversion sliding back toward **8% (the stale-backlog rate)**, where the engine flips upside-down (−€9/signed; see v8 history). **Holding fresh-lead conversion is the whole game** — it's the difference between +€23 and −€9 per signed.

## Break-even (covers engine + salaries)

| At price | Signed Hausnotruf/week | Lead→signed needed (from 250 qualified/wk) |
|---|---:|---:|
| €80 (lifeo) | **~39/week** | **~16%** |
| €110 (XY) | **~29/week** | **~11%** |

The **40/week baseline just clears the €80 break-even (~39/week)** — which is why €80 is only break-even, not profit. At €110 the break-even drops to ~29/week, so the baseline clears it with **~€3.9k/mo of headroom.** This week's 20 actual is far below both lines. Lead supply covers either target (250 qualified/week); **the gap is conversion and price, not lead volume.**

## Break-even scenarios — signed contracts per day

At **$300/day** engine cost, the operating cost base is **€9,686/mo** (€5,749 engine + €3,937 salaries & office), over ~22 working days. Break-even is where `signed/day × 22 × confirmation × price = €9,686`; **profit means averaging above these numbers.**

| Price | Confirm | **Signed/day to break even** | Confirmed/day | Implied lead→signed (of 50 qualified/day) |
|---|---|---:|---:|---:|
| €80 | 70% | **~7.9/day** | 5.5 | 16% |
| €80 | 60% | **~9.2/day** | 5.5 | 18% |
| €90 | 70% | **~7.0/day** | 4.9 | 14% |
| €90 | 60% | **~8.2/day** | 4.9 | 16% |
| €100 | 70% | **~6.3/day** | 4.4 | 13% |
| €100 | 60% | **~7.3/day** | 4.4 | 15% |

**How to read it:**

- **The 40/week baseline = 8 signed/day (16% conversion)** — landing right on the €80/70% break-even (~7.9/day) and clearing it at €90+. **This week's actual (4/day, 8%) sits below every line** — the gap is fresh-lead conversion.
- **Price sets the confirmed/day target; confirmation is the tax on it.** Break-even confirmed/day depends only on price (€80→5.5, €90→4.9, €100→4.4); a lower confirmation rate just makes you *sign* more to land those confirmations — a 70%→60% drop costs ~1–1.3 extra signings/day at every price.
- **Lifting price €80→€100 saves ~1.6 signings/day**; a 10-point confirmation drop costs about the same. Comparable levers.
- Lead supply isn't the wall (50 qualified/day covers even 9.2 signed/day) — the binding constraint is **conversion**.
- Each whole extra signed/day above break-even adds ~`22 × confirm × price`/mo of profit — e.g. at €100/70%, **+€1,540/mo** per additional signed/day.
- These are *operating* break-evens; adding ~€218/mo credit interest nudges each up ~0.05/day (negligible).

## Break-even sensitivity — 40% & 50% confirmation (the grounded range)

> **Why this section.** The headline model carries **70%** confirmation ("carried from v7 — re-measure"). But v7 itself recorded the **per-line rates as Hausnotruf 70% / Pflegebox 40%**, the 2026-06-05 snapshot used **40%**, and the rate has **never been re-measured** since the Pflegebox sunset. So **40–50% is the grounded range** and 70% is the optimistic ceiling. This directly answers the open question "*is 70% still current — a ±10-pt move is worth ±€1.4k/mo at baseline.*" It's worth far more than that: it decides whether break-even is reachable at all.

Break-even **confirmed/day depends only on price** (€80→5.5, €90→4.9, €100→4.4, €110→4.0); a lower confirmation just forces proportionally more **signings** to land them. The trap: at 40–50% the required **conversion climbs above the proven 16% fresh-lead rate**, so break-even stops being reachable at the current 50-leads/day engine.

**Table A — break-even at the current engine (50 qualified/day = 250/week, €9,686/mo):**

| Price | Confirm | Signed/day BE | Signed/week BE | Implied conversion (of 250/wk) | Reachable at proven 16%? |
|---|---|---:|---:|---:|---|
| €80 | **40%** | ~13.8 | ~69 | 27.5% | ✗ — 1.7× the fresh rate |
| €80 | **50%** | ~11.0 | ~55 | 22.0% | ✗ |
| €90 | **40%** | ~12.2 | ~61 | 24.5% | ✗ |
| €90 | **50%** | ~9.8 | ~49 | 19.6% | ✗ |
| €100 | **40%** | ~11.0 | ~55 | 22.0% | ✗ |
| €100 | **50%** | ~8.8 | ~44 | 17.6% | ✗ — just over 16% |
| €110 | **40%** | ~10.0 | ~50 | 20.0% | ✗ |
| €110 | **50%** | ~8.0 | ~40 | 16.0% | ✓ — exactly the baseline |
| *€80* | *70% (ref)* | *~7.9* | *~39* | *16%* | *✓* |
| *€110* | *70% (ref)* | *~5.7* | *~29* | *11%* | *✓* |

**Only one cell in the grounded range breaks even at proven conversion: €110 + 50%.** Every other 40–50% cell needs conversion above the demonstrated 16% — unreachable at 50 leads/day without lifting conversion or injecting more leads (which raises the cost base in turn).

**Table B — operating profit/(loss) by price × confirmation (Hausnotruf-only):**

*40/week baseline — cost €9,686/mo, 176 signed/mo:*

| Price | 40% | 50% | 70% (ref) |
|---|---:|---:|---:|
| €80 | −€4,054 | −€2,646 | +€170 |
| €90 | −€3,350 | −€1,766 | +€1,402 |
| €100 | −€2,646 | −€886 | +€2,634 |
| €110 | −€1,942 | **−€6 (break-even)** | +€3,866 |

*60/week target — cost €12,562/mo (75 leads/day), 264 signed/mo:*

| Price | 40% | 50% | 70% (ref) |
|---|---:|---:|---:|
| €80 | −€4,114 | −€2,002 | +€2,222 |
| €90 | −€3,058 | −€682 | +€4,070 |
| €100 | −€2,002 | **+€638** | +€5,918 |
| €110 | −€946 | **+€1,958** | +€7,766 |

**How to read it:**

- **At 40% confirmation, nothing in reach breaks even.** Every price at both volumes loses money — even €110 at the 60/week target is −€946/mo, and €80 (lifeo today) bleeds ~€4k/mo at baseline. If the Hausnotruf rate is anywhere near Pflegebox's documented 40%, the go-forward business is **structurally underwater at current scale**.
- **At 50% confirmation, break-even needs €110 at the baseline (lands at ~€0) or €100+ at the 60/week target.** €80 loses money everywhere short of large scale.
- **Two things become non-negotiable:** (1) **measure the real confirmation rate now** — it's the difference between "break-even reachable at €80" (70%) and "underwater except one corner" (40–50%), the single highest-leverage unknown in the model; (2) **re-pricing toward €110 is survival, not upside** — at 50% it's the only baseline price that breaks even.
- **Pflegebox (DVP €90 / XY €100):** at Pflegebox's documented **40%**, €90 needs ~61 signed/week to break even (24.5% conversion, above proven) and €100 needs ~55/week; at 50%, ~49 and ~44/week. Bridge cash at best — and the line sunsets end-2027, so it can't anchor the model.

## 60/week scenario — the realistic profitable target

Target: **2 reps sign 60/week total** (30/rep = 6 signed/day per rep) at the **16% fresh-lead close rate**. This is the sweet spot — feasible with today's headcount *and* cash-positive.

**Leads to inject:** 60 ÷ 0.16 = **375 fresh leads/week = 75/day** — **1.5× the engine's current 50/day** (engine runs ~$450/day ≈ €392 ≈ **€8,625/mo**).

**Feasibility — clears rep capacity:** 6 signed/day per rep at 16% means each rep *works* **~38 leads/day**, just under the historical ~40/day ceiling. So **2 reps can carry 60/week** (their hard ceiling at 16% is ~64/week = 40 × 16% × 5 × 2). Beyond ~64/week needs a 3rd rep or higher conversion.

**Financial outcome** — cost base scales to **€12,562/mo** (engine €8,625 at 75 leads/day + salaries €3,937); monthly signed = 264:

| Price | 70% confirm | 60% confirm |
|---|---:|---:|
| €80 | **+€2,222/mo** | +€110 (break-even) |
| €90 | **+€4,070/mo** | +€1,694/mo |
| €100 | **+€5,918/mo** | +€3,278/mo |
| €110 | **+€7,766/mo** | +€5,090/mo |

- **At the live €80/70%: +€2.2k/mo** — net of ~€218/mo interest ≈ +€2.0k/mo cash; the credit line starts repaying and runway stops being the constraint.
- Stepping from the 40/week baseline (break-even) to 60/week — **+25 leads/day (50→75)** — adds ~€2k/mo. That's the marginal value of running the engine 1.5×.
- **€80 still needs the 70% confirmation to hold** (at 60% it's a razor +€110/mo); €90+ buys a safety buffer.
- **Caveat:** rests on 75 fresh qualified leads/day actually converting at 16%, with reps near capacity — watch that fresh-lead supply doesn't thin (dragging conversion toward 8%) or rep quality dip as they run flat-out.

## Scale scenario — leads-to-inject vs rep capacity

Target: **each rep closes 50 signed/week.** With **2 reps** (1 full-time + 1 part-time) that's **100 signed/week** (440/mo). Assumes the engine scales linearly at **€5.23/qualified lead** ($300 ÷ 50) and a fresh-lead conversion of **16%** (base).

**Fresh leads to inject** (leads = signed ÷ conversion):

| Fresh-lead conversion | Per rep / week | Team (2 reps) / week | Team / day |
|---|---:|---:|---:|
| **16%** (base) | **313** | **625** | **125/day** |
| 20% | 250 | 500 | 100/day |
| 25% | 200 | 400 | 80/day |

At 16% that's **125 qualified leads/day — 2.5× the engine's current 50/day** (engine runs ~$750/day ≈ €653).

**The binding constraint is rep capacity, not leads.** 50 signed/week = 10 signed/day per rep; at 16% that means *working* ~63 fresh leads/day, vs the historical ~40 worked/day. So 50/week/rep is **not reachable with 2 reps at 16%** — it needs one of:

- **Conversion ~25% on fresh leads** (40 worked/day × 25% = 10 signed/day) → 80 leads/day suffices, or
- **A 3rd rep** (keeping 16%) → +~€1,036/mo salary, or
- **Accept ~32 signed/week per rep** (40 worked × 16% × 5) — the honest ceiling for 2 reps at 16%.

**Outcome P&L at 100 signed/week** — cost base scales to **€18,309/mo** (engine €14,372 at 125 leads/day + salaries €3,937):

| Price | 70% confirm | 60% confirm |
|---|---:|---:|
| €80 | **+€6,340/mo** | +€2,820/mo |
| €90 | **+€9,420/mo** | +€5,460/mo |
| €100 | **+€12,500/mo** | +€8,100/mo |

*(Add ~€1k/mo if a 3rd rep is needed — still solidly profitable.)*

**Why it scales:** at 16% conversion every injected fresh lead is profit-positive *after its own engine cost* — **+€3.73 at €80 / +€4.85 at €90 / +€5.97 at €100** (70% confirm). Above ~16% conversion, lead injection becomes the growth throttle: each +125 leads/day ≈ +€6–12k/mo depending on price. (Below ~9% it's the opposite — each lead loses money; see Unit economics.)

**Load-bearing assumption:** fresh-lead conversion holding **≥16% at scale.** Fresh-lead *supply* can thin as volume climbs, dragging the blended rate back toward 8% — track signed/day on fresh leads only.

## Cash & runway

No reserves; any loss is borrowed against a credit line **80% drawn** ($5,000 ≈ €4,355 headroom).

- **At the €80 baseline:** operating ~+€169/mo, ~flat once €218/mo interest is netted (~−€49/mo). Runway stops being days-counted — but there's no buffer.
- **At €110:** ~+€3.6k/mo net → the credit line can begin repaying; runway stops being the binding constraint.
- **At this week's actual (20 signed):** still ~−€5k/mo → **~3.8 weeks runway** ⚠️. Runway depends entirely on reaching the 40/week baseline fast — secure cash in parallel until it's proven sustainable.

## Levers (ranked, post-Pflegebox)

1. **Hold fresh-lead conversion at ≥16%.** This is the baseline's load-bearing assumption — it's the difference between −€4.8k/mo (8%, stale backlog) and break-even (16%, fresh leads). Keep reps on fresh AI output; stop grinding the aged backlog (it's value-destroying at 8%). Track signed/day on fresh leads only.
2. **Re-price Hausnotruf upward (€80 → €110).** Turns the €80 break-even into ~+€3.9k/mo and gives a margin of safety against a bad confirmation month. Sign XY for the €110, or renegotiate lifeo. *(XY's Pflegebox €100 is no longer a reason to sign — it expires with the market.)*
3. **Protect the confirmation rate (70%).** At the baseline, a 70%→60% slip is worth ~−€1.4k/mo. Understand what drives Hausnotruf confirmation (Pflegekasse paperwork? drop-off?) before it slips.
4. **Reconfirm lifeo in writing** — the only live revenue rests on an account with no signed continuation.
5. **Scale via lead injection — but only above 16% conversion.** Each fresh lead is then profit-positive (see Scale scenario); below ~9% it loses money. Don't scale spend until conversion is proven.

## Survival actions (next few weeks)

1. **Hit and hold the 40/week baseline** — keep reps on fresh AI leads, off the stale backlog. The 8%→16% swing *is* the P&L.
2. **Move Hausnotruf pricing toward €110** — close XY or renegotiate lifeo; turns break-even into +€3.9k/mo.
3. **Mind the runway (~4 weeks)** until the baseline is proven sustainable — secure cash in parallel.
4. **Get lifeo's continuation in writing** — don't let the one live payer lapse on a missing letter.

## How to recompute

```
confirmed_hn_wk     = signed_hn_wk * 0.70
revenue_month       = confirmed_hn_wk * hn_price * 4.4
engine_month        = 300 * usd_eur * working_days          # $300/day
fixed_month         = 13300 * tnd_eur                       # salaries + office
profit_month        = revenue_month - engine_month - fixed_month
cost_per_signed     = (300 * usd_eur / leads_per_day) / lead_to_signed
breakeven_signed_wk = (engine_month + fixed_month) / (0.70 * 4.4 * hn_price)
```

## Two-line agent-based scenario — DVP €90 Pflegebox + lifeo €80 Hausnotruf (conditional)

> **What this is.** A self-contained "what-if" (added v15): instead of Hausnotruf-only, run **both** lines — **DVP at €90/confirmed Pflegebox** (70% of contracts) alongside **lifeo at €80/confirmed Hausnotruf** (30%) — and model break-even by **sales headcount** at **€1,500/agent/mo**. ⚠️ **Conditional / off-thesis:** it revives Pflegebox to 70% of the book, against the Pflegebox-sunset thesis (the line expires end-2027). Bridge-cash analysis, not the durable plan.

**Inputs:** €90 PB + €80 HN at a 70/30 signed mix → **blended €87/confirmed** (0.70×90 + 0.30×80). Sales agent **€1,500/mo**; lead-gen **€5.2/qualified lead**; office/other fixed **~€940/mo** *(assumption — the model's non-engine fixed beyond sales salaries; flag if different).*

**The agent unit** — one fully-fed agent works ~40 leads/day (~880/mo, the historical capacity ceiling) at the **same €6,076/mo cost regardless of conversion** (lead-gen €4,576 + salary €1,500). Conversion sets how many they sign:

| Conversion | Signed/agent/mo | Lead-gen €/signed |
|---|---:|---:|
| 16% (proven baseline) | 141 | €32 |
| 20% (stretch) | 176 | €26 |

**Per-agent contribution margin** (= signed × confirmation × €87 − €6,076; office-independent):

| Confirmation | @ 16% conversion | @ 20% conversion |
|---:|---:|---:|
| 40% | **−€1,176** | **+€49** |
| 50% | **+€49** | **+€1,580** |
| 60% | **+€1,274** | **+€3,111** |
| 70% | **+€2,499** | **+€4,642** |

**Break-even is governed by the effective yield = conversion × confirmation.** Revenue/agent = 880 leads × (conv × conf) × €87, so break-even is one product: **conv × conf ≥ 7.94%**. Equivalently, break-even confirmation is **49.6% at 16% conversion** and **39.7% at 20% conversion** — and 16%×50% and 20%×40% land on the *same* +€49 knife-edge (each conversion point ≈ one confirmation point).

**How many sales agents to break even** (monthly operating P&L, office €940 included; scales linearly at the per-agent contribution):

*P&L at 2 agents:*

| Confirmation | @ 16% conversion | @ 20% conversion |
|---:|---:|---:|
| 40% | −€3,292 | −€842 |
| 50% | −€842 | **+€2,220** |
| 60% | **+€1,608** | **+€5,282** |
| 70% | **+€4,057** | **+€8,345** |

*Break-even headcount:*

| Confirmation | @ 16% conversion | @ 20% conversion |
|---:|---:|---:|
| 40% | **none** — each agent −€1,176 | ~19 (knife-edge) |
| 50% | ~19 (knife-edge) | **agent 1** |
| 60% | **agent 1** | **agent 1** |
| 70% | **agent 1** | **agent 1** |

**How to read it:**

- **Headcount is a lever only once per-agent contribution is positive.** Where it's negative (16%×40%), *adding agents deepens the loss* — break-even is impossible at any headcount. Where it's a few €/agent (the +€49 cells), break-even needs ~19 agents — operationally unreal. **Clear the effective-yield line first, then hire.**
- **The viable corner:** at **≥50% confirmation with 20% conversion**, or **≥60% with 16% conversion**, the model is **profitable from the first agent**; 2–3 agents deliver **+€1.6k–8.3k/mo** — enough to repay the credit line and end the runway problem. Each added agent then needs +40 leads/day (engine scales linearly at €5.2/lead).
- **The two levers are interchangeable around break-even** (it's the product): lifting conversion 16%→20% buys the same ground as lifting confirmation ~10 points.

**Caveats:** (1) **confirmation is unmeasured** — the one-agent outcome swings from −€891 to +€3,702 across 40–70%, entirely on this number; (2) **20% conversion is a stretch** (proven fresh-lead baseline is 16%); (3) **office €940 is an assumption** (shifts the knife-edge headcounts, not the impossible/viable verdicts); (4) **Pflegebox-majority and time-boxed** — even the profitable version expires end-2027, so the durable play remains the Hausnotruf €110 re-price (see "Break-even sensitivity").

## Per-signed scenario — €50 per signed contract, any product line (XY Proposal A)

> **What this is.** Customer XY's **Proposal A** (logged in `customers/customer-xy.md`): **€50 per *signed* contract**, either product line, **regardless of confirmation.** Modeled on the same agent unit (€1,500/agent, €6,076/mo cost, 880 leads/mo). The defining feature: **there is no confirmation rate** — revenue = €50 × signed — which removes the model's single largest unknown and shifts all Pflegekasse-confirmation risk onto the payer.

**Break-even is on conversion alone:** `880 leads × conversion × €50 = €6,076` → **13.8% conversion** — *below* the proven 16% fresh-lead baseline, so one agent breaks even at normal performance.

**Per-agent contribution** (= €50 × signed − €6,076; no confirmation term):

| Conversion | Signed/agent/mo | Contribution/agent |
|---|---:|---:|
| 8% (stale backlog) | 70 | **−€2,556** |
| 13.8% (break-even) | 97 | €0 |
| 16% (proven fresh) | 141 | **+€964** |
| 20% (stretch) | 176 | **+€2,724** |
| 25% (high) | 220 | **+€4,924** |

**Headcount P&L** (office €940):

| Agents | @ 16% conversion | @ 20% conversion |
|---:|---:|---:|
| 1 | +€24 | +€1,784 |
| 2 | +€988 | +€4,508 |
| 3 | +€1,952 | +€7,232 |
| 5 | +€3,880 | +€12,680 |

Profitable from **agent 1** at any conversion above ~14%; each added agent adds +€964 (16%) to +€2,724 (20%).

**€50/signed vs the per-confirmed deals.** €50/signed equals a confirmation rate of 50 ÷ (blended confirmed price) — it wins whenever the *real* confirmation runs below that:

| Per-confirmed deal | €50/signed equals | Wins if confirmation below |
|---|---:|---:|
| €90 PB / €80 HN (€87) | 57.5% | 57.5% |
| €100 PB / €110 HN (€103) | 48.5% | 48.5% |
| lifeo €80 HN | 62.5% | 62.5% |
| XY €110 HN | 45.5% | 45.5% |

Since the documented Pflegebox confirmation is **40%** and the rate has never beaten 50% in the data, **€50/signed is the stronger structure against most of these prices** — predictable, paid earlier, product-agnostic (sidesteps the Pflegebox sunset), and zero confirmation risk.

**Caveats:** (1) only the **8% stale-backlog conversion loses money** — the "keep reps on fresh leads" discipline still governs; (2) paying on *signed* removes our incentive to police confirmation — if the payer later disputes chronically low-confirming contracts, the protection erodes, so **signing standards must stay honest**; (3) same €1,500-agent / €940-office assumptions as the two-line scenario.

## Fully-costed scenario — €90 both lines, itemised overhead, by headcount

> **What this is.** A self-contained, fully-itemised P&L (added v17) on a **fresh cost stack** — not directly comparable to the sections above, which use $300/day (~€5.2/lead), €1,500/agent and a €3,937 lumped overhead. Here: **both lines €90/confirmed**, lead engine **€300/day in euros (€6/lead)**, sales agent **€850/mo**, and overhead broken out as **office €300 + engineer €500 + manager €1,000 + diverse €300 = €2,100/mo fixed**. Conversion **20%**; agent capacity **50 leads/day** (= one engine's output).

**Inputs:** €90 PB / €90 HN, 70/30 signed mix. Confirmation **PB 40/50/60%**, **HN +5 pts → 45/55/65%**. Engine €300/day → 50 leads (22 working days).

**The unit — one agent (= one engine):** 1,100 leads/mo → **220 signed** (154 PB / 66 HN). Cost = lead-gen **€6,600** + salary **€850** = **€7,450/mo** (lead spend is 89% of it). Each signed carries ~€30 of lead cost, so €90 × confirmation must clear that first — which is why confirmation is decisive.

**Per-agent contribution** (revenue − €7,450):

| PB / HN confirmation | Confirmed/agent | Revenue/agent | **Contribution/agent** |
|---|---:|---:|---:|
| 40% / 45% | 91.3 | €8,217 | **+€767** |
| 50% / 55% | 113.3 | €10,197 | **+€2,747** |
| 60% / 65% | 135.3 | €12,177 | **+€4,727** |

**Monthly P&L by sales-agent count** (each agent brings one €300/day engine; €2,100 fixed overhead shared):

| PB/HN conf | 1 agent | 2 agents | 3 agents | 4 agents | 5 agents |
|---|---:|---:|---:|---:|---:|
| **40% / 45%** | −€1,333 | −€566 | **+€201** | +€968 | +€1,735 |
| **50% / 55%** | **+€647** | +€3,394 | +€6,141 | +€8,888 | +€11,635 |
| **60% / 65%** | **+€2,627** | +€7,354 | +€12,081 | +€16,808 | +€21,535 |

*Worked example (50/55%, 2 agents):* revenue €20,394 − leads €13,200 − sales €1,700 − office €300 − engineer €500 − manager €1,000 − diverse €300 = **+€3,394/mo**.

**When you break even:**

| PB / HN confirmation | Break-even headcount | First profit |
|---|---|---|
| **40% / 45%** | **3 agents** | +€201/mo |
| **50% / 55%** | **1 agent** | +€647/mo |
| **60% / 65%** | **1 agent** | +€2,627/mo |

**How to read it:**

- **Confirmation rate decides everything.** At **40% it's fragile** — each agent nets only +€767, so it takes **3 agents** (~€20k/mo lead spend) to absorb the €2,100 overhead; 1–2 agents lose money. At **50%+ it flips** — profitable from agent 1, each added agent drops **+€2,747** to the bottom line. At **60%**, +€4,727/agent.
- **Break-even PB confirmation for a single agent ≈ 47%** (covers its €7,450 + the €2,100 overhead); below ~36% an agent can't cover its own lead+salary, so scaling deepens losses. **40% sits in the awkward middle — viable only at 3+ agents.**
- **Overhead is not the constraint** (€2,100 is absorbed by ~1 agent at 50%+). **Lead spend (€6,600/agent) is** — so conversion (20%) and confirmation, not the office/manager/engineer load, make or break it.

## Open questions

- **Is the 40/week baseline sustainable on fresh leads?** It assumes **16% conversion** (2× this week's 8%). The team has hit it before on fresh AI output — confirm it's a holdable run-rate, not a good week. This is now the model's load-bearing assumption.
- **Is $300 the AI engine's daily or monthly cost?** Modeled as **$300/day** (consistent with v7's $250/day and ~7,000 dials/day). If it's *monthly*, the cost base collapses to ~€4.2k/mo and even 20/week is profitable — confirm.
- **Does the engine run 5 or 7 days/week?** Modeled at 5 (22 days/mo). At 7 days the engine cost is ~€7.9k/mo.
- **Is the 70% Hausnotruf confirmation rate still current** after the Pflegebox wind-down? Carried from v7; a ±10-point move is worth ±€1.4k/mo at baseline.
- **Why does fresh-lead conversion (16%) beat stale-backlog conversion (8%)?** Quantify the decay curve — it sets how fast leads must be worked and whether the aged backlog is worth touching at all.
- **What is the true per-agent salary and the fixed office/overhead?** The agent-based scenario assumes **€1,500/agent/mo** + **~€940/mo office** (the €3,937 salaries+office split as ~2 agents + remainder). Confirm the real numbers — they move the break-even headcounts (not the impossible-vs-viable verdicts).
- Credit-line / cash status unchanged since v7 — refresh if the drawn balance moved.

## Changelog
- 2026-06-27 v17: added the **"Fully-costed scenario — €90 both lines, itemised overhead, by headcount"** section. Fresh cost stack (not comparable to the sections above): both lines €90, engine €300/day in euros (€6/lead), agent €850/mo at 50 leads/day capacity, overhead itemised (office 300 + engineer 500 + manager 1,000 + diverse 300 = €2,100), 20% conversion, HN confirmation +5 pts over PB. Per-agent contribution +€767 (40/45%) / +€2,747 (50/55%) / +€4,727 (60/65%). **Break-even: 3 agents at 40/45%, 1 agent at 50%+.** Lead spend (€6,600/agent, 89% of agent cost) is the binding driver, not the €2,100 overhead.
- 2026-06-25 v16: added the **"Per-signed scenario — €50 per signed contract"** section (XY Proposal A). Pays €50/signed regardless of confirmation — **removes the confirmation variable entirely** and shifts Pflegekasse risk to the payer. Break-even is on conversion alone (**13.8%**, below the proven 16%), profitable from agent 1, +€964/agent at 16% conversion / +€2,724 at 20%. Equivalent to **57.5% confirmation** at the €90/€80 blend, so it beats the per-confirmed deals at any realistic (≤50%) confirmation — predictable, paid earlier, product-agnostic (sidesteps the Pflegebox sunset). Caveat: signing standards must stay honest.
- 2026-06-24 v15: added the **"Two-line agent-based scenario — DVP €90 Pflegebox + lifeo €80 Hausnotruf"** section (conditional / off-thesis — revives Pflegebox to 70% of the book). Models break-even by **sales headcount** at €1,500/agent across a **conversion (16%/20%) × confirmation (40–70%) grid** on the €87 blended price. Key findings: break-even is governed by the **effective yield conv×conf ≥ 7.94%** (break-even confirmation 49.6% at 16% conversion, 39.7% at 20%); **headcount only helps once per-agent contribution is positive** — at 16%×40% every agent loses €1,176 (no viable headcount), while ≥50%/20% or ≥60%/16% is profitable from agent 1 (+€1.6k–8.3k/mo at 2 agents). Consolidates the DVP/blend/headcount thread.
- 2026-06-24 v14: added the **"Break-even sensitivity — 40% & 50% confirmation"** section. Grounds the confirmation rate in v7's documented per-line figures (Hausnotruf 70% / **Pflegebox 40%**) and the 2026-06-05 snapshot's 40% — never re-measured since the sunset, so 40–50% is the realistic range and 70% the ceiling. Key finding: at 40% confirmation **nothing in reach breaks even** (even €110/60-week is −€946/mo); at 50% only **€110 at baseline** (~€0) or **€100+ at the 60/week target** clears. The single grounded-range cell that breaks even at proven 16% conversion is **€110 + 50%**. Reinforces: measure confirmation now; re-pricing to €110 is survival, not upside.
- 2026-06-21 v13: added a **"Scenario ladder (at a glance)"** summary table at the top — actual (20/wk) → baseline (40) → profitable target (60) → scale (100), with leads/day, conversion, profit at €80 and €110, and feasibility per row. Gives the whole ladder in one view above the detailed scenario sections.
- 2026-06-21 v12: added the **"60/week scenario — the realistic profitable target"** section (between the 40/week baseline and the 100/week scale case). 2 reps signing 60/week (30/rep) at 16% needs **75 fresh leads/day** (1.5× current engine) and is **feasible within ~40/day rep capacity** (~38 worked/day) — the 100/week case wasn't. Outcome: **+€2.2k/mo at €80/70%** (up to +€5.9k at €100), credit line starts repaying. The marginal +25 leads/day over baseline adds ~€2k/mo.
- 2026-06-21 v11: **reset the operating baseline from 20 (this-week actual) to the 40 signed/week target** — 8/day = 16% lead→signed on fresh AI leads. At 40/week the model is ~break-even at €80 (+€0.2k/mo) and ~+€3.9k/mo at €110; the engine turns right-side up (+€23/signed vs −€9 at 8%). Re-derived headline, funnel, inputs, P&L, unit economics, runway, levers, and actions around the baseline; kept the 20-signed actual visible as the gap-to-close (pure fresh-lead conversion). New top lever: hold fresh-lead conversion ≥16% (off the stale backlog).
- 2026-06-21 v10: added the **"Scale scenario — leads-to-inject vs rep capacity"** section — to close 50 signed/week per rep (100/week for 2 reps) at 16% conversion needs ~625 fresh leads/week (125/day, 2.5× current engine). Key finding: rep capacity (~40 worked/day) is the binding constraint, not lead supply — 50/week/rep needs ~25% conversion or a 3rd rep. Outcome P&L +€6–12k/mo; each fresh lead is profit-positive (+€3.7–6.0) above ~16% conversion.
- 2026-06-21 v9: added the **"Break-even scenarios — signed contracts per day"** section — a 3-price (€80/€90/€100) × 2-confirmation (70%/60%) grid at $300/day engine cost. Break-even ranges 6.3–9.2 signed/day (vs ~4/day today); price sets the confirmed/day target while confirmation taxes how many must be signed.
- 2026-06-21 v8: **Pflegebox sunset (end-2027) → Hausnotruf-only model.** Retired the v7 "sign a Pflegebox payer" thesis; XY's durable value is now the €110 Hausnotruf re-price. Itemised the cost base from actuals (13,300 TND salaries+office ≈ €3,937/mo; AI engine $300/day ≈ €5,750/mo) at live FX ($1 = €0.871, 1 TND = €0.296). This week 20 Hausnotruf signed → ~€4.9k/mo revenue vs ~€9.7k cost → ~−€4.8k/mo, ~4 weeks runway. New finding: the funnel is upside-down at 8% conversion (engine costs ~€65/signed vs ~€56 returned). Reframed levers around Hausnotruf price + lead→signed conversion.
- 2026-06-14 v7: applied known per-line confirmation rates — **Hausnotruf 70%, Pflegebox 40%** (~52% blended, ~25 confirmed/week). Today ~−€5.4k/mo (lifeo only); **XY-signed turns profitable at ~+€1.7k/mo**; runway ~3.5 weeks. lifeo-only break-even needs ~41 signed HN/week. Re-valued the pipeline with line-rate confirmation. Reframed the confirmation lever around Pflegebox's 40% (most headroom).
- 2026-06-13 v6: corrected signed-vs-confirmed — the 49/week are **signed**; payers bill on **confirmed**. Re-derived on a flat 40% confirmation assumption; established the two compounding gates (Pflegebox payer + confirmation rate).
- 2026-06-13 v5: confirmed the scale-up — 49/week is the sustained run-rate (not a spike), against a new 50/week target; dropped the v3 1.6/day assumption.
- 2026-06-13 v4: corrected payer/price state — lifeo active (€80 Hausnotruf), Pflegebox unbillable (Kurapacket lost, XY unsigned), XY prospective €100/€110.
- 2026-06-07 v3: quantified runway (credit line $25k/$20k/15% APR → ~3 weeks); reframed bottleneck to low conversion; added "Survival actions."
- 2026-06-07 v2: corrected inputs (€5,000 fixed incl. salaries; 4 closed/day; 40% of closed → 1.6 confirmed/day); break-even 12.5 closed/day.
- 2026-06-06 v1: initial model (assumed 8 confirmed/day, €3,500 fixed) — superseded.
