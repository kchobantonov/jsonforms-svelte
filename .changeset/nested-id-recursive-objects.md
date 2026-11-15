---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Rebase document-local nested `$id` and `$anchor` references to root pointers for JSON Forms mapping and validation. Keep finite recursive object children absent until explicit, readonly-guarded creation in all three renderer families. Report unresolved local anchors without changing data, including in NoValidation, and recover when the host supplies a valid schema. Cover root and nested resource references through native and production demo interactions.
