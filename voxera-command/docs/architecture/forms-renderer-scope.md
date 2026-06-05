---
title: Forms Renderer Scope (JSON Forms + Mantine)
version: 1
status: active
updated: 2026-05-31
owner: you
---

# JSON Forms + Mantine Renderer Scope — v1.0

**Vocabulary note.** Per `workflow-dsl.md`, the internal vocabulary is generic ("workflow," "process instance"); the v1 CRM user-facing labels are "Pipeline," "Lead." References below use whichever is clearer in context.


---

## 1. Landscape Reality Check

JSON Forms (`@jsonforms/react`) is mature: schema parsing, state, validation, conditional rendering, custom renderer registration are all stable. The renderer sets shipped officially are Material (most complete) and Vanilla (basic). A community `jsonforms-mantine` exists but is incomplete and not at parity with Material.

You are **not** building a forms library. JSON Forms still owns:
- JSON Schema parsing and validation (AJV under the hood)
- UI Schema parsing
- State management for form data
- Renderer dispatch by `scope` + `type` + `format`
- Conditional rules (via `rule` in ui-schema)

You **are** building a renderer set: React components that JSON Forms calls for each control type, plus your custom widgets. Plan for one engineer for ~6 weeks for parity coverage, plus per-custom-widget work on top.

> *Decision recorded as [ADR-0006: JSON Forms + Mantine renderer set — don't build a forms library](../../decisions/ADR-0006-json-forms-mantine-renderer.md).*

---

## 2. Prototyping Gate (Do This First)

Before committing to the existing community renderer or rolling your own from `@jsonforms/react` core, build the hardest realistic form you'll need:

- Nested object with a 1:many array (e.g. multiple drivers on an auto policy)
- File upload control
- Conditional sections (show/hide based on another field)
- A custom widget (e.g. address autocomplete)
- Server-side validation feedback surfaced inline
- Mantine theming respected throughout

If `jsonforms-mantine` handles this cleanly: extend it. If it's shaky: build the renderer set directly against `@jsonforms/react` core using Mantine components. Either way, JSON Forms remains the engine.

---

## 3. Renderer Coverage Required (Parity Set)

Standard controls — these you must have, no negotiation:

- TextField (string, with `format` variants: email, uri, tel, password)
- NumberField (integer, number, with min/max/step)
- Checkbox (boolean)
- Toggle (boolean alt rendering)
- Select (enum, oneOf)
- MultiSelect (array of enum)
- Radio group (oneOf with small N)
- DateField, TimeField, DateTimeField
- TextArea (string with `multi: true` or `format: textarea`)
- Group, Categorization (tabs), VerticalLayout, HorizontalLayout
- Array control with add/remove/reorder
- Nested object renderer

JSON Forms' conditional `rule` syntax (show/hide/enable/disable) ties to JSON Schema. Verify it covers your activation rules; if you need richer logic, you'll wire your JSON Logic activation evaluator on top — but at the form rendering level, JSON Forms' rules are usually enough.

---

## 4. Custom Widgets (Product-Specific)

These are the ones that earn the product its identity. Prioritized:

### Tier 1 — load-bearing for the workflow product

**Object instance picker.** When a form targets a participating 1:many object in `edit` mode, the user selects an existing instance (e.g. "edit Quote #2"). Card list or dropdown showing key fields; "create new" affordance. Must respect activation rules per instance.

**Object instance creator (inline).** When target is `object, mode: create`, the form's submit creates a new instance and binds the workflow to it. Widget shows post-create preview.

**Sticky form container.** Layout wrapper outside JSON Forms proper that renders top/bottom-pinned forms separately from the stage's main content area. Handles the optional → required visual transition cleanly, and a "completion required to advance" indicator.

**Encrypted field input.** Stores ciphertext; renders as masked. "Reveal" affordance gated by permission, every reveal emits an outbox audit event (`EncryptedFieldRevealed`). Confirm on copy.

**Hashed field input.** Plain entry, hashes on submit, displays as `••• (hashed)` afterward, supports equality lookups only.

### Tier 2 — high-value, broadly useful

**Lookup field.** Searches leads, users, or custom object instances. Returns a reference (object ID), not a copy.

**Money field.** Currency-aware, formatted entry, normalized storage (minor units recommended).

**Address field.** Composite control with optional Google/Mapbox autocomplete, structured storage.

**Phone field.** Country code, format validation (`libphonenumber`), normalized E.164 storage.

**Signature initiation button.** Embeds the `signature_request` primitive in a form. Click triggers dispatch; widget then shows status (sent → opened → signed).

**Presence avatar stack.** Renders at the top of the form (or any entity view), showing users currently viewing the same entity. Driven by `UserViewing` ephemeral events on the SSE channel.

**Field-level presence indicator.** Per-field, shows when another user is editing the same field. Driven by `UserEditingField` ephemeral events.

**Overwrite notification.** Surfaces when a user's saved write has been overwritten by a later write to the same field. Computed client-side from the outbox stream comparing local write timestamps with incoming `FieldChanged` events. Offers "view their value" and "restore mine" affordances.

### Tier 3 — admin tooling

**PDF field mapping editor.** Admin-side. Renders the partner PDF, lists its AcroForm fields, lets the admin pick source paths (`lead.*`, `<alias>.*`, Handlebars expressions). Live preview by filling with sample data.

**Activation preview mode.** Admin can toggle "show inactive forms" with the reason ("inactive: `lead.score > 50` is false"). Invaluable for debugging.

**Form versioning diff view.** Side-by-side compare across pipeline versions.

---

## 5. Integration Points That Need Care

**Server-side validation.** JSON Forms validates client-side with AJV. Server must re-validate authoritatively and surface field-level errors back to the form. Standardize the error shape so client renderers know how to display.

**Activation rules at render time.** The DSL's `activation` (JSON Logic) decides whether a form *renders at all*. JSON Forms' built-in `rule` decides field visibility *within* a form. Two layers — keep them clearly separated.

**Sealed forms.** When a form is sealed, render the JSON Forms tree in read-only mode (`readonly: true` at the root). Show the unseal control gated by permission; clicking it opens a reason-capture dialog and only then lifts read-only.

**Auto-save.** Debounce form data changes; submit deltas (or full doc, simpler) on idle. Server emits `FormSaved` outbox events with before/after deltas. Conflict resolution follows the LWW-per-data-piece model from `realtime-collaboration.md`:
- Lead and custom object fields are field-level: two users editing different fields both succeed; same field, last server timestamp wins.
- Form submissions (the final submit) are record-level.
- The losing user sees a client-side overwrite notification computed from the outbox stream.

**Real-time updates from the SSE channel.** The form renderer subscribes to outbox events affecting the form's underlying entity (lead, object instance, task scratchpad). Incoming `FieldChanged` events from other users or agents update the form's local state and re-render the affected field. If the local user has unsaved edits to the same field, the overwrite notification surfaces inline on that field.

**Soft-conflict indicators (presence-driven).** When another user has `email` focused, the local user sees a soft indicator on the field. Sent via the presence ephemeral event channel (`UserEditingField`). Does not block input — LWW, not pessimistic locking.

**Sealed forms with live unseal events.** If User A unseals a form while User B has it open, User B sees the form transition from read-only to editable live via the SSE channel (`FormUnsealed` outbox event), with a notification: "User A unsealed this form. Reason: ...". Reseal events behave symmetrically.

**Performance.** Large arrays — virtualize the array control once item count exceeds ~50. Don't render every nested form for hidden tabs (Categorization should be lazy).

**Accessibility.** Mantine is good; ensure custom widgets carry through ARIA semantics. Custom widgets need keyboard navigation parity.

**SSR/hydration.** If you SSR, ensure custom widgets are SSR-safe (no `window` on initial render). Mantine itself is SSR-compatible.

---

## 6. Renderer Registration Architecture

```
<JsonForms
  schema={schema}
  uischema={uiSchema}
  data={data}
  renderers={[
    ...mantineCoreRenderers,    // your parity set
    ...productCustomRenderers,  // tier 1-3 widgets
    ...workspaceOverrides       // optional per-workspace overrides
  ]}
  cells={[...]}
  onChange={...}
/>
```

Tester functions decide which renderer wins for a given control. Workspace overrides registered last → win precedence. This lets enterprise customers slot in their own widgets without forking.

---

## 7. Build Order

1. **Prototyping gate** (1 week): hardest-form spike to choose `jsonforms-mantine` extension vs from-core build.
2. **Parity renderer set** (4-6 weeks): all standard controls + layouts + arrays + nesting.
3. **Sticky form container + activation preview** (1 week): unblocks design-time work.
4. **Object instance picker + creator** (2-3 weeks): unblocks the whole custom-objects-in-pipelines feature.
5. **Encrypted/hashed field controls** (1-2 weeks): required for compliance demos (Pflegebox + GDPR).
6. **Money + Phone + Address + Lookup** (2 weeks combined).
7. **Signature initiation control** (1 week, integrates with primitive layer).
8. **Real-time integration** (2-3 weeks): SSE subscription wiring, presence avatar stack, field-level presence indicator, overwrite notification.
9. **PDF field mapping editor** (3-4 weeks, admin-side, can ship after MVP).

Total: ~4 months for a single focused engineer for parity + tier 1-2 widgets including real-time; the PDF mapping editor adds another month.

---

## 8. Risks

- **`jsonforms-mantine` shipping pace.** If you extend the community library, you're partially dependent on its evolution. Mitigation: clean abstraction layer so a swap to a from-core build later is feasible.
- **Custom widget proliferation.** Workspaces will ask for one-off widgets. Get the override architecture right early or you'll regret it.
- **Schema drift between client and server.** Single source of truth for JSON Schema (server-owned, fetched by client). Don't let the client edit schemas without server validation.
- **Form-level vs field-level activation confusion.** Make the distinction visible in admin UI and documentation — it WILL trip people up.

## Changelog
- 2026-05-31 v1: imported from `/Users/ramzi/Downloads/files-6/forms-renderer-scope-v1.0.md`; frontmatter added (status active), inline "**Status:** v1.0" line removed in favor of frontmatter.
