# Voxera Workspace

This folder is a multi-repo workspace. Three sibling repos, one shared brain.

| Repo | Role | You run babysitter here to… |
|------|------|------------------------------|
| `voxera-command/` | Source of truth: vision, brand, roadmap, features, bugs, decisions, **all babysitter processes** | iterate on strategy/vision/brand/roadmap |
| `voxera-website/` | Marketing site code | build/iterate the website from specs |
| `voxera-crm/` | CRM product code | build/iterate the CRM from specs |

## Golden rules for any agent working here
1. **Canonical strategy lives in `voxera-command/docs/`. Reference it, never fork it.** If the website or CRM needs a fact about the product, read it from there.
2. **Process definitions live in `voxera-command/.a5c/processes/`.** Code repos invoke them by relative path; do not copy them.
3. **Specs drive work.** A feature is a `FEAT-xxx.md`; a bug is a `BUG-xxx.md`. Implementation runs take a spec path as input.
4. **Real decisions get an ADR** in `voxera-command/decisions/`. Babysitter's run journal is execution history; ADRs are the strategic "why".
5. **Versioning = git.** One canonical file per doc with frontmatter (`version`, `status`, `updated`) + a changelog block. Freeze milestones with annotated tags (e.g. `vision-v2`), not `vision-final-final.md`.

## Typical loops
- **Vision/brand/roadmap:** `cd voxera-command && /babysitter:call iterate the vision doc: <what you want to change>`
- **CRM feature:** `cd voxera-crm && /babysitter:call implement ../voxera-command/docs/product/features/FEAT-007-pipeline-view.md`
- **Website fix:** `cd voxera-website && /babysitter:call fix ../voxera-command/docs/product/bugs/BUG-014-hero-cls.md`
