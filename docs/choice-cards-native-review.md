# Choice-card UI review

Reference: React `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`,
[`ChoiceCards.tsx`](../../jsonforms-react-renderers/packages/jsonforms-react-shadcn-renderers/src/controls/ChoiceCards.tsx)
and its [shared implementation](../../jsonforms-react-renderers/packages/jsonforms-react-renderer-common/src/choiceCards.tsx).

The React shadcn adapter supplies theme colors to the shared card renderer. The
shared implementation owns the layout, native HTML radios, whole-card click,
focus outline, selected border, content restrictions and confirmation flow.
Its card styling uses 16px padding, a 12px group gap, an 8px corner radius and a
2px border. Selection adds an inset outline; errors change the border color.
These details make selection and keyboard focus visible even when images fail.

## Svelte implementation

| Family   | Native selection                     | Reason                                                                                                        |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| shadcn   | RadioGroup and Label                 | Retains the installed Bits UI radio navigation and disabled behavior.                                         |
| Flowbite | Radio with its label classes         | The library already makes the full label clickable and supports a bound group.                                |
| Skeleton | SegmentedControl and ItemHiddenInput | Uses the library's radio-group semantics. A decorative circle supplies the optional `showRadio` presentation. |

All three render branch editors after the group, preserve a visible text label,
and hide the radio circle by default. Svelte adapters use native dialogs for
branch confirmation. Bindable selection is restored to the committed value
while confirmation is pending or cancelled; tests cover the visual state as well
as stored data. Flowbite cancellation listens to `cancel`, since a delayed
`close` notification from a previous dialog can otherwise cancel a newly opened
confirmation.

The three adapters now use 2px card borders, an inset selected outline, and an
error-colored border on every card when the control is invalid. The card content
gap is 8px; the group gap remains 12px. Focused mounted suites pass 20/20 per
family, including computed border-width, selection and error-state checks,
radio-group help association, keyboard focus, disabled choices, and nested Group
value isolation.

## Visual and presentation acceptance

- Narrow light/dark cards now pass 12/12 family × EN/BG × host browser cases,
  each in both themes. The cases check containment, content overflow, selected
  border distinction and label contrast, with 24 screenshots under
  `test-results/choice-card-visual-review/`. Skeleton's selected label now uses
  readable themed text and Bulgarian rich content wraps inside the card.
  The `showRadio` Web Component matrix passes 6/6 across families and EN/BG;
  both themes show visible radio markers, focus outlines and error borders.
  Skeleton now exposes `aria-invalid` on the group. Native focus/error states
  pass the corresponding 390px light/dark matrix.
- Shared Markdown policy and inert card content are browser-tested in all three families. The rich-content matrix resolves both radios by their exact translated accessible names in all 12 family/locale/host cases.
- Rich content now precedes the choice label as in React, with DOM order and
  selection verified in all 12 family × EN/BG × host browser cases. Narrow
  wrapping is covered by the visual matrix; any remaining visual difference needs
  an explicit reason supported by the rendered result.
- Mounted extended-family suites pass 4/4 each for blocked images,
  failed image loads and selected-content replacement; the checked radio and
  visible label survive both image paths. The current shared 12/12, mounted
  20/20 per family, rich/detail production 24/24 and narrow theme/focus/error
  production 18/18 checks complete the P3.9 acceptance boundary.
