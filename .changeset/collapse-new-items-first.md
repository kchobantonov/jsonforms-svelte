---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Honor `collapseNewItems` when adding the first item to an empty expandable
array. Clear the placeholder expansion for that new position while preserving
an already expanded older item.
