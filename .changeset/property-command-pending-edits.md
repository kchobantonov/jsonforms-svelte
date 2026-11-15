---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Coordinate additional-property add and rename with pending edits. Preserve composing input, reject duplicate and stale commands, honor readonly/disableAdd and required-key restrictions, and cancel obsolete rename dialogs. Resolve updated property options reactively so runtime restrict and permission changes take effect without remounting.

Give each property editor a unique rename-input ID so labels remain associated with the correct dialog when multiple editors are mounted.
