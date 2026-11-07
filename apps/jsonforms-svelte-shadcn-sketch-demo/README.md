# Sketch shadcn JSON Forms demo

Run `pnpm run example:shadcn:sketch:dev` from the workspace root. The app uses the same JSON Forms renderers and example schemas as the standard shadcn demo. Its `@jsonforms-svelte-shadcn-ui` alias resolves to `packages/jsonforms-svelte-shadcn-sketch-ui`, and its Web Component view loads the sketch custom element.

The existing appearance selector supports light, dark, and system modes. The shared sketch stylesheet defines both palettes and bundles Patrick Hand locally.
