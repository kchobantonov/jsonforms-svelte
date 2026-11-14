---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
---

Align literal-property editors with React by rooting their existing JSON Forms context at the selected value. Remove the extra form-document context and use core data for labels, templates and dialog drafts. Preserve required presentation, literal-key updates, parent error routing and renderer-owned validation; compile draft validation against the isolated schema.
