# Sketch shadcn JSON Forms web component

Build with `pnpm run wc:shadcn:sketch:build`. The bundle registers `<jsonforms-svelte-shadcn-sketch>` and uses the shared sketch UI package for its shadcn components, Rough.js outlines, and light/dark styling. It accepts the same form properties and emits the same events as `<jsonforms-svelte-shadcn>`; see the standard web component README for that API.

Distribute the entire `dist/` directory together. The component's styles and Patrick Hand font are embedded in the shadow root bundle.
