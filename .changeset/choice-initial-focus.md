---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Apply flat and local initial-focus configuration to enum selects, searchable choices, radio choices, sliders and extended controls including Cron. Capture the effective focus request when a control mounts so later data or option changes do not reclaim focus, while preserving disabled and readonly behavior across standard and extended controls.
