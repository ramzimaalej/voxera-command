---
title: Month 1 Tracking & UTM Cheat-Sheet — Home Services
version: 1
status: active
updated: 2026-06-28
owner: you
---

# Month 1 Tracking & UTM Cheat-Sheet

Companion to [content-strategy.md](./content-strategy.md) and [content-m1-distribution-kit.md](./content-m1-distribution-kit.md). This is what makes the refine step possible: without consistent tagging and one place to log numbers, you can't tell *which* community or *which* angle actually drove signups — and the whole motion goes blind.

Conversion event = **closed-beta signup** (`VoxeraAnalytics.trackSignup()`, fired by the `data-open-beta` modal). Everything below leads to that one number.

---

## 1. UTM convention (lock this — the only way links get shared)

```
https://usevoxera.com/blog/<slug>?utm_source=<community>&utm_medium=<community|paid>&utm_campaign=hs-blog-m1&utm_content=<post-slug>&ref=<community>
```

- `utm_source` — the specific room: `reddit-sweatystartup`, `reddit-hvac`, `fbgroup-cleaning`, `hvactalk`, `nextdoor`, `facebook-ads`…
- `utm_medium` — `community` (free) or `paid`.
- `utm_campaign` — `hs-blog-m1` (vertical + month). Bump to `hs-blog-m2` next month so months never blur.
- `utm_content` — the post slug, so you can compare posts: `missed-call-cost`, `what-customers-do`, `5-calls`, `vs-comparison`.
- `ref` — same value as `utm_source`. Belt-and-suspenders: GA4 reads UTMs; the root-domain `.usevoxera.com` referral cookie reads `ref` and rides through to `trackSignup`. Keep them identical.

**Post slugs (Month 1):**

| Wk | Post | Slug / `utm_content` | Publish (Mon) |
|---|---|---|---|
| 1 | How many jobs is your voicemail costing you | `missed-call-cost` | 2026-06-29 |
| 2 | What a customer actually does when you don't pick up | `what-customers-do` | 2026-07-06 |
| 3 | The 5 calls you should never miss | `5-calls` | 2026-07-13 |
| 4 | Answering machine vs service vs AI | `vs-comparison` | 2026-07-20 |

### Ready-made tagged links — Post 1 (copy, don't hand-build)

```
reddit-sweatystartup
https://usevoxera.com/blog/missed-call-cost?utm_source=reddit-sweatystartup&utm_medium=community&utm_campaign=hs-blog-m1&utm_content=missed-call-cost&ref=reddit-sweatystartup

reddit-hvac
https://usevoxera.com/blog/missed-call-cost?utm_source=reddit-hvac&utm_medium=community&utm_campaign=hs-blog-m1&utm_content=missed-call-cost&ref=reddit-hvac

fbgroup
https://usevoxera.com/blog/missed-call-cost?utm_source=fbgroup-trades&utm_medium=community&utm_campaign=hs-blog-m1&utm_content=missed-call-cost&ref=fbgroup-trades

facebook-ads (only if earned)
https://usevoxera.com/blog/missed-call-cost?utm_source=facebook-ads&utm_medium=paid&utm_campaign=hs-blog-m1&utm_content=missed-call-cost&ref=facebook-ads
```

> For posts 2–4, swap `missed-call-cost` for the slug above. That's the only change.

---

## 2. The weekly tracking sheet

One row **per post per source**. Paste this block into Google Sheets (it's comma-separated) and fill it Friday. "Impr." for communities = upvotes/comments/views you can see; for paid = ad impressions.

```csv
week,post,source,medium,impressions,sessions,avg_time_sec,modal_opens,signups,spend_usd,cost_per_signup
1,missed-call-cost,reddit-sweatystartup,community,,,,,,0,
1,missed-call-cost,reddit-hvac,community,,,,,,0,
1,missed-call-cost,fbgroup-trades,community,,,,,,0,
2,what-customers-do,,community,,,,,,0,
3,5-calls,,community,,,,,,0,
4,vs-comparison,,community,,,,,,0,
```

**Derived columns (formulas):**
- `cost_per_signup` = `spend_usd / signups` (paid rows only; blank if 0 signups).
- **Session→signup %** = `signups / sessions` — the headline efficiency of a post.
- **Post→modal-open %** = `modal_opens / sessions` — is the CTA pulling?
- **Modal-open→signup %** = `signups / modal_opens` — is the offer/friction OK?

Those last two are the diagnostic split the strategy's refine table runs on: traffic-but-no-opens = a **CTA** problem; opens-but-no-signups = an **offer/friction** problem.

---

## 3. Where each number comes from (GA4)

| Number | GA4 location |
|---|---|
| Sessions by source | Reports → Acquisition → Traffic acquisition → filter `Session campaign = hs-blog-m1`, break down by `Session source / medium`. |
| Avg engagement time | Same report, "Average engagement time per session" column. |
| Modal opens | Custom event on `data-open-beta` click — **see setup flag**. Use as an event/key-event count, filtered by campaign. |
| Signups | `trackSignup` event (mark as a **key event/conversion** in GA4). Filter by campaign + source. |

**Setup flag (do in week 0):** confirm two events fire — a **modal-open** event on `data-open-beta` clicks (likely missing — add it), and **`trackSignup`** on submit (capturing `ref`/referrer). Mark `trackSignup` as a key event so it shows in the acquisition report. Without the modal-open event you can still count signups, but you lose the ability to diagnose *why* a post underperformed.

---

## 4. Monthly rollup (feeds the refine step)

At month end, collapse the weekly rows into this. This table is the input to the refine table in [content-strategy.md](./content-strategy.md#the-refine-step).

| Dimension | Best | Worst | Decision |
|---|---|---|---|
| **Channel** (by signups & $/signup) | | | scale / hold / cut |
| **Community** (by signups) | | | go deeper / drop |
| **Post angle** (by session→signup %) | | | write more like it |
| **Paid** (vs $60 CPA line) | n/a | n/a | scale / kill |
| **Cadence** | 4/4? | | protect / reduce |

**Month total — beta signups attributed to blog: ____** (the north-star number; compare against next month).

---

## Changelog
- 2026-06-28 v1: initial — UTM convention, ready-made Post 1 links, weekly CSV tracker, GA4 sources, monthly rollup.
