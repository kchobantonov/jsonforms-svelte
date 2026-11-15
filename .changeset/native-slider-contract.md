---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-shadcn-webcomponent': patch
'@chobantonov/jsonforms-svelte-skeleton-webcomponent': patch
---

Keep native sliders while distinguishing unset and invalid data from their provisional thumb position. Add localized clearing and value announcements, readonly commit guards, zero-based decimal increments, integer-safe fractional multiples and exclusive bounds. Preserve primitive array slots when clearing, and allow explicit selection when only one value fits the range. Forward accessible value text to the shadcn slider thumb and tooltip.

Initialize Skeleton sliders after their containing root is available and share the native thumb ID with its tooltip, preserving shadow-root measurement and keyboard focus.
