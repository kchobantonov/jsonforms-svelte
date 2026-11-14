---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
---

Wait for transient form-owned validation before dispatching an action clicked once. Keep composition and invalid drafts as immediate blockers, and let Monaco's owned pending publication represent transient diagnostics and reconciliation. Cancel waiting deletion and choice-card branch requests when their data is replaced before or after pending edits flush.
