# @chobantonov/jsonforms-svelte-shadcn-webcomponent

Shadcn-based JSONForms Svelte 5 web component.

- Custom element tag: `jsonforms-svelte-shadcn`
- Bundle file: `jsonforms-svelte-shadcn.js`

## Installation

```bash
pnpm add @chobantonov/jsonforms-svelte-shadcn-webcomponent
```

## Usage

```html
<script type="module" src="./dist/jsonforms-svelte-shadcn.js"></script>

<jsonforms-svelte-shadcn
  schema='{"type":"object","properties":{"name":{"type":"string"}}}'
  uischema='{"type":"Control","scope":"#/properties/name"}'
  data='{"name":"John"}'
  locale="en"
  theme="modern"
  mode="system"
></jsonforms-svelte-shadcn>
```

## Playground

```bash
pnpm --filter @chobantonov/jsonforms-svelte-shadcn-webcomponent dev
```
