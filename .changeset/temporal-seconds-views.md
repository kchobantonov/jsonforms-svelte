---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Honor a selected seconds view in time and date-time pickers even when the display format omits seconds. Preserve and save the edited seconds without changing the display format. Discard staged date-time picker drafts when the host replaces the value while the picker is open. Keep incomplete date, time and date-time text local until it can be completed, and discard those drafts on host value or control-target replacement. Collection actions now respect unfinished temporal text in a sibling control, including across nested pagination scopes, and resume after completion.

Resolve absolute `$data` temporal bounds from the form root so native date pickers can update their disabled dates when host data changes.
For direct date, time and date-time values edited under literal dotted property names, resolve sibling and root `$data` bounds before compiling the isolated validator, and refresh those bounds when parent data changes.
Carry the original document root through nested literal-key editors so both relative sibling and absolute root bounds keep their meaning.
Use that same root and exact path for ordinary date, time and date-time children of an isolated literal-key object.

Show translated, input-associated guidance while date, time or date-time text is incomplete or invalid, without publishing a committed-value error. Clear the guidance when the text becomes parseable.
