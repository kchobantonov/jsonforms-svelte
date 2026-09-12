# JSON Forms editor web component

Thin custom-element wrapper around the native Svelte editor. The public tag remains `<jsonforms-svelte-editor>`. Form resource acquisition and persistence belong to the host.

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


Build from the repository root with `pnpm editor:build`. See the [native editor README](../jsonforms-svelte-editor/README.md) for current capabilities and limitations.

## Shared shadcn sources

`src/components/ui` is the unchanged repository shadcn component set. The wrapper and demo map `@jsonforms-svelte-shadcn-ui` to this directory for both the editor and its native JSON Forms inspector. Customize a shared component here (with owner awareness) and rebuild to update both consumers. The separately bundled preview renderer has its own component distribution.
