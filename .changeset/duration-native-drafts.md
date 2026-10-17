---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Share duration parsing and draft handling across native pickers. Use separate weeks/component modes and native unit selectors, preserve exact imported values, accept duration quantities beyond clock-field limits, and retain incomplete drafts without rounding or overwriting committed data. Publish pending validity separately from schema errors and provide JSON-catalog English/Bulgarian feedback.
