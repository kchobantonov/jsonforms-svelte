---
'@chobantonov/jsonforms-svelte': patch
---

Keep collection pagination work proportional to the visible page and detect added row keys with a linear lookup, so large collections do not build a full index list on every page read or repeatedly scan previous keys on Add.
