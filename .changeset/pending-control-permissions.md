---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Recheck enabled and readonly state before control changes commit. Cancel queued
changes when their data, schema or path is replaced, or editing permission is
revoked, so delayed native editor callbacks cannot overwrite a newer form value.
