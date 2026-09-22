# Tuples

Available in all three Svelte demos as **Tuples (coordinates & positional records)**.

- Coordinates use a horizontal row (`vertical: false`), positional schemas, and localized X/Y labels.
- Dimensions use a vertical column (`vertical: true`), a uniform schema with equal bounds, and explicit `variant: "tuple"`.
- The initially empty order line lets you edit Quantity first; the model becomes
  `["", quantity]` in one update.
- Record notes have typed trailing items with restricted Add/Delete.
- Flexible trailing values use the mixed renderer.
- Address and phone-list positions open live editing dialogs.
- The overlong example preserves its invalid extra value until you delete it.

Fixed positions have no Add/Delete/Reorder actions. Clearing a string retains
`""`; clearing a number stays a local draft until a number is entered.
The examples explicitly enable `restrict`. Switch it off to compare tail-count
prevention with validator error reporting.

These examples use draft-07. The renderer also recognizes `prefixItems` when
the host supplies a draft-2020-12-compatible validator; the demo does not silently
replace the validator for a single example.

Tuples have an outer border by default, containing the title, fixed positions,
Additional Items section, and array errors. Coordinates demonstrate
`showBorder: false` for compact embedding. Array errors do not mark otherwise
valid individual positions invalid.

The UI-schema registry supplies separate position Controls for Address and Phone
numbers. Their `options.summary` scopes select street and each phone string;
`options.detail` defines the dialog form. Summaries are selectable text; only
the Edit icon opens the dialog. Loading or opening does not populate missing data.

Complex position dialogs offer **Clear**: Address becomes `{}` and
Phone numbers becomes `[]`, preserving all positions. The restricted-contents
example disables this action for required object properties and a nonempty array.
Set its `restrict` option to false to allow emptying and inspect validation errors.
Save changes commits the draft; Discard changes cancels editing and emptying.
The example opts in with `showEmptyButton: true`; empty/remove dialog buttons
are hidden by default. `okLabel` and `cancelLabel` use translated keys.

Dialog defaults are Apply/Cancel, with optional Clear/Remove actions. Hover or
focus an action for localized guidance. The complex examples override Apply and
Cancel using their existing translated action keys.
