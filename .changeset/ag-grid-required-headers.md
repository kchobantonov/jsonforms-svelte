---
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Mark required AG Grid columns with an asterisk, including grouped native columns, while honoring grid-wide and per-cell `hideRequiredAsterisk` options. Remove the generated row-drag column while a grid is read-only and restore it when editing is enabled. Share one injected runtime stylesheet per root and remove it after the last grid unmounts, preserving host-supplied styles.
