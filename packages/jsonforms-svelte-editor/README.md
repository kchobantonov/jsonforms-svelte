# JSON Forms editor web component

Initial Svelte 5 / shadcn-svelte scaffold. Registers `<jsonforms-svelte-editor>` with an open shadow root and bundled styles/runtime; consumers do not need Svelte. The package is private while its API is being developed.

## Run the demo

From the repository root:

```sh
pnpm editor:demo:dev
```

This builds the package before starting the demo. After editing package sources, rebuild with `pnpm editor:build` and reload the demo. Build both projects with `pnpm editor:demo:build`; serve the production demo with `pnpm editor:demo:preview`.

## Embed

Load `dist/jsonforms-svelte-editor.js` as a browser ES module, or import the workspace package in a bundler:

```js
import "@chobantonov/jsonforms-svelte-editor";

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
editor.editorMode = "system"; // light | dark | system
document.body.append(editor);
```

Assign JSON through properties after registration. The host obtains the resources; this package performs no form loading or saving. Omit `initialForm` for an empty workspace. `document-id` and `editor-mode` are also supported attributes.

The current pane displays supplied property names, an authoring placeholder, and a toggleable read-only initial-model view. It does not yet edit forms, provide Monaco, preview runtime forms, translate UI strings, or implement the planned document lifecycle/change API. The initial-model view is explicitly a scaffold inspection aid, not the planned source editor.

The local button component and utility are copied from the repository's existing shadcn web-component component set. Tailwind styles are compiled into the shadow root. The reusable Svelte pane is separate from its custom-element wrapper for future feature work.

See [the implementation plan](../../docs/form-editor/implementation-plan.md).
