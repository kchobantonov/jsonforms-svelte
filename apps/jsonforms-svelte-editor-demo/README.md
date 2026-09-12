# Editor demo

A Vite + TypeScript browser host for `@chobantonov/jsonforms-svelte-editor`. Native Svelte is the default integration. The Integration selector switches between the native Svelte editor and the separate web-component wrapper.

Run `pnpm editor:demo:dev` from the repository root. The default is **New form (blank)**, with no `initialForm` supplied to the editor. Use **New form** to start again with unsaved-change confirmation, or select an example in the top bar to inspect its layout and schema fields. The host loads JSON fixtures from `packages/jsonforms-svelte-demo-common/src/lib/examples`; examples with both schema and UI schema are available. The selector confirms discarding committed edits or pending source drafts before switching.

Select a layout, then click a palette element or drag a field into a drop target. Select a control to edit its label, multiline setting, or required status. Use Model to open Monaco and Apply/Revert source changes. Preview toggles the actual runtime form. Examples with unsupported/executable extensions show explicit limitations.

`src/main.ts` owns resource assembly and passes the initial model into a fresh native component or custom element. The editor itself has no file/network/database loading logic. The distribution is served intact under `editor/`, including renderer and Monaco assets.

Production: `pnpm editor:demo:build`, then `pnpm editor:demo:preview`.

Browser regression: serve the production demo on port 4178, then run `pnpm --filter jsonforms-svelte-editor-demo test:browser`. Override `EDITOR_DEMO_URL` if necessary. The test uses Chromium through Playwright.

The demo maps `@jsonforms-svelte-shadcn-ui` to the editor wrapper’s `src/components/ui`. Native inspector renderers and editor controls share that mapping. An application may map the alias to its own shadcn sources instead; include the same sources in Tailwind scanning.

The source selector is a themed shadcn Select. The schema panel is an expandable tree with keyboard navigation and whole-object/array drag sources; array-item detail authoring remains planned.

Form language is selected in the Form preview header when the form supplies
translation catalogs. Available locale codes come from that form, not a fixed
list in the demo toolbar.

The Schema tree now offers Add, Rename and Delete dialogs. Use **Add definition**
on the root to create a reusable schema; select that definition when adding a
property. Add an array with object items, expand `items`, and add child properties.
Referenced schemas must have their bindings removed before deletion. Changes are
undoable and appear in JSON Model.

New renderer examples in the example selector:

- `presentation-renderers`: Label, Separator, default/custom Spacer heights and
  Image View with an embedded image and alternative text.
- `selection-renderers`: enum and oneOf dropdowns, radio group and checkbox group.

Select an example and switch to Validate to compare the canvas with live rendering.

The Pages shell links to the editor at `./editor/`. `pnpm build:pages` builds the
editor packages and demo, then copies the demo's `dist` directory into the shell
artifact. Relative asset paths support hosting the shell under a nested URL.
