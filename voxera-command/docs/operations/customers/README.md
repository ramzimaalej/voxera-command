---
title: Customers
version: 4
status: active
updated: 2026-06-06
owner: you
---

# Customers

One file per customer (active, churned, paused, or pre-customer). Filename: `<customer-slug>.md` (kebab-case, matches the `slug` frontmatter field).

Voxera has **1 active customer (private beta)** as of 2026-06-06: **Customer XY** (DACH, commission), which from 2026-06-08 replaces both prior payers — **Kurapacket** (Pflegebox) and **lifeo** (Hausnotruf), now **churned**. XY buys both product lines at higher rates: €90/confirmed Pflegebox, €95/confirmed Hausnotruf (vs €80 before). The same ~7,000 calls/day operation continues; it's a commercial upgrade, not an operational change. Unit economics are tracked in [`../revenue-model.md`](../revenue-model.md). _(Note: `../strategy/strategy.md` frames v1 as "Pflegebox, two paying customers" — now stale on both count and vertical; flagged for an iterate-doc fix.)_

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
| Customer XY | [customer-xy](./customer-xy.md) | active | unknown | dach | 2026-06-08 | commission (€90 Pflegebox / €95 Hausnotruf) | Replaces both prior payers. Real name TBD. Goes live 2026-06-08. |
| Kurapacket | [kurapacket](./kurapacket.md) | churned | unknown | dach | [TBD] | commission (€80/confirmed) | Churned 2026-06-06. Pflegebox line moved to Customer XY. |
| lifeo | [lifeo](./lifeo.md) | churned | unknown | dach | [TBD] | commission (€80/confirmed) | Churned 2026-06-06. Hausnotruf line moved to Customer XY. |
| DVP | [dvp](./dvp.md) | pre-customer | unknown | dach | [TBD] | commission (€90/confirmed Pflegebox, offered) | Offered 2026-06-24. Would re-activate the orphaned Pflegebox line. Bridge only — Pflegebox sunsets end-2027. |

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
- 2026-06-06 v4: customer transition — Kurapacket + lifeo churned (contracts closed); new customer **Customer XY** added, replacing both from 2026-06-08 at higher rates (€90 Pflegebox / €95 Hausnotruf). Active count is now 1. Added link to the new revenue model.
- 2026-06-05 v3: filled in the two DACH payer scaffolds — `pflegebox-payer-1` → **kurapacket** (Pflegebox), `pflegebox-payer-2` → **lifeo** (Hausnotruf, corrected from Pflegebox). Both: €80/confirmed-customer commission, ~3,500 calls/day → ~25 qualified/day, Ahmed Abida as champion, health green. Corrected customer count to **2** (Kurapacket + lifeo) and removed the phantom third-customer scaffold (`customer-3.md`). Index + intro + "how to add a customer" updated.
- 2026-05-31 v2: scaffolded the 3 known customer files (2 Pflegebox payers + 1 third customer; motions identified for the 2 Pflegebox payers, motion-TBD for #3). Index table now reflects the scaffolds. Added "Filling in the scaffolds" instructions.
- 2026-05-31 v1: index initialized; customer pulse files to be added per real customer.
