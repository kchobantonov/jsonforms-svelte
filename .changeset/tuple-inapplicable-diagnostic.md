---
'@chobantonov/jsonforms-svelte': patch
---

Report explicit tuple presentation on a non-array schema as
`variant.inapplicable`, with a localized accessible explanation, while retaining
`variant.unsupported` for invalid array tuple shapes.
