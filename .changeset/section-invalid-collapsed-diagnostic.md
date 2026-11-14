---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Report a stable author diagnostic when the effective section `collapsed` option has a non-boolean value. Valid local values suppress warnings from lower-priority settings, and invalid values continue to use the next valid collapse default without truthiness coercion.
