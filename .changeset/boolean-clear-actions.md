---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Add localized native clear actions to boolean checkboxes, switches and table cells. False remains a present, clearable answer; clearing an ordinary property removes it instead of switching it off. Dynamic properties retain their key, and array-item clearing preserves the slot using the boolean empty value. Actions appear on hover/focus or touch, respect clearable and readonly state, and remain separate from property deletion.

Keep AG Grid boolean widgets centered with their clear action at the cell edge, and align the Flowbite color popup trigger with its text input.
