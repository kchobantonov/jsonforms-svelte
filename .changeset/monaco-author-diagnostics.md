---
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Emit structured, safe Monaco author warnings for inactive themes, diagnostic failures, editor load failures and unavailable error publication stores.
Add severity to shared UI-schema, dynamic-default and Button script author diagnostics.
Include severity on template language, permission and URL refusal warnings.
Add structured severity to shared catalog warnings and a stable message and
safe option details to invalid Group/accordion collapsed warnings.
Align Button permission and Monaco option warnings in all native
extended families. File read failures report a safe coded error without
logging the caught exception.
