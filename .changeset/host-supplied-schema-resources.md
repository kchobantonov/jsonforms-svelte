---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-webcomponent': patch
'@chobantonov/jsonforms-svelte-skeleton-webcomponent': patch
'@chobantonov/jsonforms-svelte-shadcn-webcomponent': patch
---

Render absolute references to external schema documents already registered with the host Ajv instance from identified or anonymous roots while validating against the original schema. Support transitive registered references, nested `$id` resources and document-local anchors without fetching URLs or duplicating nested resources. Diagnose missing documents, anchors, JSON Pointers and anonymous-root relative refs even in NoValidation while preserving data and recovering when the host supplies Ajv. Report `$dynamicRef` as unsupported for rendering rather than opening an unconstrained editor. Pass JSON schema resources through each demo and Web Component, with native and production interaction coverage across all three renderer families.
