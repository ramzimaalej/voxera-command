---
name: capture-decision
description: Capture a CEO decision from a brief conversation into a draft ADR. Use when the user describes a strategic choice they've made or is about to make ("we're going to do X instead of Y because Z"; "I'm picking A over B"; "we should move from X to Y"). Lighter than the extract-adr skill — that one extracts decisions from an existing long-form spec doc. This one starts from a chat-shape conversation and prompts for the missing pieces (alternatives, consequences, affects) before drafting the ADR.
---

# capture-decision

Turn a brief CEO decision-in-the-moment into a draft ADR with the right shape. For a startup CEO making many calls per week, this is the lowest-friction path between "decided" and "captured."

## When to invoke

The user says something like:
- "I've decided we're going to X."
- "We should switch from Y to Z."
- "I'm picking A — let's lock that in."
- "Let me note: we're not doing B for now because C."
- "Capture this: we're going with the X approach."

OR explicitly: "capture this decision" / "make an ADR for this."

## When NOT to invoke

- The user is still thinking out loud ("maybe we should...", "what if..."). Capture as a memo or note, not an ADR.
- The decision is a policy / convention ("we use TypeScript everywhere"). Goes in CLAUDE.md / rules, not an ADR.
- The decision is implementation detail with no strategic propagation. Goes in the relevant code comment or commit message.
- The "decision" is just a task assignment ("I'll work on X this week"). Goes in a weekly note or task list.

If unsure: ask. "Is this a real decision you want to record as an ADR, or a thought in progress?"

## Workflow

1. **Listen for the three ADR elements.** A real ADR-shaped decision has:
   - Forks in the road (X picked over Y)
   - Forces in tension (constraints, tradeoffs, deadlines)
   - Consequences that propagate (other code / docs / decisions depend on this)

2. **Prompt for what's missing.** Don't fabricate. If the user said the "what" but not the "why" or "alternatives", ask:
   - "What were the main alternatives you considered?"
   - "What's the main driver — cost, speed, optionality, risk?"
   - "What does this affect downstream?" (other docs, features, ADRs)

3. **Hand off to the extract-adr skill** to do the actual file-shape work. That skill handles: numbering (next ADR-XXXX), template usage, frontmatter, backlink to the source doc.

4. **Mark `status: proposed`** unless the user explicitly says it's accepted. Drafts let the user revise before committing.

## Output

A draft ADR file at `decisions/ADR-XXXX-<slug>.md` following the template. Plus a one-line summary back to the user: "Drafted ADR-XXXX: <title>. Status: proposed. Review before locking."

## Conversation example

> User: "OK, locking it in — we're using Cloud SQL for prod Postgres, not Neon. Neon's branching is great but the dev-prod parity risk on a regulated dataset isn't worth it. Document that."

> Skill: "Got it. Three things to confirm before drafting:
> 1. The main alternative you rejected — Neon — was rejected for **dev-prod parity on regulated data**. Anything else weighing in? (Cost, vendor risk, EU residency?)
> 2. What does this affect? (`voxera-infra/environments/dev/main.tf`, the commented `cloudsql-instance` stub I assume; anything else?)
> 3. Is this a strict "Cloud SQL only" decision, or "Cloud SQL for prod; dev choice deferred"?"

> User: "Cost was similar enough to not matter. EU residency was the other big one — Cloud SQL has Frankfurt; Neon's EU regions were limited at the time. Affects the dev main.tf and any future prod env. And yes, Cloud SQL for ALL environments — even dev. Parity over cheap."

> Skill: [drafts ADR-0011-cloud-sql-postgres-all-envs.md with: context (dev-prod parity for regulated data, EU residency requirement), decision (Cloud SQL for all environments, including dev), alternatives (Neon — rejected for parity risk + limited EU regions; Supabase — not considered), consequences (dev cost adds ~$10/mo for db-f1-micro vs free Neon tier, simpler infra, EU compliance straightforward), affects (`voxera-infra/environments/*/main.tf`, ADR-0008 platform claim)] "Drafted ADR-0011: Cloud SQL for Postgres across all environments. Status: proposed. Review at `decisions/ADR-0011-cloud-sql-postgres-all-envs.md`."

## Don't

- Don't write an ADR for a thought-in-progress. Ask first.
- Don't fabricate alternatives or consequences. If the user didn't mention them, ask.
- Don't promote to `status: accepted` without explicit user confirmation.
- Don't skip backlinking from the affected docs — if the user named a doc the decision affects, add the backlink per the `extract-adr` skill's workflow.

## See also

- `extract-adr` (skill) — for extracting decisions from existing long-form spec docs.
- `.claude/rules/adrs.md` — ADR discipline (numbering, status semantics, structure).
- `decisions/_template.md` — the template ADR.
