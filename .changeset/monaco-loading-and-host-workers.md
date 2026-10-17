---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-demo-common': patch
---

Render explicitly requested string code controls with plaintext when no language is supplied. Show translated loading and initialization-failure feedback, release owned resources after failed setup, and preserve worker providers configured by the host application.

Configure all supported Monaco language workers in the shared demo host so its preserved worker provider handles JavaScript/TypeScript, CSS and HTML as well as JSON.
