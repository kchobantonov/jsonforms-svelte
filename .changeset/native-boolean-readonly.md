---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Preserve checkbox and switch state when readonly is separated from disabled.
Use native readonly support for shadcn Checkbox and Skeleton Switch; disable
widgets whose native controls do not support readonly. Restore normal editing
when readonly is removed.
