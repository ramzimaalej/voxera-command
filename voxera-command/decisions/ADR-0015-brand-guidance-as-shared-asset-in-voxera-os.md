---
id: ADR-0015
title: Brand guidance is a shared asset in voxera-os; company facts stay confidential
status: accepted
date: 2026-06-16
supersedes: []
superseded_by: null
affects:
  - ../voxera-os/docs/brand/brand-guidelines.md
  - ../voxera-os/.claude/skills/brand-conformance/
  - docs/operations/company-facts.md
  - ../voxera-website/.claude/agents/brand-voice-reviewer.md
---

## Context

ADR-0014 moved the engineering operating system out of the exec-only `voxera-command` repo so non-execs never need it. The brand guidelines (`brand-guidelines.md`) and the `brand-conformance` lint skill were the remaining engineering/marketing dependency still inside `voxera-command`: the website's `brand-voice-reviewer`, several website rules, and command's own business processes (`iterate-vision`, `iterate-doc`, `weekly-business-review`) all read them. A contractor or non-exec writing or reviewing copy therefore still needed the confidential repo.

Most of the brand doc is non-confidential by nature — it describes how the company presents publicly (voice, Atlas palette, writing rules, honesty stance). One section, "Company facts" (team size, office locations, customer count, funding posture), is internal.

## Decision

Treat brand guidance as a **shared, non-confidential workspace asset** and move it to `voxera-os` (which becomes the "shared workspace OS", not only engineering): `voxera-os/docs/brand/brand-guidelines.md` and `voxera-os/.claude/skills/brand-conformance/`. Every consumer — `voxera-website`, `voxera-sales`, CRM UI-string reviews, and command's business processes — references it from `voxera-os`. Extract the confidential "Company facts" section into `voxera-command/docs/operations/company-facts.md` (exec-only); the brand doc keeps an exec-only pointer in its place.

## Alternatives considered

- **Keep brand in `voxera-command`, treat marketing as exec-tier** — rejected: anyone touching copy would need the confidential repo (financials, customer pulse), exactly what ADR-0014 set out to prevent.
- **Move brand into `voxera-website`** (its primary consumer) — rejected: makes a single product repo the owner of a company-wide asset, and the cross-repo reference from `voxera-sales` and the CRM is awkward. `voxera-os` is the natural shared home (it already holds the cross-repo ADR registry).
- **Duplicate the brand doc into each consuming repo** — rejected: forks the brand; violates the workspace "nothing forks" rule.

## Consequences

- Positive:
  - Copywriters/contractors lint and follow brand without the confidential repo; the last engineering/marketing coupling to `voxera-command` is removed.
  - Single source of truth for brand, referenced by all surfaces.
  - Confidential company composition stays exec-only and has a clear home (`company-facts.md`).
- Negative / risks:
  - `voxera-os` is no longer purely "engineering" — it is now the shared workspace layer. Documented in its `CLAUDE.md`/`README.md`.
  - Command's business processes now reference brand in a sibling repo (`../voxera-os/...`); fine since execs have `voxera-os`, but it's a new cross-repo dependency.
  - `ADR-0012` (Atlas palette) `affects:` and prose reference the brand doc's old path — updated to the new location.
- Follow-ups:
  - Re-point all brand consumers (website agent/rules/skill, command business processes, CLAUDE/README, ADR-0012, settings) — done in this change.
  - When `voxera-sales` is wired (Wave 3), point its brand checks at `voxera-os` too.
