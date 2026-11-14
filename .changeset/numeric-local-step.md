---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Resolve numeric input increments from local `options.step`, then the schema's suitable `multipleOf`, then the numeric-type fallback. Ignore undeclared flat `config.step` while preserving separate slider increments.
