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

## Remaining visual and presentation work

- Compare built demos in light/dark themes and narrow layouts, including actual
  focus outlines and selected/error border contrast. Browser interaction tests
  do not certify those visual details.
- Shared Markdown policy and inert card content are implemented and browser-tested in all three families. Complete the light/dark visual review of typography, wrapping and the radio's accessible text name.
- Review border width, image/content ordering and wrapping against the reference.
  Native components are the default; any remaining visual difference needs an
  explicit reason supported by the rendered result.
- Retest `showRadio`, blocked/broken images and content replacement after those
  presentation changes. Keep rich-content capability marked partial until then.
