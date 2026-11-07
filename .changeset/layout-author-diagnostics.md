---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Report unsupported, invalid, and conflicting portable layout sizing hints as coded author-facing warnings instead of visible form validation alerts. Keep raw diagnostic details on layout items for inspection and preserve Fixed > Span > Weight precedence.

Diagnose invalid local/global layout container settings while keeping their normal fallbacks, and reject inherited-property names as align/justify values.

Assign item warning codes in the shared sizing helper instead of classifying English messages in the layout adapter. Preserve the existing inspection messages and sizing behavior.
