# @chobantonov/jsonforms-svelte-flowbite-webcomponent

Flowbite-based JSONForms Svelte 5 web component.

- Custom element tag: `jsonforms-svelte-flowbite`
- Bundle file: `jsonforms-svelte-flowbite.js`

## Installation

```bash
pnpm add @chobantonov/jsonforms-svelte-flowbite-webcomponent
```

## Usage

```html
<script type="module" src="./dist/jsonforms-svelte-flowbite.js"></script>

<jsonforms-svelte-flowbite
  schema='{"type":"object","properties":{"name":{"type":"string"}}}'
  uischema='{"type":"Control","scope":"#/properties/name"}'
  data='{"name":"John"}'
  locale="en"
></jsonforms-svelte-flowbite>
```

## Playground

```bash
pnpm --filter @chobantonov/jsonforms-svelte-flowbite-webcomponent dev
```
