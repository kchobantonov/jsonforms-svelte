# JSON Forms editor web component

An initial interactive Svelte 5 / shadcn-svelte authoring slice. Registers `<jsonforms-svelte-editor>` with an open shadow root. The package is private while its API develops. A native Svelte library and separate web-component wrapper are the confirmed next packaging target; this slice keeps the existing entry point working.

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
- Drag moves to the end of compatible containers, keyboard-accessible Add/Move up/Move down/Remove actions, and snapshot undo/redo.
- A small JSON Forms-driven property inspector for labels, multiline, and required status.
- Bundled Monaco with Model/Schema/UI Schema/UI Schemas/Data/Config/Translations source selection, Apply/Revert, draft locking, draft-07 schema completion, and basic UI-schema/data tooling.
- Optional actual shadcn web-component preview and light/dark/system appearance. Source/preview panels retain state when hidden.
- `document-change` CustomEvents for committed snapshots and `draft-change` for pending source status. Example replacement prompts live in the demo host.

## Embed

Self-host the **entire `dist` directory**, including `renderer/`, Monaco chunks, workers, styles, and assets. Load its `jsonforms-svelte-editor.js` entry as a browser ES module. Bundler hosts must preserve the relative distribution layout; see the demo's Vite static-copy configuration.

```js
await import("/vendor/editor/jsonforms-svelte-editor.js");
await customElements.whenDefined("jsonforms-svelte-editor");
const editor = document.createElement("jsonforms-svelte-editor");
editor.documentId = "Person";
editor.initialForm = {
  schema: { type: "object", properties: { name: { type: "string" } } },
  uischema: {
    type: "VerticalLayout",
    elements: [{ type: "Control", scope: "#/properties/name" }],
  },
};
editor.editorMode = "system";
editor.addEventListener("document-change", (event) => {
  const { documentId, revision, document } = event.detail;
  // Host-owned persistence can consume this detached committed snapshot.
});
document.body.append(editor);
```

Assign initial properties before attachment, after registration. Values are copied on session creation; ordinary initialForm property echoes do not reset the current session. The host currently replaces the element to load another form after resolving unsaved changes. The full guarded replacement/save-acknowledgment API remains planned. `document-id` and `editor-mode` attributes are supported.

## Building blocks

- `EditorElement.svelte`: custom-element property/event boundary and shadow styles.
- `EditorPane.svelte`: composes the workspace panels; no command implementation.
- `components/editor/`: toolbar, palette, recursive canvas, inspector/property panel, source panel/Monaco adapter, preview panel/runtime adapter.
- `components/ui/`: unchanged copies of the repository's shadcn button and utility sources.
- `document/`: pure JSON operations, pointer helpers, initialization and validation.
- `state/`: reactive session, selection and history, invoking document operations.
- `source/`: document-specific completion schemas and bundled draft-07 meta-schema (from the installed AJV distribution).

The shadcn sources match `packages/jsonforms-svelte-shadcn-webcomponent/src/lib/components/ui` byte-for-byte. No component adjustments were made. A documented `--tw-border-style: solid` fallback in `editor.css` handles Tailwind property defaults across shadow roots; editor styles and interaction wrappers remain outside `components/ui`.

## Validation and remaining work

Run `pnpm --filter @chobantonov/jsonforms-svelte-editor test` for command tests. With the demo served on port 4178, run `pnpm --filter jsonforms-svelte-editor-demo test:browser`; set `EDITOR_DEMO_URL` for another URL.

This slice is not the full editor. Stable node IDs, the full schema tree/inspector, rename and type conversions, dialect selection, rules, templates, nested array authoring, a host descriptor registry, localization catalogs, split/file codecs, and separate Form Input/Output panels remain on the [implementation plan](../../docs/form-editor/implementation-plan.md). Unsupported elements retain their JSON and show authoring placeholders. Documents containing executable tester/validator/template strings are not previewed until trusted preview isolation is implemented. Theme isolation across multiple differently themed Monaco instances and complete UI-schema meta-schema coverage require follow-up verification.
