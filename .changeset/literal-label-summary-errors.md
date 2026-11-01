---
'@chobantonov/jsonforms-svelte': patch
---

Match label-detail validation errors by decoded JSON Pointer members so literal dotted, empty, slash and repeated-tilde property names do not inherit errors from nested lookalikes. Suppress document validation in NoValidation while preserving host feedback.
