---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Share bound-control traversal for Group and Category data/error indicators. Keep section errors visible when panels close, count overlapping control bindings once, attribute missing/additional property errors to their child, and preserve host errors when schema validation is hidden. Local false options override namespaced defaults.

Translate section summaries and validation popup headings using English/Bulgarian JSON catalogs and live host overrides. Flowbite native steppers use their icon and description slots for section feedback.

Use native tooltips for keyboard and pointer access to section error summaries without toggling the surrounding disclosure. Cache descendant scope collection by UI-schema identity.

Provide Skeleton native disclosures with their shadow-root resolver so closing updates accessible state. Stretch native Group and mixed-frame content to the available width, retaining full-width headings with trailing status indicators.
