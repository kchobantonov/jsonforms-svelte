---
'@chobantonov/jsonforms-svelte-extended': patch
---

Reject nonfinite and negative ranks from string-authored UI-schema registry
testers. Only the not-applicable sentinel or a finite non-negative rank may
select a registered detail; invalid results retain the author diagnostic and
do not expose script source.
