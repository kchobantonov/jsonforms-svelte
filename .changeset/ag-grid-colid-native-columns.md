---
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Preserve JSON Forms cell rendering for AG Grid native columns that identify a schema field by `colId` alone. Name primitive-array value columns `value` so React-compatible native overrides reach them. Honor authored row-drag columns, including grouped and computed columns, without adding a duplicate generated drag handle.
