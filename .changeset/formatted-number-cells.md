---
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Register formatted integer cells for `options.format: true`. JavaScript-authored cell options can provide `toFormatted` and `fromFormatted` callbacks; without both callbacks, the ordinary integer cell remains in use. Honor `multi: true` with a multiline editor. Keep invalid formatter drafts local and preserve numeric data, readonly behavior, and row identity.
