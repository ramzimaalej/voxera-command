---
id: ADR-0004
title: Fixed roster of seven agent roles, no runtime agent creation
status: accepted
date: 2026-05-31
supersedes: []
superseded_by: null
affects:
  - docs/architecture/multi-agent-architecture.md
  - docs/architecture/architecture-vision-and-principles.md
---

## Context

An "AI-native CRM" invites two opposite designs:
1. A **marketplace** of community-built agents — each workspace assembles a custom roster. Maximally flexible, maximally unpredictable, maximally hard to evaluate.
2. A **fixed code-defined roster** — the surface area is testable, the Critic can evaluate against known role contracts, behavior is reasoned about end-to-end.

The product bets on predictability through Business Context quality (P1), not agent cleverness. That bet only pays off if the agents are interpreters of a structured artifact, not improvisers — and that only works if the role contracts are fixed.

## Decision

Seven roles, defined in code:

1. **Orchestrator (Brain)** — selects and parameterizes per-workspace agents from the Business Context.
2. **Context Copilot** — proposes Business Context edits.
3. **Configurator** — proposes DSL changes (workflows, custom objects, agents, reports).
4. **Operator** (templated) — runs workspace work: outbound qualification, inbound triage, voice-calling Operators, etc.
5. **Critic** — observes interactions, proposes prompt deltas and rubric changes; never modifies production prompts.
6. **Promoter** — human in v1; reviews Critic proposals with full context and decides what ships.
7. **Reporter** — translates natural-language report intent into versioned report definitions.

The Brain selects which roles to instantiate per workspace and parameterizes them from the Business Context. It does not invent new agent kinds at runtime. Adding a new role requires a code change + an ADR.

## Alternatives considered

- **Agent marketplace** — flexible but breaks the predictability bet (P1, P3), makes the Critic untrustworthy (no contract to score against), and forces the Promoter to evaluate strangers. Rejected.
- **Per-workspace agent definitions in DSL** — a softer version of the marketplace. Still loses the testable surface; configuration drift becomes the product's failure mode.
- **Smaller roster (e.g., merge Critic + Promoter)** — collapses the proposal/decision separation that P9 depends on. Rejected.

## Consequences

- Positive:
  - Surface area is testable end-to-end; the Critic operates against known role contracts.
  - User-facing narrative can still be "the Brain delegates to specialists" — the abstraction is honest because the roles are real and bounded.
  - Adding a role is a deliberate strategic event (code + ADR), which forces us to keep the roster small.
- Negative / risks:
  - Verticals with genuinely novel agent needs may strain the roster; we either templatize the Operator further or add a role.
  - "Operator is templated" carries most of the per-workspace variation — that template must stay clean.
- Follow-ups:
  - Document each role's contract (inputs, outputs, Decision Record shape) in `multi-agent-architecture.md`.
  - Re-evaluate roster scope after the third Pflegebox-adjacent vertical ships.
