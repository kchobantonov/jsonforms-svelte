# Spec: JSON inference

Source JSON is preserved from `jsonforms-extended-spec/examples/json-inference` at `9d8a6915bd19972b7ce9fe3b584926fc23e66fb7` (unchanged by the subsequent packaging commit). Missing schema/data files remain absent in the example object. EN/BG translations come from the source fixture.

The Svelte host adapts the installed core's object-only inference through wrapped property generation. Runtime inferred schemas never overwrite the authored Schema editor. Root scalars, arrays and null are covered by native registry tests; full editor/Web Component acceptance remains tracked in the example matrix.
