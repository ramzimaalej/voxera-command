---
title: <short feature name>
version: 1
status: draft         # draft | refining | spec_approved | tests_approved | plan_approved | implementing | done | shelved
updated: <YYYY-MM-DD>
owner: you
implements: []        # other FEAT ids this builds on (e.g., [FEAT-001])
adrs: []              # ADRs this depends on (e.g., [ADR-0009])
target: <repo>        # voxera-crm | voxera-website | voxera-infra
priority: medium      # low | medium | high
roadmap: now          # now | next | later
---

# FEAT-XXX: <Title>

## Why

1–3 sentences. The user pain or strategic driver this addresses. Link to the vision / strategy / roadmap item that pulled this in.

## What

The shape of the feature. User-facing behavior, not implementation details (paths, library choices belong in the implementation plan, not here).

- Bullet of the key user actions
- Bullet of the data created / changed
- Bullet of the integrations touched

## Acceptance criteria

Numbered, testable, observable. Each one MUST map to at least one test case in `test-cases.md` (the `fix-bug.js` / `build-feature.js` processes enforce this).

1. Given X, when user does Y, then Z appears within N seconds.
2. ...
3. ...

## Non-goals

What this feature is NOT doing. Prevents scope creep during implementation.

- We are not building <related thing>.
- We are not optimizing <axis>.

## Open questions

Anything you couldn't decide at spec time. Each question has a tentative answer the implementer will use unless escalated.

## Linked

- Related ADRs / FEATs / BUGs
- Pattern docs the implementation should follow

## Changelog

- <YYYY-MM-DD> v1: initial draft.
