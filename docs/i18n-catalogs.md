# Catalog translation

Demos and Web Components use `createCatalogTranslator` from `@chobantonov/jsonforms-svelte-renderer-common`.

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

Renderer catalogs live in `packages/jsonforms-svelte-renderer-common/src/lib/locale/{en,bg}.ts`. Demo shell catalogs live in `packages/jsonforms-svelte-demo-common/src/lib/i18n/{en,bg}.ts`. English defines the message keys, and TypeScript checks that Bulgarian supplies every key. Example translations stay with their example data.
For a new message, add the key to `en.ts` and translate it in `bg.ts` in the same directory. To ship another built-in language, add a module alongside them using the same `satisfies Record<keyof typeof en, string>` check as Bulgarian, then register it under its locale code in that directory’s `messages.ts`. The renderer and demo shell each have their own registry. `useRendererMessages()` resolves the active host translator
first (including empty translations), with catalog defaults for the requested locale, its base
language, and English. Locale identifiers are normalized for case and underscore separators.
Parameters use inert `{name}` or `${name}` substitution.

The shared catalog covers Boolean state hints, password and clear actions, Button diagnostics,
file actions and size errors, editor actions, color feedback, markup, images, and layout diagnostics.
Applications can supply any other locale through their existing JSON catalog and
`createCatalogTranslator`, without changing renderer code.
