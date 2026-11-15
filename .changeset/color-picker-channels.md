---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
---

Add HEX, RGB and HSB channel views and opacity editing to color pickers using each renderer library's native popup and field components. Reopening restores the configured save-format view; changing views preserves stored data. Keep invalid values and rejected transparent hex3 drafts intact, retain picker-only clearing, and translate channel labels through the JSON catalogs and host translator.

Honor local `options.format` selection for color and duration on string schemas, matching the Antd reference and canonical examples. Keep these testers inapplicable to incompatible schemas and non-Control UI elements.

Keep color selection in one popover with an inline saturation/brightness surface and hue slider. Remove the nested browser chooser across all three UI families; preserve alpha, channel formats, readonly guards and compact cell triggers.
