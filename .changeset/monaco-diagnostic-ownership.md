---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Track Monaco diagnostic requests by model, content version and logical target. Reject obsolete worker results, keep participating validation pending until the current result arrives, and report validation failures with localized feedback. Preserve unrelated host errors and retain invalid drafts when the same object target moves.

Isolate external target and schema replacements with new owned model URIs while retaining the editor instance and selection. Preserve the model during ordinary edit feedback. Query JSON, JavaScript/TypeScript and CSS-family diagnostics directly so empty results also complete validation, and prevent validity publication from triggering a validation loop.
