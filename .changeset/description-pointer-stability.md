---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Reserve helper space for focus-only descriptions. Blurring a preceding control no longer moves the next native checkbox between pointer-down and pointer-up, which previously dropped clicks in the null-control example. Hidden descriptions stay out of the accessibility tree.
