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

## Combined validity and renderer errors

Use `onvaliditychange` when submission depends on all validation channels. Its `{ errors, additionalErrors, pending, valid }` payload updates when renderer-owned or host errors change, even without a data edit. `onchange` continues to report data and core schema errors.

Custom renderers can obtain the form-local `useOwnedErrors()` store and create one owner per editor instance. Publication requires an explicit renderer option; use generation tokens to reject stale asynchronous results and dispose the owner on unmount. See [the ownership contract](../../docs/renderer-owned-validation.md) for relative JSON Pointer paths, relocation and cleanup.
