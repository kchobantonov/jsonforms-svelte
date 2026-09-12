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
- Existing schema-field binding and palette insertion for text, textarea, number, checkbox, and layouts. New fields currently target the root object.
- Pointer and keyboard drag-and-drop between compatible containers, with ordered insertion, keyboard-accessible Add/Move up/Move down/Remove actions, and snapshot undo/redo.
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

This slice is not the full editor. The full schema tree/inspector, rename and type conversions, dialect selection, rules, templates, nested array authoring, a host descriptor registry, localization catalogs, split/file codecs, and separate Form Input/Output panels remain on the [implementation plan](../../docs/form-editor/implementation-plan.md). Unsupported elements retain their JSON and show authoring placeholders. Documents containing executable tester/validator/template strings are not previewed until trusted preview isolation is implemented. Theme isolation across multiple differently themed Monaco instances and complete UI-schema meta-schema coverage require follow-up verification.

The inspector uses native `JsonForms` and shadcn renderers/cells. Both inspector and editor UI resolve the same host alias, share theme tokens and DOM boundary, and reflect host component changes after rebuild. The preview remains a separate renderer web component.
