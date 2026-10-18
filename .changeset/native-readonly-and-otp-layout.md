---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Honor native readonly presentation for numeric, masked and temporal inputs while
preserving focus and copying. Apply native calendar readonly APIs where supported,
prevent time-picker edits, and keep effective form permissions above native
Calendar option overrides.

Keep six OTP boxes visible beside their actions on narrow layouts, retain compact
spacing on wide layouts, and honor initial focus on exactly one native OTP input.
