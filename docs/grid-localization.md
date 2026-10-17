# Native grid localization

All three AG Grid adapters use the host translator with JSON catalog fallbacks. Native `getLocaleText` takes precedence; native `localeText` entries override individual messages, including intentional empty strings.

AG Grid reads localization when it creates its controls. Its [localization documentation](https://www.ag-grid.com/javascript-data-grid/localisation/) requires recreation for a language change. The Svelte adapters therefore recreate the native grid after locale, translator, or native catalog changes, restoring its `GridState`. Ordinary data edits do not recreate it.

The pending-edit boundary flushes committable edits first. An open isolated detail dialog or a blocking editor draft defers recreation. A detail dialog continues using the live host translator while keeping its draft; after Apply or Cancel, the grid can refresh. This avoids discarding drafts as a side effect of translating pagination controls.

Executed browser cases cover EN→BG→French host messages, native overrides and empty labels, retained filtering/sorting/paging/column width/checkbox selection, an isolated dialog across locale change and Apply, and an invalid numeric cell draft that postpones recreation until corrected. All three families pass these cases. The complete AG Grid message catalog and production host acceptance remain separate work.
