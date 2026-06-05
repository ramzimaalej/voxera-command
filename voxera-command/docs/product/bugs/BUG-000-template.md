---
title: <short bug title>
version: 1
status: reported          # reported | reproducing | fixing | fixed | wontfix
updated: <YYYY-MM-DD>
owner: you
affected_repos: []        # ["voxera-crm"], ["voxera-website"], or both
severity: medium          # low | medium | high | critical
first_seen: <YYYY-MM-DD>
---

# BUG-XXX: <Title>

## What's broken

Plain description of the wrong behavior. Be specific — paths, line numbers, error messages.

## What should happen

The correct behavior. If the fix is obvious, sketch it.

## Reproduction steps

1. Step one
2. Step two
3. ...

(If reproduction requires specific environment / data, document that too.)

## Regression test to add

The shape of the test that should fail today and pass after the fix. This is the **contract** that `fix-bug.js` writes first, before any implementation work.

```ts
// e.g., apps/backend/src/app/<module>/__tests__/<file>.spec.ts
it('<scenario>', async () => {
  // ...
});
```

## Root cause hypothesis

Best guess if known. Helpful for the fix, not required.

## Linked

- Pattern doc: `<path>` (if the bug exposes a pattern violation)
- Rule: `<path>` (if the bug should harden a rule)
- Related ADR: `<id>` (if behavior change might warrant a decision)

## Changelog

- <YYYY-MM-DD> v1: reported.
