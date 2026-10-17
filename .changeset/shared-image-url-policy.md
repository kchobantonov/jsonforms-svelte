---
'@chobantonov/jsonforms-svelte': minor
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Apply the namespaced host URL policy before loading presentation images. Share policy resolution for allowed schemes, relative URLs and opt-in image data URLs, including rejection of browser-normalized network paths.

Support top-level image sources and alternative text, reactive scoped image data, and English/Bulgarian diagnostics with host translation overrides. Preserve legacy source/alt options as fallbacks; a defined source, including an empty string, takes precedence over scoped data.
