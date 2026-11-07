---
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-shadcn-webcomponent': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-skeleton-webcomponent': patch
---

Keep Skeleton splitter handles above adjacent pane content and prevent browser scrolling from taking over touch resizing. Preserve the original touch during scoped-direction shadcn resizing when another finger starts or ends on the handle, and cleanly stop the native drag on cancellation.
