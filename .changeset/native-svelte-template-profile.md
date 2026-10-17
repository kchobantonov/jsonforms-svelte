---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': minor
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
'@chobantonov/jsonforms-svelte-demo-common': patch
---

Add a trusted compiled Svelte component profile for TemplateLayout with live data, core errors, host context, permission state, translation and delegated Slot components. Compiled templates operate without runtime script evaluation permission.

Diagnose unsupported string-template languages, avoid child-name collisions, preserve literal slot names, load Ractive only when allowed and visible, and retain template DOM during data-only updates. Refresh live host context independently of schema validation errors.

Import the canonical template-engine fixture with English/Bulgarian catalogs and a native Svelte host adapter. JSX remains an explicitly unsupported string engine in the default Svelte registry.

Provide defineNativeTemplate to mount compiled components and delegated slots in their owning Svelte runtimes, including separately bundled Web Component hosts.
