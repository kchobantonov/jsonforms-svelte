---
'@chobantonov/jsonforms-svelte-extended': patch
---

Wait for Monaco's asynchronously registered JSON language worker before reading initial editor diagnostics, so first-mount validation does not report an initialization failure.
