---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite-webcomponent': patch
'@chobantonov/jsonforms-svelte-shadcn-webcomponent': patch
'@chobantonov/jsonforms-svelte-skeleton-webcomponent': patch
---

Expose current automatic schema validation in combined-validity notifications. NoValidation no longer reports an empty-error form as valid. Notify hosts when validation modes change without a data edit, preserving pending and additional-error contributions for submit guards.
