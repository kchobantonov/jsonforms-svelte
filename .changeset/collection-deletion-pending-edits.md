---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Resolve pending edits before collection deletion confirmation. Block unfinished
composition, evaluate discarded values after completed drafts reach form state,
and recheck permissions, schema, path, data and removal constraints before commit.
Invalidate stale confirmations and bind dialog callbacks to their own request so
late native events cannot cancel or accept a newer deletion. Keep Flowbite array
layout confirmation state controlled during rapid cancel/retry interactions.
