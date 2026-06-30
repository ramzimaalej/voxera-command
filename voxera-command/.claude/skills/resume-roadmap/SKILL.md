---
name: resume-roadmap
description: Resume executing the product roadmap — read the roadmap execution registry, pick the next unblocked item, and invoke the right babysitter workflow for it. Use when the user says "resume the roadmap", "continue the roadmap implementation", "execute/advance the roadmap", "what's next on the roadmap and run it", or "kick off the next bet". Selects the next move deterministically from dependencies + status, proposes the exact command, then runs it on a go-ahead.
---

# resume-roadmap

Turn "resume the roadmap" into the **one correct babysitter command**, run from the **one correct repo**. This skill is the executor for [`docs/product/roadmap-execution-registry.md`](../../docs/product/roadmap-execution-registry.md); that registry is the source of truth for *which* command maps to *which* roadmap item. This skill is the *behavior* that reads it and acts.

## When to invoke

- "Resume / continue / advance / execute the roadmap."
- "What's next on the roadmap — and start it."
- "Kick off the next bet / the next feature."
- After a roadmap run merges, to move to the newly-unblocked item.

Not for *planning* which work matters (that's `priorities-coach`) — this skill assumes the roadmap order and just executes the next ready item.

## Inputs you read (never guess — read the files)

1. `docs/product/roadmap-execution-registry.md` — the ordered map + workflow templates + status vocabulary.
2. `docs/product/roadmap.md` — bet text, horizons, checkboxes, dependency prose.
3. `docs/product/gap-analysis-crm-to-product.md` — the `GAP-xx` detail to compose a CRM `featureDescription`.
4. For any item with a feature folder: `../voxera-crm/features/<id>/status.json` (CRM phase) or `../voxera-website/features/<id>/spec.md` frontmatter (`status:`).

## Procedure

1. **Compute state.** For every registry row, resolve its live Status (read the feature folder if one exists) and mark `BLOCKED` if any dependency isn't `DONE`. Dependencies and order come from the registry; never invent them.
2. **Select the next move.** Highest-priority item that is **not `DONE`** with **all dependencies `DONE`**: Now → Next → Later; lower Order first; an `IN-SDLC` item outranks a `NOT-STARTED` one. The CRM spine and the website motion are **parallel tracks** — if both have a ready item, present the top of each and let the user pick (default: the CRM spine, since the year hangs off it).
3. **Build the command.** Look up the row's **Workflow** template in the registry and fill its args:
   - **CRM-BUILD** (fresh bet) → compose a tight, self-contained `featureDescription` from the bet's `roadmap.md` line + its `GAP-xx` objectives. **Confidentiality:** the description must stand alone; never tell the engineering process to read `voxera-command`.
   - **CRM-RESUME** (folder exists) → read `status.json`, choose the SDLC skill for that phase (`DRAFT`→`refine-feature-spec` … `VERIFYING`→`verify-feature`).
   - **WEB-BUILD / WEB-DESIGN / CRM-FIX / CRM-DEBT / HARVEST** → fill from the row.
4. **Propose, then run.** Show the user: the selected item, a one-line *why this one* (the dependency/horizon reason), and the **exact command** you will run. On a go-ahead, `cd` into the target repo and invoke it. If the user said "just run it" / "don't ask", skip the confirm — the babysitter run still has its own human gates (and CRM writes no production code before `PLAN_APPROVED`).
5. **Close the loop (when a run finishes).** Tick the `roadmap.md` checkbox, set the registry row's Status to `DONE` (bump version + Changelog per `docs.md`), and run **HARVEST**. Then offer the next `resume`.

## Guardrails

- **Dependency-safe:** never launch an item whose dependencies aren't `DONE` — re-derive `BLOCKED` every run from the registry, don't trust a stale label.
- **One move at a time:** select and launch the single next ready item; don't auto-chain multiple bets unattended. Each bet is a big-batch effort with internal breakpoints.
- **Right process per repo:** CRM → its local gate-aware `*.process.js`; sites → the voxera-os baseline by relative path. Never copy a process.
- **Confidentiality (ADR-0014/0015):** you (exec context) read the confidential roadmap; you pass a self-contained input *down* to the engineering process. The engineering process never reads up into `voxera-command`.
- **Registry is truth:** if `roadmap.md` and the registry disagree (e.g. a new bet added but not registered), reconcile the registry first, then execute.

## Example

> **User:** resume the roadmap
>
> **You:** Next ready move is **B0 — Robust authorization layer** (CRM spine, Now): it's `IN-SDLC:VERIFYING`, and B1/B2/B3/B7 all depend on it, so finishing it unblocks the year. On the parallel website track, **FEAT-001** is also ready (no deps). I'll resume B0 first:
>
> ```
> cd voxera-crm && /verify-feature 20260624-robust-authz-layer
> ```
>
> On B0 DONE I'll tick the roadmap, mark it DONE in the registry, harvest it, and B1 becomes the next CRM-BUILD. Run it?
