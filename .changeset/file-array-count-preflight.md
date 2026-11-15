---
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Reject a restricted non-unique file batch that would exceed `maxItems` before starting file conversion. Keep the post-conversion count check for `uniqueItems`, where encoded duplicates can reduce the final count.
