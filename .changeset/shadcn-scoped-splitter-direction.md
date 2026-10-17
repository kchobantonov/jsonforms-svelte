---
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-webcomponent': patch
---

Respect a split pane's inherited RTL/LTR direction when it differs from the document direction, including forms hosted in Shadow DOM. Retain native shadcn/PaneForge panels and adapt horizontal keyboard, mouse and touch input only when their direction differs from PaneForge's document-level calculation.
