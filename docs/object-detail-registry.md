# Object detail registry

The three Svelte families share detail selection and now guard repeated registry dispatch at the same data path. A registry entry containing `{ type: 'Control', scope: '#' }` can otherwise ask for itself indefinitely. The repeated dispatch uses the generated object form, preserving its data path and root schema.

The guard is scoped to component ancestry. It compares the resolved registry element before presentation clones it; sibling forms and different data paths may reuse the same entry. It does not put visited entries in a process-wide set. Native regression cases cover absent options, empty options, summary-only entries, editing after fallback, sibling reuse and separate paths.

## Reference discrepancy

At spec revision `f0183923295c495c60024fddca58dbe99e82e816`, section 18.6 and the canonical object-control description require an inline detail to have a `type`. React revision `150fd688ae09f0f3b28e989649f3daf1d9f6d91d` normalizes a bare `elements` container to `VerticalLayout` in its shared detail resolver. Both React Antd and shadcn object renderers use that resolver.

Svelte retains the current React compatibility behavior. In the canonical Notes section, only For coordinator is rendered; For office remains in the data. The imported source JSON remains unchanged. This conflict is recorded as an open specification alignment item, not as full normative parity.

## Canonical examples

`spec-object-control` and `spec-array-controls` are registered in all demo families. Their source JSON is tracked by the provenance manifest. English/Bulgarian supplements translate field labels, descriptions, constant choices and enum values without changing registry titles or stored data. The object registry module is a typed adaptation of the trusted source module.

The localization helper distinguishes schema text from properties named `title` or `description`. Constant-choice `i18n` annotations contain the exact message key expected by JSON Forms; ordinary schema annotations contain the field prefix.

## Direct feedback and frames

Object-owned Groups receive direct errors through a scoped context. The outer resolved Group shows a translated native tooltip beside its title; independently authored nested Groups keep their own section indicators. A non-Group detail shows direct messages above its fields. Required-child and property-name errors retain their own targets. Validation hiding suppresses schema errors and preserves host additional errors. Direct-target and rejected-property indexes are cached by validation-array identity.

Imported rejected properties are retained and can be removed explicitly. Their section heading identifies each rejected key, including empty and literal dotted/slashed names, with translated feedback. The original document remains invalid until a correcting action succeeds.

A resolved Group supplies the object frame. Its dynamic-property editor is embedded without an additional border, and dynamic-only Groups omit an empty static-fields region. Other nested detail layouts use a native card. Explicit title suppression takes precedence over a host translation of the object's title.

The source checkpoint covers 39 native cases across three families: canonical object editing/error repair/frame variants in EN/BG, registry cycles, direct versus child feedback, validation visibility, nested Group ownership, French host title suppression, and independent section indicators. Five pure/catalog tests pass. Production acceptance is recorded in the verification baseline.
