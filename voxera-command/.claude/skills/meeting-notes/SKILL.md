---
name: meeting-notes
description: Turn raw meeting notes (dumped from memory or pasted from a transcript) into structured output — decisions, action items, follow-ups, attendees. Use when the user pastes a chunk of meeting content and asks to "structure this" or "extract action items" or "what should I follow up on". Cleanly separates: decisions made (candidates for capture-decision), action items (with owner + due date), open questions (parked), and follow-up commitments to others.
---

# meeting-notes

Structure raw meeting input into the four things that actually matter after a meeting: decisions made, action items, open questions, follow-up commitments.

## When to invoke

The user:
- Pastes raw notes from a meeting (sales call, founder catch-up, customer call, advisor convo)
- Dumps memory after a meeting they didn't take notes in
- Shares a transcript and asks "what should I do with this"

## Inputs

The raw content. May be:
- Bullet-list notes (already partially structured)
- Free-form prose
- Transcript (verbatim back-and-forth)
- Mixed (some notes + some quotes)

Plus optional context:
- Meeting type (1-on-1, customer call, sales call, advisor, board, all-hands)
- Attendees (names + roles)
- Date (defaults to today)

## Workflow

1. **Identify decisions.** Statements like "we'll do X", "let's go with Y", "I'm committing to Z". Each is a candidate for ADR capture via the `capture-decision` skill.
2. **Identify action items.** Anything with an implied owner ("I'll send the contract", "you'll review the spec"). Capture: action, owner, due date (ask if not stated; default to "this week").
3. **Identify open questions.** Things parked, deferred, "we need to think about that".
4. **Identify follow-up commitments to others.** Promises made to people outside the meeting ("I'll get back to Marcus by Friday with the pricing"). These are easy to forget; surface separately.
5. **Output a structured note**, ready to drop into `docs/operations/meetings/` or a Slack thread or just paste into the relevant doc.

## Output format

```markdown
# Meeting notes — <date> — <type> (<attendees>)

## Decisions made
- **<decision>** — context in one line. → ADR candidate (run `capture-decision`).
- ...

## Action items
- [ ] **<owner>**: <action> (due <date>)
- [ ] **<owner>**: <action> (due <date>)

## Open questions
- <question> — to revisit when <trigger>.

## Follow-up commitments (to people outside the meeting)
- **<person>**: <commitment> by <date>.

## Raw notes (optional, for reference)
<the input, lightly cleaned up if it was prose-form>
```

## Discipline

- **Don't fabricate.** If the input doesn't have an owner or due date, ask the user or mark `<owner: ???>` `<due: ???>` rather than guessing.
- **Don't paraphrase decisions** in a way that changes the meaning. A decision should read back the way the decider said it.
- **Don't merge action items** that could be tracked separately. Each one is testable.
- **Suggest `capture-decision`** for anything that looks ADR-shaped, but don't auto-invoke it — the user might want to think more first.
- **For sales / customer calls**, also flag anything that should update a customer pulse file (`customer-pulse-update` skill).

## Where to save

This skill produces the structured output. Saving is the user's call:
- Casual / personal: leave it in chat, copy-paste where needed.
- Permanent / referenceable: save to `docs/operations/meetings/<YYYY-MM-DD>-<short-name>.md`.
- Customer call: also pipe relevant signals to the customer's pulse file via `customer-pulse-update`.
- Strategic discussion: each decision flows into an ADR via `capture-decision`.

## Don't

- Don't include sensitive / off-the-record content if the user said something was off-record.
- Don't share the structured note externally without the user's say-so (this is a CEO's notes).
- Don't write more than the raw notes warranted. Brevity is the value.

## See also

- `capture-decision` (skill) — for ADR-shaped items in the "Decisions made" section.
- `customer-pulse-update` (skill) — for customer-call signals.
- `docs/operations/templates/meeting-notes-template.md` — fillable template if the user wants to start from scratch instead of cleaning up raw input.
