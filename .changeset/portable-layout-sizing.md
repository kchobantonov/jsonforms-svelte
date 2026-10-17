---
'@chobantonov/jsonforms-svelte': minor
'@chobantonov/jsonforms-svelte-flowbite': major
'@chobantonov/jsonforms-svelte-shadcn': major
'@chobantonov/jsonforms-svelte-skeleton': major
---

Use portable horizontal and vertical layout sizing with 16px gaps, explicit wrap control, fixed/span/weight modes, effective visible children and parent-axis Spacer sizing. Spacer reads canonical size before legacy height; native separators support vertical orientation.

The default layout renderer diagnoses legacy columns rather than applying the incompatible fixed-grid convention. Applications that need the previous columns behavior can explicitly replace the standard layout registry entry with the exported LegacyLayoutRenderer. Migrate authored columns to options.layout.span and configure gridColumns and wrap on the parent layout.
