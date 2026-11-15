---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Use the portable `combinator.clearForm*` catalog keys for branch-clear confirmation in OneOf and choice-card renderers, while preserving scoped legacy translation overrides. Imported catalogs now control the title, message, confirm and decline actions in every renderer family.
