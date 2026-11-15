---
'@chobantonov/jsonforms-svelte-extended': minor
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Use persisted filenames for the default AG Grid filtering and sorting of single and multiple file columns. Nameless attachments contribute empty search text, keeping encoded contents and MIME metadata out of searches. File cells continue editing the original stored values, and explicit column overrides retain precedence.

Stop inheriting the parent grid variant into cell controls so array-valued file columns render file pickers instead of nested grids. Explicit per-column variants remain supported.
