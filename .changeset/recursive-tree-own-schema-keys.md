---
'@chobantonov/jsonforms-svelte': patch
---

Require recursive-tree command and child-schema lookups to use declared own
properties. A prototype-named label no longer exposes Rename when its field is
absent from the schema. Mixed-tree readonly checks likewise apply an authored
`additionalProperties` constraint to undeclared prototype-named keys.
Branch-discard and choice-card discriminator inspection also require own schema
properties.
Recursive-tree detail layouts now isolate selected nodes beneath literal dotted,
empty or prototype-named child members. Repeated child paths remain editable, and
recursive child links retain their target identity inside the isolated detail.
Replacing a mounted recursive-tree UI schema no longer throws during the
renderer transition.
