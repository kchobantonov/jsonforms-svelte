---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Coordinate mixed-tree rename and deletion with pending detail edits, name composition, stale-owner checks and destructive confirmation. Preserve selection through literal-key rename and return to the parent after deletion. Honor required keys and disableRemove, and expose translated rename input and breadcrumb names with accessible inline feedback.

Preserve unrestricted array-item schemas and generate a value control when no detail layout can be generated, so mixed array rows cannot reuse the root form schema or UI.
