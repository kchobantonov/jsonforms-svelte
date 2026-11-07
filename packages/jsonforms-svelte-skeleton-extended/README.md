# @chobantonov/jsonforms-svelte-skeleton-extended

See the [family capability declaration](../../docs/renderers/README.md) for
extended entries, runtime requirements and known limits.

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

The extended controls include Button, color, cron, duration, file, null and
Monaco code/JSON editors. Color, cron, duration, file and null have compact
cell entries where their testers apply. Link and split layouts are family
adapters; markup labels, slots and templates come from the shared extended
package. A Skeleton-aware AG Grid array control is lazy-loaded when
`options.variant: 'ag-grid'` applies; install `ag-grid-community` for it.

Include both extended packages in your Tailwind 4 source list (paths below assume `src/app.css`):

```css
@source '../node_modules/@chobantonov/jsonforms-svelte-skeleton-extended/dist';
@source '../node_modules/@chobantonov/jsonforms-svelte-extended/dist';
```
