---
'@chobantonov/jsonforms-svelte': patch
---

Validate custom choice-card identifiers before applying them. Duplicate,
unknown, out-of-range, and ambiguous entries no longer customize a card, and
the renderer reports author-facing diagnostic codes for those entries.
