---
'@chobantonov/jsonforms-svelte-shadcn': patch
---

Load the existing icon mappings through supported per-icon package exports. This avoids transforming entire Lucide, Tabler and Remix catalogs in server-side consumers and tests without changing icon selection.
