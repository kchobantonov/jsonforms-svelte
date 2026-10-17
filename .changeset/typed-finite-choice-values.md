---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Use internal selection IDs for enum and const-oneOf selects and radios, preserving original JSON types, null and empty-string choices, duplicate labels, and structural selection after a host reload. This prevents duplicate-key crashes for object-valued choices.

Support finite enum arrays of any JSON type. Compare multi-choice members structurally and avoid removing an unrelated last item when a requested member is absent. Preserve standalone falsy const choices despite the installed JSON Forms mapper's truthiness check.
