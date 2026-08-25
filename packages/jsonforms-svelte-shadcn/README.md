# @chobantonov/jsonforms-svelte-shadcn

shadcn-svelte-themed JSON Forms renderers for Svelte 5.

## Installation

```bash
pnpm add @chobantonov/jsonforms-svelte-shadcn
```

The package declares its Svelte, JSON Forms, Bits UI, and renderer dependencies as peer dependencies. Your package manager will report any peers that the consuming application still needs to install.

### Install the Shadcn components

The renderer package does not ship generated Shadcn component source. In keeping with the
Shadcn ownership model, install the components into the consuming application:

```bash
pnpm dlx shadcn-svelte@latest add accordion avatar breadcrumb button calendar card checkbox collapsible dialog field input item label native-select popover radio-group select slider switch table tabs textarea toggle-group tooltip
```

The optional extended renderer set additionally requires:

```bash
pnpm dlx shadcn-svelte@latest add progress
```

The commands may install component dependencies such as `separator` automatically. Commit the
generated files so the application can customize and update them like any other app source.

Map the renderer's stable UI import prefix to the generated directory in `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    alias: {
      '@jsonforms-svelte-shadcn-ui': './src/lib/components/ui',
    },
  },
};

export default config;
```

If the application uses a plain Vite Svelte setup, define the equivalent `resolve.alias` and
TypeScript `paths` mapping. The prefix must support subpaths such as
`@jsonforms-svelte-shadcn-ui/button`.

For SvelteKit SSR, keep the renderer and its generated-component runtime in Vite's transform
pipeline:

```ts
ssr: {
  noExternal: [
    '@chobantonov/jsonforms-svelte-shadcn',
    '@chobantonov/jsonforms-svelte-shadcn-extended',
    'bits-ui',
  ],
},
```

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

The app-owned components and renderers use shadcn semantic tokens such as `--background`,
`--foreground`, `--primary`, `--border`, `--input`, and `--ring`. Define those variables in the
application theme. See the shadcn demo's `src/app.css` for a complete Tailwind 4 theme and
dark-mode setup.

## Included renderers

- Controls: string, masked string, password, multiline string, number, integer, boolean, toggle, enum, radio group, slider, date, time, and date-time
- Complex controls: arrays, enum arrays, objects, mixed schemas, `allOf`, `anyOf`, and `oneOf`
- Layouts: vertical, horizontal, group, array, categorization tabs, and categorization stepper
- Additional renderers: label and list-with-detail

Individual renderer components, registry entries, renderer-specific components, styles,
utilities, and i18n helpers are exported alongside `shadcnRenderers`. Generated Shadcn UI
primitives are deliberately not exported by this package; import and customize them from the
consuming application's component directory.

The `shadcn-svelte/tailwind.css` import maps shared variants such as `data-active`,
`data-open`, and `data-checked` to the state attributes emitted by Bits UI. The CLI is needed
only to add or update source components during development; it is never required at runtime.
