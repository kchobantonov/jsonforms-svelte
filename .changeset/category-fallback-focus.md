---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-shadcn-webcomponent': patch
---

Keep keyboard focus on the visible fallback tab, stepper header, or accordion header when a selected category is hidden. Preserve Skeleton's focused native triggers, and keep conditional shadcn step registration in DOM order. Track unnamed and duplicate-named categories by their UI-schema object so selection survives sibling reorder without duplicate keyed entries. Reconcile equivalent unnamed category objects across UI replacement so a data update does not remount nested tabs or lose focus.
