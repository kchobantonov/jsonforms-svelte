# Conditional object fields

Enable `config.jsonformsExtended.conditionalFields: true` or set
`uischema.options.conditionalFields: true` on an object control. An explicit local
`false` overrides the global setting. The object renderer takes precedence over
composition renderers for opted-in conditional object schemas.

The generated field schema includes base properties, active `then`/`else` properties,
`allOf` contributions, and dependencies triggered by property presence. Overlapping
constraints remain intersected. A false, null or empty dependency value still counts
as present. Inactive property values are retained and are excluded from the additional
property editor's list of undeclared fields.

Authored details retain their groups and field order; only inactive branch-only
bindings are omitted. This controls presentation, not document validity: the form
continues to validate the original schema. Conditions work in `NoValidation` mode.
They validate copies using the host Ajv, and successful validators are cached by
validator, root schema and condition identity. Failed evaluation displays a localized
capability diagnostic and does not select the else branch.

The pure projection follows the React common implementation at
`150fd688ae09f0f3b28e989649f3daf1d9f6d91d`; the reactive adapter uses Svelte derived
state. Diagnostics come from the shared JSON renderer catalogs. The canonical
conditional-fields and combinators fixtures preserve source JSON; demo localization
adapters/catalogs are separate additions.

Full recursive-reference and visual fixture acceptance remains tracked in TODO.md.
