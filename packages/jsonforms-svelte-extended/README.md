# @chobantonov/jsonforms-svelte-extended

Import `JsonForms` from `@chobantonov/jsonforms-svelte-extended` when the form needs host actions or templates. It wraps the [renderer-common host](../jsonforms-svelte-renderer-common/README.md) and accepts the renderer and cell registries from the chosen family. Handle action requests with the `onhandleaction` callback.

### External values in templates

Pass host-owned values once through `external={external}`. The extended form
also exposes them as `context.external` in templates; replacing the external
object updates the template without changing business data. `settings` is only
the playground's chosen namespace; `external.branding`, for example, is equally
valid. The bridge does not expose resolver settings such as `trustedFunctions`
or change template security gates. In Svelte, a defined `external` takes
precedence over an explicitly supplied `context.external`; removing it restores
that context fallback.
