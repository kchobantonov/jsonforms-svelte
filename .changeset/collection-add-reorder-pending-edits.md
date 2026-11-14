---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Resolve pending edits before ordinary table, expandable-layout and list/detail
array add/reorder actions. Block unfinished composition and duplicate preparation,
cancel queued actions after unmount, and recheck schema/path, permissions, options
and limits before committing.
Keep expansion and list selection with the moved item. Capture the insertion index
before adding so newly added layout items open consistently while respecting
collapseNewItems.
