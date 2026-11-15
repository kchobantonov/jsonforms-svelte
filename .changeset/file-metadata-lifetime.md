---
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Discard selection-time file-size metadata when its encoded value leaves the control. Importing the same string later no longer revives an error from a removed attachment. Preserve metadata for retained values, including array reordering, and preserve unrelated host errors.

Mount AG Grid cell components independently of parent reactive effects so asynchronous feedback remains live after tab transitions, including in Shadow DOM. Cancel a scheduled mount if AG Grid destroys the cell first, and use the latest cell props if it refreshes before mounting.
