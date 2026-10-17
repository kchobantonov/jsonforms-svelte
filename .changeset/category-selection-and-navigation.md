---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Share named initial category selection and stable category identity across tabs and steppers. Refresh category bindings when the UI schema changes, fall back when the selected category hides, and remove stale panels when no category remains visible. Translate Previous/Next through the renderer JSON catalogs and host translator.

Add native single-open categorization accordions with named initial selection, persistent explicit closure, visibility fallback and live namespaced collapse settings. Closed panels remain mounted using the native components' supported content options.

Add vertical layout, roving keyboard focus and unique native tab IDs to the Flowbite Tabs adapter. Preserve keyed stepper component identity when named categories move.
