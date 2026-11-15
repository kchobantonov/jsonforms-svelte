---
'@chobantonov/jsonforms-svelte-extended': patch
---

Treat template `<source src>` as a media URL, so image data URL opt-in applies only to image sources such as picture `srcset`.

Protect Link targets spelled `_BLANK` with `noopener noreferrer` and discard conflicting `opener` tokens.
