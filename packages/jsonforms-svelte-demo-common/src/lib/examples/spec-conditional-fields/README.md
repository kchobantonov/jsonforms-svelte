# Conditional object fields

Config opts in; local options.conditionalFields:false overrides it. Both tabs
edit the same data. Switch customerType to personal: nickname replaces VAT, and
Name remains visible but is no longer required. Switch back: VAT is preserved.
Remove purchaseOrder in the Data editor to deactivate its schema dependency;
an empty string still counts as present. Billing address is retained in data.
The second tab demonstrates freely placed branch-only fields in ordinary groups.

Use an object Control (scope # at the document root) to resolve the active fields.
A manually authored root layout by itself does not install the object projection.
Validation always uses the original schema. Hiding a field does not erase it or
relax additionalProperties. In Draft-07, additionalProperties:false in the base
schema does not recognize properties declared only in then/else: declare allowed
names in the base schema when closing the object, and use explicit UI rules for
visibility of those base fields.

This example supports graphical authoring through serializable control scopes,
detail layouts and config. It does not include a drag-and-drop editor.
