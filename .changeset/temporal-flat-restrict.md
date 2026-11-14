---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
---

Use authored flat `config.restrict` for date, time and date-time pickers, with local `options.restrict` taking precedence. Ignore the removed `jsonformsExtended.restrict` path consistently with other controls.
