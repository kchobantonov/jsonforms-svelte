---
'@chobantonov/jsonforms-svelte': minor
'@chobantonov/jsonforms-svelte-extended': minor
'@chobantonov/jsonforms-svelte-flowbite-webcomponent': minor
'@chobantonov/jsonforms-svelte-shadcn-webcomponent': minor
'@chobantonov/jsonforms-svelte-skeleton-webcomponent': minor
---

Provide a form-local renderer error store with per-instance ownership, generation checks for asynchronous results, explicit path relocation, pending state and cleanup. Merge its errors with host-supplied errors without replaying stale form data. Add a separate onvaliditychange callback covering schema errors, additional errors and pending validation while preserving the base onchange contract.

Forward combined validity through the extended form and a typed validity-change Web Component event; expose merged additional errors in the extended action context.
