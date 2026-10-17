---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-webcomponent': patch
'@chobantonov/jsonforms-svelte-shadcn-webcomponent': patch
'@chobantonov/jsonforms-svelte-skeleton-webcomponent': patch
'@chobantonov/jsonforms-svelte-demo-common': patch
---

Complete portable splitter sizing: fixed CSS dimensions, weighted remainder, vertical content sizing, per-pane bounds, gaps, alignment and constrained overflow. Preserve resized shares and mounted controls during data updates and responsive stacking.

Retain native Flowbite Pane/Divider components with a shared bounded controller because the native group lacks controlled per-pane constraints. Forward shadcn's native Resizable layout API and preserve the adapter during component sync. Harden drag ownership and cancellation, and add localized sizing examples with browser coverage for native and Web Component hosts.
