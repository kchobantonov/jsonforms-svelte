---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
---

Use each renderer family's native split pane in ListWithDetail. The list and detail start at a 25/75 split, support resizing and responsive stacking, and retain the selected detail editor during layout changes. Adding an item now selects it and opens its detail editor immediately.
