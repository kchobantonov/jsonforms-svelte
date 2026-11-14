---
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Resolve the current Shadow DOM root when native duration popovers and file dialogs request it. This keeps positioning and focus lookup inside Web Components whose portal target is established after renderer initialization.
