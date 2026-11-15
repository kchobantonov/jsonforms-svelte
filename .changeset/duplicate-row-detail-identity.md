---
'@chobantonov/jsonforms-svelte': patch
---

Clear row-detail selection when an external collection update makes the selected occurrence ambiguous. Duplicate primitive values and repeated object references no longer transfer the detail pane to an arbitrary surviving row. Preserve unique-object moves and existing immutable row-edit behavior across the native table and AG Grid integrations.
