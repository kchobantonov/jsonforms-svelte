---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Honor the legacy `showArrayTableSortButtons` and `showArrayLayoutSortButtons` options alongside `showSortButtons` in native arrays. AG Grid also uses the table alias for row dragging. After local options override the same config key, the generic and applicable presentation flag are combined with logical OR.
