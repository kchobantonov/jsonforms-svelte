---
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-webcomponent': patch
'@chobantonov/jsonforms-svelte-shadcn-webcomponent': patch
'@chobantonov/jsonforms-svelte-skeleton-webcomponent': patch
---

Forward validator-owned author diagnostics from each Web Component's default
AJV instance to its composed `diagnostic` event. Denied dynamic-default scripts
now reach the host without changing form data or validity. Default validators
start a fresh diagnostic interval when the authored schema changes; restoring
the same schema object after a valid interval reports an active warning again,
while data-only updates continue to reuse the validator.
