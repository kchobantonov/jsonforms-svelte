---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Render dotted and empty additional-property names through the parent-scoped literal adapter instead of a separate form. Renderer-owned errors and pending validation now contribute to the parent form, while host errors are displayed at the literal field. Preserve nested literal paths, sibling data and dynamic property keys when clearing values.
