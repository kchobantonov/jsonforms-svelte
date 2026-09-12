# JSONForms Visual Editor — Design Document

**Target stack:** TypeScript, Svelte 5 (runes), shadcn-svelte, existing JSONForms Svelte renderer set (+ web component build) for live preview.
**Audience:** implementation agents (Claude Code / Codex) building this from scratch.
**Status:** design spec, not yet implemented.

---

## 1. Goals & Non-Goals

### Goals
- Visually author a JSONForms **JSON Schema** + **UI Schema** pair without hand-writing JSON.
- **JSON Schema authoring itself is a first-class visual workflow**, not a side effect of dragging controls: adding, renaming, retyping, reordering, nesting, and deleting properties, and setting constraints (required, enum, format, min/max, pattern, description, default), should all be doable from the Schema Tree + Inspector without opening the Monaco `schema.json` pane. Monaco remains available for power users and bulk edits, but is never the *only* way to do these things.
- The **target JSON Schema draft/version is configurable** (per document/project), and the Inspector's available fields adapt to the selected draft — see §3.5.
- Support schemas whose **root is not an object** (`array`, `string`, `number`, `boolean`, `integer`) — see §3.6.
- **Any unknown/vendor-specific fields already present in a provided schema or UI Schema are preserved through visual/Inspector editing** unless the user deletes the element carrying them — see §3.7.
- Support `definitions`/`$defs` and `$ref` — the Schema Tree and Inspector understand and dereference them, not just Monaco's raw-JSON validation — see §3.8.
- Support `additionalProperties` and `patternProperties` on object schemas, primarily so the resulting schema/UI Schema pair can be handed to a host-supplied renderer capable of rendering those dynamic-keyed objects — see §3.9.
- Drag existing schema properties from a schema tree onto a layout canvas to place bound controls.
- Drag *unbound* control/layout types from a palette onto the canvas — this both creates the UI Schema node **and** scaffolds the corresponding JSON Schema property if one doesn't exist yet.
- **JSONForms rules** (`rule.effect` + `rule.condition`) are authorable both visually (a condition builder for common cases, including visual authoring of the condition's `schema` fragment for schema-based conditions) and as raw JSON, switchable per-rule — see §7.3.
- The **Inspector itself is JSONForms-driven**: it's a form rendered by JSONForms (using the shadcn renderer set), not bespoke hand-rolled UI — see §7.
- Full undo/redo across every mutation (schema edits, uischema edits, layout moves, rule edits, root-type changes).
- Monaco is **bundled into the app** (no CDN fetch at runtime), configured with code completion/IntelliSense for `schema.json` (against the JSON Schema meta-schema for the selected draft), `uischema.json` (against a JSONForms UI Schema meta-schema, so known layout/control shapes autocomplete), and `data.json` (against the live authored `schema`, kept current as it changes) — see §9.
- The **Live Preview is always in sync** with the modeled form — every committed document change re-renders it, with no user-facing staleness — see §10.
- Supports **system / light / dark** theming end-to-end (editor chrome, canvas, Inspector, Monaco theme) — see §15.
- The **editor's own UI is internationalized**, shipping initially with English and Bulgarian, structured to add further locales without code changes — see §16.
- Ships as **two packages** — a pure Svelte component library and a Web Component wrapper — plus a demo app exercising both integration modes — see §14.
- Extensible to custom control types / renderers without core rewrites.

### Non-Goals (v1)
- Authoring brand-new JSONForms **custom renderers** from within the editor UI (the editor assumes a renderer set already exists and is registered; see §8 for how existing custom renderers plug in).
- Multi-user real-time collaboration.
- Multiple named sample-data sets — v1 supports a single `data.json` per document (see §18, resolved).
- `$ref` resolution across separate files/documents (single self-contained schema document only).

---

## 2. Core Concept: One Source of Truth

Everything in the editor — tree views, canvas, palette, Monaco panes, Inspector, live preview — reads from and writes to a **single normalized document model** (`EditorDocument`). No panel owns its own copy of schema/uischema state; they're all views/controllers over the same store, so there's exactly one place that has to stay consistent and exactly one place undo/redo has to instrument.

```
EditorDocument
├── schemaDraft: SchemaDraftId  // e.g. 'draft-07' | '2019-09' | '2020-12' — see §3.5
├── schema: JsonSchema          // the JSON Schema, as a plain object (root may be any type — §3.6)
├── uischema: UISchemaElement   // the JSONForms UI Schema, as a plain object
├── data: unknown               // optional sample data for live preview
└── meta: EditorMeta            // selection, expanded nodes, editor-only annotations
```

This is the thing that gets undo/redo'd, serialized, and diffed. Everything else (tree node IDs, drag state, hover state, theme preference) is derived/ephemeral UI state that lives in panel-local runes and is **not** part of history.

---

## 3. Data Model Details

### 3.1 Schema representation
Keep the JSON Schema as a *plain, JSON-Schema-shaped object* — do not invent a parallel schema DSL. Editor code walks it directly using a small set of typed helpers (`getPropertyAtPath`, `setPropertyAtPath`, `renamePropertyKey`, `deletePropertyAtPath`, `movePropertyKey`) built on top of a JSON-pointer-like path array (`string[]`, not string, to avoid escaping bugs with `/` and `~` in keys).

### 3.2 UI Schema representation
Same principle: plain JSONForms `UISchemaElement` tree (`Layout`, `Control`, `Categorization`, etc.) with `scope` strings that are real JSON Pointers into the schema. Do **not** maintain a separate "visual tree" that gets serialized to UI Schema — the UI Schema *is* the visual tree. Every node the canvas renders corresponds 1:1 to a UI Schema element, addressed by a stable **element ID** (see §3.3).

### 3.3 Stable IDs, not paths, for UI Schema nodes
UI Schema elements don't have natural stable keys (they're array items). Assign every UI Schema element an editor-only `id` (e.g. via a non-enumerable `Symbol` map keyed by object identity, or a hidden `__editorId` field stripped on export) the moment it's created. Use these IDs for:
- Selection state (`meta.selectedId`)
- Drag-and-drop source/target addressing
- Svelte `#key` blocks for stable DOM identity during reorders

**Export step** strips `__editorId` (or whatever marker you choose) before writing to Monaco/schema output, so the exported JSON is clean standard JSONForms UI Schema.

### 3.4 Scope resolution
Maintain a derived (memoized) index: `scopeToSchemaNode: Map<string /* JSON pointer */, SchemaNodeInfo>` rebuilt whenever `schema` changes. `SchemaNodeInfo` includes resolved type, title, enum/format, and whether the pointer currently resolves (so the UI can flag "broken scope" controls whose bound property was deleted/renamed/moved by a root-type change — §3.6).

### 3.5 JSON Schema draft/version selection
The target draft is chosen once per document (surfaced as a dropdown in the app's top bar / document-settings area — `draft-07`, `2019-09`, `2020-12` are the recommended v1 set) and stored as `EditorDocument.schemaDraft`. This choice drives:
- Which `ajv` build/config validates the document (§11).
- Which JSON Schema **meta-schema** Monaco uses for `schema.json` completion/validation (§9) — each draft ships its own official meta-schema JSON, bundle all supported ones locally rather than fetching.
- Which keyword set the Inspector's schema-property form (§7.1) exposes — e.g. `prefixItems` (tuple validation) only appears for 2020-12; `dependentRequired`/`dependentSchemas` only for 2019-09+; older `dependencies` keyword only surfaces as a raw-fragment concern pre-2019-09. Implement this as a small per-draft **field-availability table** (`draftId -> Set<keyword>`) consulted when the Inspector's meta-schema (§7.0) is composed, rather than branching all over the field components.
- Changing the draft on an existing document is a non-destructive `EditorCommand` (it doesn't rewrite existing schema content) but should run validation immediately afterward and surface any now-invalid/unrecognized keywords as warnings rather than silently stripping them.

### 3.6 Non-object root schemas
JSON Schema (and JSONForms) doesn't require the document root to be `object` — it can be `array`, or a bare primitive. The editor treats the **root itself as a node in the Schema Tree**, not a hidden implicit container:

- The Schema Tree always renders a synthetic top row — `▾ (root)` — representing `schema` as a whole, with pointer `#`. Selecting it opens the same Inspector schema-property panel as any other node (§7.1), minus a "Key" field (the root has no key, only `title`/`description`/`type`/etc.), and its **Type** dropdown is what lets the user switch the whole document between `object` / `array` / `string` / `number` / `boolean` / `integer`.
- **Root = `object`** (the common case): children are `schema.properties.*`, rendered/dragged exactly as described elsewhere in this doc — nothing special.
- **Root = primitive** (`string`/`number`/`boolean`/`integer`): there is exactly one bindable thing — the whole document (`#`). The Schema Tree shows only the root row (no children). It's still a drag source like any leaf; dropping it on the canvas creates a `Control` with `scope: '#'`. Since a realistic form for a primitive root has at most one meaningful field, the drop handler should detect an existing root-bound control on re-drag and **focus/select it instead of creating a duplicate** (with a small toast explaining why), rather than silently allowing many redundant root controls.
- **Root = `array`**: the root's `items` sub-schema appears as a single child row ("items") in the tree. If `items` is `object`, its `properties` expand normally underneath and are draggable the usual way, each bound at `#/items/properties/x` (JSONForms renders these as the column/field template for each array row via its built-in array control — the editor does not need a bespoke UI Schema element for this; it just needs the array's canvas box to expose the nested `items` sub-schema for editing, per §5.2's array special case). If `items` is a primitive, only the "items" row itself is draggable (bound at `#/items`), same one-control caveat as the primitive-root case above.
- **Switching root type** is a guided, undo-able transaction, not a silent structural rewrite: changing `object → array` (or vice versa) via the Inspector's Type dropdown pops a confirmation ("Switching the root to Array will move your N existing propert(y/ies) under `items`. Continue?"). On confirm, the whole `schema` is replaced in one grouped command (§6.2): existing `properties` are relocated into `items.properties` (object→array) or lifted back out (array→object, if `items` was itself an object), and any UI Schema scopes that no longer resolve are **left in place and flagged** via the broken-scope badge (§3.4) rather than deleted, so the user can consciously re-bind or remove them with full undo safety net.
- This keeps the mental model uniform: "the Schema Tree always has exactly one root node with pointer `#`; everything else is normal tree/drag/Inspector behavior applied to that node," instead of a special-cased UI mode for non-object schemas.

### 3.7 Preservation of unknown / vendor-specific fields
A schema or UI Schema fed into the editor may carry keywords or keys the editor has no dedicated field for — unofficial vendor extensions (commonly namespaced `x-*`), app-specific metadata some other tool wrote, or JSON Schema keywords this v1 simply doesn't model a control for yet. **These must survive round-tripping through the visual editor untouched**, at every granularity, unless the user deletes the element that carries them outright. This is a cross-cutting principle, not a feature to build once:

- Every `EditorCommand` that edits a schema property or UI Schema element must be written as a **targeted merge/patch** on the specific keys it owns (e.g. `RenameProperty` touches only the parent's key ordering, `SetPropertyType` touches only `type` plus whatever type-specific keys it scaffolds) — never as "read known fields into a form model, then reserialize the whole fragment from that model." The latter silently drops anything the form model didn't know about.
- The §7.1/§7.2 Advanced raw-fragment editors are the *explicit* escape hatch for editing unknown keywords directly, but they are not what keeps unknown keys alive during *ordinary* structured edits elsewhere in the Inspector — the merge-patch discipline above is what does that.
- Test this explicitly: round-tripping a schema/uischema with injected `x-*` fields through a sequence of ordinary Inspector edits (rename, retype, toggle required, reorder) should leave those fields byte-for-byte present, in a project acceptance test, not just spot-checked manually.

### 3.8 `definitions` / `$defs` and `$ref` support
Reusable schema fragments and `$ref` pointers to them are first-class, not an edge case:

- The Schema Tree renders a second top-level branch alongside the root — **"Definitions"** — listing every entry under `schema.definitions` (draft-07-style) or `schema.$defs` (2019-09+ convention; the editor reads either location if present, and writes to whichever the active `schemaDraft`, §3.5, conventionally uses when creating a *new* definition). Each definition is authored exactly like any other schema node (§7.1 applies unchanged), just rooted at `#/definitions/Foo` or `#/$defs/Foo` instead of under the document root.
- A `properties` (or `items`, `patternProperties`, etc.) entry whose value is `{ "$ref": "#/$defs/Foo" }` is shown in the tree as a **reference node**: labeled with the property key plus a link affordance to the target definition (e.g. "→ Foo"), and its type/shape info in the Inspector, tree icons, and `scopeToSchemaNode` (§3.4) all come from **resolving the `$ref` chain**, not from the `$ref` wrapper object itself. `scopeToSchemaNode` must follow `$ref` (including chains of refs, with cycle detection — see below) when building `SchemaNodeInfo`, so downstream consumers (Inspector field availability, Monaco data-schema completion, drag-and-drop type matching) all see the dereferenced shape transparently.
- **Inspector actions on a reference node**: "Go to definition" (focuses the Schema Tree on the target under Definitions), "Unlink" (replaces the `$ref` wrapper with an inlined deep copy of the resolved schema at that call site — a normal, undoable `EditorCommand` — for when a user wants to detach one usage from the shared definition), and, on any *non-ref* node, "Extract to definition" (the reverse: moves the node's schema fragment into a new `#/$defs/<name>` entry and replaces the original location with a `$ref` to it — prompts for the definition name, single grouped transaction).
- **Circular references**: definitions may reference each other, including cycles. The Schema Tree must detect a cycle while expanding a reference chain and render the repeating node as a collapsed leaf ("↻ Foo (recursive)") that can be navigated to (via "Go to definition") but not expanded inline, rather than recursing infinitely.
- Drag-and-drop of a property whose value is a `$ref` behaves exactly like §5.1 for any other property — the *pointer* dragged/bound in the UI Schema `scope` is still the property's own location (e.g. `#/properties/owner`), not the `$ref` target; JSONForms itself resolves `$ref` at render time the same way this editor's tooling does for authoring.

### 3.9 `additionalProperties`, `patternProperties`, and dynamic-keyed objects
Object schemas whose properties aren't a fixed, enumerable set (dictionaries/maps, dynamic key-value bags) are supported as first-class object shapes, primarily so they can be handed to a **custom "dynamic object" renderer** the host app supplies (this is a data-modeling/authoring concern for the editor, not a renderer the editor needs to build itself):

- For any `object`-typed Schema Tree node, alongside its named `properties` children, show up to two special pseudo-children when present: **"◆ Additional properties"** (from `additionalProperties`, when it's a schema rather than a plain `true`/`false`) and **"◆ Pattern properties"** (a list, one entry per key in `patternProperties`, each labeled by its regex pattern). Both are authored with the same schema-node Inspector form as any other node (§7.1) — they just aren't bound to a concrete property name, so they are **not individually drag-and-droppable onto the canvas as their own controls** (there's no fixed key to put in a `scope` pointer for a not-yet-known key).
- The Inspector's **Constraints** tab for `object`-typed nodes gains a **Dynamic Properties** sub-section: `additionalProperties` as a three-state control (Disallowed / Allowed, any shape / Allowed, matching this schema — revealing the nested schema-editing form only in the last case), and a repeatable **Pattern properties** list editor (add/remove/reorder entries, each with a regex-pattern text field, live regex-validity feedback, and a nested schema-editing form for that pattern's value shape, recursing into the same components used everywhere else).
- What *is* draggable is the **object node itself**: dropping an object that has `additionalProperties`/`patternProperties` defined onto the canvas creates a single `Control` bound at that object's own scope, intended to be picked up by the host app's registered dynamic-object renderer (via JSONForms' normal tester/renderer matching, or an explicit `options.renderer` hint set at drop time) rather than decomposed into per-field controls the editor can't know the keys of ahead of time. Register a matching `EditorControlDefinition` (§8.1) whose `matchesSchema` detects `additionalProperties`/`patternProperties` presence so this shows up as a suggested palette/bind option automatically wherever such an object appears.

---

## 4. Application Layout

Four-zone workbench, resizable panes (splitter library — see §12), with a persistent theme toggle (system/light/dark, §15) in the top bar alongside the schema-draft selector (§3.5):

```
┌─────────────┬───────────────────────────────┬─────────────────┐
│  Left Rail  │           Canvas               │   Right Rail    │
│             │  (UI Schema layout, WYSIWYG-ish)│                 │
│ ┌─────────┐ │                                 │ ┌─────────────┐ │
│ │ Schema  │ │                                 │ │ Inspector   │ │
│ │ Tree    │ │                                 │ │ (JSONForms- │ │
│ ├─────────┤ │                                 │ │  driven,    │ │
│ │ Palette │ │                                 │ │  §7)        │ │
│ └─────────┘ │                                 │ └─────────────┘ │
├─────────────┴───────────────────────────────┴─────────────────┤
│  Bottom Dock (tabbed):  Live Preview | schema.json | uischema.json │
│                          | data.json   (Monaco editors, §9)         │
└─────────────────────────────────────────────────────────────────┘
```

- **Left Rail — Schema Tree**: renders the schema (rooted at `#` — §3.6) as a tree, plus a parallel **Definitions** branch (§3.8) for `definitions`/`$defs` entries. It's an authoring surface, not read-only drag scaffolding (§7.1): each node is a drag source **and** has its own context menu / inline controls for add-sibling-property, add-child-property (for `object`/`array` nodes), rename, delete, duplicate, retype, and reorder (drag-to-reorder within the tree itself, independent of UI Schema layout order). Shows type icon, required flag, "already placed" badge, a link badge + target label for `$ref` nodes (§3.8), and non-draggable **◆** pseudo-nodes for `additionalProperties`/`patternProperties` entries on object nodes (§3.9) — the containing object itself remains the drag source for those.
- **Left Rail — Palette**: static list of draggable UI Schema element types, grouped:
  - *Layouts*: VerticalLayout, HorizontalLayout, Group, Categorization/Category
  - *Controls (unbound)*: Text Control, Number Control, Boolean Control, Enum/Select Control, Date Control, Array Control (table/list)
  - *Custom* (populated from the registered renderer/tester list at runtime — see §8)
- **Canvas**: renders the actual UI Schema tree as nested, selectable, draggable-for-reorder boxes. Each box shows a compact label (control title/scope, or layout type), a selection outline, and drop-zones between/inside children. This is *not* the live JSONForms renderer — it's a structural editor view (see §4.1) — but it mirrors the eventual layout closely.
- **Inspector**: a JSONForms form (rendered with the shadcn renderer set) for whatever is currently selected — a Schema Tree node or a Canvas node — organized into tabs/collapsible sections; see §7 for the full design.
- **Bottom Dock**: tabs for (a) the actual live-rendered form via the real JSONForms Svelte/web-component renderer fed by current `schema`/`uischema`/`data`, always in sync (§10), and (b) three bundled Monaco panes (§9).

### 4.1 Why the canvas is a structural editor, not the live renderer
Dragging, hovering, and selecting *inside* an iframe/web-component-rendered live form is painful (event boundaries, shadow DOM, renderer-specific DOM structure you don't control). Keep the canvas as the editor's own lightweight representation of the UI Schema tree (built from your own components, one per UI Schema element type), and keep the **actual** JSONForms renderer purely as a read-only preview tab. This is the single most important architectural decision in this doc — don't try to make the live-rendered form directly editable.

---

## 5. Drag & Drop — Detailed Behavior

Two independent DnD contexts feed the same canvas drop target, so the canvas's drop handler needs to branch on drag payload kind.

### 5.1 Schema Tree → Canvas (bind existing property)
- **Payload**: `{ kind: 'schema-property', pointer: string /* JSON pointer, may be '#' — §3.6 */ }`
- **Drop action**: create a new `Control` UI Schema element with `scope: pointer`, insert at drop position. Label defaults to schema `title` or prettified property key. No schema mutation.
- **Edge case — array items**: dropping a property nested under `#/items/properties/x` while the canvas target is the top-level form should still just create the control at that scope; nesting inside an Array control layout is the user's job to arrange afterward (don't auto-detect "this should go inside an array section").
- **Edge case — already bound**: allow it (JSONForms doesn't forbid duplicate controls for one scope), but show a warning toast, not a block — **except** the primitive-root/primitive-items one-control case (§3.6), which redirects to selecting the existing control instead.
- **`$ref` properties** (§3.8): dragging a property whose value is `{ "$ref": ... }` binds `scope` to the property's own location as usual (e.g. `#/properties/owner`), never to the `$ref` target — JSONForms resolves the reference at render time. Type/label information shown during the drag comes from the dereferenced target via `scopeToSchemaNode`.
- **Dynamic-keyed objects** (§3.9): dragging an object node that carries `additionalProperties`/`patternProperties` always creates exactly one `Control` at that object's scope (intended for a host-registered dynamic-object renderer) rather than prompting for individual field placement — the pseudo-children (§3.9) it may show in the tree are not independently draggable.

### 5.2 Palette → Canvas (create UI element, possibly create schema property)
- **Payload**: `{ kind: 'palette-item', elementType: 'Control' | 'VerticalLayout' | ..., controlKind?: 'string'|'number'|'boolean'|'enum'|'date'|'array' }`
- **Drop action for layouts** (`VerticalLayout`, `HorizontalLayout`, `Group`, `Categorization`): pure UI Schema insertion, no schema change — these are structural only.
- **Drop action for controls**: this is the "wizard" path:
  1. On drop, open a small inline popover/modal: *"Bind to existing property"* (searchable list of currently-unbound schema pointers matching the dropped control kind) **or** *"Create new property"* (name + inferred type/format prefilled from `controlKind`, editable).
  2. If "create new": mutate `schema` — insert the new property at the schema's top level (or, if dropped inside a nested `object`-typed control's subtree, at that nested level — resolve target object by walking up the canvas tree from the drop point to the nearest ancestor whose scope resolves to an `object` schema, defaulting to root). New properties are appended at the **end** of the target's `properties` (resolved open question §18.2). Then create the `Control` referencing the new pointer.
  3. If "bind existing": same as §5.1.
  4. This is a **single undo step** (schema insert + uischema insert grouped — see §6.2).
- **Array control special case**: dropping "Array Control" with no existing array property prompts for the item shape too (at minimum: item type = object with zero properties, which the user then populates by dragging more palette items *into* the array's generated `items` sub-schema — the array control's canvas box exposes its own nested mini schema-tree/palette drop target scoped to `items`, the same mechanism used for array roots in §3.6).

### 5.3 Reordering / re-parenting within canvas
- **Payload**: `{ kind: 'canvas-node', elementId: string }`
- Standard tree-reorder semantics: drop indicator shows before/after siblings or "into" for container types (`Layout`, `Group`, `Category`). Moving a node is pure UI Schema mutation (splice from old parent's `elements[]`, insert into new parent's `elements[]`) — never touches schema.
- Disallow dropping a `Category` element outside a `Categorization` parent (validate allowed-parent rules per element type — keep this as a small static compatibility table, not hardcoded if/else scattered through the drop handler).

### 5.4 Recommended DnD implementation
Use **`svelte-dnd-action`** (or a hand-rolled pointer-events implementation if you want zero deps) rather than native HTML5 DnD — native DnD's drag-image and dataTransfer APIs are awkward for cross-panel typed payloads and don't play well with nested scroll containers, which this layout has three of (tree, canvas, palette). Whatever library is chosen, funnel every drop through **one** typed dispatcher function (`handleDrop(payload: DragPayload, target: DropTarget)`) so §5.1–5.3's branching lives in one place, not spread across component event handlers.

---

## 6. Undo/Redo

### 6.1 Command pattern over the document store
Every mutation to `EditorDocument` goes through a command object, not direct store writes:

```ts
interface EditorCommand {
  label: string;              // for a future "history" UI / debugging
  apply(doc: EditorDocument): EditorDocument;   // pure, returns new doc
  invert(before: EditorDocument, after: EditorDocument): EditorCommand; // produces the undo command
}
```

Maintain `history: { past: EditorDocument[]; present: EditorDocument; future: EditorDocument[] }` (simplest correct approach given form documents are small — a handful of KB of JSON — so snapshotting whole-document is fine; no need for fine-grained patches at this scale). `EditorDocument` should be treated as immutable — every command returns a new object (structural sharing via `structuredClone` or an immutability helper like `immer`'s `produce` is fine and recommended to avoid hand-written deep-clone bugs).

### 6.2 Transaction grouping
Multi-step actions (palette drop → schema insert + uischema insert; root-type switch → schema rewrite + scope re-flagging; Monaco paste that reformats the whole tree) must land as **one** history entry. Provide a `runTransaction(fn: () => void)` that batches all `dispatch(command)` calls issued synchronously inside `fn` into a single undo step, flushed on next microtask.

### 6.3 What's excluded from history
`meta` fields that are pure UI convenience (tree expand/collapse, canvas scroll position, which Monaco/dock tab is active, theme preference) should **not** create undo steps — keep those in a separate non-historied store, or mark specific commands as `historied: false`.

---

## 7. Inspector (Properties Panel) — JSONForms-driven

The Inspector edits **JSON Schema property definitions** (Schema Tree selection, including the root — §3.6) and **UI Schema node properties** (Canvas selection). Rather than hand-rolled Svelte forms, the Inspector is itself **rendered by JSONForms**, using the shadcn renderer set — the editor dogfoods its own output format to build its own configuration UI. Every field edit dispatches an `EditorCommand`, same as drag/drop — the Inspector is not a special path.

### 7.0 How the Inspector is built
For each selection kind (schema-property, UI-control, UI-layout, UI-categorization, rule), maintain a small **static internal JSON Schema + UI Schema pair** describing that thing's editable fields, and feed the current node's data into the JSONForms renderer against that pair. E.g. `internal/schema-property.schema.json` + `internal/schema-property.uischema.json` describes "what a schema property looks like" (key, type, title, description, required, format, enum, min/max, ...); the Inspector binds the currently-selected schema node's relevant fields into that shape, renders it, and maps field changes back into `EditorCommand`s.

- **Categorization for discoverability**: the internal UI Schemas use JSONForms `Categorization`/`Category` (rendered as tabs) or nested `Group`s (rendered as collapsible sections) to organize the large field set — see the concrete tab/section breakdown in §7.1–§7.3. Prefer tabs at the top level (General / Constraints / Rule / Advanced) and collapsible groups for dense sub-sections within a tab (e.g. per-type constraint fields), so the common fields are always one click away and the long tail doesn't clutter the default view.
- **Draft-awareness (§3.5)**: the internal schema-property schema/uischema pair is **composed dynamically** from the field-availability table for the currently selected `schemaDraft` — fields for keywords not in the active draft are simply omitted (via a `rule: { effect: HIDE }` driven by a synthetic "current draft" value passed alongside the node data, or by literally building a different static uischema per draft and picking one — either works; picking one per draft is simpler to reason about and test).
- **Renderer boundary**: the Inspector's own tabs/groups/text-fields/dropdowns are all standard shadcn-rendered JSONForms controls and layouts — nothing editor-specific is needed here. Anything genuinely new the Inspector needs (e.g. the repeatable enum-value chip editor, the composite rule-condition builder) is a **custom control renderer**. Whether such a renderer lives in the generic shadcn renderer package or in the editor package specifically depends on reusability — see §8.1 for that decision rule; the enum-chip editor and rule-condition builder both count as editor-specific (they encode this editor's own data shapes) and belong in the editor package.

### 7.1 Schema-property authoring (Schema Tree selection, including root)
Tabs: **General** · **Constraints** · **Advanced**.

- **General**: Key (property name — hidden/disabled for the root node, §3.6; renaming cascades to any UI Schema `scope` and `rule.condition.scope` pointing at it, grouped as one transaction), Type (dropdown: `string` | `number` | `integer` | `boolean` | `object` | `array`; for the root, this is the control that drives §3.6's root-type-switch flow), Title, Description, Default value (typed input matching selected `type`), Required toggle (writes/removes the key from the **parent** schema's `required[]`, not the property itself — hidden for the root, which has no parent).
- **Constraints** (contents vary by `type`, and by active draft per §3.5's field-availability table):
  - `string`: `format` (dropdown: date, date-time, email, uri, ...), `pattern`, `minLength`/`maxLength`, `enum` (repeatable value-chip editor: add/remove/reorder chips instead of hand-editing a JSON array).
  - `number`/`integer`: `minimum`/`maximum`, `exclusiveMinimum`/`exclusiveMaximum`, `multipleOf`.
  - `object`: read-only child-property count + a "manage children" shortcut that focuses the Schema Tree's expanded child list (children are authored via the tree itself, not a nested form here); plus the **Dynamic Properties** sub-section (`additionalProperties` three-state control, `patternProperties` list editor) from §3.9.
  - `array`: `items` type (dropdown — recurses into this same panel for a primitive item, or a "manage item shape" shortcut into the tree for an object item, matching §3.6's array-root handling), `minItems`/`maxItems`, `uniqueItems` toggle. Where the active draft supports it (2020-12), also expose `prefixItems` tuple editing as its own collapsible sub-group.
- **Advanced**: a collapsed "raw schema fragment" section showing this node's schema fragment in a small inline Monaco instance (§9 — Monaco is used everywhere in the editor, including these small per-node spots; no secondary editor library, resolved §18.5), for keywords the visual form doesn't cover (`const`, `oneOf`/`anyOf`/`allOf`, custom vocabulary keywords, or any vendor/unknown field — §3.7 governs why ordinary field edits elsewhere never touch these). Edits here parse-and-replace just that fragment; structured fields above re-render from the fragment after a raw edit, and a raw edit that breaks JSON syntax is rejected inline, never committed.
- **Reference nodes** (§3.8): selecting a node whose value is `{ "$ref": ... }` shows a distinct, minimal Inspector view instead of the full General/Constraints tabs — the resolved target's summary (type/title, read-only) plus two actions: **Go to definition** and **Unlink** (inline a copy and switch to the normal editing view for it). A non-ref node's General tab also gets an **Extract to definition** action (§3.8).

### 7.2 UI Schema node authoring (Canvas selection)
Tabs: **General** · **Rule** · **Options** · **Advanced**.

- **General**: label (writes `uischema.label`), scope (dropdown of compatible schema pointers — rebind; N/A for pure layout nodes), and — for `Control` — a shortcut link "edit underlying property" that jumps focus to the Schema Tree node and opens §7.1 for the bound scope. `Categorization` additionally manages child Category labels/order here (redundant with canvas drag, offered for convenience).
- **Rule**: see §7.3.
- **Options**: the renderer `options` bag, as a key/value editor (values typed loosely — string/number/boolean/JSON — since `options` is renderer-defined and not schema-validated).
- **Advanced**: a small inline Monaco instance for the selected UI Schema element's raw fragment, same pattern as §7.1's Advanced tab, for JSONForms options/shapes the structured tabs don't model.

### 7.3 Rule authoring — visual and raw JSON, switchable
Any UI Schema element that supports `rule` (`Control`, `Layout`, `Group`, `Category`) gets the **Rule** tab, with two modes and a toggle between them:

- **Visual mode** (default, used whenever the rule fits a modeled shape):
  - `effect`: dropdown (`SHOW`, `HIDE`, `ENABLE`, `DISABLE`).
  - `condition.scope`: dropdown of schema pointers (same source as Control's scope dropdown).
  - `condition` shape: **Equals** (`{ scope, schema: { const: value } }`), **One of** (`{ scope, schema: { enum: [...] } }` — same value-chip editor as §7.1's enum editor), **Truthy/Falsy** (`{ scope, schema: { const: true|false } }`), **Composite** (`AND`/`OR`/`NOT` combining sub-conditions, recursively using this same builder, capped at a shallow depth — e.g. 2–3 levels — before nudging the user to raw mode), and **Schema-based** — for conditions that need more than a `const`/`enum` check (e.g. `minimum`, `pattern`, or any other schema keyword applied to the condition's target value): this reuses **§7.1's own schema-property Constraints form** to author `condition.schema` visually, since a rule's `condition.schema` is itself just a JSON Schema fragment. This is the direct link between rule authoring and schema authoring the visual builder needed.
  - Value/constraint input types adapt to the target property's schema type (string/number/boolean/enum-of-target), pulled from `scopeToSchemaNode` (§3.4).
- **Raw JSON mode**: a small inline Monaco instance for the literal `rule` object, for anything the visual builder doesn't model. Parses on blur/debounce, validates it's at least structurally a valid `rule` (`effect` present, `condition.scope` and `condition.schema` present), rejects-in-place on parse failure without touching the store.
- **Mode switch is lossy-aware**: switching *from* raw *to* visual attempts to pattern-match the raw JSON back into one of the modeled shapes above; if it doesn't match, visual mode shows "this rule is too complex to edit visually — switch back to raw" rather than silently discarding/mangling it. Never auto-convert-and-lose data.
- Whichever mode is active, committing a rule change is one `EditorCommand` (`UpdateElementRule`), same undo/redo path as everything else.

---

## 8. Extensibility & Renderer Package Boundaries

### 8.1 Registration API
The palette's "Custom" section and the Inspector's control-kind inference read from a **registration list** the host app supplies, not hardcoded to core JSONForms control kinds:

```ts
interface EditorControlDefinition {
  id: string;                       // palette key
  label: string;
  icon?: string;
  matchesSchema?: (schema: JsonSchemaFragment) => boolean; // for "bind existing" suggestions
  scaffoldSchema: () => JsonSchemaFragment;                // for "create new"
  scaffoldUiSchemaOptions?: () => Record<string, unknown>; // default `options` bag
}
```

This list is passed into the editor as a prop/context, defaulting to a built-in set covering standard JSONForms control kinds.

### 8.2 Where does a given renderer/component belong?
Given the two-package split (§14), use this rule whenever a new visual piece is needed (a layout renderer, a control renderer, an Inspector sub-widget):

- **Generic → the shared shadcn renderer package** (the existing, separate "svelte shadcn extended renderer" package, not this editor's own package): if the piece is a standard JSONForms renderer that any host app using that shadcn renderer set could use — e.g. a `Group`/`Categorization`/layout renderer styled with shadcn, a standard control renderer — it belongs there, decoupled from anything editor-specific, and the editor simply depends on it (for its Live Preview and, per §7.0, for the Inspector's own rendering).
- **Editor-specific → this editor's own package**: if the piece depends on editor-only concepts — selection outlines, drag handles, the Canvas's structural (non-live) node boxes, the enum-chip editor, the composite rule-condition builder, anything that manipulates `EditorCommand`s directly — it stays in the editor package, and may internally wrap/extend a generic renderer from the shared package rather than duplicating it.
- When genuinely unsure, default to the editor package first — it's easy to promote something generic later; it's disruptive to walk back a public API in the shared package that turned out to be editor-specific.

---

## 9. Monaco Integration — bundled, with code completion

- **Bundled, not CDN-loaded**: vendor `monaco-editor` through the build tool (Vite's `vite-plugin-monaco-editor` or equivalent), self-hosting the editor core, language workers, and CSS as build assets. No runtime fetch to a CDN for Monaco itself or its language services — this matters for offline use, CSP-restricted host apps, and the web-component package's self-containment goal (§14).
- **Monaco is the only code-editing component in this project** — resolved §18.5: no secondary/lightweight editor library. This applies to the three bottom-dock document panes below *and* to every small inline "raw fragment" spot in the Inspector (§7.1's Advanced tab, §7.2's Advanced tab, §7.3's raw rule JSON mode). Since that means potentially many Monaco instances alive at once (one per open Inspector tab plus the three dock panes), share a single lazily-created `monaco` module/worker setup across all of them rather than re-initializing language workers per instance, and dispose instances whose owning panel/tab unmounts.
- **Three full-document read/write Monaco instances**: `schema.json`, `uischema.json`, and (optional) `data.json`. Each gets real code completion/IntelliSense, not just syntax highlighting:
  - **`schema.json`**: configure Monaco's JSON language service (`languages.json.jsonDefaults.setDiagnosticsOptions`) with the **official JSON Schema meta-schema for the currently selected draft** (§3.5) as its validation schema — bundle the draft-07/2019-09/2020-12 meta-schema JSON files locally rather than fetching them, so completion/validation works offline and switching drafts just swaps which bundled meta-schema is active.
  - **`uischema.json`**: configure a **JSONForms UI Schema meta-schema** (a JSON Schema describing valid `Layout`/`Control`/`Categorization`/`Rule`/etc. shapes and their `type` discriminants) as its validation schema, so typing in this pane autocompletes known layout/control type names and required fields the same way `schema.json` does. No official meta-schema for JSONForms UI Schema ships upstream as of this writing — **authoring one is part of this project's scope** (a single JSON Schema file capturing the `UISchemaElement` union), and it should live alongside the internal Inspector schemas from §7.0 since both describe the same shapes from different angles.
  - **`data.json`**: point its validation schema at the **live, currently-authored `schema`** (not a static file) — re-register it with Monaco's JSON defaults every time `schema` changes (cheap; it's a small object), so sample-data completion and validation track the form being designed in real time.
  - `$ref`/`definitions`/`$defs` (§3.8) need no special Monaco configuration beyond passing the whole `schema` object (definitions included) as the registered schema — Monaco's built-in JSON language service already follows in-document `$ref`s for both validation and completion.
- **Editor → Monaco**: on every committed `EditorCommand`, re-stringify the relevant document slice (`JSON.stringify(schema, null, 2)`) and push into the Monaco model *only if the text differs* (avoid cursor-jump churn) and **only when that Monaco pane doesn't currently have focus** (avoid clobbering an in-progress edit).
- **Monaco → Editor**: debounce `onDidChangeModelContent` (≈300ms), `JSON.parse` defensively (swallow parse errors, show inline error banner, don't touch the store until it parses), diff against current store value, and if different, dispatch a single `ReplaceSchemaCommand` / `ReplaceUiSchemaCommand` (whole-document replace commands are fine here — don't try to compute a minimal patch from raw text).
- Keep Monaco edits **inside the same undo history** as visual edits (dispatch through the same command bus) so Ctrl+Z is consistent no matter which panel the user last touched.
- **Theme**: Monaco's own theme (`vs`, `vs-dark`, or a custom-defined theme matching the shadcn token palette) is switched in lockstep with the app's light/dark mode — see §15.

---

## 10. Live Preview Synchronization

The Live Preview tab renders the actual JSONForms Svelte (or web component, for cross-checking) renderer against the current `schema` / `uischema` / `data`. It is wired as a **direct subscriber to the `EditorDocument` store with no debounce and no manual refresh** — every committed `EditorCommand`, from any source (drag/drop, Inspector edit, Monaco edit, root-type switch), triggers an immediate re-render. There is no "sync" button and no state where the preview can visibly lag behind the modeled form; if a future performance issue ever requires throttling, it must be a render-scheduling optimization invisible to the user (e.g. batching within a single animation frame), never a user-facing staleness window.

---

## 11. Validation

- **Schema validity**: run `ajv` (selecting the `ajv` build/config matching `schemaDraft`, §3.5) against the meta-schema whenever `schema` changes; surface errors as a small banner, don't block editing.
- **UI Schema scope validity**: the `scopeToSchemaNode` index (§3.4) flags controls whose scope no longer resolves — surface as a warning badge directly on the canvas node and in the Schema/UI trees, not just a global error list, so it's fixable in place. This is also how root-type-switch fallout (§3.6) surfaces.
- **Sample data validity**: validate `data` against `schema` live in the Monaco `data.json` pane (§9) and in the Live Preview tab (JSONForms already does this natively — just surface its validation output).

---

## 12. Suggested Module / File Structure

```
packages/
  editor/                       // package 1 — pure Svelte component library, §14
    src/
      lib/
        editor/
          document/
            types.ts              // EditorDocument, EditorMeta, SchemaNodeInfo, SchemaDraftId
            schema-paths.ts        // path helpers (get/set/rename/delete/move)
            scope-index.ts         // scopeToSchemaNode builder
            root-schema.ts         // §3.6 root-node view + root-type-switch transaction
            draft-config.ts        // §3.5 per-draft field-availability table + bundled meta-schemas
            ref-resolution.ts      // §3.8 $ref/$defs/definitions dereferencing + cycle detection
            dynamic-properties.ts  // §3.9 additionalProperties/patternProperties tree + Inspector helpers
            merge-patch.ts         // §3.7 shared "edit only these keys, preserve the rest" command helper
            commands/
              types.ts             // EditorCommand interface, runTransaction
              schema-commands.ts    // InsertProperty, RenameProperty, DeleteProperty, SetRootType, ExtractToDefinition, UnlinkRef, ...
              uischema-commands.ts  // InsertElement, MoveElement, UpdateElementProps, UpdateElementRule, ...
              replace-commands.ts   // ReplaceSchema, ReplaceUiSchema (for Monaco sync)
            history-store.svelte.ts // past/present/future runes store + dispatch()
          dnd/
            payloads.ts             // DragPayload discriminated union
            drop-handler.ts         // single handleDrop() dispatcher
            compatibility.ts        // allowed-parent rules table
          registrations/
            control-definitions.ts  // default EditorControlDefinition[]
          inspector/
            schemas/                 // §7.0 internal schema+uischema pairs, per selection kind & draft
            renderers/                // editor-specific custom renderers (enum-chip editor, rule builder, §8.2)
          components/
            SchemaTree.svelte
            Palette.svelte
            Canvas/
              Canvas.svelte
              CanvasNode.svelte      // recursive, one per UI Schema element
              nodes/ (per-type node renderers: ControlNode, LayoutNode, GroupNode, CategorizationNode)
            Inspector/
              Inspector.svelte       // hosts the JSONForms instance described in §7.0
            MonacoPane.svelte
            LivePreview.svelte        // wraps the shared shadcn renderer package's JSONForms Svelte renderer
          theme/
            theme-context.ts         // §15 system/light/dark state + Monaco theme sync
          i18n/
            locale-context.ts        // §16 active LocaleId + t() Svelte context
            locales/
              en.json                  // source-of-truth catalog, populated from Phase 0 onward
              bg.json                  // §16 initial second locale
          EditorShell.svelte          // top-level 4-zone layout + splitters + top bar (draft selector, theme toggle)
    package.json                    // peer-deps on shadcn-svelte + the shared renderer package, §14

  editor-webcomponent/           // package 2 — custom-element wrapper, §14
    src/
      define-element.ts            // customElements.define(...), bundles shadcn + renderer deps internally
    package.json                   // no peer deps — everything self-contained

  uischema-meta-schema/          // the authored JSONForms UI Schema meta-schema, §9 — its own small package
                                  // so both Monaco completion and §7.0's internal schemas can import it

apps/
  demo/                          // §14 — dual-mode demo (native Svelte integration vs web-component integration)
```

---

## 13. Technology Choices Summary

| Concern | Recommendation |
|---|---|
| Framework | Svelte 5, runes (`$state`, `$derived`) for the document store and history stack |
| Component library | shadcn-svelte, supplied as a peer dependency to the `editor` package, bundled directly into `editor-webcomponent` (§14) |
| Drag & drop | `svelte-dnd-action`, or hand-rolled pointer-events if you want to avoid the dependency |
| Split panes | `svelte-splitpanes` or similar; avoid hand-rolling resize logic |
| Tree views | Hand-rolled recursive component (schema tree and canvas are both small recursive trees; a generic tree library adds more friction than it saves given the two trees have quite different node semantics) |
| Code editing | `monaco-editor`, bundled via `vite-plugin-monaco-editor` (or equivalent for the chosen bundler) — never CDN-loaded (§9) |
| Schema validation | `ajv`, configured per selected draft (§3.5) |
| Internationalization | `svelte-i18n` (or a compile-time alternative like Paraglide) for editor-chrome strings, English + Bulgarian catalogs shipped initially (§16) |
| Immutability | `immer`'s `produce`, or manual structural-sharing helpers if you want zero deps |
| Live preview | The shared shadcn JSONForms Svelte renderer package for the native pane; the web component build for a "how would this look embedded elsewhere" secondary check |

---

## 14. Package & Build Architecture

Two publishable packages plus a demo app, reflecting how shadcn's "you own the components" model interacts with a Web Component's need for style/dependency self-containment:

1. **`editor` (pure Svelte component library)** — the actual editor implementation from §12. **shadcn-svelte components are a peer dependency / externally referenced**: the consuming (Svelte-native) host app supplies its own shadcn setup (theme tokens, installed components), and this package's components are written against those same primitives. This keeps the editor themeable and consistent with a host app that already uses shadcn, and avoids bundling duplicate copies of shadcn's (copy-in, not npm-installed) component source into every consumer.
2. **`editor-webcomponent` (Custom Element wrapper)** — wraps `editor` behind `customElements.define(...)`. Because a Web Component's Shadow DOM can't rely on a host page happening to have shadcn set up correctly (or at all), this package **bundles the shadcn components and their styles internally**, along with the shared renderer package and Monaco assets, so the resulting custom element is fully self-contained — drop the `<script>` tag in, use the `<jsonforms-editor>` element, no host-side setup required.
3. **`uischema-meta-schema`** — small standalone package holding the authored JSONForms UI Schema meta-schema (§9), imported by both Monaco setup and the Inspector's internal schemas (§7.0), so it's authored once and doesn't drift between the two consumers.
4. **`demo` app** — exercises **both** integration modes behind a mode switch:
   - *Native Svelte mode*: imports the `editor` package directly and mounts it as ordinary Svelte components inside the demo's own shell (which itself uses shadcn-svelte for its chrome, and therefore also satisfies `editor`'s peer dependency).
   - *Web Component mode*: loads `editor-webcomponent` and mounts the `<jsonforms-editor>` custom element directly, demonstrating the zero-setup embedding path.
   - The demo needs shadcn components regardless of mode (for its own shell chrome and to satisfy the native-mode peer dependency), but only needs to bundle them itself for that native path — the web-component path brings its own.

---

## 15. Theming — system / light / dark

- A single `theme-context` (Svelte context, §12) exposes `theme: 'system' | 'light' | 'dark'` and a derived `resolvedTheme: 'light' | 'dark'` (resolving `'system'` via a `prefers-color-scheme` media-query listener kept live for the session, not just read once at startup).
- The resolved theme toggles a class (e.g. `.dark`) at the editor's root element, driving shadcn's standard CSS-variable-based theming for every shadcn-rendered surface (Inspector, tree, palette, canvas chrome, dock tabs).
- **Monaco needs separate, explicit theme sync**: Monaco doesn't read CSS variables or ambient dark-mode classes — call `monaco.editor.setTheme(...)` whenever `resolvedTheme` changes, mapping to Monaco's built-in `vs`/`vs-dark`, or (nicer, for visual consistency) a custom Monaco theme defined once from the same token values shadcn uses, so the Monaco panes don't look like a visually distinct product bolted onto the rest of the shell.
- Theme preference (`'system' | 'light' | 'dark'`) is `meta`-level UI state, not part of `EditorDocument`'s undo history (§6.3) — persisting it (e.g. to `localStorage` in the host app) is a host-app concern, not this package's.
- The Web Component wrapper (§14) needs to forward `resolvedTheme` across the Shadow DOM boundary explicitly (host page dark-mode classes don't pierce Shadow DOM) — expose it as an element attribute/property (`<jsonforms-editor theme="dark">`) rather than relying on inherited CSS state.

---

## 16. Internationalization (i18n)

The editor's own chrome — not user-authored form content — supports multiple UI languages, shipping with **English and Bulgarian** initially and structured so adding further locales later is a translation-catalog addition, not a code change.

### 16.1 What gets translated, and what doesn't
Two clearly separate things are easy to conflate here:
- **Editor chrome strings** — tab names, button/menu labels, tooltips, confirmation dialogs (e.g. §3.6's root-type-switch prompt), validation/error banner text, palette category names, the "Definitions" tree branch label, etc. — **are** translated via the mechanism below.
- **User-authored content** — schema `title`/`description`, UI Schema `label`, enum display values, anything the person using the editor typed into a field — is **not** touched by the editor's i18n system. It's just data; the editor doesn't attempt to translate or localize it. (Separately, JSONForms itself supports supplying translated strings at *render time* for its own built-in output like default validation messages — §16.4 covers whether/how the Live Preview surfaces that, which is a distinct concern from editor-chrome i18n.)

### 16.2 Mechanism
- Use a standard Svelte-compatible i18n library (`svelte-i18n` is a reasonable default — runtime, reactive, minimal setup; a compile-time alternative like Paraglide is fine too if type-safety across keys is prioritized over runtime-swap simplicity — either is compatible with everything else in this doc, so treat the specific library as an implementation detail, not a design constraint).
- All editor chrome strings live in locale catalogs — `locales/en.json`, `locales/bg.json` — keyed by a flat, namespaced key scheme (e.g. `inspector.tabs.general`, `schemaTree.definitions.title`, `dialog.rootTypeSwitch.confirm`) rather than nesting mirroring component structure 1:1, so keys stay stable even as components get refactored.
- A `locale-context` (sibling to the `theme-context` from §15) exposes the active `LocaleId` and a `t(key, params?)` function via Svelte context, consumed by every chrome component the same way theme is.
- **Missing-key fallback**: if a key is absent from the active locale (e.g. Bulgarian catalog lags behind a newly added English string), fall back to English silently at runtime, but fail a build/CI check that diffs the key sets across all locale files — missing translations should be a caught build issue, not a silent runtime gap discovered by a Bulgarian-speaking user.
- **Pluralization/formatting**: keep number/date formatting locale-aware via the standard `Intl` APIs (`Intl.NumberFormat`, `Intl.DateTimeFormat`) rather than hand-rolled formatting, wherever the chrome displays numbers/dates (e.g. any future "last saved" timestamp).

### 16.3 Locale selection & the Web Component boundary
- Locale is presentation-layer state like theme (§15) — it is **not** part of `EditorDocument` and never enters undo history (§6.3). A locale dropdown sits in the top bar alongside the theme toggle and schema-draft selector (§4).
- Default locale resolution: an explicit `locale` prop/attribute from the host app wins; absent that, fall back to the browser's language (`navigator.language`) if it matches a supported locale, else English.
- The `editor-webcomponent` package (§14) needs `locale` exposed as an element attribute/property (`<jsonforms-editor locale="bg">`), the same way `theme` is (§15) — Shadow DOM doesn't inherit ambient language context from the host page any more than it inherits dark-mode classes.
- Design the catalog/context mechanism to be **locale-count-agnostic** from day one (a list of supported locales, not a hardcoded `en`/`bg` binary), even though only two ship initially — adding a third locale later should mean "drop in a new JSON file and register its id," not touching the mechanism itself. RTL isn't needed for English/Bulgarian, but avoid anything that would make adding an RTL locale later structurally awkward (e.g. hardcoded `left`/`right` CSS instead of logical properties) — not worth active effort now, just worth not actively precluding.

### 16.4 Live Preview's own JSONForms-level i18n (optional, later)
Separately from editor-chrome i18n, JSONForms itself accepts a translation function for the strings it generates at render time (default required-field/validation messages, and similar). Whether the Live Preview (§10) should expose a way to preview the *rendered form's* output in a chosen language (independent of the editor chrome's language) is a nice-to-have worth flagging but not committing to for v1 — see §18's open questions.

---

## 17. Phased Implementation Plan

**Phase 0 — Skeleton**
- `EditorDocument` types (including `schemaDraft` and the root-node view, §3.5–3.6), path helpers, scope index.
- 4-zone shell layout with splitters and a top bar (draft selector, theme toggle stub, locale selector stub), no functionality yet — static panels. Stand up the `t(key)` chrome-string mechanism (§16.2) now, English-only, even though no component text exists yet — every chrome string written from this point on should go through it rather than being hardcoded and revisited later (§17's Phase 8b).

**Phase 1 — Read-only round trip**
- Load a schema+uischema (object-root to start), render Schema Tree (read-only), Canvas (read-only, from real uischema), Live Preview, and all three bundled Monaco panes wired **read-only** first (with their meta-schemas/completion already configured, §9) to prove the data model and layout before touching mutation.

**Phase 2 — Command bus + undo/redo**
- Implement `EditorCommand`, `history-store`, `runTransaction`, and the §3.7 merge-patch discipline from day one (every command reviewed against "does this preserve unrelated/unknown keys?" as an acceptance criterion, not bolted on later). Wire *one* mutation end-to-end (e.g. an Inspector label edit, via the §7.0 JSONForms-driven Inspector for at least this one field) to prove the full command → store → re-render → Monaco-sync loop, and add the round-trip preservation test from §3.7 here so later phases can't regress it.

**Phase 3 — Drag & drop, schema tree → canvas**
- §5.1 only (bind existing property). This alone makes the tool useful for "I already have a schema, just let me lay it out."

**Phase 4 — Palette → canvas, with schema scaffolding**
- §5.2, including the bind-or-create popover and nested-object/array target resolution.

**Phase 5 — Reordering & re-parenting**
- §5.3, plus the allowed-parent compatibility table.

**Phase 6 — Full Inspector, General tabs**
- §7.2's UI Schema node General/Options tabs first (smaller surface, unblocks everyday use), built as the actual §7.0 JSONForms-driven Inspector rather than placeholder markup.

**Phase 6b — Visual schema authoring**
- §7.1 in full: type-specific Constraints fields, the required-toggle-writes-to-parent behavior, enum chip editor, draft-aware field availability (§3.5), and the Advanced raw-fragment escape hatch.

**Phase 6c — Non-object root support**
- §3.6: root node in the Schema Tree, root-type-switch transaction and confirmation flow, one-control-per-primitive-root/items behavior.

**Phase 6c-2 — Definitions & `$ref`**
- §3.8: Definitions tree branch, `$ref` node rendering and dereferenced type info in `scopeToSchemaNode`, Go to definition / Unlink / Extract to definition actions, cycle detection.

**Phase 6c-3 — Dynamic-keyed objects**
- §3.9: `additionalProperties`/`patternProperties` pseudo-children in the Schema Tree, the Inspector's Dynamic Properties sub-section, and the whole-object drag behavior plus its `EditorControlDefinition` registration.

**Phase 6d — Rule authoring**
- §7.3: visual condition builder (equals/one-of/truthy/composite/schema-based, reusing §7.1's Constraints form for the schema-based case) plus the raw-JSON mode and the mode-switch pattern-matching behavior.

**Phase 7 — Monaco write path**
- §9's Monaco → Editor direction (debounced parse, replace-commands) and the `uischema` meta-schema package, completing bidirectional sync with completion in all three panes.

**Phase 8 — Theming & package split**
- §15 end-to-end, then split into the `editor` / `editor-webcomponent` / `uischema-meta-schema` packages and stand up the dual-mode `demo` app (§14).

**Phase 8b — Internationalization**
- §16: locale-context mechanism and English + Bulgarian catalogs. To avoid an expensive retrofit, every chrome string introduced from **Phase 0 onward** should already be routed through the `t(key)` mechanism with only the English catalog populated; Phase 8b's actual work is standing up the mechanism itself (if not done earlier), authoring the Bulgarian catalog, wiring the missing-key CI check, and adding the `editor-webcomponent`'s `locale` attribute — not hunting down hardcoded strings across eight phases of components.

**Phase 9 — Extensibility & polish**
- §8 registration API, validation banners (§11), broken-scope badges, array item sub-schema editing.

---

## 18. Open Questions — status

1. ~~Target JSON Schema draft~~ — **resolved**: configurable per document (§3.5), not fixed to one draft.
2. ~~Property insertion position on "create new" from the palette~~ — **resolved**: append at the end of the target's `properties` (§5.2).
3. ~~Depth of visual condition/rule builder~~ — **resolved**: equals / one-of / truthy-falsy / composite (capped depth) / schema-based, with a raw-JSON fallback for anything beyond that (§7.3).
4. ~~Single vs multiple sample-data sets~~ — **resolved**: single `data.json` per document for v1.
5. ~~Whether inline "raw fragment"/"raw rule JSON" editors should be full Monaco or a lighter library~~ — **resolved**: Monaco only, everywhere (§9) — no CodeMirror or other secondary editor, with instance-sharing/disposal discipline for the many small inline spots.
6. Exact contents of the authored JSONForms UI Schema meta-schema (§9) — needs to be drafted against the actual JSONForms UI Schema TypeScript types to make sure Monaco completion doesn't drift from what the renderer actually accepts.
7. Whether "Extract to definition" (§3.8) should default new definitions to `$defs` or `definitions` when the active draft technically permits either (draft-07 predates `$defs`; later drafts conventionally prefer it but don't forbid `definitions`) — leaning "match whatever the document already predominantly uses, default to the draft's conventional location only for a brand-new document."
8. How strictly to validate `patternProperties` regex syntax live in the Inspector (§3.9) — JavaScript regex syntax is a reasonable superset to accept even though JSON Schema technically expects ECMA 262 regex, but worth confirming against whatever `ajv` build is selected per draft (§3.5) rather than assuming.
9. Whether the Live Preview should let the user preview the rendered form's own JSONForms-generated strings (default validation messages, etc.) in a chosen language, independent of the editor chrome's language (§16.4) — flagged as a nice-to-have, not committed for v1.
