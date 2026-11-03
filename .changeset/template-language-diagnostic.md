---
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-extended': patch
---

Reserve `TemplateLayout` for its extended renderer in each standard family. An unsupported configured template language now reaches the renderer's localized diagnostic instead of being silently handled as an empty generic layout.

Report unsupported languages as structured author diagnostics with stable codes and safe details.

Report denied script permission for a visible supported `TemplateLayout` once per mounted path, alongside its translated in-form explanation.
