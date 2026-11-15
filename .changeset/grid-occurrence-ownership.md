---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Use form-owned occurrence identities for AG Grid rows, cell editors and native/grid detail panels. Preserve selected details and Monaco diagnostics through local moves and deletion of other rows; clear ownership when the selected row is removed or externally replaced. Remove the grid's separate positional identity heuristic so duplicate values cannot inherit another row's editor or errors.

Refresh retained cell bindings after a move even when their displayed values are unchanged, so subsequent edits write to the new source path. Avoid replacing native row data for validation-only updates.

Provide optional occurrence keys to the shared row-detail selection helper and collection context to detail content, retaining the conservative fallback for callers without keys. Replaced native row occurrences dispose open detail dialogs so stale drafts require reopening.
