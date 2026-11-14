# @chobantonov/jsonforms-svelte

Base JSONForms components for Svelte 5.

## Experimental `$dynamic` UI overlays

Pass `external={settings} config={{ jsonformsExtended: { dynamic: { enabled: true } } }}` to `JsonForms` to opt into resolution of
top-level `$dynamic` on UI elements. Replace `settings` with an immutable snapshot
when it changes. The form resolves `bind`, `template`, and CEL `expression` leaves
before normal renderer and cell selection. It starts every evaluation from the
authored element, so a conditional `options.format: "radio"` disappears when its
condition stops matching. Visual renderers receive the resolved UI element.
CEL safe integers become JSON numbers; values outside the safe integer range
fall back without rounding. Use `{ literal: value }` when the intended data
itself looks like a descriptor. For a UI schema created in trusted application
code, `external={settings} config={{ jsonformsExtended: { dynamic: { enabled: true, trusted: TRUST_DYNAMIC_FUNCTIONS } } }}` also admits
synchronous function leaves and boolean conditions. JSON input never enables
functions, and a Promise result is rejected.

The resolver accepts any UI-element key and nested key without a field-specific
allowlist. Authored objects merge recursively; arrays and descriptor results replace their target as a unit. The
current element's `$dynamic` metadata is removed before dispatch; nested elements
retain their own descriptors in both object-valued detail slots and child arrays.
Nested metadata is copied without evaluating it in the parent occurrence. The selected renderer owns field meaning and
validation. Missing or unsafe values fall back to the current evaluation's earlier
value and emit `dynamic.invalid`.
The resolver never writes to form data. A changed tester may replace the selected
renderer component; equal results retain its instance. Parent layout sizing and
category metadata use the same resolution rules.
`item` reads the nearest collection occurrence from current form data, `value`
reads the authored Control scope, and `errors` contains current core schema
errors. The dynamic context excludes the `jsonformsExtended` config namespace.
Only environment roots referenced by portable descriptors are copied. Validated
root snapshots are shared across occurrences until that immutable root is
replaced. Trusted function leaves receive all available roots; shared copies are
frozen so one callback cannot change another occurrence's input. Indexed array
getters are rejected without execution. Each mounted occurrence caches evaluation
by its referenced immutable roots; unrelated roots are not read. Equal subtrees
retain their references when another field changes.

The opt-in API and extension target behavior are experimental. A change that selects
a different renderer replaces it immediately and discards its local uncommitted
draft without changing committed form data. The adapter transfers focus to the new
editor when the replaced subtree owned it. Changing a Control's effective scope
starts a new editing session even if the selected component is unchanged. Toggling
activation alone retains the selected instance when its binding and component
remain the same. Nested detail coverage, additional
property contracts, custom-renderer cleanup, and the full portable CEL profile
still need adapter tests. The specification package provides an experimental
descriptor schema and typed authoring profile; the portable schemas and
conformance contract have not been promoted yet.

To try the implemented path, open **Spec: Dynamic playground: preview and
configuration forms** in a Svelte demo and select the **Demo** tab. The preview
uses `$dynamic`; the neighboring Configuration form supplies `external.settings`.
Edit **Preview label** to update the plan label, toggle **Preview readonly** to
disable just that control, and switch **Preview presentation** between
`automatic` and `radio` to exercise renderer selection. The **UI Schema** tab
shows the authored `$dynamic` rules from the catalog's
`dynamic-uischema.json`. Its `uischema.json` remains the static mapping
alternative for hosts without `$dynamic` support.

The same playground includes advanced settings for templates,
per-item values, `scope`/`type`/`elements`/`rule`
overlays, invalid binding fallback, and a number editor that changes to a slider.
The **External** tab edits the same host state as the Configuration form; invalid
JSON drafts retain the last valid value, independently of Data and Config.
Typing an incomplete number such as `1e` and then choosing the slider discards
the incomplete suffix while retaining the last committed numeric value.

For trusted, local TypeScript UI schemas, a function leaf can read the same
environment. Enable it explicitly on the form:

```ts
import type { TrustedDynamicSpec } from '@chobantonov/jsonforms-extended-spec/typescript';

const dynamicLabel: TrustedDynamicSpec<{ label: string }> = {
  label: ({ external }) =>
    (external as { settings?: { label?: string } } | undefined)?.settings?.label ?? 'Name',
};
const uischema = {
  type: 'Control',
  scope: '#/properties/name',
  $dynamic: dynamicLabel,
};
// Pass uischema and external={{ settings }} config={{ jsonformsExtended: { dynamic: { enabled: true, trusted: TRUST_DYNAMIC_FUNCTIONS } } }}
// to JsonForms. Replace settings immutably when it changes.
```

## Installation

```bash
npm install @chobantonov/jsonforms-svelte
# or
pnpm add @chobantonov/jsonforms-svelte
```

## License

MIT

## Renderer specifications

See the [renderer family capabilities](../../docs/renderers/README.md) for
registered types, variants, options, integrations and current verification limits.

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

When no registered renderer or cell applies, the form preserves its data, shows
a localized status message, and emits `renderer.unsupported` or
`cell.unsupported` to the author console with the UI element type and scope.
These author diagnostics are separate from schema and additional validation
errors.

Use `ondiagnostic={(diagnostic) => ...}` to receive a typed author event with
`code`, `severity`, `message` and optional `details`. The callback covers mounted shared-base author warnings, including renderer/cell
dispatch, category, tuple, focus, layout, image and conditional diagnostics.
Catalog translators can forward missing-key and missing-parameter warnings when
created with the optional third `ondiagnostic` argument. The extended form also
delivers `action.unhandled`; other native and extended warnings remain in the
console.

Use `onvaliditychange` when submission depends on all validation channels. Its `{ errors, additionalErrors, current, pending, valid }` payload updates when renderer-owned or host errors change, even without a data edit. `onchange` continues to report data and core schema errors.

`current` is false when automatic schema validation is disabled (`NoValidation`). An empty error array then does not prove validity: `valid` remains false. In validating modes, `valid` requires current schema results, no pending validation and no schema or additional errors. Validation-mode changes notify this channel without a data edit.

Custom renderers can obtain the form-local `useOwnedErrors()` store and create one owner per editor instance. Publication requires an explicit renderer option; use generation tokens to reject stale asynchronous results and dispose the owner on unmount. See [the ownership contract](../../docs/renderer-owned-validation.md) for relative JSON Pointer paths, relocation and cleanup.

For `$dynamic`, authored nested objects patch existing keys. Descriptor results
(`bind`, `expression`, `literal`, or trusted functions) replace their target as a
complete value, including objects. Use `{ literal: completeDetail }` for a whole
detail layout, or `{ elements: [...] }` to update only its children. Literal
payloads are copied without evaluating descriptor-shaped descendants; child
UI elements resolve their own `$dynamic` when dispatched. Invalid results preserve
the accumulated fallback within the current evaluation.

### Activation and trusted functions

Only `config.jsonformsExtended.dynamic.enabled === true` enables overlays. The
`external` prop is independent; passing it alone does not enable `$dynamic`.
Replace the external object to notify the form. There is no experimental `dynamic`
prop alias. To admit synchronous function leaves, import `TRUST_DYNAMIC_FUNCTIONS`
from this package and set `config.jsonformsExtended.dynamic.trusted` to that symbol.
JSON booleans/strings and lookalike symbols cannot grant this capability. The token
alone does not activate overlays. Label `dynamicValues` and template script gates
remain independent.

For a bundled web component, import `TRUST_DYNAMIC_FUNCTIONS` from that web-component
package, then assign it through the element’s `config` property. Its `external`
property also accepts a JSON attribute; trusted callbacks cannot be enabled by
attributes. Each independently bundled adapter owns its capability identity.

### Lazy evaluator and shared resolution

CEL loads when the first form enables overlays; disabled forms do not request it.
Concurrent forms share preparation. An initially enabled form holds its editors
back until the evaluator is ready, avoiding a static editor that would immediately
be replaced. Live activation retains mounted editors and drafts while temporarily
blocking editing. Loading failures are shown; disabling and reenabling retries.
Completion from an obsolete activation is ignored.

The form shares the latest pure result for each authored element and referenced
input roots across parent consumers and dispatch. Occurrence-local identity and
snapshot validation remain intact; this does not add field-level subscriptions.

The public form adapters prepare CEL automatically. When calling the low-level
synchronous resolver directly, first `await loadDynamicUiExpressions()` if the UI
contains CEL expressions. Literal values, restricted templates and bindings can
resolve without that preparation.
