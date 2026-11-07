---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Resolve pending edits before changing choice-card branches. Completed text drafts
participate in destructive-change confirmation, while unfinished composition or
pending editor work preserves the current branch and native radio selection.
