---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Use the portable additional-property catalog keys for Add, Rename, and mixed-tree Rename titles, placeholder, confirmation/cancel actions, and name-validation feedback. Property row Rename/Delete buttons now use the named catalog labels, including literal property names. Imported EN/BG translations reach these controls in every Svelte renderer family. Keep the mixed type selector and value editor aligned below the row actions. The empty row-detail panel reads `collection.selectItem` and ListWithDetail index text reads `array.indexLabel`; both respond to locale-only changes.
