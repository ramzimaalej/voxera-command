---
name: customer-pulse-update
description: Update a per-customer pulse file (`docs/operations/customers/<customer>.md`) with this week's signals — usage, support touch-points, expansion / churn risk, action items. Use when the user has new info about a customer ("just got off a call with X", "X mentioned they're using Y less"). The skill keeps the pulse file current without requiring a full re-write — it appends to a dated pulse log and updates frontmatter health if it changed.
---

# customer-pulse-update

Keep a per-customer pulse file current. For a private-beta company with 2 customers, knowing each customer's pulse weekly is existential.

## When to invoke

- After a customer call (sales, support, demo, check-in).
- After noticing a usage change (drop, spike, new feature adoption).
- During the weekly business review (the `weekly-business-review` babysitter process loops over customers and invokes this skill per customer).
- When the user says "update <customer>'s pulse" or "<customer> mentioned X" or "log this for <customer>".

## Customer pulse file shape

Each customer has one file at `docs/operations/customers/<customer-slug>.md`:

```markdown
---
title: <Customer Name>
slug: <customer-slug>
version: <integer>
status: active        # active | churned | paused | pre-customer
health: green         # green | yellow | red | unknown
since: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
owner: you
motion: dach          # dach | english-markets
plan: <plan name>
mrr_usd: <number>     # null if unknown / pre-customer
primary_contact: <name + role>
secondary_contact: <name + role, optional>
---

# <Customer Name>

## Summary
2-3 sentences. Who they are, why they bought, what they care about most.

## Account context
- **Industry / vertical**: ...
- **Size**: ...
- **Use case**: ...
- **Key integrations**: ...
- **Renewal / contract terms**: ...

## Pulse log (newest first)

### YYYY-MM-DD — <health>
- Signal 1
- Signal 2
- Action items: ...

### YYYY-MM-DD — <health>
- ...
```

## Workflow

1. **Read the existing pulse file** at `docs/operations/customers/<slug>.md`. If it doesn't exist, scaffold one from `docs/operations/templates/customer-pulse-template.md` and ask the user for the basic account context.

2. **Capture the new signals.** What changed this week?
   - **Usage signals** — more / less product usage, adoption of new features, drop in known activity (calls placed, leads worked).
   - **Support touch-points** — bugs hit, questions asked, escalations.
   - **Expansion signals** — asked about more seats, asked about new features, mentioned new use cases.
   - **Churn risk signals** — quiet, missed renewal conversation, raised pricing concerns, mentioned a competitor by name.
   - **Stakeholder signals** — new contact, contact left, champion changed roles.
   - **Action items** — what you committed to do for them, or what they committed to do.

3. **Re-assess health.**
   - **green**: using product, paying, no churn signals, growing or stable.
   - **yellow**: at least one churn signal OR usage declining OR support issue unresolved > 1 week OR contract questions raised.
   - **red**: explicit churn intent OR usage near zero OR escalated complaint OR contract renewal at risk.
   - **unknown**: no contact in > 4 weeks; chase before this week's review.

4. **Append a dated entry** to the `## Pulse log` section at the top (newest first). Include the new health rating in the section header. Format:
   ```markdown
   ### 2026-05-31 — yellow
   - Pflegekasse paperwork integration hit a bug; team frustrated but ops team is patient.
   - Two new use cases mentioned (private health insurance leads).
   - Action items: ship the Pflegekasse fix by 06-07; schedule a call about the private-health expansion.
   ```

5. **Update frontmatter** if anything changed:
   - `health`: if it changed
   - `mrr_usd`: if new
   - `updated`: today's date
   - `version`: increment

6. **Output** the new pulse log entry text + a one-line summary (health change, key action items). Optionally surface to the weekly review.

## When to escalate

If the new entry sets `health: red`, surface it loudly:
- "**Health: red.** Top concern: <reason>. Recommended next action: <action>."

If the customer hasn't been updated in > 4 weeks (`unknown`):
- "**Unknown health — last contact <date>.** Schedule a check-in before the next weekly review."

## Don't

- **Don't fabricate signals.** "Seems happy" is not a signal; "renewed without negotiation" is. If the user didn't mention something, don't infer it.
- **Don't change health without a signal.** Health changes are evidence-based; if the user just chatted with the customer and nothing's different, log "no significant change" and keep health the same.
- **Don't share pulse files externally.** They contain candid internal assessments.
- **Don't overwrite past pulse-log entries.** History is the value — health changes over time are a leading indicator.
- **Don't add fake first names / quotes** to fill out the pulse. Use what the user actually said.

## See also

- `docs/operations/templates/customer-pulse-template.md` — fillable template for a new customer.
- `weekly-business-review` (process) — loops over customers and invokes this skill per customer.
- `meeting-notes` (skill) — when you have a full customer-call transcript and need to extract signals from it before updating the pulse.
