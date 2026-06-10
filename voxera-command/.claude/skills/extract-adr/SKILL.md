---
name: extract-adr
description: Extract architectural decisions from spec / strategy / architecture docs into new ADR files under `decisions/`, using the project template. Use when reading a doc that contains a load-bearing decision ("we built X over Y because Z", "we picked A not B for these reasons") and that decision is not yet recorded as an ADR. Identifies the decision, drafts ADR-XXXX in the standard template, adds a backlink from the source doc.
---

# extract-adr

Turn an implicit decision in a spec doc into a first-class ADR in `voxera-command/decisions/`.

## When to invoke

- Reading a doc and you spot a "decided X over Y because Z" passage with concrete alternatives and consequences.
- The decision is load-bearing (other parts of the system depend on it).
- No existing ADR covers it — check `decisions/ADR-*.md` titles + `affects:` frontmatter first.

If the decision is small or hasn't been made yet, **don't** extract. ADRs are for real decisions, not aspirations or todos.

## Steps

1. **Confirm decision shape.** A real ADR-candidate has: (a) a context with forces in tension, (b) at least one alternative actually considered and rejected, (c) consequences that propagate to other docs/code.
1b. **Route by domain.** The decision log is federated (see `decisions/README.md`). A **company** decision (strategy/brand/vision/governance) is extracted into this repo's `decisions/`. A **CRM product/technical** decision belongs in `voxera-crm/decisions/` (use voxera-crm's `extract-adr` skill); an **infra** decision in `voxera-infra/decisions/`. Extract the ADR into the owning repo so it sits next to the code/docs it constrains.
2. **Pick the next ADR number — global.** Numbers are unique across the whole workspace. Take the highest across **all** repos + 1: `ls voxera-command/decisions/ADR-*.md voxera-*/decisions/ADR-*.md 2>/dev/null | grep -oE 'ADR-[0-9]{4}' | sort -V | tail -1`. Then add the new ADR's row to the registry in `voxera-command/decisions/README.md`.
3. **Draft from the template.** Copy the owning repo's `decisions/_template.md` to `decisions/ADR-XXXX-<slug>.md`. Fill in:
   - `id`, `title`, `status: accepted` (or `proposed` if not yet committed), today's date
   - `affects:` list of doc paths touched by the decision
   - **Context** — the forces in tension, in 1–2 short paragraphs
   - **Decision** — what we're doing, plainly
   - **Alternatives considered** — list, with one-line "why not" per alternative
   - **Consequences** — positive, negative/risks, follow-ups (link FEAT/BUG ids when relevant)
4. **Cross-link related ADRs** with `[[ADR-XXXX]]` syntax in the body. The `affects:` frontmatter is the reverse link.
5. **Add a backlink from the source doc.** Right after the prose where the decision is described, add:
   ```markdown
   > *Decision recorded as [ADR-XXXX: title](../../decisions/ADR-XXXX-slug.md).*
   ```
   (Relative path depends on the source doc's location. From `docs/architecture/` or `docs/strategy/` it's `../../decisions/`.)
6. **Verify the link works** — open both files, confirm the slugs match.

## Voxera ADR conventions

- Numbers are permanent. Never renumber.
- Superseded ADRs: set `status: superseded`, add `superseded_by: ADR-YYYY`. Do not delete.
- Body sections in fixed order: Context, Decision, Alternatives considered, Consequences (Positive / Negative-risks / Follow-ups).
- One decision per ADR. If a spec describes 3 decisions, that's 3 ADRs.
- Keep ADRs **terse** — the "why" of one choice in 30–60 lines. Long-form rationale lives in the spec doc.

## Don't

- Don't extract policy or convention statements as ADRs ("we use TypeScript everywhere"). Those are CLAUDE.md / rules material.
- Don't fabricate "alternatives considered" if the source doc doesn't list them. Note "none documented" instead — the next reader can fill it in.
- Don't write production code as part of an ADR extraction. ADRs are documentation only.
