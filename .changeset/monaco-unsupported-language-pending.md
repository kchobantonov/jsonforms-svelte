---
'@chobantonov/jsonforms-svelte-extended': patch
---

Do not keep form validity pending for Monaco languages without a supported diagnostic reader. An HTML editor can still publish its Monaco markers, but it no longer leaves the form showing “Checking…” until the user edits that field.
