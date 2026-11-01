---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Select list/detail items by form-owned occurrence identity, preserving the selected editor through reorder, deletion of earlier items and reliably matched external moves. Clear selection when the owner is removed or replaced, including after reinsertion. Provide collection context to nested editors and preserve nested layout instances when their containing row moves.

Support primitive arrays in ListWithDetail, matching the React renderer applicability contract. Route list error indicators to the exact row instead of confusing JSON Pointer/data-path formats or matching row-index prefixes.
