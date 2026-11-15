---
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Select ordinary array presenters when item schemas use `oneOf`, `anyOf`, or `allOf`, including local references. Add can initialize the new item through the existing schema-default path; an explicit table option still selects the table presentation.
