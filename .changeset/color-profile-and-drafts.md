---
'@chobantonov/jsonforms-svelte-extended': minor
'@chobantonov/jsonforms-svelte-flowbite-extended': minor
'@chobantonov/jsonforms-svelte-shadcn-extended': minor
'@chobantonov/jsonforms-svelte-skeleton-extended': minor
---

Support the shared color input and serialization profile, including RGB, HSL and HSB inputs, hex/RGB/HSB output, and alpha-preserving picker edits. Keep incomplete text as a local draft and retain invalid incoming values. Align the color format validator with supported input syntax.

Honor namespaced color defaults and local overrides, support picker-only entry with a clear action, and localize picker actions and feedback in English and Bulgarian. Existing hexadecimal pattern and mask exports remain available for consumers that explicitly require hex-only input.
