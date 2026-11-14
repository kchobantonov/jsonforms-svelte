# Literal property names

Requires JSON Forms core 3.9.0-alpha.1 or newer. Add, rename, edit, clear, and
delete dynamic properties with bracketed, dotted, empty, or whitespace names.
The JSON preview must retain the exact key inside `group[0]`; neither brackets
nor dots should create a different data structure. `15` remains an object key.

Dotted and empty keys use isolated editors and parent-object updates. The nested example also demonstrates empty/dotted names in the mixed tree:
expand the object, show primitive nodes, and select `""` or `a.b` to edit the
exact value. Tree Rename/Delete and type changes preserve exact keys. Ordinary
direct-path Controls retain their core path limitations.
Schema `propertyNames` constraints still apply when configured, and duplicate
or schema-owned keys cannot be added again.
