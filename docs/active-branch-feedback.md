# Active branch feedback

Object anyOf/oneOf editors in all three families validate the displayed branch by
default. Set `config.validateActiveBranch: false` to use document feedback only;
`uischema.options.validateActiveBranch` overrides that setting, including `false`.
`NoValidation` and `ValidateAndHide` suppress this extra validation.

The shared branch component overlays errors in its descendant rendering context.
It does not dispatch errors or data changes, so the parent form's document validity,
change events and submission decisions remain authoritative. Nested branch overlays
retain parent feedback. Equivalent errors are deduplicated by target, keyword,
parameters and message; original error objects remain unchanged.

Validators are cached by Ajv, root and branch schema identities. Disabled and inactive
branches skip compilation and validation. Validation operates on isolated data so
Ajv defaults and transformations cannot mutate the document. Local references retain
the original root context; an unresolvable branch skips local feedback without
crashing. This does not guarantee arbitrary external-reference support.

Single branches use the same boundary without a selector. Validation-only scalar
compositions continue to use the original composition's document feedback. Full
mixed-type delegation and production visual acceptance remain tracked in TODO.md.

Branch selection also recognizes distinct required `const` discriminator values,
including referenced branches with other invalid or missing fields. This only selects
an editor; document errors remain. oneOf follows incoming data until a user chooses,
and resets stale detail when the node is removed. Clearing an object-only array slot
keeps `{}` so the item remains editable without a sparse array entry.
