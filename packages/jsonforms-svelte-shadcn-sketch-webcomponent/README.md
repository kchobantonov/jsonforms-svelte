# Sketch shadcn JSON Forms web component

The browser module registers `<jsonforms-svelte-shadcn-sketch>`. It includes the
shadcn base and extended renderers, sketch components, Rough.js outlines, and
light/dark styling. A plain HTML host does not need Svelte or the separate sketch
UI package.

## Build or install

From this workspace, run `pnpm run build:libs` to build the dependencies and
the sketch Web Component. After that, `pnpm run wc:shadcn:sketch:build` rebuilds
only this bundle. For another project, install the package:

```sh
pnpm add @chobantonov/jsonforms-svelte-shadcn-sketch-webcomponent
```

Copy its complete `dist/` directory, including `chunks/` and `assets/`, to a
public location such as `/vendor/jsonforms-svelte-shadcn-sketch/`. Preserve the
directory layout. The component's styles and Patrick Hand font are embedded in
the shadow root bundle.

## npm CDN after publication

After publishing, replace `VERSION` with the exact package version and use one
of these module URLs in place of the self-hosted script below:

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@chobantonov/jsonforms-svelte-shadcn-sketch-webcomponent@VERSION/dist/jsonforms-svelte-shadcn-sketch.js"
></script>
```

```html
<script
  type="module"
  src="https://unpkg.com/@chobantonov/jsonforms-svelte-shadcn-sketch-webcomponent@VERSION/dist/jsonforms-svelte-shadcn-sketch.js"
></script>
```

The entry module loads its supporting chunks relative to its own URL. These
URLs are templates until the selected version is published.

## Plain HTML example

Serve the page and the copied bundle over HTTP(S):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sketch JSON Forms</title>
  </head>
  <body>
    <jsonforms-svelte-shadcn-sketch id="form"></jsonforms-svelte-shadcn-sketch>
    <pre id="result"></pre>
    <script
      type="module"
      src="/vendor/jsonforms-svelte-shadcn-sketch/jsonforms-svelte-shadcn-sketch.js"
    ></script>
    <script type="module">
      await customElements.whenDefined('jsonforms-svelte-shadcn-sketch');
      const form = document.getElementById('form');
      form.addEventListener('change', (event) => {
        if (event instanceof CustomEvent) {
          document.getElementById('result').textContent = JSON.stringify(
            event.detail.data,
            null,
            2,
          );
        }
      });
      form.schema = {
        type: 'object',
        properties: { name: { type: 'string' } },
      };
      form.uischema = { type: 'Control', scope: '#/properties/name' };
      form.data = { name: 'Ada' };
    </script>
  </body>
</html>
```

In a browser application with a bundler, importing
`@chobantonov/jsonforms-svelte-shadcn-sketch-webcomponent` registers the same
element. It accepts the same form properties and emits the same events as the
[standard shadcn Web Component](../jsonforms-svelte-shadcn-webcomponent/README.md#properties-and-attributes).
Use that guide for validation, localization, modes, action events, and the
complete property and attribute reference.

The repository's [packed browser test](../../tests/packed-webcomponents.spec.ts)
loads this published-file layout from a static server and checks form edits,
events, localization, and packaged assets.
