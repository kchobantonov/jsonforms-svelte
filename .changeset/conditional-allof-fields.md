---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Project ordinary fields from referenced `allOf` branches when conditional-field
presentation is enabled. This keeps generated object details finite and makes
the referenced fields editable even when the branch has no `if` condition.
