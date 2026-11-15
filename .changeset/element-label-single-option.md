---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Use only `options.elementLabelProp` for array item labels. Ignore the
unsupported `childLabelProp` alias and fall back to the shared generated label.
When no primitive item property supplies a label, array and ListWithDetail
views show a localized item number.
Selected enum and constant-based oneOf item values use their translated choice
labels while preserving the underlying data value.
The generated first-primitive label also follows item and property `$ref`
schemas before falling back to a numbered item.
The selected oneOf choice titles are also exercised through all three demo
families in English and Bulgarian, with native and Web Component hosts.
Duplicate displayed labels keep distinct item details, and removing the
explicit path restores the first-primitive name fallback.
ListWithDetail row labels likewise use translated choice titles while
selection still opens the correct item's detail.
