# Recursive tree

Local Draft-07 references describe a node as a file or folder. Explicit defaults seed `kind` and an empty `children` array without generating descendants. Distinct `kind` constants make the branches mutually exclusive. Three tabs cover finite populated data, child creation from an empty folder, and a nested invalid file name. English and Bulgarian translations are included.

Acceptance checks: expand the populated tree, edit a file without changing siblings, add a file and a folder, add a child inside the new folder, remove it, and repair the invalid name. Empty folders remain empty until the user adds children. These interaction checks are acceptance scenarios, not a claim of automated coverage.

Recursion belongs to the schema; the JSON document remains finite. Resolve references as editors are needed. Do not recursively materialize every referenced schema or invent required descendants. A required self-reference with no terminating branch may have no finite valid instance.

This example covers local references only. External documents require a host resolution contract shared by validation and rendering. A URL in `$ref` does not authorize automatic fetching.

Automated coverage in the two tested renderer families: mount all three tabs with Bulgarian labels, preserve supplied data, add one child without modifying sibling trees, switch a file to an empty folder, and select File for an empty node. Full nested edit/delete and browser layout checks remain acceptance scenarios.


### One discriminator editor

The File/Folder branch selector is labelled Kind. Registered branch UI schemas omit the const-valued kind field and lay out Name with Content or Children. The children detail reuses the Kind selector at each depth. The discriminator remains required in the JSON Schema and stored in data; branch selection sets it. Hosts must register uischemas.mjs alongside the example UI schema.

Folder children omit an array default. AJV configured with useDefaults can apply defaults while probing referenced alternatives; branch selection initializes the selected branch instead.

Node unions have an explicit empty-object default. Add leaves Kind unselected; selecting File or Folder applies its whole-object default. Clearing an object-only child retains its slot as {}.

Each Folder’s Children collection panel is collapsible via local `options.collapsible: true`. Initial expansion follows the configured collapsed defaults.


## Recursive node tree presentation

A Control can opt into a tree with a selected-node detail pane using
`options.recursiveTree: { childrenProperty: "children", labelProperty: "name" }`.
Both properties name direct members of each node, not dotted paths. The tree
omits intermediate collection and scalar-property entries. Unnamed nodes use
an index label. The optional `detail` UI schema is relative to the selected node;
it must not enable recursiveTree again. Branch layouts from the UI schema
registry remain available. Without this option, recursive controls retain their
existing nested presentation. This differs from mixed `structuredLayout: "tree"`,
which navigates arbitrary JSON structure.

The selected node's child collection retains native add/delete behavior and
uses links to child editors rather than recursively expanding their fields.
Editing a node preserves sibling data. Node error indicators include descendants
and follow the container-indicator and validation-visibility settings. After a
selected node is removed, select its closest remaining parent. Navigation remains
available in read-only forms; mutations remain disabled.

The recursive-tree example includes a Tree editor tab for comparison. See the
implementation guide for renderer coverage.

Tree rows offer rename and delete actions. Rename changes the node's name; delete
removes a child and its subtree after confirmation. The displayed root is not
deletable. Read-only forms retain navigation but hide mutation actions.
