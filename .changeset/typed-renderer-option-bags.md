---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Type directly consumed renderer options and mask tokens, and expose unknown types
for extension options and vendor props. Use native library types for forwarded
listbox, accordion and dialog callbacks and toolbar colors. Consumers reading
extension values must narrow them or supply their component-specific type.

Existing configuration merging, property forwarding and stored values are unchanged.
