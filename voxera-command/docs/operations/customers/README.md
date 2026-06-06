---
title: Customers
version: 3
status: active
updated: 2026-06-05
owner: you
---

# Customers

One file per customer (active, churned, paused, or pre-customer). Filename: `<customer-slug>.md` (kebab-case, matches the `slug` frontmatter field).

Voxera currently has **2 customers in production (private beta)**, both DACH and commission-based per `../strategy/strategy.md` §2: **Kurapacket** (Pflegebox line) and **lifeo** (Hausnotruf line). Both pay €80 per confirmed new customer and run on ~3,500 outbound calls/day → ~25 qualified/day; Ahmed Abida champions both accounts. _(Note: strategy.md §2 frames the v1 vertical as Pflegebox — lifeo is actually Hausnotruf; flagged for an iterate-doc fix.)_

## File shape

See `../templates/customer-pulse-template.md`. Each file has:
- Frontmatter: title, slug, status (active / churned / paused / pre-customer), health (green / yellow / red / unknown), since, motion (dach / english-markets), plan, mrr_usd, primary_contact.
- A summary section (who they are, why they bought, what they care about).
- An account context section (industry, size, use case, integrations, renewal, compliance).
- Champions + stakeholders.
- A pulse log (dated entries, newest first).
- Open + closed action items.
- Risks + expansion signals.

## Index

| Customer | Slug | Status | Health | Motion | Since | MRR | Notes |
|---|---|---|---|---|---|---|---|
| Kurapacket | [kurapacket](./kurapacket.md) | active | green | dach | [TBD] | commission (€80/confirmed) | Pflegebox line. Ahmed Abida champions. |
| lifeo | [lifeo](./lifeo.md) | active | green | dach | [TBD] | commission (€80/confirmed) | **Hausnotruf** line (not Pflegebox). Ahmed Abida champions. |

Update this table whenever a customer is added, churns, or changes plan / MRR / motion.

## How to add a new customer

1. **Copy the template** `../templates/customer-pulse-template.md` to `<customer-slug>.md` (kebab-case, matches the `slug` frontmatter).
2. **Fill in the frontmatter** — title, slug, since, primary_contact, plan, mrr_usd, motion, account-context details.
3. **Add a first pulse log entry** dated today — capture the current state of the relationship.
4. **Set the initial `health` rating** from actual signals: `green` if using product + paying + no churn signals; `yellow` if any churn signal or stale; `red` if at-risk; `unknown` only if you genuinely don't know yet.
5. **Update this README's index table** with the real values.

The `weekly-business-review` process picks up the files automatically — Phase 2 loops over every file in this directory and invokes the `customer-pulse-update` skill per customer.

## Privacy

These files contain candid internal assessments. They're for internal use only — never share with the customer, never paste into a public channel.

## Changelog
- 2026-06-05 v3: filled in the two DACH payer scaffolds — `pflegebox-payer-1` → **kurapacket** (Pflegebox), `pflegebox-payer-2` → **lifeo** (Hausnotruf, corrected from Pflegebox). Both: €80/confirmed-customer commission, ~3,500 calls/day → ~25 qualified/day, Ahmed Abida as champion, health green. Corrected customer count to **2** (Kurapacket + lifeo) and removed the phantom third-customer scaffold (`customer-3.md`). Index + intro + "how to add a customer" updated.
- 2026-05-31 v2: scaffolded the 3 known customer files (2 Pflegebox payers + 1 third customer; motions identified for the 2 Pflegebox payers, motion-TBD for #3). Index table now reflects the scaffolds. Added "Filling in the scaffolds" instructions.
- 2026-05-31 v1: index initialized; customer pulse files to be added per real customer.
