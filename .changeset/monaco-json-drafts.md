---
'@chobantonov/jsonforms-svelte-extended': minor
'@chobantonov/jsonforms-svelte-flowbite-extended': minor
'@chobantonov/jsonforms-svelte-shadcn-extended': minor
'@chobantonov/jsonforms-svelte-skeleton-extended': minor
---

Preserve converted JSON editor drafts and valid edit formatting independently of committed data. Add opt-in owned parse-error publication, reactive English/Bulgarian editor actions and feedback, and shared config support for code-editor options. Preserve other validation messages and enforce host readonly state even when native editor options request editing.

Dispose the editor before its owned model, and use the same default occurrence-highlighting setting as the demo editors to avoid background requests during teardown.

Register converted-JSON section schemas per editor model, resolve local references against the document root, and remove only owned registrations. Preserve explicit null and literal schema data, and prevent native options from replacing the bound model, language, theme or value. Guard cancelled completion callbacks that reach an already-disposed owned model.

Resolve Monaco error publication from local options, namespaced global defaults, then the legacy flat default. Replace local Monaco option bags wholesale so global editor options and action arrays cannot leak into an authored override.
