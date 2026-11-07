---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Resolve live relative $data temporal bounds and the spec's namespaced restrict setting. Prevent restricted picker selections while preserving imported values and typed range violations with schema validation. Diagnose save formats incompatible with schema-selected date/time formats.

Apply time views independently of storage, provide localized native month/year selectors for coarse date views, and translate picker controls through JSON catalogs. Import the canonical temporal-controls fixture with English and Bulgarian supplements.

Keep Flowbite native popover triggers inside their owning shadow root.
