---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Preserve nested collection selection and editor identity when reordering items inside an isolated detail dialog draft.
Read dialog targets through the JSON Forms data resolver so inherited prototype
properties are never treated as stored form values.
Use the same own-data lookup for tuple fields and mixed-control parent paths
across all three native families.
Use that resolver for boolean and slider array-parent checks and composite-cell
parent removal policy.
Resolve declared and dynamic composite schemas through own properties, so
prototype-looking names use their authored schema or additionalProperties.
