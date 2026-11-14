---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-shadcn-webcomponent': patch
---

Show Group and Category error indicators as soon as displayable section errors exist, independently of control touch. Keep pre-touch filtering local to each Control, so required-field text waits for blur while a section cue can guide navigation. Remove the form-scoped touch store.
