---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Flush pending debounced control edits on blur so immediate tab navigation preserves the latest value. Cancel pending callbacks when a control is removed so an old edit cannot overwrite externally replaced root data.
