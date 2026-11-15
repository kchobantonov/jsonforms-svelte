---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
---

Distinguish named templates when detecting UI-schema dispatch cycles so nested
templates at one data path render, while true cycles still stop. Report template
lookup and native slot problems as structured author diagnostics.
