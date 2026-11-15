---
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Honor readonly independently of disabled state in color, duration, file and null
controls. Preserve focusable readonly text, disable mutating picker actions,
close duration drafts and cancel pending color/file operations when permissions
change. Use the native shadcn checkbox readonly API for null values.
