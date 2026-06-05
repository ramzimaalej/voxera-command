# Specs rules — FEAT-xxx and BUG-xxx

Specs are the contract between strategy and implementation. The `implement-feature.js` and `fix-bug.js` babysitter processes expect specific shapes — don't deviate.

## File naming + numbering

- Features: `docs/product/features/FEAT-<NNN>-<slug>.md`. Numbers are zero-padded to 3 digits (FEAT-001, FEAT-007, FEAT-042).
- Bugs: `docs/product/bugs/BUG-<NNN>-<slug>.md`. Same padding.
- Numbers are **permanent**. Never renumber. Skipped numbers (e.g., a deleted FEAT-005) stay skipped; the gap is the record.
- Next number: highest existing + 1. `ls docs/product/features/FEAT-*.md | tail -1` then increment.

## Required sections for a FEAT-xxx

```markdown
---
title: <Short feature name>
version: 1
status: draft        # draft | refining | spec_approved | tests_approved | plan_approved | implementing | done | shelved
updated: 2026-05-31
owner: you
implements: []       # roadmap items: ["q2-pipeline-v2"], optional
adrs: []             # ADRs this feature depends on: ["ADR-0007"], optional
---

# FEAT-<NNN>: <Title>

## Why
1-3 sentences. The user pain or strategic driver this addresses.
Link to the vision/strategy/roadmap item that pulled this in.

## What
The shape of the feature. User-facing behavior, not implementation.
- Bullet of the key user actions
- Bullet of the data created/changed
- Bullet of the integrations touched

## Acceptance criteria
Numbered, testable, observable. Each one MUST map to at least one test case.
1. Given X, when user does Y, then Z appears within N seconds.
2. ...
3. ...

## Non-goals
What this feature is NOT doing. Prevents scope creep during implementation.
- We are not building <related thing>.
- We are not optimizing <axis>.

## Open questions
Anything you couldn't decide at spec time. Each question has a tentative answer the implementer will use unless escalated.

## Changelog
- 2026-05-31 v1: initial draft.
```

The `acceptance criteria` section is the contract — `implement-feature.js` maps every criterion to a test in its planning phase.

## Required sections for a BUG-xxx

```markdown
---
title: <Short bug name>
version: 1
status: reported     # reported | reproducing | fixing | fixed | wontfix
updated: 2026-05-31
owner: you
affected_repos: []   # ["voxera-crm", "voxera-website"]
severity: low | medium | high | critical
first_seen: <YYYY-MM-DD>
---

# BUG-<NNN>: <Title>

## What's broken
Plain description of the wrong behavior.

## What should happen
The correct behavior.

## Reproduction steps
1. Step one
2. Step two
3. ...

## Regression test to add
The shape of the test that should fail today and pass after the fix.
This is the CONTRACT for fix-bug.js — write it concretely.

```ts
// e.g., apps/backend/src/app/contact/__tests__/contact.service.spec.ts
it('should reject contact creation with invalid email', async () => {
  // ...
});
```

## Root cause hypothesis
Best guess if known. Helpful for the fix, not required.

## Changelog
- 2026-05-31 v1: reported.
```

The `Regression test to add` section is the contract — `fix-bug.js` writes that test first, confirms it fails, then implements the fix.

## Status lifecycle

### FEAT lifecycle
- `draft` → spec exists but not yet refined
- `refining` → being edited via `/refine-feature-spec` (crm) or iterate-doc (others)
- `spec_approved` → spec locked; test cases next
- `tests_approved` → test cases locked; plan next
- `plan_approved` → implementation can begin (voxera-crm enforces this gate)
- `implementing` → babysitter run in progress
- `done` → merged + verified
- `shelved` → put on hold; document why in changelog

### BUG lifecycle
- `reported` → spec exists
- `reproducing` → reproduction confirmed; regression test being written
- `fixing` → fix in progress
- `fixed` → merged + verified
- `wontfix` → closed without fix; document why

The babysitter processes update `status` automatically in their final phases. If editing by hand, update both `status` and `updated` + bump `version` + add a Changelog line.

## Linking

- A FEAT references the ADRs it depends on (`adrs:` in frontmatter).
- An ADR's `affects:` lists the specs/docs that depend on it.
- A roadmap item links to its FEAT (`docs/product/roadmap.md` references `FEAT-007` by ID).
- A bug's `affected_repos:` enumerates the code repos that need the fix.

## Don't

- Don't write a FEAT without acceptance criteria. "It should work better" is not a spec.
- Don't write a BUG without a reproduction. "Sometimes it crashes" → close as needs-repro until you have one.
- Don't merge implementation while the spec is still `draft` or `refining` — voxera-crm enforces this; the other repos rely on the discipline.
- Don't mutate acceptance criteria mid-implementation. If a criterion is wrong, bump the spec version + add a Changelog line + restart the relevant phase.
- Don't put implementation details in a FEAT (file paths, library choices). Those live in the implementation plan generated from the spec.
