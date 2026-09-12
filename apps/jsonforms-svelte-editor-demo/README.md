# Editor demo

A minimal Vite + TypeScript browser host for `@chobantonov/jsonforms-svelte-editor`. Deliberately uses the web-component API without a Svelte app dependency to exercise framework-independent embedding.

Run `pnpm editor:demo:dev` from the repository root. Open the URL printed by Vite. The Person workspace should list `name` and `email`; View initial model shows the supplied JSON. The appearance selector controls only the embedded editor.

`src/main.ts` owns the sample JSON and passes it as properties before attaching the element. Replace those values with any host-loaded resources. No filesystem or network resource loading is implemented in the editor.

Production: `pnpm editor:demo:build`, then `pnpm editor:demo:preview`.
