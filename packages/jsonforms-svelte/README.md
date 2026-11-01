# @chobantonov/jsonforms-svelte

Base JSONForms components for Svelte 5.

## Installation

```bash
npm install @chobantonov/jsonforms-svelte
# or
pnpm add @chobantonov/jsonforms-svelte
```

## License

MIT

## Renderer specifications

See the [renderer specifications](../../docs/renderers/README.md) for supported
behavior and options, independent of framework or UI toolkit.

## Schema references

The form renders document-local JSON Pointers, `$anchor` references and nested
`$id` resources when the root has an absolute `$id`. It also renders absolute
references to external documents already registered with the supplied `ajv`,
whether the form root has an absolute `$id` or no `$id`. External documents may
reference other registered documents or expose nested `$id` resources. The
renderer does not fetch URLs.

The default validator is JSON Forms' Ajv Draft-07 instance. A host may supply a
different Ajv for validation, but `$dynamicRef` rendering is not supported:
dynamic scope cannot be preserved by the renderer's static reference mapping.

An unresolved external document, pointer or anchor shows a form-level
diagnostic and preserves data, including in `NoValidation`. Replacing `ajv`
with a registered instance restores rendering. A relative external reference
from an anonymous root has no declared base URI, so it is diagnosed without
guessing one. `$dynamicRef` shows a distinct unsupported-rendering diagnostic
instead of an unconstrained editor.

## Combined validity and renderer errors

Use `onvaliditychange` when submission depends on all validation channels. Its `{ errors, additionalErrors, current, pending, valid }` payload updates when renderer-owned or host errors change, even without a data edit. `onchange` continues to report data and core schema errors.

`current` is false when automatic schema validation is disabled (`NoValidation`). An empty error array then does not prove validity: `valid` remains false. In validating modes, `valid` requires current schema results, no pending validation and no schema or additional errors. Validation-mode changes notify this channel without a data edit.

Custom renderers can obtain the form-local `useOwnedErrors()` store and create one owner per editor instance. Publication requires an explicit renderer option; use generation tokens to reject stale asynchronous results and dispose the owner on unmount. See [the ownership contract](../../docs/renderer-owned-validation.md) for relative JSON Pointer paths, relocation and cleanup.
