---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Preserve control adapter input types and clear-value types. Add explicit mask token
and mixed-editor data types, and position keys for collection rows and stepper panels.

Flowbite tree nodes, snippets and callbacks now retain their payload type. Custom
filter values are typed as unknown because filter keys may address arbitrary node
properties; custom filters should narrow the value before using string methods.
Highlight matches have explicit range types, and breadcrumbs are keyed by path.
