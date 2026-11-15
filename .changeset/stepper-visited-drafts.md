---
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
---

Keep previously visited categorization step panels mounted but hidden and inert so pending text edits survive step navigation. Unopened steps remain unmounted to avoid premature initial focus. The shadcn stepper also avoids remounting all panels when named categories reorder.
