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

The extended data controls include color, duration, file, and null renderers with matching table cells. It also includes a theme-aware, lazy-loaded AG Grid array control selected with `options.variant: 'ag-grid'`; install `@chobantonov/jsonforms-svelte-ag-grid` alongside this package.
