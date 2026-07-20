# @chobantonov/jsonforms-svelte-shadcn

shadcn-svelte-themed JSON Forms renderers for Svelte 5.

## Installation

```bash
pnpm add @chobantonov/jsonforms-svelte-shadcn
```

The package declares its Svelte, JSON Forms, Bits UI, and renderer dependencies as peer dependencies. Your package manager will report any peers that the consuming application still needs to install.

## Usage

```svelte
<script lang="ts">
  import { JsonForms } from '@chobantonov/jsonforms-svelte';
  import { shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';

  let data = $state({ name: '' });

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
  };

  const uischema = {
    type: 'Control',
    scope: '#/properties/name',
  };
</script>

<JsonForms
  {data}
  {schema}
  {uischema}
  renderers={shadcnRenderers}
  onchange={(event) => (data = event.data)}
/>
```

To include the optional extended set:

```ts
import { shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import { shadcnExtendedRenderers } from '@chobantonov/jsonforms-svelte-shadcn-extended';

const renderers = [...shadcnRenderers, ...shadcnExtendedRenderers];
```

## Tailwind CSS 4.2

Install the same Tailwind support packages that the official shadcn-svelte initializer adds:

```bash
pnpm add -D shadcn-svelte tw-animate-css
```

Include Tailwind, the animation utilities, and shadcn-svelte's shared state variants. Then
explicitly scan the renderer packages from the consuming application's stylesheet:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import 'shadcn-svelte/tailwind.css';

@source '../node_modules/@chobantonov/jsonforms-svelte/dist';
@source '../node_modules/@chobantonov/jsonforms-svelte-shadcn/dist';
```

When using the extended set, add:

```css
@source '../node_modules/@chobantonov/jsonforms-svelte-shadcn-extended/dist';
```

These paths assume the stylesheet is `src/app.css`; adjust them relative to the stylesheet when it lives elsewhere.

The components use shadcn semantic tokens such as `--background`, `--foreground`, `--primary`, `--border`, `--input`, and `--ring`. Define those variables in the application theme. See the shadcn demo's `src/app.css` for a complete Tailwind 4 theme and dark-mode setup.

## Included renderers

- Controls: string, masked string, password, multiline string, number, integer, boolean, toggle, enum, radio group, slider, date, time, and date-time
- Complex controls: arrays, enum arrays, objects, mixed schemas, `allOf`, `anyOf`, and `oneOf`
- Layouts: vertical, horizontal, group, array, categorization tabs, and categorization stepper
- Additional renderers: label and list-with-detail

Individual renderer components, registry entries, shadcn UI primitives, styles, utilities, and i18n helpers are exported alongside `shadcnRenderers`.

The `shadcn-svelte/tailwind.css` import maps shared variants such as `data-active`,
`data-open`, and `data-checked` to the state attributes emitted by Bits UI. The UI primitives
are local generated-style Svelte components built on Bits UI. Using this package does not
require running the `shadcn-svelte` CLI at runtime.
