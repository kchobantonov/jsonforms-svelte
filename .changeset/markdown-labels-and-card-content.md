---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': minor
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Add lazy Markdown labels with basic and extended grammar, shared URL policy, escaped text rendering, and English/Bulgarian diagnostics. Keep rich choice-card content inert and render its links as text so native radio selection remains the only interaction. Add lazy CEL interpolation with declared text parameters, gated data namespaces, locale formatting and safe Markdown substitutions. Include the spec Label interpolation and Markdown examples in the demo catalog.

Improve demo message fallback and avoid stale interpolation parameters. Supply separate EN/BG translation supplements for missing spec-example labels without modifying source fixtures.
