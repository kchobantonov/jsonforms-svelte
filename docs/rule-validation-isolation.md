# Rule validation isolation

Schema rules use the host Ajv instance against a deep copy of the scoped value.
The rule result therefore describes a **normalized copy**, not necessarily the
original value: a default can satisfy `required`, and a transform can make a
value match a condition. Neither operation writes to live form data.

This preserves registered formats, custom keywords and schema references, including
JSON Forms root references (`/#/...`). Ordinary form validation still uses the
original validator and may assign defaults or transform data. The adapter does
not change that profile or create a second, differently configured Ajv instance.

Predicate rules receive copied `data` and `fullData`, preserving shared identity
between those values. Nested AND/OR predicates use the same protection. The
original condition, schema and host configuration remain available; this is data
isolation, not a sandbox for trusted native callbacks or permitted scripts.

The shared control mapper covers fields, cells, layouts and composition bindings.
Horizontal/portable sizing visibility and extended Button mappings use the same
boundary. Custom renderers that invoke core rule helpers directly should use
`ruleValidationAjv` and `ruleValidationElement`, or map through the shared hooks.
`ruleValidationState` is for renderer mapping only, never the form reducer.

Compiled validators and registered-schema lookups in the mapping adapter also
validate copies. This covers JSON Forms oneOf/anyOf/allOf branch probes while
preserving their errors and live control data identity.

Remaining validator work includes structured summaries and full fixture acceptance.
