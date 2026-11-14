---
'@chobantonov/jsonforms-svelte-extended': patch
---

Keep static interpolated labels stable when unrelated form data changes by reusing lazy module loads and interpolation results. Dynamic labels still update when their data changes.
