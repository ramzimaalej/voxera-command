---
title: Blog Content Strategy — Month 1 (Home Services)
version: 2
status: active
updated: 2026-06-28
owner: you
---

# Blog Content Strategy — a monthly publish → distribute → measure → refine motion

This is an **operating loop**, not a one-off plan. Month 1 runs a focused test (one vertical, four posts, two channels) instrumented so the end-of-month numbers tell us exactly what to change for Month 2. The same template repeats every month with the dials reset from last month's data.

Cross-refs: [website-plan.md](./website-plan.md) · [strategy.md](../strategy/strategy.md) · [vertical-strategy-english-markets.md](../strategy/vertical-strategy-english-markets.md) · brand voice in `voxera-os/docs/brand/brand-guidelines.md`.

**Companion operational docs** (the executable side of this plan):
- [content-m1-distribution-kit.md](./content-m1-distribution-kit.md) — community target list, stagger schedule, seeding copy, paid starter.
- [content-m1-tracking.md](./content-m1-tracking.md) — UTM convention, ready-made tagged links, weekly tracker, GA4 sources, monthly rollup.
- Drafted asset: `voxera-website/src/content/blog/missed-call-cost.md` (Post 1, `draft: true` until anchor stats are verified).

---

## TL;DR

- **Goal:** drive **closed-beta signups** (the `data-open-beta` modal → `VoxeraAnalytics.trackSignup()`). That is the one conversion event everything is measured against.
- **Month 1 bet:** Home services (US/EN), the "missed calls = lost jobs" wedge. Owner-operators, 1–25 staff, $149–$449/mo ACV.
- **Cadence:** 1 post/week, 4 posts. Lean and hittable beats ambitious and slipped.
- **Distribution:** niche communities (free, primary) + a small, *earned*, kill-switched paid test. **No SEO assumption** — a new blog has ~0 organic search traffic in a 30-day window, so signups come from distribution, not Google.
- **The motion:** publish Monday → distribute + engage all week → Friday log the numbers → end of month, run the refinement table → produce the Month 2 delta.

---

## The motion (the part to actually follow)

```
        ┌─────────────────────────────────────────────────────────────┐
        │                     MONTHLY LOOP                             │
        │                                                              │
  WRITE ─▶ PUBLISH ─▶ DISTRIBUTE ─▶ MEASURE ─▶ REFINE ─▶ (next month)  │
   1 post   Mon       communities    Fri        end of                 │
   /week              + earned paid  weekly     month                  │
        │                  ▲            │                              │
        │                  └────────────┘  (paid follows community     │
        │                     weekly        signal — never leads)      │
        └─────────────────────────────────────────────────────────────┘
```

**Weekly micro-loop**

| Day | Action |
|---|---|
| **Mon** | Publish the week's post (`draft: false` in `voxera-website/src/content/blog/`). Post to 2–3 target communities with tagged links. |
| **Tue–Thu** | Show up in the threads as an operator, not a marketer. Answer questions. Watch which post/community gets traction. |
| **Thu** | If a post is *earning* attention organically, queue it for a small paid boost (the "earn paid" rule, below). Otherwise skip paid this week. |
| **Fri** | 15 min: log the week's row in the tracking table (sessions, modal-opens, signups, by source). |

**Monthly macro-loop** — at end of month, run [The refine step](#the-refine-step) and write the Month 2 plan as a *diff* of this doc (new vertical/angle/channel mix, same structure).

---

## Month 1 focus — Home services

**Why this vertical for the test:** the pain is visceral, quantifiable, and self-evident to the buyer — *"a call I didn't answer is a job my competitor just booked."* That makes for honest, useful, community-postable content that needs no invented stats. It's the cleanest wedge to read a conversion signal off.

- **Reader / buyer:** owner-operator of a 1–25-person home-services business — cleaners, HVAC, plumbing, electrical, landscaping, handyman, pest, garage doors. They answer their own phone, often with their hands full.
- **Core pain (the spine of every post):** missed inbound calls = lost jobs; after-hours and overflow calls go to voicemail; callers don't leave voicemails — they call the next business.
- **The job Voxera does for them (how we describe the product — never "AI-powered"):** answers and qualifies inbound calls the moment they come in, books the job or captures the lead, and shows the operator exactly what was said and what to approve. *AI proposes. You approve.*
- **Conversion event:** click "Join the closed beta" / "Email me when there's room in the beta" → submit the modal → `trackSignup()` fires. Trust line stays *"Private beta · invite-only · no card required."*

---

## Guardrails (non-negotiable — keep whoever writes on-rails)

**Voice** (`brand-guidelines.md`): plain-spoken, specific, operator-first, confident-not-loud, anti-hype. Short sentence, then long. Em-dashes fine; exclamation points no. Say what the AI *does*, never "AI-powered / next-gen / revolutionary." Brand verbs: Approve / Reject / Roll back. Signature: "built around how you work."

**Editorial bar:** *"Would the owner of a 10-truck home-services business find this genuinely useful on a Sunday morning?"* If no, don't publish it.

**Honesty (hard rule — we are early and don't pretend otherwise):**
- No fabricated stats, customer counts, or outcomes. No "Voxera customers saw X" — we don't have measured outcomes yet.
- External research stats are allowed **only with a verified source and exact figure** — see each post's "anchor stat (verify)" note. If we can't source it, we don't cite it; we reframe to the operator's own arithmetic instead.
- Capability claims OK ("answers in seconds," "live in under an hour"); aggregate outcome claims not OK until measured.

---

## The 4 posts (Month 1 calendar)

A deliberate arc: **feel the cost → understand the behavior → get a playbook → make the decision.** Post 4 carries the heaviest CTA.

| Wk | Working title | Job of the post | Primary communities | Paid angle (if earned) |
|---|---|---|---|---|
| 1 | **"How many jobs a week is your voicemail costing you?"** | Make the pain a *number the reader computes for their own shop* (avg ticket × missed calls × close rate). No product. | r/smallbusiness, trade subs (r/HVAC, r/Plumbing, r/Electricians), owner FB groups | "Missed-call cost calculator for [trade]" — interest-targeted |
| 2 | **"What a customer actually does when you don't pick up"** | The buying behavior: voicemail rarely gets left; they call the next name on the list. Speed-to-lead for the trades. | Same + r/Entrepreneur, Nextdoor business | Boost only if Wk-1 earned traction |
| 3 | **"The 5 calls a home-services business should never miss"** | Practical playbook (after-hours, overflow-mid-job, weekend, repeat customer, quote follow-up). First soft intro of what an AI answerer *does*. | Trade subs + FB owner groups | "Stop missing after-hours calls" |
| 4 | **"Answering machine vs. answering service vs. AI: what a 1–5 truck shop should actually use"** | Honest decision guide. Tradeoffs named plainly. Strongest beta CTA. | Same + comparison/decision-intent threads | "Compare your call-handling options" — highest-intent |

**Per-post anchor stat to verify before publishing** (honesty guardrail — find the real figure + source, or cut it):
- Share of inbound calls to service businesses that go unanswered.
- Share of callers who *don't* leave a voicemail.
- Speed-to-lead / response-time → conversion studies (the "first to respond wins" body of research).

Each post ends with the same CTA block: one line of "here's what answering every call automatically looks like" → the closed-beta button.

---

## Distribution playbook

> The blog post is the *asset*. The community post / ad is the *distribution*. A post nobody distributes converts nobody.

### Channel A — Niche communities (free, primary)

**Where the ICP already is:** Reddit (`r/smallbusiness`, `r/Entrepreneur`, `r/HVAC`, `r/Plumbing`, `r/Electricians`, `r/HVACadvice`, `r/handyman`, `r/landscaping`, trade-specific subs), Facebook owner groups per trade, trade-association forums, Nextdoor business. Build the target list per trade in week 0.

**Rules of engagement (this is what keeps us from getting banned and ignored):**
- Lead with the *useful insight in the thread itself* — the link is the proof, not the pitch. Most platforms punish drive-by links.
- One community at a time, staggered across the week — don't blast the same post to 10 subs on Monday (spam filters + mod bans).
- Show up as an operator solving a problem. Answer follow-ups for 2–3 days. Reputation compounds; the second month's posts land warmer.
- Tag every link so we can attribute it (below).

### Channel B — Paid (small, earned, kill-switched)

**Runway caveat (read first):** runway is tight. Paid is **optional and gated**, not a baseline spend. Treat it as a measurement instrument, not a growth lever this month.

- **The "earn paid" rule:** only put money behind a post that *already* earned organic traction in communities. Paid amplifies a proven angle; it never rescues a dud.
- **Channel:** Meta (Facebook/Instagram) — cheapest reach to home-services owner-operators with interest/job-title targeting. Reddit ads as alt for trade-sub precision.
- **Budget cap:** hard cap **$200 total for the month**, ≤ **$50 per post**. Calibrate to your reality — if cash says $0 this month, run Channel A only and the motion still works.
- **Kill-switch:** stop a post's paid spend the moment **cost-per-beta-signup exceeds your threshold** (suggested starting line: **$60** — a *beta* signup is a lead, not revenue, so stay conservative). Reallocate or stop.

### Link tagging (so attribution actually works)

Every distributed link uses a UTM + the existing root-domain `?ref=` cookie:

```
https://usevoxera.com/blog/<slug>?utm_source=<reddit|facebook|fbgroup|nextdoor>
   &utm_medium=<community|paid>
   &utm_campaign=hs-blog-m1
   &utm_content=<post-slug>
   &ref=<same-source>
```

`utm_source` = which community/platform · `utm_medium` = community vs paid · `utm_campaign` = `hs-blog-m1` (vertical-month) · `utm_content` = which post. This is what lets the refine step say *"Reddit-HVAC drove the signups, Facebook groups drove bounces."*

---

## Measurement spine

Everything we can already track with the existing stack: **GA4 (Consent Mode v2)**, the root-domain referral cookie, `VoxeraAnalytics.getReferrer()`, and `VoxeraAnalytics.trackSignup()`.

**The funnel (measured at every step, per post, per source):**

| # | Stage | Metric | Source |
|---|---|---|---|
| 1 | Reach | Community impressions / upvotes / comments; paid impressions | Manual (platform) + ad manager |
| 2 | Click | Sessions to the post | GA4, by `utm_source` / `ref` |
| 3 | Read | Avg engagement time / scroll depth | GA4 |
| 4 | Intent | **Beta-modal opens** (`data-open-beta` clicks) | GA4 event — *see prerequisite* |
| 5 | **Convert** | **Beta signups** (`trackSignup`, with referrer) | GA4 / signup handler |

**The numbers that matter (derived):**
- **North star:** beta signups attributed to the blog this month.
- **Session → signup rate** (overall post efficiency).
- **Post → modal-open rate** (is the CTA pulling?) and **modal-open → signup rate** (is the offer/friction OK?). These two split a low conversion into *"nobody clicked"* vs *"clicked but bailed."*
- **Cost per signup** (paid only).
- **Signups by source** (which community / paid set actually produced them).

**Tracking sheet (fill weekly — one row per post per source):**

| Post | Source | Impr. | Sessions | Avg time | Modal opens | Signups | Spend | $/signup |
|---|---|---|---|---|---|---|---|---|
| wk1 | reddit-hvac | | | | | | $0 | — |
| wk1 | fbgroup-cleaning | | | | | | $0 | — |
| … | | | | | | | | |

---

## Targets for Month 1 (calibration, not commitments)

We have **no baseline**, so Month 1's real job is to *establish one* and find one repeatable angle+channel. Targets are framed accordingly:

- **Process (the one that matters most): 4/4 posts published on schedule**, each distributed to ≥3 relevant communities. Hitting cadence is the win condition for a first month.
- **Reach:** establish a baseline for sessions/post and community response. (No prior → measure, don't promise.)
- **Conversion hypothesis to test:** cold content → signup typically converts in the low-single-digit % of sessions. We treat that as a *hypothesis*, not a quota — Month 1 tells us our real number.
- **Learning goal:** by month end, be able to name (a) the best-converting **angle**, (b) the best **community**, (c) whether **paid** cleared its CPA line. Those three answers *are* the deliverable.

---

## The refine step (end of month → Month 2)

Pull the tracking sheet and run this table. Each observed pattern has a pre-committed action — so refinement is mechanical, not vibes.

| If the data shows… | It means… | Do this in Month 2 |
|---|---|---|
| One community drove most signups at low/zero cost | We found a channel | Go deeper there; add 1–2 adjacent communities; drop dead ones |
| Posts got **traffic but ~0 modal opens** | CTA isn't pulling (placement/copy) | Fix the CTA block before adding any volume — this is a *creative* fix, not a distribution one |
| **Modal opens but ~0 signups** | Offer/friction problem at the gate | Tighten the closed-beta offer/copy; reduce form friction; re-test before scaling |
| One **angle** converted far better (session→signup) | We found the message | Write Month 2 posts as variations of the winning angle |
| Paid beat its CPA line | Paid is a viable lever | Raise the cap cautiously; keep the kill-switch |
| Paid missed its CPA line | Paid isn't ready / wrong creative | Cut paid; reinvest the hours into communities |
| Communities ignored/removed posts | Wrong rooms or too promotional | Re-pick communities; shift further toward useful-first, link-second |
| Cadence slipped (<4 posts) | Capacity over-estimated | Drop to a cadence you *will* hit; protect the loop over the volume |

**Output of the refine step:** a Month-2 version of this doc (bump `version`, add a Changelog line) with the vertical/angle/channel dials reset. If month 1 *validates inbound-content as a beta-acquisition channel*, that's a real GTM decision — capture it as an ADR (`capture-decision` skill) so it's not re-litigated.

---

## Setup checklist (week 0 — do once before publishing)

- [ ] Confirm `trackSignup()` fires on closed-beta modal submit **and** captures `getReferrer()` / `ref` (engineer — 5 min check).
- [ ] **Add a GA4 event on `data-open-beta` clicks** if one doesn't exist — without it we can't measure stage 4 (modal opens) and can't diagnose low conversion. *Flag: verify with the engineer; this is the one likely instrumentation gap.*
- [ ] Build the per-trade community target list (subs, FB groups, forums) + warm up any accounts that need karma/age to post.
- [ ] Create the tracking sheet (copy the table above into a shared sheet).
- [ ] Agree the paid CPA kill-line and monthly cap (or set paid to $0 this month).
- [ ] Lock the UTM convention (above) as the only way links get shared.

---

## Assumptions & open questions to verify

- **Signup attribution end-to-end** — that GA4 + `ref` actually stitch community/paid click → `trackSignup`. If broken, the whole motion is flying blind; fix before Month 1, not during.
- **Modal-open tracking** — assumed to be a gap (see checklist). Confirm.
- **Closed-beta capacity** — if the beta literally can't take new home-services users right now, the honest CTA is *"Email me when there's room"* (already on the home page) and the metric becomes *waitlist joins*. Confirm which CTA state is live.
- **Per-post anchor stats** — every external statistic must be sourced before publish, or cut.
- **Single-vertical discipline** — resist mixing real-estate/insurance posts in; a clean read on home services this month is worth more than broader coverage.

---

## Changelog
- 2026-06-28 v2: added companion operational docs (distribution kit, tracking/UTM sheet) and Post-1 drafted asset; linked them as the executable side of the plan.
- 2026-06-28 v1: initial — Month 1 home-services blog motion (4 posts, communities + earned paid), measurement spine, and the monthly refine loop.
