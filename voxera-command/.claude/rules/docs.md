# Docs rules — frontmatter, versioning, changelog

Every versioned doc under `docs/**` follows the same lifecycle. This is the spine of the repo — if these break, the iterate-vision / iterate-doc processes break, and cross-doc backlinks rot.

## Frontmatter — required on every doc under `docs/**`

```yaml
---
title: <Display title>
version: <integer>
status: draft | active | superseded
updated: <YYYY-MM-DD>
owner: <name or role>
---
```

- `version` starts at `1`. Increment by 1 on every **substantive** edit. Cosmetic edits (typo, link fix, formatting) do NOT bump version.
- `status` transitions: `draft` → `active` → (eventually) `superseded`. Don't skip `active`. A `superseded` doc keeps its content and adds a `superseded_by:` field pointing at the replacement.
- `updated` is ISO date, no time. Today's date on every bump.
- `owner` is who the change should be reviewed with. Default `you` if the user owns the doc.

## Changelog — every doc ends with one

```markdown
## Changelog
- 2026-05-31 v2: short description of what changed, focusing on *why*.
- 2026-05-27 v1: initial draft.
```

- Reverse-chronological (newest first).
- One bullet per version. Match the bullet's version number to the frontmatter's version.
- Describe the *why*, not the *what* (the diff already shows the what).
- Cosmetic edits without a version bump: do NOT add a changelog line. They land via `git log` alone.

## Substantive vs cosmetic

| Substantive (bump + changelog) | Cosmetic (no bump) |
|---|---|
| New section, removed section, rewritten section | Typo, grammar fix |
| Changed claim, statistic, or commitment | Broken link repair |
| Added/removed acceptance criterion in a spec | Renamed file (handled by `git mv`) |
| Changed brand rule, voice attribute, color | Markdown formatting only |
| Updated cross-references after a related doc moved | Whitespace |

When in doubt: substantive.

## Cross-doc links

- Reference other docs by relative path: `[strategy](../strategy/strategy.md)`.
- ADRs: `[ADR-0008: Pflegebox wedge](../../decisions/ADR-0008-pflegebox-wedge-on-workflow-agnostic-platform.md)`.
- Backlinks: when a decision is recorded as an ADR, add a one-line italic blockquote in the source doc right after the relevant section:
  ```markdown
  > *Decision recorded as [ADR-XXXX: title](../../decisions/ADR-XXXX-slug.md).*
  ```
- When a doc moves or splits, update inbound references. The `find` + `perl -pi -e` pattern works for renames; check with `grep -rn '<old-name>' docs/` before committing.

## File naming

- Slugified kebab-case: `vision.md`, `brand-guidelines.md`, `pricing-positioning.md`.
- No version suffixes in filenames (`vision-v2.md` is wrong — the version lives in frontmatter). Milestones get an annotated git tag (`git tag -a vision-v2`) instead.
- One canonical doc per topic. Don't fork `vision-final.md`, `vision-final-final.md`.

## Folder organization

| Folder | Purpose |
|---|---|
| `docs/vision/` | North star, ICP, positioning. |
| `docs/strategy/` | Wedge, bet, moat, milestones. |
| `docs/product/roadmap.md` | Now / next / later. Single file. |
| `docs/product/features/` | `FEAT-xxx-<slug>.md` specs. |
| `docs/product/bugs/` | `BUG-xxx-<slug>.md` reports. |
| `docs/website/` | Website-specific plans (IA, content, etc.). |
| `docs/operations/` | CEO ops — weekly reviews, customer pulse, meeting notes. |
| `decisions/` | Company-level ADRs (strategy/brand/vision/governance). Numbered, never renumbered. |

Product/platform architecture lives **with the code that owns it**, not here:

| Doc | Now lives in |
|---|---|
| Brand guidelines (`brand/` — voice, visual identity, writing rules) | `voxera-os/docs/brand/` |
| CRM platform architecture (`architecture/`) + cross-cutting technical notes (`implementation/`) | `voxera-crm/docs/` |
| Marketing-site specifics (`marketing/`) | `voxera-website/docs/marketing/` |
| Infra docs | `voxera-infra/` |
| Product/technical ADRs | the owning code repo's `decisions/` (see `decisions/README.md`) |

## Editing workflow

Two paths, depending on weight:

- **Light edit** (one section, no brand implications): `/babysitter:call --process .a5c/processes/iterate-doc.js#process --inputs '{"docPath":"...","change":"..."}'`. Three phases: plan, review, apply.
- **Strategic edit** (vision/brand/roadmap): `/babysitter:call iterate <doc>: <change>` → `iterate-vision.js`. Adds consistency + brand-voice quality gate, optional ADR capture if a strategic decision is detected.

Both processes do the frontmatter bump + changelog append for you. If you're editing by hand, do them by hand.

## Don't

- Don't bump `version` without a changelog line, or vice versa.
- Don't change the `created` date (none exists in our frontmatter; if you add one in the future, never modify it).
- Don't fork a doc into two parallel versions. Either supersede one (set `status: superseded` + `superseded_by`) or merge.
- Don't add a doc to `docs/` without frontmatter + a Changelog section. The iterate processes assume both exist.
- Don't reorganize folders without updating cross-references. The `extract-adr` skill's backlink format and `iterate-vision.js` both assume relative paths stay valid.
