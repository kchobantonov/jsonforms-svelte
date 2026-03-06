# @chobantonov/jsonforms-svelte-skeleton-webcomponent

Skeleton-based JSONForms Svelte 5 web component.

- Custom element tag: `jsonforms-svelte-skeleton`
- Bundle file: `jsonforms-svelte-skeleton.js`

## Installation

```bash
pnpm add @chobantonov/jsonforms-svelte-skeleton-webcomponent
```

## Usage

```html
<script type="module" src="./dist/jsonforms-svelte-skeleton.js"></script>

<jsonforms-svelte-skeleton
  schema='{"type":"object","properties":{"name":{"type":"string"}}}'
  uischema='{"type":"Control","scope":"#/properties/name"}'
  data='{"name":"John"}'
  locale="en"
  theme="modern"
  mode="system"
></jsonforms-svelte-skeleton>
```

## Playground

```bash
pnpm --filter @chobantonov/jsonforms-svelte-skeleton-webcomponent dev
```
