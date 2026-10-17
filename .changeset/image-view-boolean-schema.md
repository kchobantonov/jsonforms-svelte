---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Reject a scope-bound ImageView source when its schema is false. Preserve true-schema support, stored data, localized diagnostics and live schema replacement across renderer families.

Resolve scope-bound image data by literal property segments so dotted and empty names work within the current array-item context. Ignore inherited values.

Keep scoped presentation elements out of literal Control isolation and mixed/tuple control selection. ImageView now retains its authored source, alternative text and diagnostics in the full renderer registries, including unrestricted and tuple schemas.

Restrict the generic array fallback to Control elements as well, so an image bound to an array reports a source-schema diagnostic instead of displaying an array editor.
