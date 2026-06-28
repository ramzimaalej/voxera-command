---
title: Customers
version: 5
status: active
updated: 2026-06-27
owner: you
---

# Customers

One file per customer (active, churned, paused, or pre-customer). Filename: `<customer-slug>.md` (kebab-case, matches the `slug` frontmatter field).

Voxera has **1 active paying customer (private beta)** as of 2026-06-27: **lifeo** (DACH, Hausnotruf, €80/confirmed) — the only live payer and the spine of the go-forward model. The June "Customer XY replaces both payers" transition did **not** hold; the real picture:

- **lifeo** — active, `yellow`. Pays €80 per confirmed Hausnotruf. Continuation is *implicit* (no termination letter, but no written reconfirmation either). With **Pflegebox sunsetting (end-2027)**, Hausnotruf is the durable line — which makes lifeo the revenue spine, not a "second vertical."
- **Kurapacket** (Pflegebox) — **churned**, loss confirmed 2026-06-13, `red`. The Pflegebox line now has **no active payer**.
- **Customer XY** — **pre-customer, in active negotiation** (unsigned). Three structures on the table: per-confirmed (€100 Pflegebox / €110 Hausnotruf), per-signed (€50/signed, either line), or per-qualified-lead (€7.50). The earlier "signed, live 2026-06-08" framing was premature — XY never signed.
- **DVP** — **pre-customer**, offered €90/confirmed Pflegebox (2026-06-24); would re-activate the orphaned Pflegebox line. Bridge only — Pflegebox sunsets end-2027.

Unit economics + all pricing scenarios are tracked in [`../revenue-model.md`](../revenue-model.md). _(Note: `../strategy/strategy.md` still frames v1 as "Pflegebox, two paying customers" — stale on count, vertical, and payer; flagged for an iterate-doc fix.)_

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
| lifeo | [lifeo](./lifeo.md) | active | yellow | dach | [TBD] | commission (€80/confirmed Hausnotruf) | **Only live payer; spine of the go-forward model.** Continuation implicit (unwritten). |
| Kurapacket | [kurapacket](./kurapacket.md) | churned | red | dach | [TBD] | commission (€80/confirmed) | Loss confirmed 2026-06-13. Pflegebox line now has **no active payer**. |
| Customer XY | [customer-xy](./customer-xy.md) | pre-customer | unknown | dach | [TBD] | commission — in negotiation (unsigned) | €100 PB / €110 HN per-confirmed, or €50/signed, or €7.50/qualified lead. Real name TBD. |
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
- 2026-06-27 v5: refreshed intro + index to match the corrected pulse files. The 2026-06-06 "XY replaces both payers, live 06-08" framing never held: **lifeo reverted to active** (the only live payer, €80/confirmed Hausnotruf, the go-forward spine), **Kurapacket churned/red** (Pflegebox now has no payer), **XY is pre-customer in negotiation** (unsigned; €100/€110 per-confirmed, €50/signed, or €7.50/lead on the table), **DVP** added as a pre-customer €90 Pflegebox offer. Noted the Pflegebox sunset (end-2027).
- 2026-06-06 v4: customer transition — Kurapacket + lifeo churned (contracts closed); new customer **Customer XY** added, replacing both from 2026-06-08 at higher rates (€90 Pflegebox / €95 Hausnotruf). Active count is now 1. Added link to the new revenue model.
- 2026-06-05 v3: filled in the two DACH payer scaffolds — `pflegebox-payer-1` → **kurapacket** (Pflegebox), `pflegebox-payer-2` → **lifeo** (Hausnotruf, corrected from Pflegebox). Both: €80/confirmed-customer commission, ~3,500 calls/day → ~25 qualified/day, Ahmed Abida as champion, health green. Corrected customer count to **2** (Kurapacket + lifeo) and removed the phantom third-customer scaffold (`customer-3.md`). Index + intro + "how to add a customer" updated.
- 2026-05-31 v2: scaffolded the 3 known customer files (2 Pflegebox payers + 1 third customer; motions identified for the 2 Pflegebox payers, motion-TBD for #3). Index table now reflects the scaffolds. Added "Filling in the scaffolds" instructions.
- 2026-05-31 v1: index initialized; customer pulse files to be added per real customer.
