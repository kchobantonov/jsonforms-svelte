---
'@chobantonov/jsonforms-svelte': patch
---

Preserve translated Label templates until their `textParams` are resolved, so
valid interpolated summaries do not emit false missing-parameter diagnostics.
