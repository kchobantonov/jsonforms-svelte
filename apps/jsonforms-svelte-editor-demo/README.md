# Editor demo

A Vite + TypeScript browser host for `@chobantonov/jsonforms-svelte-editor`. It exercises the web-component API without a Svelte application dependency. A native-Svelte integration mode is a confirmed follow-up target.

Run `pnpm editor:demo:dev` from the repository root. Select an example in the top bar to inspect its layout and schema fields. The host loads JSON fixtures from `packages/jsonforms-svelte-demo-common/src/lib/examples`; examples with both schema and UI schema are available. The selector confirms discarding committed edits or pending source drafts before switching.

Select a layout, then click a palette element or drag a field into a drop target. Select a control to edit its label, multiline setting, or required status. Use Model to open Monaco and Apply/Revert source changes. Preview toggles the actual runtime form. Examples with unsupported/executable extensions show explicit limitations.

`src/main.ts` owns resource assembly and passes the initial model into a fresh custom element. The editor itself has no file/network/database loading logic. The distribution is served intact under `editor/`, including renderer and Monaco assets.

Production: `pnpm editor:demo:build`, then `pnpm editor:demo:preview`.

Browser regression: serve the production demo on port 4178, then run `pnpm --filter jsonforms-svelte-editor-demo test:browser`. Override `EDITOR_DEMO_URL` if necessary. The test uses Chromium through Playwright.
