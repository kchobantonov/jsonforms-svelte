# Sketch shadcn UI

This workspace owns the shadcn-svelte and shadcn-svelte-extras component source for the sketch demo and sketch web component. Both consumers resolve `@jsonforms-svelte-shadcn-ui` to `src/lib/components/ui`. The JSON Forms renderers are shared with the standard shadcn projects.

`src/lib/sketch.css` supplies the Patrick Hand font, paper/ink colors, and a CSS fallback for controls before hydration. `src/lib/outlines.ts` adds deterministic Rough.js SVG overlays around rendered shadcn control boxes. It redraws on size and theme changes, without replacing native controls or Bits UI behavior. The font and its license are in `assets/`.

The existing upstream sync scripts intentionally target the standard UI copies only. Review and copy upstream changes here separately so sketch styling and compatibility can be tested together.
