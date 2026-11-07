---
'@chobantonov/jsonforms-svelte': patch
---

Report a stable author diagnostic once when a catalog translation references a missing interpolation parameter, including when the caller supplies no values object. Keep its placeholder visible and leave ordinary fallback strings out of the diagnostic path.
