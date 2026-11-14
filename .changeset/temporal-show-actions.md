---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Honor `showActions: false` for month and year date/date-time pickers: publish
valid selections immediately and omit OK/Cancel. With `showActions: true`, keep
selection staged until confirmation. Flowbite also preserves the selected day
when changing a coarse calendar view.
