# Decision log (ADRs) — workspace index

One file per real decision. Decisions are **federated by domain**: each ADR lives in the repo that owns the thing it decides, but **numbers are global, unique, and permanent across the whole workspace**. This file is the cross-repo registry and the number allocator.

## Where an ADR lives

| Decision is about… | Owning repo | Folder |
|---|---|---|
| Company strategy, GTM, brand, vision, workspace governance | `voxera-command` | `decisions/` (here) |
| CRM product / platform — data model, schema, API, agents, voice, execution | `voxera-crm` | `voxera-crm/decisions/` |
| Cloud, infrastructure, networking, IaC | `voxera-infra` | `voxera-infra/decisions/` |
| Marketing-site or sales-site engineering | `voxera-website` / `voxera-sales` | that repo's `decisions/` |

Rule of thumb: **the ADR lives next to the code or docs it constrains.** A decision a contributor needs while editing the CRM should be readable inside `voxera-crm`, not a sibling repo. Strategy/brand/company-wide decisions stay here because no single code repo owns them. See `../.claude/rules/adrs.md` for the full routing rules.

## Numbering — global + permanent

- `ADR-NNNN`, zero-padded to 4 digits. Numbers are **never reused, never renumbered**, even when an ADR is superseded or moves repos.
- To claim the next number, take the highest number **across every repo's `decisions/`** and add 1. From the workspace root:
  ```sh
  ls voxera-command/decisions/ADR-*.md voxera-*/decisions/ADR-*.md 2>/dev/null \
    | grep -oE 'ADR-[0-9]{4}' | sort -V | tail -1
  ```
  Then add the new ADR to the registry table below.
- This index is the source of truth for "which numbers are taken." Keep it current when you add or move an ADR.

## Registry — every ADR across the workspace

| ADR | Title | Owner repo | Status |
|---|---|---|---|
| [ADR-0001](./ADR-0001-three-repo-workspace.md) | Three-repo workspace (command + website + crm) | voxera-command | accepted |
| ADR-0002 | Custom state machine on Postgres, not Temporal/Inngest/Restate | voxera-crm | accepted |
| ADR-0003 | Two-log audit model — outbox + Decision Records | voxera-crm | accepted |
| ADR-0004 | Fixed roster of seven agent roles, no runtime agent creation | voxera-crm | accepted |
| ADR-0005 | Generic internal DSL vocabulary with per-workflow label presets | voxera-crm | accepted |
| ADR-0006 | JSON Forms + Mantine renderer set | voxera-crm | accepted |
| ADR-0007 | Twilio + Ultravox for the v1 voice stack | voxera-crm | accepted |
| [ADR-0008](./ADR-0008-pflegebox-wedge-on-workflow-agnostic-platform.md) | Pflegebox / DACH as v1 wedge on a workflow-agnostic platform | voxera-command | accepted |
| [ADR-0009](./ADR-0009-english-markets-parallel-motion.md) | English-speaking markets GTM in parallel with DACH | voxera-command | accepted |
| ADR-0010 | GCP primary cloud, managed with Fabric modules | voxera-infra | accepted |
| ADR-0011 | Postgres-only outbox implementation | voxera-crm | accepted |
| [ADR-0012](./ADR-0012-retain-atlas-palette-accent-vs-approval-color.md) | Retain Atlas palette; brand accent vs approval color | voxera-command | accepted |
| ADR-0013 | Membership-scoped audit identity; archivedAt soft-delete tombstone | voxera-crm | proposed |

ADRs owned by another repo are listed without a link because relative links across independent git repos break when a repo is checked out standalone. Find them at `<owner-repo>/decisions/ADR-NNNN-*.md`.

## Conventions

- Copy the owning repo's `decisions/_template.md`, increment the number (globally), fill it in.
- Don't delete superseded ADRs — set `status: superseded` and link `superseded_by`. Numbers persist.
- ADRs are the strategic "why". Babysitter's per-run journal (`.a5c/runs/`) is the execution "what". Different layers; keep both.
- When an ADR moves repos, update this registry's **Owner repo** column and fix inbound links.
