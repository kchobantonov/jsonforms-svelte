---
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Keep file-size metadata only for attachments actually appended to a unique file array. Selecting an encoded duplicate no longer assigns selection-time size errors to a previously imported attachment or dispatches an unchanged array.
