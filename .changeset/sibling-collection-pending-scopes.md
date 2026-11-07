---
'@chobantonov/jsonforms-svelte': patch
---

Prevent sibling collection pending-change scopes from recursively traversing one another during pagination and detail actions. Each pending edit is checked and flushed once per action, while blocked edits in sibling collections still prevent navigation.
