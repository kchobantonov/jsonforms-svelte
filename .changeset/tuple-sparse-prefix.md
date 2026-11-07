---
'@chobantonov/jsonforms-svelte': patch
---

Fill missing fixed tuple positions when editing a later position or adding a tail item to a host-provided array with holes or undefined entries. Commit initialized positions with the edit, and retain the Add warning when a missing position has no unambiguous initial value.
