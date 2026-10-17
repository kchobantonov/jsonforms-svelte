---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
---

Keep brackets literal when routing collection error badges, Group/Category validation indicators, Flowbite stepper feedback and label item context. Use the existing JSON Forms data-path parser so a property named rows[0] remains distinct from rows.0, including host errors under hidden schema validation.
