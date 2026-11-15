---
'@chobantonov/jsonforms-svelte': patch
---

Keep failed `contains` validation on the array instead of showing Ajv's provisional candidate failures as errors on each item. Independent item validation and host errors remain visible.
