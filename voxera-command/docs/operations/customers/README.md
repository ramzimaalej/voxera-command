---
title: Customers
version: 2
status: active
updated: 2026-05-31
owner: you
---

# Customers

One file per customer (active, churned, paused, or pre-customer). Filename: `<customer-slug>.md` (kebab-case, matches the `slug` frontmatter field).

Per BRAND.md, Voxera currently has **3 customers in production (private beta)**: two Pflegebox payers (commission-based per `../strategy/strategy.md` §2) plus one third customer.

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
| [REPLACE_ME] Pflegebox Payer #1 | [pflegebox-payer-1](./pflegebox-payer-1.md) | active | unknown | dach | [TBD] | [TBD] | **Scaffold — rename + fill in.** |
| [REPLACE_ME] Pflegebox Payer #2 | [pflegebox-payer-2](./pflegebox-payer-2.md) | active | unknown | dach | [TBD] | [TBD] | **Scaffold — rename + fill in.** |
| [REPLACE_ME] Customer #3 | [customer-3](./customer-3.md) | active | unknown | TBD | [TBD] | [TBD] | **Scaffold — identify motion + rename + fill in.** |

Update this table whenever a customer is added, churns, or changes plan / MRR / motion.

## Filling in the scaffolds

For each scaffold file:
1. **Rename the file** to match the real customer slug (e.g., `pflegebox-payer-1.md` → `pflegebox-direkt-gmbh.md`).
2. **Update the `slug` frontmatter** to match the new filename.
3. **Fill in the `[REPLACE_ME]` placeholders** — title, since, primary_contact, plan, mrr_usd, account-context details.
4. **Delete the banner** at the top of the file.
5. **Update this README's index table** with the real values.
6. **Add a real first pulse log entry** dated today — capture the current state of the relationship.
7. **Set the initial `health` rating** based on actual signals: `green` if they're using product + paying + no churn signals; `yellow` if any churn signal or stale; `red` if at-risk; `unknown` only if you genuinely don't know yet.

After this, the `weekly-business-review` process will pick up the files automatically — Phase 2 loops over every file in this directory and invokes the `customer-pulse-update` skill per customer.

## How to add a new customer

Same process as filling in the scaffolds, except start from `../templates/customer-pulse-template.md` instead of a pre-existing scaffold file.

## Privacy

These files contain candid internal assessments. They're for internal use only — never share with the customer, never paste into a public channel.

## Changelog
- 2026-05-31 v2: scaffolded the 3 known customer files (2 Pflegebox payers + 1 third customer; motions identified for the 2 Pflegebox payers, motion-TBD for #3). Index table now reflects the scaffolds. Added "Filling in the scaffolds" instructions.
- 2026-05-31 v1: index initialized; customer pulse files to be added per real customer.
