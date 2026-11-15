---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Keep enum-array checkbox and choice-card orientation local to
`options.vertical`, and keep choice-card radio-circle visibility local to
`options.showRadio`. Global `config.vertical`, tuple defaults, and global
`config.showRadio` no longer alter those groups. Checkbox and card groups
announce the orientation that they draw.
