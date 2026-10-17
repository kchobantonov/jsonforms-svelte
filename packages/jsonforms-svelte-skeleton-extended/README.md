# @chobantonov/jsonforms-svelte-skeleton-extended

Extended renderer set for `@chobantonov/jsonforms-svelte-skeleton`.

This package contains non-official or custom renderers intended to be composed together with the official renderer set.

Compose both registries to make the extended controls available in forms and table cells:

```ts
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import {
  skeletonExtendedCells,
  skeletonExtendedRenderers,
} from '@chobantonov/jsonforms-svelte-skeleton-extended';

const renderers = [...skeletonRenderers, ...skeletonExtendedRenderers];
const cells = [...skeletonCells, ...skeletonExtendedCells];
```

The extended data controls include color, duration, file, and null renderers with matching table cells. It also owns a Skeleton-aware, lazy-loaded AG Grid array control selected with `options.variant: 'ag-grid'`; install `ag-grid-community` alongside this package.

Include both extended packages in your Tailwind 4 source list (paths below assume `src/app.css`):

```css
@source '../node_modules/@chobantonov/jsonforms-svelte-skeleton-extended/dist';
@source '../node_modules/@chobantonov/jsonforms-svelte-extended/dist';
```
