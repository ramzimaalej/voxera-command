---
title: Vertical Strategy — English-Speaking Markets
version: 2
status: active
updated: 2026-05-31
owner: you
---

# Voxera — Three-Vertical Go-To-Market Strategy

**Audience for this document:** a Claude subagent (or human collaborator) tasked with updating the Voxera marketing website and producing per-vertical landing pages, paid-search assets, email sequences, and supporting copy.

**Geographic scope:** English-speaking markets only (US, UK, Canada, Australia, Ireland). DACH (Germany, Austria, Switzerland) is explicitly out of scope for this document — it's handled separately by the founder on a different acquisition motion that respects German cold-calling restrictions (UWG §7).

**Existing assets to build on (already in the repo):**
- Shared design system in `styles.css` — editorial, warm cream + ink + sunset orange accent, Fraunces + DM Sans + JetBrains Mono. Reuse, don't recreate.
- Generic pages: `index.html`, `features.html`, `how-it-works.html`, `pricing.html`, `customers.html`, `about.html`, `contact.html`, `security.html`.
- Vertical/utility pages already drafted: `home-services.html`, `compare.html`.
- i18n infrastructure: `i18n.json`, `i18n.js` (EN + DE). For the three verticals in this document, keep copy English-only — don't add DE entries.
- Analytics: `analytics.js` with GA4 Consent Mode v2, root-domain referral cookie (`?ref=` captured into `.usevoxera.com`), `VoxeraAnalytics.trackSignup()` and `VoxeraAnalytics.getReferrer()` exposed.

**What "done" looks like for the subagent:**
1. Three vertical landing pages built from the template described in §6, one per vertical.
2. Generic homepage updated with a self-select strip ("What kind of business do you run?") that routes to the right vertical page (see §7).
3. A vertical-aware testimonial/case-study system (see §6.3).
4. Per-vertical paid-search ad copy and keyword groupings ready to paste into Google Ads (see §4 in each vertical section).
5. Per-vertical activation email tweaks (the day-0 to day-11 sequence in `activation-emails.md` adapted for each vertical's language).
6. GA4 event naming consistent across all three (see §8).

---

## §1 — Strategic frame

### 1.1 Why these three verticals

The selection criteria were: (a) the buyer is the user, (b) decisions happen in days not quarters, (c) the cost of slow lead response is *quantifiable and felt daily*, (d) ACV is high enough to support paid acquisition, (e) competitive landscape isn't dominated by an obvious incumbent for the "AI does the work" pitch.

The three verticals chosen, ordered by recommended launch priority:

1. **Real estate agents and small brokerages** — primary wedge, launch first.
2. **Home services (cleaners, trades, installers)** — broadest base, easiest pitch, lowest ACV.
3. **Insurance agents (personal lines, Medicare, final expense)** — highest ACV, hardest channel.

Real estate first because it has the best combination of buyer accessibility, ACV ($499–$999/mo per agent, $1,500+/mo per small brokerage), and a *pre-existing sales argument* (the 5-minute rule, see §2). Home services and insurance launch in parallel after the real-estate funnel is converting.

### 1.2 What's the same across all three

The product pitch is identical underneath: **AI that answers your phone, follows up on every lead, and books the meeting — in your voice, in under a minute, 24/7, while you stay in control of every change.** What changes per vertical is:
- The opening pain (what specifically they're losing)
- The numbers in the proof (response time, cost per lead, conversion lift)
- The integrations highlighted (Zillow vs. ServiceTitan vs. Agency Bloc)
- The objections answered in the FAQ
- The testimonial voice and headshot

What stays the same:
- Design system (`styles.css` reused verbatim)
- Trust messaging ("AI proposes. You approve. Always.")
- Compliance positioning (audit trails, GDPR, full call recording)
- Pricing — same plans for all three; verticals don't get vertical pricing
- The "hear it call you now" demo mechanic as the central conversion device

### 1.3 What the subagent must not do

- Do not invent customer logos, named testimonials, or specific case-study numbers that don't exist. Use composite/anonymized voices (first name + last initial) and round numbers ("3×", "40%", "1hr") rather than fabricated specifics ("Jana M. at Northwind Group saw 142% YoY growth"). The existing site follows this convention — preserve it.
- Do not add new top-level navigation items per vertical. Verticals live at `/real-estate`, `/home-services`, `/insurance`; they're entry points reached via paid traffic and the homepage self-select, not nav items.
- Do not add browser geolocation or IP-based industry detection. Routing is by URL/UTM only.
- Do not write copy that promises specific dollar outcomes ("you'll close $50k more"). Stick to mechanism + range, e.g. "more booked appointments" or "up to 3× lead response speed."
- Do not introduce DE translations for these vertical pages. Mark `<html lang="en">` and omit `data-i18n` attributes on vertical-specific elements.
- Do not name competitors in default copy. Competitor mentions only appear via the DTR mechanic in `compare.html?competitor=X` and on paid-search-only landing pages — never on indexed pages.

---

## §2 — Vertical 1: Real estate agents and small brokerages

### 2.1 Why this vertical wins on speed-to-revenue

Real estate has a phenomenon other industries don't: **the 5-minute rule.** Multiple studies (Harvard Business Review, MIT Sloan, InsideSales.com) have shown that the probability of qualifying an online lead drops by roughly an order of magnitude if the first contact attempt is delayed from 5 minutes to 30 minutes. Most agents and brokerages know this and *still* fail at it, because human responsiveness can't compete with a phone that rings at 11pm on Saturday.

This gives Voxera a pre-built sales argument that doesn't need creating — the agent already accepts the premise. The pitch isn't "let me convince you that fast lead response matters." It's "you already know it matters; here's how you finally do it."

Combined with:
- **High commission per closed lead** ($5,000–$15,000+ average commission) → high willingness-to-pay per tool
- **Existing tool-budget** — agents already spend $200–500/mo on lead sources (Zillow Premier Agent, Realtor.com Connections, Facebook lead ads), so adding a $500–1,000/mo tool that converts those leads isn't a budget jump, it's a budget reallocation
- **Identifiable buyer** — solo agent or team lead, decides for themselves, no procurement process for a $599/mo tool
- **Tight community** — agents talk to each other constantly (Facebook groups, BiggerPockets, mastermind groups, brokerage offices), so referrals compound fast

### 2.2 Buyer profile

**Primary buyer: solo agent or small team lead, 2–10 person team.**

- Spends $1,500–$5,000/mo on lead generation (Zillow, Realtor.com, paid social, SEO)
- Closes 12–40 transactions/year, average commission $8–12k
- Works 60+ hours/week, much of it driving between showings or in active sessions where they can't answer the phone
- Already uses some CRM (most common: Follow Up Boss, kvCORE, Sierra Interactive, BoomTown, LionDesk) but is dissatisfied with manual follow-up
- Has tried at least one AI tool (Structurely, Conversica, Lofty, RealScout, OJO) — typically text-based, often disappointing
- Values: speed, professionalism in front of clients, never letting a lead go cold

**Secondary buyer: small independent brokerage (10–50 agents).**

- Higher ACV ($1,500–$4,000/mo for team plan)
- Slower sales cycle (2–4 weeks instead of days)
- Buyer is broker/owner, sometimes ops manager
- Reaches via direct outreach and partnerships, not paid search
- Defer this segment to Q3 — focus on solo agents first

### 2.3 Messaging architecture for `/real-estate`

**Hero headline (H1):**
> Stop losing leads to <em>the 5-minute rule</em>.

**Hero subhead:**
> Voxera answers every Zillow, Realtor.com, and website lead in under 30 seconds — qualifies, books the showing, and notifies you on your phone. 24/7, in your voice. While you're at a showing, with a client, or asleep.

**Primary CTA:** "Get called by the AI now" (links to in-page demo)
**Secondary CTA:** "Start free trial"
**Hero meta strip:** "Answers in 30s · Live in 30 minutes · No credit card"

**The three problems (problem section, replacing the home-services pain):**

1. **The lead came in at 11pm. You called back at 9am. They're already touring with someone else.** Online leads convert ~10× better when called within 5 minutes, but you can't be on the phone 24/7.
2. **You paid $40 a lead and worked one in three.** Zillow and Realtor.com leads aren't cheap. Most agents only get to a fraction — the rest sit in a CRM, slowly going stale.
3. **Your "AI assistant" sends a text that says 'thanks!' and stops.** Most so-called AI tools in real estate are templated text drips. Leads can tell. They want a conversation.

**How it works (3 steps):**

1. **Connect your lead sources.** Zillow, Realtor.com, Facebook lead ads, your website forms. Voxera reads new leads the moment they hit.
2. **It calls them. In your voice.** Within 30 seconds. It qualifies (timing, financing, area), books the showing on your calendar, and texts you the summary.
3. **You walk in already briefed.** You only join the leads worth your time. The cold ones get warmed. The serious ones get scheduled. Nothing goes silent.

**Feature highlights (use the existing `.features` grid with `span 4 / span 2 / etc` layout):**

- **Lead-source integrations** — Zillow Premier Agent, Realtor.com Connections, Facebook lead ads, Boomtown, kvCORE, Follow Up Boss, your website forms. We read leads from where you actually pay for them.
- **Qualifies on the call** — Pre-approval status, timeline, area, price range, motivation. The questions you'd ask, asked the same way every time.
- **Books showings on your calendar** — Connects to Google or Outlook. Books only times you're free. Confirms the property address out loud.
- **Sounds like a real agent** — Trained on the way agents actually talk. Not stiff, not a chatbot. Demo it on yourself before you decide.
- **Compliant with TCPA & state rules** — Required disclosures, opt-out handling, do-not-call list checking, full recording with consent. Audit trail forever.
- **Drip + recall** — If a lead isn't ready now, Voxera keeps the relationship warm. New listings, market updates, a check-in at the right moment. All in your voice.

**Trust section (mid-page):**
> AI proposes. You approve. Always.
> Every script, every follow-up rule, every change Voxera wants to make comes to you as a proposal. One click to approve. One click to roll back. You stay the boss.

**Testimonial (composite — first-name-last-initial format):**
> "I was paying $1,200/mo on Zillow and working maybe 30% of the leads. Now Voxera calls every one in under a minute. I close more, I sleep more, and the leads who weren't ready six months ago still come back warm."
> — *Marcus T., solo agent, 8 years*

**FAQ (objection handling — these are real estate specific):**

1. *Will Zillow / Realtor.com let me use this with their leads?* — Yes. You're the lead recipient; you decide how you contact them. Voxera respects all platform terms — it calls and texts using your number or a Voxera number you control. Always discloses it's an assistant if asked. Never pretends to be you.
2. *What if it books a showing for a property I'm not licensed to sell?* — You define your service area, price range, and any property-type rules during setup. Voxera only books inside those bounds. If a lead asks about something outside, it captures the inquiry and notifies you instead of guessing.
3. *Will I lose the personal relationship that's my whole brand?* — You only spend less time on *unqualified* leads. The serious ones still get you — and now they get you faster, better-briefed, and at the showing. Most agents find their close rate goes up because they're showing up to qualified meetings instead of working a noisy top of funnel.
4. *Is this legal? Real estate has strict rules.* — Voxera handles TCPA opt-out, state-by-state calling hours, mandatory disclosures, and recording consent automatically. Every call is logged with full audit trail. We can configure additional rules for specific state requirements.
5. *How is this different from Structurely / Conversica / [other text-based AI]?* — Those are text-bots. This is voice. The 5-minute rule is about *being on the phone* with the lead while they're still hot. Text-bots can't do that. Voxera can.

**Final CTA:**
> Your next lead is <em>about to hit your inbox</em>.
> Start your 14-day trial. Live in 30 minutes. No credit card. Cancel anytime.

### 2.4 Paid-search plan for real estate

**Tier 1 — high intent, send to `/real-estate`** ($CPC ~$8–18, expected; bid hard):
- `real estate AI assistant`
- `real estate lead response automation`
- `Zillow lead follow up tool`
- `Realtor.com lead response`
- `AI ISA real estate` (ISA = Inside Sales Agent; agents recognize this term)
- `5 minute rule real estate tool`
- `real estate appointment booking AI`
- `AI receptionist for realtors`
- `real estate lead qualification software`

**Tier 2 — competitor & category, send to `/compare?competitor=X`** ($CPC ~$5–12):
- `Structurely alternative`
- `Conversica real estate alternative`
- `Lofty AI alternative`
- `Follow Up Boss AI`
- `kvCORE AI assistant`
- `real estate CRM with AI`

**Tier 3 — problem-aware, send to `/real-estate` or a 5-minute-rule cornerstone post** (cheap, educational):
- `how to respond to real estate leads faster`
- `losing real estate leads to other agents`
- `Zillow leads not converting`
- `real estate lead response time statistics`

**Ad copy template (Tier 1):**
- Headline 1: `Answer Every Lead In 30 Seconds`
- Headline 2: `AI That Sounds Like You — Try It Now`
- Headline 3: `Built For Real Estate Agents`
- Description 1: `Voxera answers every Zillow, Realtor.com, and website lead the second it comes in. Qualifies, books the showing, in your voice. Hear it call you free.`
- Description 2: `Stop losing leads to the 5-minute rule. 14-day free trial. Live in 30 minutes. No credit card.`
- Sitelinks: "Hear It Call You" / "Pricing" / "How It Works" / "vs. Structurely"

**Budget recommendation:** start at $75–100/day on Tier 1 only, one MLS region (Phoenix, Austin, Tampa, or Charlotte recommended — high volume, English-only, no DACH overlap). After 2 weeks of data, expand if CAC tracks under $4,500 fully-loaded.

### 2.5 Channel-specific go-to-market (non-paid)

**Founder-led outreach (Q1):**
- Target: 200 personalized LinkedIn messages to solo agents in chosen MLS, weekly for 8 weeks.
- Hook: "I built a thing that calls your Zillow leads in 30 seconds. Want to hear it work on a leftover lead from last month?"
- Goal: 25 trials, 5 closed customers.

**Community presence:**
- BiggerPockets — answer real questions about lead response in the forums, never spam, build a profile.
- The Real Estate Mastermind Facebook groups — same.
- Tom Ferry / Mike Ferry coaching communities — these are paid masterminds; a partnership conversation is worth more than a hundred organic posts.

**Partnership targets (Q3):**
- Lead-source resellers (people who sell Zillow Premier Agent training): bundle Voxera as the "what to do with leads once you get them" upsell.
- Real estate CRMs that lack AI calling (LionDesk, IXACT Contact, RealOffice360): integration-led partnership.
- Brokerage networks (eXp, Real, etc.) — pitch as a brokerage-wide tool, longer cycle but bigger ACV.

### 2.6 Real estate launch checklist for the subagent

1. Create `/real-estate.html` based on the §6 template using copy from §2.3.
2. Add real-estate testimonial composite to a shared `testimonials.json` (see §6.3).
3. Add `/real-estate` to homepage self-select (see §7).
4. Wire `?vertical=real-estate` UTM into GA4 event metadata (see §8).
5. Adapt activation emails for real-estate vocabulary (replace "jobs" with "showings", "trades" with "leads", etc.) — see §9.

---

## §3 — Vertical 2: Home services

### 3.1 Why this vertical, ranked second

Home services is the broadest base of potential customers, but its average ACV is lower ($149–$449/mo), the buyer is more price-sensitive, and the channel landscape is more fragmented than real estate. It's still an excellent vertical — and the existing `home-services.html` is already 80% right — but it's launch #2 because the dollars-per-customer-acquired math is harder than real estate.

Where home services wins: **volume.** There are ~5M home-services businesses in the US alone. Even modest penetration at low ACV scales. And the pitch is dead simple — every owner knows that a missed call is a lost job.

### 3.2 Buyer profile

**Primary buyer: owner-operator with 1–25 employees.**

- Trades: cleaners, plumbers, electricians, HVAC, roofers, landscapers, pest control, locksmiths, garage door, handyman, junk removal, pool service
- Average revenue $200K–$3M/year
- Spends $500–$5,000/mo on Google Ads / Local Services Ads / Angi / Thumbtack
- Phone is the primary lead channel (~60–80% of jobs start with an inbound call)
- Probably uses a field-service tool (Jobber, Housecall Pro, ServiceTitan) but its CRM features are weak
- Lives by reviews — Google Reviews are existential for local SEO

**Sub-segments and what they pay attention to:**
- **Cleaners (residential)** — Care most about: phone always answered, quote follow-up, automated review requests. Best entry point — usually owner-operated, fast decision.
- **Trades (plumbing, electrical, HVAC)** — Care most about: 24/7 emergency call answering, accurate quoting, route-aware booking. Higher willingness-to-pay because emergencies = premium pricing.
- **Recurring services (landscaping, pool, pest control)** — Care most about: seasonal re-engagement, contract renewal automation, route optimization. Slightly different pitch — Voxera is the "remember every customer at the right time" tool.

### 3.3 Messaging architecture for `/home-services`

The existing `home-services.html` already has strong bones. Tighten it with these specifications:

**Keep:**
- Hero: "Stop losing <em>jobs</em> to slow callbacks."
- The "get called by the AI now" demo mechanic
- The 3-problem grid (missed calls, quotes going quiet, after-hours leads vanishing)
- The how-it-works steps
- The FAQ structure

**Update:**
- Add a sub-vertical selector (4 buttons: "Cleaning", "Trades", "Recurring services", "Other") that uses the existing `?trade=` DTR mechanic to swap headline word and one paragraph in the body. Don't build four separate pages.
- Add a feature row specifically about **automated review requests** ("Voxera asks for the Google Review at the right moment — gets you found, gets you more calls"). This is huge for home services and not present in the current draft.
- Add an integration mention strip: "Connects with Jobber · Housecall Pro · ServiceTitan · Google Calendar · Outlook · your existing number."
- Add a testimonial slot per sub-vertical so the proof matches the user's industry (see §6.3 for the system).

**Sub-vertical headline variants (used via `?trade=`):**
- `?trade=cleaning` → "Stop losing <em>cleaning jobs</em> to slow callbacks."
- `?trade=plumbing` → "Stop losing <em>plumbing jobs</em> to slow callbacks."
- `?trade=hvac` → "Stop losing <em>HVAC jobs</em> to slow callbacks."
- `?trade=electrical` → "Stop losing <em>electrical jobs</em> to slow callbacks."
- `?trade=landscaping` → "Stop losing <em>landscaping jobs</em> to slow callbacks."
- Default (no `?trade=`) → "Stop losing <em>jobs</em> to slow callbacks."

### 3.4 Paid-search plan for home services

**Tier 1 — high intent, sub-vertical targeted** ($CPC ~$4–10):
- `AI receptionist for cleaning company`
- `AI receptionist for plumbers`
- `24/7 answering service trades`
- `cleaning company missed calls`
- `HVAC after hours answering`
- `automated quote follow up [trade]`
- `virtual receptionist for [trade]`

**Tier 2 — competitor & category** ($CPC ~$3–8):
- `Jobber alternative with AI`
- `Housecall Pro AI add-on`
- `ServiceTitan answering service`
- `Ruby Receptionists alternative`
- `Smith.ai alternative`

**Tier 3 — problem-aware** (cheap):
- `how to stop missing calls small business`
- `automate quote follow up`
- `get more cleaning customers`
- `Google reviews for cleaning company`

**Ad copy template (cleaning sub-vertical example):**
- Headline 1: `Never Miss a Cleaning Job`
- Headline 2: `AI Answers Your Phone 24/7`
- Headline 3: `Hear It Call You — Free`
- Description 1: `Voxera answers every call, quotes the job, and books the visit in your calendar. In your voice. 24/7. No more callbacks lost to competitors.`
- Description 2: `14-day free trial. Live in 30 minutes. No credit card.`

**Budget recommendation:** start at $50–75/day per sub-vertical (cleaning first, then plumbing, then HVAC). Lower CPC than real estate means dollars stretch further but conversion economics are tighter — watch CAC ruthlessly.

### 3.5 Channel-specific go-to-market (non-paid)

**Founder/sales-led outreach:**
- Cold-call cleaning companies in chosen city. Use Voxera's own AI to do the outreach. (This is also marketing — it demonstrates the product.)
- Facebook groups for trade owners: "Cleaning Business Owners," "Plumbing Business Owners," local Chamber of Commerce groups.

**Partnership targets:**
- Field-service software companies that lack AI calling (especially Jobber and Housecall Pro mid-market plans). Co-marketing > acquisition for both sides.
- Local Service Ads management agencies — bundle Voxera as the "convert your LSA leads" upsell.
- Trade-specific newsletters and YouTube channels (e.g., Service Business Mastery, The Plumbing & HVAC Sales Podcast).

### 3.6 Home services launch checklist for the subagent

1. Update existing `/home-services.html` with sub-vertical selector buttons (visual chips above hero).
2. Add `?trade=` DTR for the 5+ trades listed in §3.3.
3. Add review-request feature card to the features grid.
4. Add integration mention strip below hero.
5. Add 3 trade-specific testimonial composites to `testimonials.json` (see §6.3).
6. Add `/home-services` to homepage self-select (see §7).
7. Adapt activation emails — split into "responsive trade" (plumbing/HVAC) vs. "recurring trade" (cleaning/landscaping) versions.

---

## §4 — Vertical 3: Insurance agents

### 4.1 Why this vertical is highest-ACV but launch-third

Insurance agents have the most extreme version of the lead-cost economics that make real estate attractive: many agents buy leads at $15–$80 per lead, work only a fraction of them, and have a one-time licensing barrier that makes the agent population accessible and stable. A closed Medicare Advantage policy is worth $400–$700 in first-year commission with renewals; final expense and life insurance run higher. Willingness to pay for "convert more leads" is real.

Why launch third anyway:
- **Regulatory surface is large.** TCPA enforcement is aggressive in insurance, state insurance departments have specific rules per state, CMS regulates Medicare marketing tightly (the 48-hour rule on inbound recordings, scope-of-appointment requirements, etc.). Compliance must be airtight before launch.
- **Channel is dominated by IMOs and FMOs** (Independent / Field Marketing Organizations), which are essentially distribution networks. Going around them means slow direct sales; going through them means a partnership deal that takes months to land.
- **Lead-platform dependency.** Agents buy from QuoteWizard, EverQuote, NextGen Leads, MediaAlpha, etc. Voxera needs at least basic integration with the top 2–3 for a credible pitch.

The combination is solvable but takes 3–4 months of focused work. Don't try to launch this in Q1.

### 4.2 Buyer profile

**Primary buyer: independent insurance agent or small agency (1–15 producers).**

- Lines: Medicare (Advantage + Supp), final expense, life insurance, ACA health, P&C
- Spends $2,000–$10,000/mo on leads
- Closes 5–15% of leads typically; the bottleneck is *speed of contact*, exactly like real estate
- Often works with one or more IMOs for carrier access and lead supply
- Uses agency management systems: Agency Bloc, NowCerts, EZLynx, Applied Epic (P&C-heavy)
- Highly regulated — knows about TCPA, knows what gets agents in trouble, will ask hard compliance questions

### 4.3 Messaging architecture for `/insurance`

**Hero headline:**
> Stop paying for leads you can't <em>get to in time</em>.

**Hero subhead:**
> Voxera calls every lead the second it hits — qualified, recorded, compliant. Built for Medicare, final expense, life, and P&C agents who bought the lead and still couldn't be first to the phone.

**Primary CTA:** "Get called by the AI now"
**Secondary CTA:** "Start free trial"
**Hero meta strip:** "TCPA-compliant · CMS-aware · Audit trail forever"

**The three problems:**

1. **You paid $45 for that Medicare lead. They bought from the guy who called them in 4 minutes.** The lead vendors aren't reselling — you're just losing the race. Voxera answers in 30 seconds.
2. **Compliance kills the AI tools you've looked at.** Most weren't built for insurance. Voxera handles required disclosures, opt-out, recording consent, and state-specific rules — automatically — with a full audit log.
3. **Your follow-up plan is a sticky note.** Leads who weren't ready today are gone in a week. Voxera keeps the relationship alive — at the right cadence, with the right script, until they're ready.

**How it works:**

1. **Connect your lead vendors.** QuoteWizard, EverQuote, MediaAlpha, NextGen, your own web forms. Every new lead hits Voxera the moment it arrives.
2. **It calls — compliant by default.** Required disclosures at the start. TCPA opt-in capture. State calling hours respected. Full recording with consent. Audit trail forever.
3. **Qualified leads go on your calendar. Cold leads stay warm.** You only spend time on leads that are ready, with budget, and in your states.

**Feature highlights:**

- **Lead-vendor integrations** — QuoteWizard, EverQuote, NextGen Leads, MediaAlpha. We answer the leads where you buy them.
- **TCPA & state compliance built in** — Required disclosures, opt-out capture, state-specific calling hours, DNC list checking before every dial. Audit log forever.
- **Medicare-aware** — Scope of Appointment forms, 48-hour recording handling, CMS-compliant scripts. If you sell Medicare, the AI knows the rules.
- **Qualifies on the call** — Income, age (Medicare), health status (final expense), state, current carrier. The right questions, in the right order, every time.
- **Books on your calendar** — Connects to your AMS and your calendar. Books only times you're free, only in states you're licensed.
- **Drip + recall in your voice** — Today's "not interested" is next quarter's customer. Voxera keeps the line open, in your voice, with the right pace.

**Trust section (lead heavily on compliance — it's the unlock for this buyer):**
> Compliant. Auditable. Yours.
> Voxera was built for regulated industries. Every call has the required disclosures. Every opt-out is honored automatically. Every recording is stored with consent and full audit trail. We can configure additional rules for your specific state and carrier requirements.

**Testimonial (composite):**
> "I was first to call maybe one in ten leads. The rest were a coin flip. Voxera answers every one before my coffee's done — and the compliance side is bulletproof. My licensing held up to my IMO's audit no problem."
> — *Diane R., independent Medicare agent, 12 years*

**FAQ (compliance-heavy):**

1. *How does this handle TCPA?* — Voxera tracks consent on every lead, respects opt-outs immediately, runs DNC checks before every outbound dial, and adapts calling hours per state. Every interaction is logged with timestamp and opt-in source.
2. *What about CMS rules for Medicare?* — Voxera handles required Medicare disclosures, manages Scope of Appointment electronically, and supports the 48-hour rule on inbound recordings. Scripts are reviewable and modifiable by your compliance team.
3. *Will my IMO/FMO approve this?* — We work with several agency carriers on configurations. Most IMO compliance teams approve once they see the audit trail and disclosure handling. We provide compliance documentation on request.
4. *Can it handle multiple states with different rules?* — Yes. You set the states you're licensed in. Voxera applies the right calling hours, disclosures, and rules per lead based on the lead's state.
5. *What about lead vendor terms — am I allowed to use this on QuoteWizard / EverQuote leads?* — You are the lead recipient and you decide your contact method. Voxera contacts using your number or a Voxera number you control, identifies as an assistant if asked, and respects all opt-outs. We have no record of lead-vendor TOS conflicts.

**Final CTA:**
> Your next lead just hit the queue. <em>Be first.</em>
> 14-day free trial. No credit card. Live in 30 minutes — including TCPA setup.

### 4.4 Paid-search plan for insurance

**Tier 1 — high intent** ($CPC ~$10–25, insurance keywords are expensive):
- `AI dialer Medicare leads`
- `Medicare lead response automation`
- `insurance AI assistant TCPA`
- `final expense lead follow up`
- `EverQuote lead automation`
- `QuoteWizard automation tool`
- `independent insurance agent AI`

**Tier 2 — competitor & category** ($CPC ~$8–15):
- `Convoso alternative`
- `Mojo Dialer alternative`
- `PhoneBurner AI`
- `Agency Bloc AI`
- `insurance CRM with AI calling`

**Tier 3 — problem-aware:**
- `how to work Medicare leads faster`
- `Medicare lead response time`
- `TCPA compliant AI calling`
- `final expense lead conversion`

**Ad copy template:**
- Headline 1: `Call Every Insurance Lead First`
- Headline 2: `TCPA-Compliant AI Dialer`
- Headline 3: `Free 14-Day Trial — No Card`
- Description 1: `Voxera calls every Medicare, FE, and life lead in 30 seconds — TCPA-compliant, fully recorded, audit trail forever. Hear it on a sample lead free.`
- Description 2: `Built for independent agents and small agencies. CMS-aware. State-by-state compliant.`

**Budget recommendation:** higher CPCs mean higher daily floor. Start $150/day on Tier 1 only, after compliance and integration work is shipped. Don't run insurance ads against a half-built product — the buyer is too skeptical.

### 4.5 Channel-specific go-to-market (non-paid)

**Founder/sales-led outreach (this matters more in insurance than the other two):**
- LinkedIn outreach to independent Medicare/FE agents. Pitch: "Built TCPA-compliant AI for agents like you. Want to hear it answer one of your dead leads?"
- Industry forums: AgentLink, Insurance Forums, the various Reddit subs (r/InsuranceAgent, r/Medicare).

**Partnership targets (this is where the real volume comes from in insurance):**
- **IMOs/FMOs** — These are the choke point. Land 1–2 partnerships with progressive IMOs (Integrity Marketing, AGA, etc.) and you get a built-in pipeline. Expect 3–6 month sales cycles.
- **Lead vendors** — QuoteWizard, EverQuote, MediaAlpha. Bundle as the "convert more of what you bought" upsell.
- **AMS platforms** — Agency Bloc and NowCerts integrations open the small-agency channel.

**Content:**
- One cornerstone TCPA-compliance guide ("Your TCPA Compliance Checklist for AI Calling in 2026"). This will compound.
- Conference presence — Medicarians, the annual NAIFA conference, ITC events.

### 4.6 Insurance launch checklist for the subagent (Q2+, not Q1)

1. Hold this vertical until compliance documentation is ready.
2. Create `/insurance.html` based on §6 template using copy from §4.3.
3. Add insurance testimonial composite to `testimonials.json`.
4. Add `/insurance` to homepage self-select.
5. Build a dedicated `/tcpa-compliance` cornerstone resource page (not a landing page — a credibility asset).
6. Adapt activation emails — heavier on compliance reassurance, especially day 0.

---

## §5 — Cross-vertical execution plan

### 5.1 Sequencing

| Month | Real estate | Home services | Insurance |
|---|---|---|---|
| 1 | Founder outreach, launch `/real-estate`, paid tier 1 live in one MLS | Existing `/home-services` tightened with sub-vertical selector, paid tier 1 live for cleaning only | Compliance research only |
| 2 | Scale paid, hire first AE, start brokerage outreach | Expand to plumbing + HVAC sub-verticals | Begin IMO partnership conversations |
| 3 | First brokerage closes, referral program live | All 5 sub-verticals running | Build `/insurance`, ship TCPA features in product |
| 4 | $25K MRR target | $10K MRR target | Soft launch, founder-led only |
| 6 | $50K MRR | $20K MRR | $5K MRR target |
| 9 | $70K MRR | $30K MRR | $15K MRR |
| 12 | $80K MRR | $40K MRR | $25K MRR ≈ $1.7M ARR combined run-rate |

The combined Q4 run-rate target overshoots the $1M goal deliberately — execution rarely hits plan. If you hit 60% of these per-vertical targets you still land at $1M.

### 5.2 Founder time allocation

Roughly 60% real estate, 25% home services, 15% insurance (mostly partnership conversations) in the first 6 months. Don't split evenly — concentration wins.

---

## §6 — The vertical landing page template

This is the structural specification the subagent should follow when building any of the three vertical pages. The point of having a template is that the design system stays consistent — only the words and proofs change per vertical.

### 6.1 Page sections, in order

1. **`<nav>`** — Identical to existing site nav. Active state on no item (verticals aren't nav items). No `data-i18n` attributes.
2. **Hero** — Eyebrow ("For [vertical]"), H1 with `<em>` accent, lede, two CTAs (primary = "Get called by the AI now" anchor link to `#demo`, secondary = "Start free trial" anchor link to `#cta`), meta strip with 3 checkmarks.
3. **In-page demo (right side of hero)** — The "get called by the AI now" form. Critical. This is the highest-leverage element on every vertical page. Reuse exactly the markup from `home-services.html` lines containing `<div class="console" id="demo">`. Wire the button to fire `gtag('event', 'demo_call_requested', { method: 'landing_[vertical]' })`.
4. **Problem grid (3 problems)** — Industry-specific pain. Use `.problems` class with 3 `.problem` blocks.
5. **How it works (3 steps)** — Industry-specific. Use `.steps` class.
6. **Feature highlights** — 4–7 cards using the existing `.features` grid with `span 2/3/4` cells for visual rhythm.
7. **Integration mention strip** — Inline text strip with the 5–8 tools/platforms your vertical recognizes. Single line, monospace font, looks like a credit on a movie poster.
8. **Trust statement** — Reuse the existing dark `.control-section` markup. Single industry-tuned paragraph.
9. **Testimonial** — `.testimonial` block. Composite voice, first-name-last-initial. See §6.3.
10. **FAQ** — 4–6 objection-handling items using existing `.faq-wrap` markup. Vertical-specific objections only — don't repeat generic ones from the main FAQ page.
11. **Final CTA** — Reuse `.final-cta` orange block with industry-specific headline.
12. **Footer** — Identical to existing site footer.

### 6.2 Scripts each vertical page must include

```html
<!-- Already in existing template; preserve exactly -->
<script>window.GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';</script>
<script src="analytics.js"></script>

<!-- At end of body -->
<script>
  // Reveal-on-scroll (copy from existing pages)
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // FAQ accordion
  document.querySelectorAll('.faq-item .faq-q').forEach(q => {
    q.addEventListener('click', () => q.parentElement.classList.toggle('open'));
  });

  // Demo intent tracking (per-vertical method label)
  document.getElementById('demo-btn').addEventListener('click', function () {
    const phone = document.getElementById('demo-phone').value.trim();
    if (!phone) { document.getElementById('demo-phone').focus(); return; }
    if (window.gtag) {
      gtag('event', 'demo_call_requested', { method: 'landing_VERTICAL_KEY' });
    }
    document.getElementById('demo-btn-text').textContent = 'Calling…';
    document.getElementById('demo-confirm').style.display = 'block';
    // TODO: POST phone to backend to trigger outbound demo call.
  });

  // Trial CTA tracking
  document.getElementById('trial-btn').addEventListener('click', function () {
    if (window.gtag) { gtag('event', 'trial_cta_click', { location: 'VERTICAL_KEY_final' }); }
  });

  // Vertical context tagging — ensures GA4 events from this page carry the vertical
  (function () {
    if (window.gtag) {
      gtag('set', 'user_properties', { active_vertical: 'VERTICAL_KEY' });
    }
  })();
</script>
```

Replace `VERTICAL_KEY` with one of: `real_estate`, `home_services`, `insurance`.

### 6.3 The shared testimonials system

Rather than hard-coding testimonials per page, the subagent should create `testimonials.json` with composite voices per vertical, then have each landing page render the appropriate one. This way:
- Voice and tone stay consistent
- Updates happen in one file
- Generic pages (homepage) can rotate testimonials per visit

Schema:
```json
{
  "real_estate": [
    {
      "quote": "I was paying $1,200/mo on Zillow and working maybe 30% of the leads. Now Voxera calls every one in under a minute.",
      "name": "Marcus T.",
      "role": "Solo agent, 8 years",
      "avatar": "MT"
    }
  ],
  "home_services": {
    "cleaning": [ { "quote": "...", "name": "Jana M.", "role": "...", "avatar": "JM" } ],
    "plumbing": [ { "quote": "...", "name": "Dan K.", "role": "...", "avatar": "DK" } ],
    "hvac": [],
    "default": []
  },
  "insurance": [
    { "quote": "...", "name": "Diane R.", "role": "Medicare agent", "avatar": "DR" }
  ]
}
```

Vertical pages can read the right slot via a tiny inline script — pattern follows the existing `i18n.js` approach.

---

## §7 — Homepage self-select strip

The generic homepage (`index.html`) catches branded search, direct traffic, and anyone who didn't arrive via a vertical-targeted ad. Add a one-question self-select that routes them to the right vertical page.

### 7.1 Where it goes

Insert immediately after the hero, before the "problems" section. So the visitor sees: nav → hero → self-select → rest of page. The self-select is not the *only* path — the existing page content still works for someone who doesn't click — but it's an obvious, low-friction way to get a vertical-targeted experience.

### 7.2 Markup pattern

```html
<section class="block self-select-strip">
  <div class="container">
    <div class="self-select-card">
      <div class="self-select-text">
        <span class="eyebrow">Show me what fits</span>
        <h3>What kind of business do you run?</h3>
        <p>We tune the pitch — and the proof — to your industry.</p>
      </div>
      <div class="self-select-options">
        <a href="real-estate.html" class="self-select-btn">
          <span class="ss-label">Real estate</span>
          <span class="ss-sub">Agents · brokerages</span>
        </a>
        <a href="home-services.html" class="self-select-btn">
          <span class="ss-label">Home services</span>
          <span class="ss-sub">Cleaning · trades · recurring</span>
        </a>
        <a href="insurance.html" class="self-select-btn">
          <span class="ss-label">Insurance</span>
          <span class="ss-sub">Medicare · FE · P&C</span>
        </a>
        <a href="#problems" class="self-select-btn ss-btn-other">
          <span class="ss-label">Something else</span>
          <span class="ss-sub">Show me the generic pitch</span>
        </a>
      </div>
    </div>
  </div>
</section>
```

### 7.3 CSS to add (append to `styles.css`)

```css
.self-select-strip { padding: 60px 0 0; }
.self-select-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 32px 36px;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 32px;
  align-items: center;
}
.self-select-text h3 { margin: 6px 0 8px; font-family: 'Fraunces', serif; font-size: 22px; }
.self-select-text p { color: var(--mute); font-size: 14px; margin: 0; }
.self-select-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.self-select-btn {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px;
  text-decoration: none;
  color: var(--ink);
  transition: border-color 0.15s ease, transform 0.1s ease, background 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.self-select-btn:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
  background: var(--accent-soft);
}
.ss-label { font-weight: 600; font-size: 15px; }
.ss-sub { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--mute); letter-spacing: 0.04em; text-transform: uppercase; }
.ss-btn-other { background: transparent; }
@media (max-width: 900px) {
  .self-select-card { grid-template-columns: 1fr; padding: 24px; }
  .self-select-options { grid-template-columns: 1fr 1fr; }
}
```

### 7.4 GA4 event on click

Add to the homepage script tag:
```js
document.querySelectorAll('.self-select-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = btn.querySelector('.ss-label')?.textContent || 'other';
    if (window.gtag) gtag('event', 'vertical_self_select', { selected_vertical: v });
  });
});
```

---

## §8 — GA4 event naming standard

The subagent should keep events consistent across all three verticals. Use these exactly:

| Event name | When it fires | Parameters |
|---|---|---|
| `page_view` | Automatic via GA4 | `page_location`, `page_path` |
| `vertical_self_select` | Click on homepage self-select chip | `selected_vertical` |
| `demo_call_requested` | "Call me now" button on any vertical page | `method` = `landing_real_estate` / `landing_home_services` / `landing_insurance` |
| `trial_cta_click` | "Start free trial" button click | `location` = `home_services_final`, etc. |
| `referral_visit` | First time `?ref=` is seen | `referral_code`, `referral_campaign` |
| `sign_up` | On `app.usevoxera.com` after successful signup | `method`, `referral_code` (from cookie) |

Mark `sign_up` and `demo_call_requested` as **key events** in GA4 Admin. The first is your conversion. The second is your highest-leverage leading indicator.

Cross-vertical user property: set `active_vertical` once on each vertical landing page so funnels can be filtered by vertical without parsing URLs.

---

## §9 — Per-vertical activation email adjustments

The base sequence in `activation-emails.md` works for any vertical. Adjust the vocabulary per vertical to match how the buyer actually talks.

**Real estate adaptations:**
- "jobs" → "leads" or "showings"
- "the phone" → "your lead inbox"
- Day-1 test-call email: "have Voxera call you and play the role of a Zillow lead."
- Day-5 recap metric: emphasize *number of leads contacted within 5 minutes* — the agent's mental model.

**Home services adaptations:**
- Already aligned to current `activation-emails.md` voice ("jobs", "calls"). Minor tweaks per sub-vertical for vocabulary ("estimates" for trades, "quotes" for cleaning).

**Insurance adaptations:**
- "leads" stays "leads"
- "jobs" → "policies" or "appointments"
- Day-0 should explicitly reference TCPA setup ("Your 10-minute setup includes setting up disclosures and your states") — compliance reassurance is part of activation, not afterthought.
- Day-3 concierge email is even more important here — insurance buyers are more skeptical of self-serve.

---

## §10 — Anti-goals (what the subagent must avoid)

A list of things that look helpful but make things worse:

1. **Don't auto-detect the visitor's industry.** Browser/IP detection is unreliable and creepy. Routing is by URL/UTM only.
2. **Don't create a "Solutions" mega-menu.** The verticals aren't products — they're entry points. They shouldn't clutter primary nav.
3. **Don't promise dollar outcomes in copy.** "Make $50k more this year" puts your foot in your mouth. Stick to mechanism and ranges ("up to 3× faster lead response").
4. **Don't write a fourth vertical page right now.** Mortgage, dental, legal, etc. all could work — but launching three is already aggressive. Prove these three before splitting attention.
5. **Don't add German translations to vertical pages.** DACH is being handled separately by the founder via a different motion. Keeping vertical pages English-only avoids translation drift and respects the cold-calling law issue.
6. **Don't add login walls, popups, or exit-intent modals to the vertical pages.** The conversion mechanic is the in-page demo. Anything else competes with it.
7. **Don't write competitor names into default landing copy.** Use the `?competitor=X` DTR on `compare.html` for ad-driven competitor traffic. Default landing pages stay name-free to avoid legal and indexing issues.
8. **Don't over-engineer the testimonials system.** A single shared JSON file is enough. Don't build a headless CMS for 6 quotes.

---

## §11 — Concrete file output the subagent should produce

When this document is handed to a Claude subagent, the expected deliverables are:

**New files:**
- `/real-estate.html` — from §2.3 copy and §6 template
- `/insurance.html` — from §4.3 copy and §6 template (lower priority; can be deferred to Q2)
- `/testimonials.json` — composite testimonials per vertical
- `/tcpa-compliance.html` — cornerstone resource page for insurance (deferrable to Q2)

**Updated files:**
- `/index.html` — add self-select strip per §7, GA event per §7.4
- `/home-services.html` — add sub-vertical selector chips above hero, review-request feature card, integration strip per §3.3
- `/styles.css` — append self-select strip CSS per §7.3, append any vertical-specific styles needed (sub-vertical chips for home-services)
- `/activation-emails.md` — add per-vertical variants per §9, OR create three companion files (`activation-emails-real-estate.md`, `-home-services.md`, `-insurance.md`)

**Quality checks the subagent should run before declaring done:**
- All vertical pages validate as HTML and load without console errors.
- All vertical pages pass a quick read-through: no fabricated specifics, no competitor names in default copy, no dollar promises.
- The "get called by the AI now" demo block exists and is wired identically on all three vertical pages.
- GA4 events fire as specified in §8 (verifiable in browser dev tools network tab).
- The homepage self-select strip routes correctly to all three vertical pages.
- The shared design system isn't broken — fonts, colors, spacing, button styles match the existing site.

---

## §12 — Success criteria for the GTM plan (not the subagent)

What the founder is measuring once the site updates are live:

- **Month 1:** 25+ trials across the three verticals, with real estate >50%. `demo_call_requested` events >50/week.
- **Month 3:** $25K MRR, with trial-to-paid conversion >12% per vertical.
- **Month 6:** $75K combined MRR, NRR >100%, CAC payback <12 months on at least one vertical.
- **Month 12:** $1M ARR run-rate, with real estate as the dominant contributor (>50%).

If any of these slip by >30%, the issue is either product quality (most likely — the AI calling isn't good enough) or wrong vertical (less likely given the rationale in §1 and §2). The site, copy, and channels are not usually the bottleneck once they exist.

---

## §13 — One final note for the subagent

The Voxera homepage and product pages already do a strong job of presenting a generic, design-led pitch. The vertical pages should feel like *the same brand talking to a specific person* — not like landing-page-builder pages. Keep the editorial voice. Keep Fraunces in italic for emphasis. Keep the warm cream backgrounds and the sunset-orange accent on CTAs. Keep paragraphs short but never list-formatted unless the content is genuinely a list. Resist the urge to add icons, badges, gradients, or visual flourishes the existing site doesn't already have.

The product is positioned as the careful, considered, in-control AI CRM. The verticals are how it gets discovered. The voice should never change.

## Changelog
- 2026-05-31 v2: promoted to `status: active`. Strategic conflict resolved by [ADR-0009: English-speaking markets GTM in parallel with the DACH motion](../../decisions/ADR-0009-english-markets-parallel-motion.md), which adopts the two-motion structure. `strategy.md` updated to v2 with §1a "Two parallel motions" table referencing this doc as the English-markets playbook. **Open issue (not blocking)**: §6 and §7 implementation specs in this doc were written against an earlier vanilla-HTML site and reference files that don't exist in the current Astro-based `voxera-website` (e.g., `home-services.html`, `i18n.js`, `analytics.js`). The strategy content (vertical pitches, paid-search plans, sequencing, buyer profiles) is correct and active; the implementation specs need translation to Astro before a subagent can execute them. Track that work as a separate FEAT in `docs/product/features/`.
- 2026-05-31 v1: imported from `/Users/ramzi/Downloads/vertical-strategy.md`. Frontmatter added; body preserved verbatim. Status `draft` — pending reconciliation with the canonical `strategy.md`.
