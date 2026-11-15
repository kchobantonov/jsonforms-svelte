---
'@chobantonov/jsonforms-svelte-extended': patch
---

Guard owned Monaco models before detaching them so late editor computations cannot raise disposed-model errors when a Web Component reconnects or changes renderer.
