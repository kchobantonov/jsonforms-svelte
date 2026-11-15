---
'@chobantonov/jsonforms-svelte-extended': patch
---

Wait briefly for asynchronously registered language providers before running Monaco initialization actions, so format-document runs when requested for JavaScript. Keep the editor interactive while an unavailable action waits, and cancel late actions after a local edit or host model replacement.
