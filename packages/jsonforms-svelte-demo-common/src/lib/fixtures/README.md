# Development demo fixtures

These factories provide local/global precedence, reference-edge, recursive,
and literal-key test scenarios. Integration tests open them through the demo
so the same fixture runs against each Svelte renderer set, locale, and host.
They are development scenarios, not pinned spec assets. Some are derived from
the shared spec example data but change the schema or starting state for a
focused regression.

The `spec-*` examples in `../examples/` are imported from
`jsonforms-extended-spec/examples` with JSON assets and provenance hashes.
Cross-renderer behavior should be added to that spec repository first and
reimported here and in the React demos. A development fixture belongs here
when it exercises an implementation or precedence case absent from the shared
example catalog.
