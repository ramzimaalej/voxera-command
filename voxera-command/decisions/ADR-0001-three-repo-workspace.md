---
id: ADR-0001
title: Three-repo workspace (command + website + crm)
status: accepted
date: 2026-05-27
supersedes: []
superseded_by: null
affects:
  - CLAUDE.md
  - docs/
---

## Context
Two products (website, CRM) share one strategy (vision, brand, roadmap). Strategy must not live inside either product repo (it would fork), nor be duplicated. We use the babysitter Claude Code plugin, which keeps run state and process definitions under `.a5c/` per workspace.

## Decision
Use three sibling repos: `voxera-command` as the single source of truth for strategy, decisions, and all babysitter process definitions; `voxera-website` and `voxera-crm` for code. Code repos reference command-repo specs and processes by relative path.

## Alternatives considered
- **Monorepo** — simplest tooling, but couples website and CRM deploys and bloats one history. Rejected.
- **Docs inside each code repo** — strategy forks immediately. Rejected.

## Consequences
- Positive: one canonical vision/roadmap; DRY processes; clean per-product git history and deploys.
- Negative: contributors must keep three repos checked out as siblings; cross-repo relative paths must stay stable.
- Follow-ups: keep the workspace `CLAUDE.md` map current.
