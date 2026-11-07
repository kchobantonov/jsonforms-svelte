---
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-skeleton-webcomponent': patch
---

Keep a removed accordion category mounted for one update while focus moves from its header to the visible fallback. Keep the Skeleton accordion renderer selected through an empty-category update so its focused final native trigger can release focus before the accordion subtree unmounts. This avoids native teardown errors and preserves form data.
