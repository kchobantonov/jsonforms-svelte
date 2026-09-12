# JSON Forms native Svelte editor

Reusable Svelte 5 / shadcn editor. Custom-element hosting is in the separate `jsonforms-svelte-editor-webcomponent` package. Both packages remain private while their APIs develop.

## Run

From the repository root:

```sh
pnpm editor:demo:dev
```

This builds the existing shadcn renderer web component and editor before starting the demo. After editing package sources, rebuild with `pnpm editor:build` and reload. Build the production demo with `pnpm editor:demo:build`, then serve it with `pnpm editor:demo:preview`.

The demo's Example selector uses JSON fixtures from `jsonforms-svelte-demo-common`. Source acquisition stays in the host; the editor performs no form-resource loading or saving.

## Current functionality

- Recursive structural canvas with actual, inert shadcn renderer samples; clicking selects instead of entering form data.
- Standard layouts and categorization tabs, with empty-layout drop targets.
- Expandable schema tree with keyboard navigation and draggable object/array containers.
- Existing schema-field binding and palette insertion for text, textarea, number, checkbox, and layouts. New fields currently target the root object.
- Pointer and keyboard drag-and-drop between compatible containers, with ordered insertion, keyboard-accessible Add/Move up/Move down/Remove actions, and snapshot undo/redo.
- Canvas and tab remove buttons appear on hover, selection or keyboard focus; deletion preserves schema fields and supports undo.
- A small native Svelte JSON Forms-driven property inspector for labels, multiline, and required status.
- Bundled Monaco with Model/Schema/UI Schema/UI Schemas/Data/Config/Translations source selection, Apply/Revert, draft locking, draft-07 schema completion, and basic UI-schema/data tooling.
- Optional actual shadcn web-component preview and light/dark/system appearance. Source/preview panels retain state when hidden.
- Native change/draft callbacks, exposed as `document-change` and `draft-change` CustomEvents by the wrapper. Example replacement prompts live in the demo host.

## Native integration

Import `Editor` and `InitialForm` from `@chobantonov/jsonforms-svelte-editor`. Pass `initialForm`, `documentId`, `editorMode`, `onchange(document, revision)` and `ondraft(dirty)`. The host owns loading, unsaved-change confirmation and persistence. Remount to replace a session.

This workspace library currently requires Svelte/Vite and Tailwind 4 processing, and the `@jsonforms-svelte-shadcn-ui` alias mapped to the consuming host’s shadcn source directory (the demo uses `jsonforms-svelte-editor-webcomponent/src/components/ui`). Register the existing shadcn renderer custom element before mounting. The demo's Vite configuration and `NativeHost.svelte` show the integration. A self-contained external npm consumer build is a later release task.

## Building blocks

- `Editor.svelte`: public native component.
- `editor/EditorShell.svelte`: panel composition and visibility.
- `editor/document/`: types, immutable commands, session/history and nonserialized identity.
- `editor/dnd/`: typed payloads, reusable action zones and drop commands using `svelte-dnd-action`.
- `editor/registrations/`: palette control definitions, to expand into renderer registrations.
- `editor/components/Canvas`, `Inspector`, `preview`: focused visual components.
- `editor/monaco/`: document completion schemas; `MonacoPane` owns the editor lifecycle.
- `editor/styles/`: editor-specific styling.
- Shadcn components are host-owned in `jsonforms-svelte-editor-webcomponent/src/components/ui`; the native library contains no private UI copy.

The three splitter boundaries use the repository's shadcn/Paneforge components. No shadcn component adjustments were made. An editor-level `--tw-border-style: solid` fallback handles Tailwind property defaults in shadow roots.

## Validation and remaining work

Run `pnpm --filter @chobantonov/jsonforms-svelte-editor test` for command tests. With the demo served on port 4178, run `pnpm --filter jsonforms-svelte-editor-demo test:browser`; set `EDITOR_DEMO_URL` for another URL.

This slice is not the full editor. The full schema authoring inspector, rename and type conversions, dialect selection, rules, templates, nested array authoring, a host descriptor registry, localization catalogs, split/file codecs, and separate Form Input/Output panels remain on the [implementation plan](../../docs/form-editor/implementation-plan.md). Unsupported elements retain their JSON and show authoring placeholders. Documents containing executable tester/validator/template strings are not previewed until trusted preview isolation is implemented. Theme isolation across multiple differently themed Monaco instances and complete UI-schema meta-schema coverage require follow-up verification.

The inspector uses native `JsonForms` and shadcn renderers/cells. Both inspector and editor UI resolve the same host alias, share theme tokens and DOM boundary, and reflect host component changes after rebuild. The preview remains a separate renderer web component.

### Host history controls

The editor has no top toolbar. Bind the native Editor instance and call `undo()`
or `redo()` from host buttons, menus, or keyboard commands. Pass
`onhistory={({ canUndo, canRedo }) => ...}` to update command availability; pending
JSON drafts disable these commands. The web component exposes `undo()`/`redo()`
and emits `history-change` with `{ canUndo, canRedo }` in `event.detail`.

The editor starts in Design. Validate opens definition, preview, input, and output;
JSON Model replaces the visual workspace with source editing. Switching views
preserves drafts. Components are grouped by purpose, including Label and Button.

### Languages and translation authoring

Pass `editorLocale` for editor UI language and `formLocale` for rendered form
language (both default to `en`). Optional `editorMessages` overrides UI messages
using `{ [locale]: { [EnglishMessage]: translatedMessage } }`. The initial built-in
Bulgarian catalog covers navigation, source actions, and inspector fields; missing
messages fall back to English. The web component exposes the same properties.

The inspector's Translations section edits an element's `i18n` key and nested
`translations[locale]` entries. Label elements use the `text` suffix; other supported
elements use `label`, and controls also expose `description`. The inspector displays every supported locale together. Use Add form language
to declare a new locale, including an initially empty catalog. Changing a key preserves existing catalog entries.

JSON Model toggles the full Monaco workspace and restores the previous visual
preset when switched off. Design/Validate form a single-selection toggle group.
Apply/Revert remain explicit and appear above Monaco as translated icon actions
with tooltips.

The schema tree's **Show unused fields only** filter tracks placements in the
active UI schema. Click/Enter selects; drag-and-drop inserts. Duplicate fields
have a **Control placement** chooser in the inspector, retaining the current
occurrence when possible. Schema properties are shared across placements, while
UI options are edited per placement. Unplaced fields show a selection message;
use JSON Model to edit their schema before placing them.
