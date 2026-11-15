---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
---

Add recursive node-tree editing with native navigation, selected-node details, validated rename, guarded deletion and descendant validation indicators. Include the canonical recursive-tree and finite-depth examples in the demo catalog.

Keep dispatcher prop snapshots stable between changes so nested native components mount and unmount without repeatedly traversing the entire ancestor dependency graph. Preserve immutable reducer state and avoid redundant additional-error updates.

Resolve array restriction defaults from authored configuration (local override, global override, then enabled), recheck array layout mutation bounds, and translate default array actions through the shared English/Bulgarian JSON catalogs with host overrides.

Show native validation badges in mixed trees and avoid duplicated headings in structured mixed details.
