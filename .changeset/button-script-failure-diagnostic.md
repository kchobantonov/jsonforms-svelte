---
'@chobantonov/jsonforms-svelte-extended': patch
---

Emit safe `script.evaluationFailed` author diagnostics for Button script compile and execution failures while preserving the original rejection for callers.

Report CSP compilation refusal as `script.evaluationUnavailable` while retaining the existing `unavailable` result and translated renderer status.
