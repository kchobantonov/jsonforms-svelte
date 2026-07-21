# @chobantonov/jsonforms-svelte-flowbite-extended

Extended renderer set for `@chobantonov/jsonforms-svelte-flowbite`.

This package contains non-official or custom renderers intended to be composed together with the official renderer set.

Compose both registries to make the extended controls available in forms and table cells:

```ts
import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import {
  flowbiteExtendedCells,
  flowbiteExtendedRenderers,
} from '@chobantonov/jsonforms-svelte-flowbite-extended';

const renderers = [...flowbiteRenderers, ...flowbiteExtendedRenderers];
const cells = [...flowbiteCells, ...flowbiteExtendedCells];
```
