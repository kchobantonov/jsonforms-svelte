---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
---

Honor local and namespaced dialog dimensions, dragging, resizing, and maximize/restore options in native detail dialogs. Keep headers and actions reachable, scroll the body, focus the dialog without selecting editor text, constrain geometry to the viewport, and preserve draft edits and normal geometry through maximize/restore. Add English/Bulgarian actions and maximize/restore icons for each supported shadcn icon library.

Restore the actual trigger after native dialog teardown, including shadow-root portals. Include native padding in viewport limits and schedule resize updates outside observer delivery.
