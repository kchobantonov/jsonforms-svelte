---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Publish one owned, translated Monaco language-error summary when propagateErrors is enabled. Ignore warnings and other models, retract summaries on correction or language changes, and preserve host errors. Avoid republishing JSON Schema diagnostics already handled by the form validator.

Import the canonical additional-errors example with English/Bulgarian host catalogs and simulated server actions. Editing a field clears only that field's simulated server error; no request is sent.
