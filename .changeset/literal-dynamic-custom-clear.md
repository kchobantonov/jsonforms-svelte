---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Keep a dynamic additional-property key when a custom renderer clears its isolated value with `undefined`. Use the property's schema default for that clear and reject stale edits after the key is removed. Declared literal controls retain their ordinary clear-to-absent behavior.
