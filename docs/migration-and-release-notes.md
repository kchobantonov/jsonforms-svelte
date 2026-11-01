# Migration and release notes for the portable renderer profile

These notes describe the current Svelte packages. They are an authoring and host
migration guide, not a claim that every open item in [TODO.md](TODO.md) is complete.
Keep the authored schema, UI schema and data separate: a presentation option
does not change the data schema.

## Configuration and local options

Per-element options remain flat: `options.restrict`, `options.collapsed`,
`options.format` and `options.layout` are examples. Global JSON Forms/core and
established keys remain at the top level of `config`, including `restrict`,
`disableAdd`, `disableRemove`, `showUnfocusedDescription` and
`hideRequiredAsterisk`. Portable extension defaults belong under
`config.jsonformsExtended`; vendor-only options use a vendor namespace. There
is **no** `config.jsonformsExtended.restrict`: move an authored value to
`config.restrict`. A local `options.restrict` can still override it.

```json
{
  "config": {
    "restrict": true,
    "jsonformsExtended": {
      "collapsed": false,
      "group": { "collapsed": true },
      "layoutDefaults": { "gap": 16, "wrap": false, "gridColumns": 16 }
    }
  },
  "uischema": {
    "type": "Group",
    "label": "Details",
    "options": { "collapsible": true, "collapsed": false },
    "elements": []
  }
}
```

The local `collapsed: false` above wins over the Group default. Group, mixed,
accordion and array presentations resolve local collapsed, component default,
shared `jsonformsExtended.collapsed`, then false. Collapsing is runtime state;
it does not mutate the UI schema. Outer panels and array items have separate
expansion state. See [layout sizing migration](layout-sizing-migration.md) for
the legacy columns adapter, `layout.span`, 16px gaps and explicit wrapping.

The option resolver preserves explicit `false`, zero and empty translations.
For a compound option bag, a local bag replaces the configured bag rather than
merging arbitrary members. Review the config consumption ledger in [TODO.md](TODO.md)
before migrating a less common option; removed legacy paths are not aliases.

## Renderer selection and data inference

Registry testers select the highest score. The first registered entry wins a
tie, so place a custom entry before a default entry when their testers have the
same rank. Explicit UI choices such as `options.format`, `options.variant` and
`options.table` can change which specialized renderer wins; simply supplying
schema data does not request those presentations. Keep the base and extended
renderer **and cell** registries installed when the form uses their features.

An omitted schema is inferred from the current JSON root, including scalars,
arrays and null. An authored `{}` remains an explicit unrestricted schema.
External data replacement that changes the inferred root type regenerates the
root presentation; ordinary same-type edits retain editor identity. When
inference is undesirable, pass an explicit schema. An omitted UI schema is
generated from the effective schema, with a root Control fallback for
unrestricted or boolean schemas.

## Validation and host events

`onchange` still reports `{ data, errors }`. It does not represent pending
renderer-owned validation or all host additional errors. Hosts that gate Save
or Submit should also listen to `onvaliditychange`:

```ts
function handleValidityChange(event: JsonFormsValidityEvent) {
  const canSubmit = event.current && event.valid && !event.pending;
  // Keep this state separate from the latest onchange data.
}
```

The event contains `current`, `errors`, `additionalErrors`, `pending` and
`valid`. `current` is false in `NoValidation`, and `valid` requires current
schema results, no pending work and no schema or additional errors. A change
in validation mode or an asynchronous editor result can emit this event without
a data edit. The framework-native prop `additionalErrors` supplies host errors;
renderer-owned errors are merged through the form-local publication channel.
The extended form also accepts `onhandleaction` and a host `context` for Button
actions. Web Components emit `validity-change` and `handle-action` custom
events; read their typed values from `event.detail`.

## Visible UI changes

Portable horizontal/vertical layouts now default to 16px gaps, and horizontal
wrapping is opt-in. Groups use a full-header disclosure trigger and keep the
body mounted while collapsed. Choice cards use a distinct selected border and
keyboard-focus outline; their rich content is inert and remains outside the
accessible radio name. Array and table commands apply the shared confirmation
and restriction policies. Inline field errors may wait for blur, while Group
and Category indicators report current displayable errors immediately.

These changes have package changesets already: [portable layout sizing](../.changeset/portable-layout-sizing.md),
[native Group disclosure](../.changeset/native-group-disclosure.md),
[root inference](../.changeset/root-json-inference.md),
[owned validation channel](../.changeset/owned-validation-channel.md) and
[current combined validity](../.changeset/current-combined-validity.md).
The [verification baseline](verification-baseline.md) records focused checks;
the final full release gate remains P8.6 in TODO.md.
