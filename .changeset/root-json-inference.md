---
'@chobantonov/jsonforms-svelte': minor
'@chobantonov/jsonforms-svelte-extended': patch
---

Infer omitted schemas from every JSON root type, including arrays, scalars and null, and regenerate them when external data changes type. Preserve absent data and authored schemas. Dispatch a root Control when the installed core cannot generate a UI schema for an unrestricted schema.

Use the same inference helpers in the extended JsonForms host so demos and Web Components preserve absent schema/data and infer scalar roots correctly.
