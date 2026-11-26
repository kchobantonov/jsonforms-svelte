# Sketch shadcn UI

This workspace owns the shadcn-svelte and shadcn-svelte-extras component source for the sketch demo and sketch web component. Both consumers resolve `@jsonforms-svelte-shadcn-ui` to `src/lib/components/ui`. The JSON Forms renderers are shared with the standard shadcn projects.

`src/lib/sketch.css` supplies the Patrick Hand font, paper/ink colors, and a CSS fallback for controls before hydration. `src/lib/outlines.ts` adds deterministic Rough.js SVG overlays around rendered shadcn control boxes. It redraws on size and theme changes, without replacing native controls or Bits UI behavior. The font and its license are in `assets/`.

## Use in a SvelteKit app

Install the regular shadcn renderer and this component package. Add the optional
extended renderer package when the form uses extended controls:

```sh
pnpm add @chobantonov/jsonforms-svelte-shadcn @chobantonov/jsonforms-svelte-shadcn-sketch-ui
pnpm add @chobantonov/jsonforms-svelte-shadcn-extended
```

Point the renderer's UI alias at the installed sketch components in
`svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess({ script: true }),
  kit: {
    adapter: adapter(),
    alias: {
      '@jsonforms-svelte-shadcn-ui':
        './node_modules/@chobantonov/jsonforms-svelte-shadcn-sketch-ui/src/lib/components/ui',
    },
  },
};
```

Keep the [standard shadcn Tailwind setup](../jsonforms-svelte-shadcn/README.md#tailwind-css-42)
and add the sketch stylesheet and component source to `src/app.css`. Adjust
the `@source` path if the stylesheet lives elsewhere:

```css
@import '@chobantonov/jsonforms-svelte-shadcn-sketch-ui/sketch.css';
@source '../node_modules/@chobantonov/jsonforms-svelte-shadcn-sketch-ui/src/lib/components/ui';
```

Attach the outline action to an ancestor of the form:

```svelte
<script lang="ts">
  import { sketchElements } from '@chobantonov/jsonforms-svelte-shadcn-sketch-ui/outlines';
</script>

<div use:sketchElements>
  <!-- Place JsonForms with the regular shadcn renderer registry here. -->
</div>
```

Follow the [shadcn renderer setup](../jsonforms-svelte-shadcn/README.md) for
`JsonForms`, renderer registration, peers, preprocessing and SSR. Use this
package's alias in place of the app-owned generated component directory. The
[sketch demo](../../apps/jsonforms-svelte-shadcn-sketch-demo/README.md) shows a
working workspace host. For a host without Svelte, use the
[sketch Web Component](../jsonforms-svelte-shadcn-sketch-webcomponent/README.md).

The official registry and the Stepper and Tags Input sync commands target the standard UI copies. Merge their pinned updates into this sketch copy and review overlapping changes so sketch styling and compatibility can be tested together. The Color Picker sync command updates all three UI copies.
