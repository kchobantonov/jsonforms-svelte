---
'@chobantonov/jsonforms-svelte-flowbite': patch
---

Keep a searchable single-choice popup closed after selecting an option or pressing Escape while restoring focus to its trigger. Flowbite Popper also opens on `focusin`; suppress that one synthetic focus event so a delayed reopen cannot cover nearby fields.
