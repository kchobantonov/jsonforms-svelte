---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
---

Support anonymous recursive root schemas in the default validator without inserting a schema ID or changing authored schema identity. Temporarily register anonymous roots during compilation, release the registration afterwards, and retain cached validators until explicitly removed. Supplied host validators remain unchanged.
