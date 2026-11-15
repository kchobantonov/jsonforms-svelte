# Catalog translation

Demos and Web Components use `createCatalogTranslator` from `@chobantonov/jsonforms-svelte`.

```ts
const translate = createCatalogTranslator('bg-BG', {
  'bg-BG': { greeting: 'Здравейте' },
  bg: { count: 'Брой ${count}' },
  en: { help: 'Help' },
});

translate('greeting'); // Здравейте
translate('count', undefined, { count: 2 }); // Брой 2
translate('help'); // Help
translate('missing', 'Fallback'); // Fallback
translate('missing'); // undefined
```

Each message is looked up in the exact locale, its language, English, then the supplied fallback. Empty strings are intentional translations. Flat keys take precedence over nested paths, and lookup uses only own properties.

Legacy `${name}` parameters substitute current values on every call. Parsed segments are cached within the translator and released when it becomes unreachable. Missing parameters retain their authored placeholder. Expressions and executable template syntax remain literal text; extended renderer expression interpolation uses its separate presentation policy.

Create a new translator when replacing the locale or catalog. Web Components do this reactively and preserve form data during locale changes. EN/BG fallback and changing interpolation values have shared unit coverage; packed Web Component browser tests exercise regional fallback and live locale replacement.

## Renderer UI messages

Renderer messages live in `packages/jsonforms-svelte/src/lib/locales/messages.json`.
Edit the catalog to change wording or add a language; components must not branch on a locale
or embed translated alternatives. `useRendererMessages()` resolves the active host translator
first (including empty translations), with catalog defaults for the requested locale, its base
language, and English. Locale identifiers are normalized for case and underscore separators.
Parameters use inert `{name}` or `${name}` substitution.

The shared catalog covers Boolean state hints, password and clear actions, Button diagnostics,
file actions and size errors, editor actions, color feedback, markup, images, and layout diagnostics.
Applications can supply any other locale through their existing JSON catalog and
`createCatalogTranslator`, without changing renderer code.
