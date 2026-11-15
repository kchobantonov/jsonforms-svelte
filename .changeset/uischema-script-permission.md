---
'@chobantonov/jsonforms-svelte-extended': patch
---

Require explicit host script permission before compiling or invoking string UI-schema testers and rule predicates. Recheck permission on every invocation, preserve trusted native callbacks, and report denied capabilities without executing their source.
