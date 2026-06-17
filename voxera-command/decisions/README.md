# Decision log (ADRs) — company-level + routing

One file per real decision. Decisions are **federated by domain**: each ADR lives in the repo that owns the thing it decides, but **numbers are global, unique, and permanent across the whole workspace**.

> **Number allocator moved.** The workspace-wide ADR number allocator + full cross-repo registry now lives in **`../../voxera-os/decisions/ADR-REGISTRY.md`** (engineer-accessible, per `ADR-0014`) — `voxera-command` is exec-only, so the allocator can't live here or non-execs couldn't claim numbers. This folder holds the **company-level** ADR files (strategy / GTM / brand / vision / governance); the table below is just those, for convenience. The registry in `voxera-os` is the source of truth for which numbers are taken.

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
- **Claim the next number from `../../voxera-os/decisions/ADR-REGISTRY.md`** (highest in that table + 1), then add your row there. Don't glob the filesystem — non-execs can't read `voxera-command/decisions/`, so a glob would miss company ADRs and risk a collision; the `voxera-os` registry is the authoritative list of taken numbers.

## Company-level ADRs in this folder

These are the strategy / GTM / brand / vision / governance ADRs owned by `voxera-command`. The full cross-repo registry is in `voxera-os`.

| ADR | Title | Status |
|---|---|---|
| [ADR-0001](./ADR-0001-three-repo-workspace.md) | Three-repo workspace (command + website + crm) | accepted |
| [ADR-0008](./ADR-0008-pflegebox-wedge-on-workflow-agnostic-platform.md) | Pflegebox / DACH as v1 wedge on a workflow-agnostic platform | accepted |
| [ADR-0009](./ADR-0009-english-markets-parallel-motion.md) | English-speaking markets GTM in parallel with DACH | accepted |
| [ADR-0012](./ADR-0012-retain-atlas-palette-accent-vs-approval-color.md) | Retain Atlas palette; brand accent vs approval color | accepted |
| [ADR-0014](./ADR-0014-split-engineering-os-from-confidential-command-repo.md) | Split the engineering OS into voxera-os; keep voxera-command exec-only | accepted |
| [ADR-0015](./ADR-0015-brand-guidance-as-shared-asset-in-voxera-os.md) | Brand guidance is a shared asset in voxera-os; company facts stay confidential | accepted |

Product/technical ADRs (CRM, infra, web) live in their owning repo's `decisions/` and are indexed in the `voxera-os` registry.

## Conventions

- Copy the owning repo's `decisions/_template.md`, increment the number (globally), fill it in.
- Don't delete superseded ADRs — set `status: superseded` and link `superseded_by`. Numbers persist.
- ADRs are the strategic "why". Babysitter's per-run journal (`.a5c/runs/`) is the execution "what". Different layers; keep both.
- When an ADR moves repos, update this registry's **Owner repo** column and fix inbound links.
