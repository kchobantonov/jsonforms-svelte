# @chobantonov/jsonforms-svelte-shadcn-extended

Optional extended renderers for `@chobantonov/jsonforms-svelte-shadcn`. These are custom renderers beyond the main JSON Forms renderer set.

## Installation

```bash
pnpm add @chobantonov/jsonforms-svelte-shadcn-extended @chobantonov/jsonforms-svelte-shadcn
```

## Usage

Append the extended registry after the core registry:

```ts
import { shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import { shadcnExtendedRenderers } from '@chobantonov/jsonforms-svelte-shadcn-extended';

const renderers = [...shadcnRenderers, ...shadcnExtendedRenderers];
```

Add the package to the Tailwind 4 source list:

```css
@source '../node_modules/@chobantonov/jsonforms-svelte-shadcn-extended/dist';
```

This path assumes the stylesheet is `src/app.css`; adjust it relative to the stylesheet when it lives elsewhere.

## Included renderers

- Button control
- Duration control
- File control
- Null control
- Split layout
- Shared slot, template, and template-layout renderers from `@chobantonov/jsonforms-svelte-extended`

The package exports `shadcnExtendedRenderers`, the control and layout registry arrays, individual renderer components, and their registry entries.
