---
'@chobantonov/jsonforms-svelte': major
'@chobantonov/jsonforms-svelte-renderer-common': major
---

Move shared renderer components and helpers into `@chobantonov/jsonforms-svelte-renderer-common`. Update imports for shared presentation components and switch date helpers to `@chobantonov/jsonforms-svelte-renderer-common`. The form host, renderer and cell dispatch, unknown renderer, and Svelte bindings remain in `@chobantonov/jsonforms-svelte`.

For dynamic UI, confirmation, literal properties, renderer diagnostics and other extended-spec behavior, import `JsonForms` and its renderer bindings from `@chobantonov/jsonforms-svelte-renderer-common`. The base host uses standard JSON Forms inference and dispatch.
