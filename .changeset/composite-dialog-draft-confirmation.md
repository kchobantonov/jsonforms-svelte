---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Apply the shared deletion confirmation policy to optional Clear and Remove actions inside composite detail dialogs. Confirmed actions update only the dialog draft; Apply still commits the change. Cancel, readonly transitions, and changed targets discard pending confirmations.
