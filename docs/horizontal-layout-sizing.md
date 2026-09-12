# Horizontal layout sizing proposal

Status: proposed implementation contract; runtime sizing is not implemented yet.

The three base LayoutRenderer components currently use equal `flex-1` children.
Add a shared sizing calculation, consumed by Shadcn, Skeleton, Flowbite, and the
editor canvas, rather than implementing sizing in individual control renderers.

## UI-schema contract

A direct child of HorizontalLayout may specify `options.columns` as an integer
from 2 through 16. Missing, null, or `"auto"` means Auto. The editor should remove
the property when Auto is selected, keeping existing documents minimal. Invalid
imported values get a diagnostic and render as Auto rather than breaking layout.
This is a renderer extension, not a standard JSON Forms core option.

```json
{
  "type": "HorizontalLayout",
  "elements": [
    { "type": "Control", "scope": "#/properties/firstName", "options": { "columns": 4 } },
    { "type": "Control", "scope": "#/properties/notes", "options": { "multi": true } }
  ]
}
```

Each row has 16 conceptual columns. Fixed widths are fractions of the full row,
not ratios normalized against the other children. Thus a lone 4-column child
occupies one quarter of the row's column area, leaving the rest empty. A fixed
16-column child occupies a whole row. Existing library gaps are included in the
calculation so widths plus gaps do not overflow the container.

Auto children share the remaining space equally. One Auto alone fills the row;
4 + Auto gives 4 + 12; 4 + Auto + Auto gives 4 + 6 + 6. With no Auto children,
unused columns remain empty. All-Auto layouts retain today's equal-width
behavior, including child counts that do not divide 16 evenly.

For mixed/fixed sizing, pack children in document order, reserving at least two
columns per Auto child; wrap to a new row when the next child cannot fit. Then
distribute each row's spare columns among its Auto children. Do not reorder
children to fill holes. Fractional Auto widths are allowed, so calculations must
not round spans to integers. A flex-based row with calculated bases, or explicit
row wrappers with equivalent sizing, is preferable to integer-only grid spans.
Keep row wrappers out of serialized UI schemas.

## Editor behavior

The native JSON Forms inspector offers Layout → Columns: Auto, 2…16 for direct
children of HorizontalLayout. This includes controls, presentation elements,
and nested layouts. The option belongs to a placement, not the JSON Schema field.
Retain it when moving elsewhere but only apply it under HorizontalLayout. A lone
restricted-width field is represented by a HorizontalLayout with one child;
do not implicitly change VerticalLayout sizing.

Canvas drop targets, insertion previews, selection borders and actual renderers
must use the same computed widths. Wrapping affects presentation only; DnD and
keyboard reordering still operate on the flat `elements` order. Fixed widths
must not expand because an input or nested layout has an intrinsic minimum width;
child wrappers use `min-width: 0`, with appropriate overflow handling.

In design mode, rule-hidden controls remain authorable and occupy their column
slots. At runtime, hidden controls should release their slots; the parent must
use JSON Forms visibility evaluation so it agrees with child rules. Disabled
controls continue to occupy space. Responsive stacking should use container
width (including web-component hosts), not viewport width; settle its breakpoint
and opt-out contract before implementing that separate responsive enhancement.

## Implementation steps and verification

1. Add a library-independent row/width calculator and option validation in the
   shared Svelte package. Test fixed, Auto, fractional, and wrapping cases.
2. Apply it in all three LayoutRenderers; preserve vertical layouts and each
   library's themed gaps. Add browser geometry tests for each renderer set.
3. Apply the same calculation to horizontal canvas drag zones. Add the contextual
   Columns inspector field, command support, Monaco completion and diagnostics.
4. Test a lone width-4 field, 4 + Auto, 4 + Auto + Auto, fixed widths with empty
   space, overflowing rows, hidden controls, and nested layouts. Verify canvas
   and preview geometry, DnD ordering, undo/redo, and JSON Apply/Revert in both
   editor integrations. Assert actual bounding boxes, not just CSS class names.
