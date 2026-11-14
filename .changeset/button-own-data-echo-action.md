---
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Allow a Button action to consume a completed pending edit when the host echoes that edit and recreates equivalent UI schema during the flush. Keep pre-flush host replacement guards and cancel the action if its authored target or flushed data changes afterward.
