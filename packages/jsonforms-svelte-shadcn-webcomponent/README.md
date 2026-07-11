# @chobantonov/jsonforms-svelte-shadcn-webcomponent

A standalone shadcn-svelte JSON Forms custom element for Svelte 5. It includes the core and extended shadcn renderer sets and renders inside an open shadow root.

- Custom element: `jsonforms-svelte-shadcn`
- ESM bundle: `jsonforms-svelte-shadcn.js`

## Installation

```bash
pnpm add @chobantonov/jsonforms-svelte-shadcn-webcomponent
```

## Usage

Copy `dist/jsonforms-svelte-shadcn.js` to the application's public assets, load the ESM bundle, and provide JSON strings when configuring the element through HTML attributes:

```html
<script type="module" src="/js/jsonforms-svelte-shadcn.js"></script>

<jsonforms-svelte-shadcn
  schema='{"type":"object","properties":{"name":{"type":"string"}}}'
  uischema='{"type":"Control","scope":"#/properties/name"}'
  data='{"name":"John"}'
  locale="en"
  theme="slate"
  mode="system"
></jsonforms-svelte-shadcn>
```

For objects and arrays, application code can assign JavaScript properties directly:

```js
const form = document.querySelector('jsonforms-svelte-shadcn');

form.schema = schema;
form.uischema = uischema;
form.data = data;
```

## Properties

| Property           | Description                                                    | Default           |
| ------------------ | -------------------------------------------------------------- | ----------------- |
| `data`             | Form data as a value or JSON string                            | `undefined`       |
| `schema`           | JSON Schema as an object or JSON string                        | `undefined`       |
| `uischema`         | UI schema as an object or JSON string                          | `undefined`       |
| `uischemas`        | Registered UI schemas as an array or JSON string               | `[]`              |
| `config`           | JSON Forms configuration as an object or JSON string           | `{}`              |
| `readonly`         | Boolean or `"true"`/`"false"`                                  | `false`           |
| `validationMode`   | JSON Forms validation mode                                     | `ValidateAndShow` |
| `locale`           | Translation locale                                             | `en`              |
| `translations`     | Translation data as an object or JSON string                   | `undefined`       |
| `additionalErrors` | AJV errors as an array or JSON string                          | `[]`              |
| `theme`            | Color theme name                                               | `slate`           |
| `mode`             | `system`, `light`, or `dark`; boolean values are also accepted | `system`          |
| `customStyle`      | Additional CSS injected into the shadow root                   | Empty             |

Supported themes are `slate`, `zinc`, `neutral`, `stone`, `red`, `orange`, `green`, and `blue`.

## Events

The events bubble and cross the shadow boundary:

- `change`: `event.detail` contains the JSON Forms change event with the current data and validation errors.
- `handle-action`: `event.detail` contains an extended renderer action event.

```js
form.addEventListener('change', (event) => {
  console.log(event.detail.data, event.detail.errors);
});

form.addEventListener('handle-action', (event) => {
  console.log(event.detail);
});
```

## Development playground

From the monorepo root:

```bash
pnpm run wc:shadcn:dev
```

Use `pnpm run wc:shadcn:build` to create the production bundle or `pnpm run wc:shadcn:preview` to preview it.
