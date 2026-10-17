# Spec choice controls

Fixtures copied from jsonforms-extended-spec at
`9d8a6915bd19972b7ce9fe3b584926fc23e66fb7`, examples/choice-controls.
Schema, UI schema, data, config and English/Bulgarian translations are unchanged
apart from formatting. The trusted uischemas.mjs tester is represented as a
function string for the existing demo/Web Component registry adapter. This is
host code, not a portable JSON authoring feature.

The example includes capabilities still under implementation (rich presentation,
search and structural choice cells); its availability does not certify full
conformance. Card detail modes must be tested separately in each renderer family.

The demo merges `supplemental-translations.json` over the source catalog. It adds
the fallback branch labels and generated email-address label missing from the
reference Card detail modes example; the source fixture files remain unchanged.
