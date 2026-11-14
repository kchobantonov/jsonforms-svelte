---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Use the shared composition-aware text controller for ordinary password inputs,
including Unicode code-point limits and schema replacement cancellation. Preserve
native readonly focus and selection for text inputs while preventing edits and
hiding Clear actions. Guard Skeleton's deferred native enum callbacks against
host data/schema replacement.
