# ADR rules — decision log discipline

ADRs are the strategic "why". Babysitter's run journal (`.a5c/runs/`) is the execution "what". Different layers, both kept.

The deep workflow is in `.claude/skills/extract-adr/SKILL.md`. This file is the invariants.

## When to write an ADR

Write an ADR when the change has all three:

1. **Forks in the road.** At least one alternative was actually considered and rejected (not "we couldn't think of another way").
2. **Consequences propagate.** Other code, docs, or future decisions depend on this one.
3. **Future-you would ask "why"?** If a contributor 6 months from now can't reconstruct the reasoning by reading the code + commit message, an ADR is warranted.

Don't write an ADR for:
- Policy or convention statements ("we use TypeScript everywhere") — those are CLAUDE.md / rules material.
- Aspirations or todos ("we should look into X").
- Things that are obviously the only choice.
- Implementation details that don't constrain future decisions.

When unsure: don't. ADR-bloat dilutes the signal. The next reader skims fewer ADRs more carefully than many.

## Numbering

- ADR-0001, ADR-0002, ... — zero-padded to 4 digits.
- Numbers are **permanent**. Never renumber. Numbers are not revocable even if the ADR is superseded.
- Next number: `ls decisions/ADR-*.md | sort -V | tail -1` + 1.

## File naming

`decisions/ADR-<NNNN>-<kebab-slug>.md`

The slug should be short + descriptive (4-8 words). It describes the *decision*, not the topic. Good: `ADR-0007-twilio-ultravox-voice-stack.md`. Bad: `ADR-0007-voice-stuff.md`.

## Required structure

Use `decisions/_template.md` as the starting point. Every ADR has:

```markdown
---
id: ADR-XXXX
title: <one-line decision statement>
status: proposed | accepted | superseded | deprecated
date: <YYYY-MM-DD>
supersedes: []           # e.g. [ADR-0003]
superseded_by: null      # e.g. ADR-0011
affects:                 # docs / specs / code paths this decision touches
  - docs/architecture/...
  - apps/backend/src/...
---

## Context
The forces in tension. Constraints, deadlines, tradeoffs. 1-2 short paragraphs.

## Decision
What we're doing, stated plainly. One paragraph max.

## Alternatives considered
- **Option A** — why not, briefly.
- **Option B** — why not, briefly.

## Consequences
- Positive:
  - ...
- Negative / risks:
  - ...
- Follow-ups (link FEAT/BUG ids):
  - ...
```

All four body sections required. If "alternatives considered" is genuinely empty (rare), state "none documented" — don't fabricate.

## Status semantics

- **proposed** — written, not yet committed to. Use during discussion.
- **accepted** — the decision we're operating under.
- **superseded** — replaced by another ADR. Don't delete; set `status: superseded` and `superseded_by: ADR-XXXX`.
- **deprecated** — no longer relevant (e.g., the technology was removed). Don't delete; set `status: deprecated`.

Superseded and deprecated ADRs stay readable forever. They're part of the history.

## Cross-linking

- **ADR → docs**: list affected docs in `affects:` frontmatter (the reverse link).
- **Docs → ADR**: add a one-line italic blockquote in the source doc right after the section describing the decision:
  ```markdown
  > *Decision recorded as [ADR-XXXX: title](../../decisions/ADR-XXXX-slug.md).*
  ```
- **ADR → ADR**: use `[[ADR-XXXX]]` inline in the body when one ADR depends on or contrasts with another. (The link syntax is informal; the `affects:` and `supersedes:` frontmatter is the formal graph.)

## Extraction workflow (existing decision in a spec)

Use the `extract-adr` skill. The skill encodes:
1. Confirm it's ADR-shaped (the three criteria above).
2. Pick the next number.
3. Copy `_template.md` to `ADR-XXXX-<slug>.md`. Fill it in.
4. Add a backlink in the source doc.
5. Verify links resolve.

The `iterate-vision.js` babysitter process also detects strategic decisions and offers ADR capture as a final phase — accept when offered for substantive decisions.

## Maintenance

- When an ADR is superseded: set its status + add `superseded_by:`. Add a one-line note at the top of the body pointing to the successor ("See ADR-XXXX for the current decision."). Don't rewrite the original.
- When code referenced in `affects:` moves: update the path.
- When an ADR turns out to be wrong (not superseded — *wrong*): write a new ADR explaining the lesson, and mark the original `status: deprecated` with a one-line note.

## Don't

- Don't write an ADR after-the-fact for a routine implementation choice. The spec + code is enough.
- Don't bundle multiple decisions in one ADR. One decision per ADR. If it splits naturally into 3, write 3.
- Don't write a long-form essay. ADRs are 30-80 lines. Long rationale belongs in the source spec doc; the ADR captures the decision skeleton.
- Don't delete an ADR. Status changes only.
- Don't reuse a number after deleting a stale draft. Numbers are permanent the moment they're claimed.
