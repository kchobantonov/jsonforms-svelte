---
'@chobantonov/jsonforms-svelte': patch
---

Route control errors by their original JSON Pointer members when a literal
dotted key and a nested path flatten to the same control path. This keeps an
error on one field from marking the other field invalid.
