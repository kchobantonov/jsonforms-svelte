# @chobantonov/jsonforms-svelte-shadcn-webcomponent

A standalone shadcn-svelte JSON Forms custom element built with Svelte 5. It includes
both the base and extended renderer sets, cells, validation, and styles inside an
open shadow root. The consuming page does not need Svelte or a build tool.

- Custom element: `jsonforms-svelte-shadcn`
- Browser ES module: `dist/jsonforms-svelte-shadcn.js`
- [Complete HTML example](#complete-html-example)
- [Properties and attributes](#properties-and-attributes)
- [Events](#events)

## Loading from an npm CDN

**Publication status (checked 2026-09-07):** this package is not yet available
on the public npm registry. The CDN URLs below show the expected paths for
version `1.0.1` after publication; they currently return 404. To run the HTML
sample now, build this package with `pnpm run wc:shadcn:build`, self-host its
`dist` directory as described below, and replace the sample's CDN import with
the local import. The npm installation command also requires publication first.

Load the browser bundle directly from jsDelivr:

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@chobantonov/jsonforms-svelte-shadcn-webcomponent@1.0.1/dist/jsonforms-svelte-shadcn.js"
></script>
```

Or use UNPKG with the same package version and file path:

```html
<script
  type="module"
  src="https://unpkg.com/@chobantonov/jsonforms-svelte-shadcn-webcomponent@1.0.1/dist/jsonforms-svelte-shadcn.js"
></script>
```

Choose **one** CDN. These examples pin version `1.0.1`; update the version to the
published release you want to use. The module registers `<jsonforms-svelte-shadcn>`
and loads its supporting chunks relative to its own URL. No separate renderer,
Svelte, or global stylesheet imports are needed for the form.

## Complete HTML example

Save this as `index.html` and serve it over HTTP(S). It loads the npm bundle,
configures a form, displays its current data and validation errors, and handles
an extended renderer button action. The page also demonstrates changing
properties after initialization.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>JSON Forms shadcn-svelte Web Component</title>
    <style>
      body {
        max-width: 800px;
        margin: 2rem auto;
        padding: 0 1rem;
        font-family: sans-serif;
      }
      jsonforms-svelte-shadcn {
        display: block;
        margin: 1rem 0;
      }
      pre {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
    </style>
  </head>
  <body>
    <h1>Profile</h1>
    <button id="reset" type="button">Reset data</button>
    <label><input id="readonly" type="checkbox" /> Read-only</label>
    <label>
      Appearance
      <select id="mode">
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>

    <div id="form-container"></div>
    <p id="status" role="status">Loading form…</p>
    <h2>Current data</h2>
    <pre id="data"></pre>
    <h2>Validation errors</h2>
    <pre id="errors"></pre>

    <script type="module">
      import 'https://cdn.jsdelivr.net/npm/@chobantonov/jsonforms-svelte-shadcn-webcomponent@1.0.1/dist/jsonforms-svelte-shadcn.js';

      await customElements.whenDefined('jsonforms-svelte-shadcn');
      const form = document.createElement('jsonforms-svelte-shadcn');
      form.id = 'form';
      form.locale = 'en';
      form.mode = 'system';
      const status = document.getElementById('status');
      const initialData = { name: 'Ada', age: 37, newsletter: false };

      // Register listeners before assigning the form inputs.
      form.addEventListener('change', (event) => {
        // Native input change events can also bubble out of the shadow root.
        if (!(event instanceof CustomEvent)) return;
        const { data, errors = [] } = event.detail;
        document.getElementById('data').textContent = JSON.stringify(data, null, 2);
        document.getElementById('errors').textContent = JSON.stringify(errors, null, 2);
        status.textContent = errors.length
          ? `${errors.length} validation error(s)`
          : 'Form is valid';
      });
      form.addEventListener('handle-action', (event) => {
        const { action, context, params } = event.detail;
        if (action === 'showData') {
          status.textContent = `${params.message} ${JSON.stringify(context.data)}`;
        }
      });

      form.schema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          age: { type: 'integer', minimum: 0 },
          newsletter: { type: 'boolean' },
        },
        required: ['name'],
      };
      form.uischema = {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/name' },
          { type: 'Control', scope: '#/properties/age' },
          { type: 'Control', scope: '#/properties/newsletter' },
          {
            type: 'Button',
            label: 'Show data',
            action: 'showData',
            params: { message: 'Current profile:' },
          },
        ],
      };
      form.config = { showUnfocusedDescription: true };
      form.validationMode = 'ValidateAndShow';
      form.data = { ...initialData };
      // Attach after configuring so the first render has all inputs.
      document.getElementById('form-container').append(form);

      document.getElementById('reset').addEventListener('click', () => {
        form.data = { ...initialData };
      });
      document.getElementById('readonly').addEventListener('change', (event) => {
        form.readonly = event.target.checked;
      });
      document.getElementById('mode').addEventListener('change', (event) => {
        form.mode = event.target.value;
      });
    </script>
  </body>
</html>
```

The `change` event supplies the current edited data; keep application state from
`event.detail.data` rather than treating the `data` input property as an output
binding. Assign a new object or array to update the form externally, rather than
mutating a nested input in place.

## npm installation and self-hosting

```bash
pnpm add @chobantonov/jsonforms-svelte-shadcn-webcomponent
```

Copy the package's **entire `dist` directory**, including `chunks/` and `assets/`,
to a public directory such as `/vendor/jsonforms-svelte-shadcn/`. Preserve its layout;
copying only the entry JavaScript file is not sufficient. Then replace the CDN
import in the example with:

```js
import '/vendor/jsonforms-svelte-shadcn/jsonforms-svelte-shadcn.js';
```

Serve the files over HTTP(S) with JavaScript module MIME types. The entry point
is a browser module that registers the element as a side effect, not a component
constructor to instantiate or a Node.js entry point.

## Properties and attributes

Prefer JavaScript properties for objects and arrays. HTML attributes contain
strings; serialize JSON-valued inputs with JSON. Wait for
`customElements.whenDefined('jsonforms-svelte-shadcn')` before assigning properties.

| JavaScript property | HTML attribute     | Accepted value / purpose                                                                                            | Default            |
| ------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `data`              | `data`             | Any JSON-compatible form value, or serialized JSON. A string that cannot be parsed as JSON is retained as a string. | `undefined`        |
| `schema`            | `schema`           | JSON Schema object or JSON string.                                                                                  | `undefined`        |
| `uischema`          | `uischema`         | JSON Forms UI schema object or JSON string; omitted UI schemas are generated by JSON Forms.                         | `undefined`        |
| `uischemas`         | `uischemas`        | Additional UI schema registry entries; use properties for entries containing tester functions.                      | `[]` after parsing |
| `config`            | `config`           | JSON Forms configuration object or JSON string.                                                                     | `{}`               |
| `readonly`          | `readonly`         | Boolean or string `"true"` / `"false"`.                                                                             | `false`            |
| `validationMode`    | `validationmode`   | `ValidateAndShow`, `ValidateAndHide`, or `NoValidation`.                                                            | `ValidateAndShow`  |
| `locale`            | `locale`           | Locale for translation and validation messages, such as `en`, `de`, or `bg`.                                        | `en`               |
| `translations`      | `translations`     | Object keyed by locale, or its JSON string.                                                                         | `undefined`        |
| `additionalErrors`  | `additionalerrors` | Array of AJV error objects, or JSON string, for external validation errors.                                         | `[]`               |
| `mode`              | `mode`             | `system`, `light`, or `dark`; `auto` means system, and booleans / `"true"` / `"false"` mean dark / light.           | `system`           |
| `customStyle`       | `customstyle`      | CSS text appended inside the shadow root.                                                                           | `''`               |
| `theme`             | `theme`            | Included color theme name; see below.                                                                               | `slate`            |
| `designSystem`      | `designsystem`     | Design-system configuration object or JSON string; normalized using the renderer defaults.                          | See below          |

Attribute names are lowercase, without hyphens: use `validationmode`, not
`validation-mode`. In JavaScript use the camelCase names shown above. The
`readonly` parser requires an explicit value: use `readonly="true"`, not a bare
`readonly` attribute.

```html
<jsonforms-svelte-shadcn
  schema='{"type":"object","properties":{"name":{"type":"string"}}}'
  data='{"name":"Ada"}'
  readonly="true"
  validationmode="ValidateAndHide"
></jsonforms-svelte-shadcn>
```

For a literal string that also parses as JSON (for example `"123"`), use
`form.data = JSON.stringify('123')` to preserve its string type.

### Translation and styling

```js
form.locale = 'de';
form.translations = {
  en: { name: { label: 'Name' } },
  de: { name: { label: 'Name auf Deutsch' } },
};
form.customStyle = ':host { display: block; }';
form.setAttribute('dir', 'rtl'); // Standard HTML direction attribute.
```

Translation lookup uses the requested locale, then its language prefix (for
example `de` for `de-DE`), then English when the locale dictionary is missing.
Missing messages fall back to the JSON Forms default. Page CSS does not cross
the shadow boundary; use `customStyle` for CSS targeting the rendered form.

The base stylesheet includes `slate`, `zinc`, `neutral`, `stone`, `red`, `orange`,
`green`, and `blue` themes. The generated `designSystem` CSS is applied afterward
and takes precedence for the tokens it defines. Use `designSystem` to configure
the effective palette, style, typography, and radius:

```js
form.designSystem = {
  style: 'nova',
  baseColor: 'neutral',
  theme: 'blue',
  radius: 'large',
};
```

Defaults are `style: 'nova'`, `baseColor: 'neutral'`, `theme: 'neutral'`,
`chartColor: 'neutral'`, `iconLibrary: 'lucide'`, `fontHeading: 'inherit'`,
`font: 'inter'`, `radius: 'default'`, `menuColor: 'default'`, and
`menuAccent: 'subtle'`. Partial configurations are supported. See the
[design-system options](../jsonforms-svelte-shadcn/src/lib/theme/design-system.ts)
for accepted values. Font choices set CSS font families; load any desired web
fonts in the host application.

## Events

Both events are `CustomEvent`s with `bubbles: true` and `composed: true`, so they
can be handled on the element or an ancestor outside the shadow root.
`event.detail` is an **object**, not an array.

| Event           | `event.detail`                                                                    | When emitted                                                                        |
| --------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `change`        | `{ data, errors }`, where `errors` contains AJV validation errors when available. | Initial form evaluation and JSON Forms data/validation changes.                     |
| `handle-action` | `{ action, params, context, $el, callback? }`.                                    | An extended renderer dispatches a named action, such as the `Button` in the sample. |

`context` provides the current form state, including `data`, `schema`,
`uischema`, `errors`, `config`, and `locale`; `$el` is the originating element.
For asynchronous action handling, assign `event.detail.callback` synchronously
in the listener so the renderer can await your work:

```js
form.addEventListener('handle-action', (event) => {
  if (event.detail.action === 'save') {
    event.detail.callback = async ({ context }) => {
      console.log('Save this data:', context.data);
      // await your application's save operation here.
    };
  }
});
```

No submission or network request is performed automatically. Your application
handles persistence and decides whether validation errors allow submission.

## Development playground

From the monorepo root:

```bash
pnpm run wc:shadcn:dev
pnpm run wc:shadcn:build
pnpm run wc:shadcn:preview
```
