---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Track collection occurrences in form-local runtime state using verified add/remove/move metadata and explicit descendant edits. Preserve identities through JSON Forms' deep-cloned array commands, including nested collections and equal primitive values. External replacements retain only reliably matched unique object references.

Key native table and array-layout rows by these identities and provide their logical target context to nested editors. Monaco diagnostics and invalid drafts follow retained occurrences to their current pointers; deleting or replacing an occurrence disposes its owner without changing host errors. Keep validity pending during reassociation. Flowbite array expansion now relies on its existing controlled selection without competing native selection feedback.
