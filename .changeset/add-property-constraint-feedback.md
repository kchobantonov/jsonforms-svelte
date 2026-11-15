---
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte': patch
---

Show the property-name schema's specific validation message while adding a dynamic property without repeating it through the additional-error path. Adding the first property also creates a missing dynamic object. Direct and locally referenced boolean value schemas are normalized before Add, so a permitted `true` pattern schema does not skip the write. Invalid incoming primitive object data no longer appears as character-indexed dynamic properties and can be replaced through Add.
