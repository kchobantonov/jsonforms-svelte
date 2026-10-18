# Password and OTP native component review

## Contract and references

The contract is spec §18.24 at `48b96b5`.
React Antd `PasswordOtpControl`/`AntdOtp` and shadcn `PasswordControl` at
`935122d` provide interaction references.
The Svelte implementation is independently implemented against that contract.

Both schema and UI password formats select the existing password renderer and
cell entries. A local OTP variant with both length bounds displays character
boxes; missing bounds retain ordinary password presentation. Cells always retain
one masked input. Oversized imported strings retain a full ordinary input instead
of silently truncating their stored value to the available boxes.

## Native choices

- Shadcn uses the official [Input OTP](https://www.shadcn-svelte.com/docs/components/input-otp)
  Root, Group and Slot components, backed by Bits UI PinInput. Source was imported
  from the [pinned nova registry](https://raw.githubusercontent.com/huntabyte/shadcn-svelte/8cbccdc8214e68709239fe9752e789e763f90aaa/docs/static/registry/styles/nova/input-otp.json) into both
  application-owned UI directories. Only the utility import alias, the registry's
  icon placeholder (resolved to Lucide Minus), and repository formatting change.
  Slot styling, invalid feedback, focus and password-manager integration remain
  owned by the library components. The private adapter below reconciles native
  selection and editing with JSON Schema Unicode length semantics. The renderer passes masked character
  presentation into Slot while preserving the actual input value and password type.
  It does not impose numeric-only filtering: schema validation owns that constraint.
- The installed Flowbite package has no dedicated OTP export. Character boxes use
  its native Input, with ToolbarButton and CloseButton for actions. Each input
  sits in a fixed-width character container: Flowbite 1.33.1 applies `w-full`
  through its base slot as well as its input slot, so a width class on Input
  alone does not reliably constrain the rendered box.
- The installed Skeleton package has no dedicated OTP export. Character boxes use
  its styled native inputs and buttons.
- Flowbite/Skeleton share a Svelte interaction component for partial edits,
  paste, navigation, composition and leading-zero preservation. This component
  receives the native input as a snippet; it does not substitute a separate UI kit.

The ordinary password field and OTP share translated reveal/clear actions.
Reveal uses each family’s native Tooltip around one button, with the same JSON-backed
action label for the tooltip and accessible name. Shadcn and Skeleton use the host
portal context; Flowbite uses its native popover. Disabled controls disable reveal,
matching the React reference, and synthetic clicks are guarded. Readonly mutations
are guarded independently of browser disabled behavior.
Empty and partial edits retain string semantics and normal schema validation.

## Evidence and remaining acceptance

The three real-registry browser suites cover partial values, leading zeros,
paste, bounded/unbounded selection, oversized imported strings, readonly mutation
and ordinary masked table cells. Existing password tests cover EN/BG actions.
The original six live native family/locale runs pass. After adopting the composed
shadcn Input OTP, all five OTP regressions and all four ordinary-password tests
pass; the shadcn package type check reports zero errors and warnings.
`tests/demos/password-control.spec.ts` exercises the imported source fixture for each
family/locale/native or Web Component combination. All twelve production scenarios
pass, including bounded paste, leading-zero preservation, keyboard reveal/hide,
independent backup-field masking, clearing and committed data. Shadcn additionally
checks masked slot contents and cleared invalid state after a valid code. Flowbite
and Skeleton assert compact character-box geometry. The corrected Flowbite
production screenshot was inspected. Updated production scenarios cover Unicode
composition and compact password edits; light/dark narrow screenshots were reviewed
for all three families, with six boxes fitting beside their actions. The native reveal-tooltip update passes
31 component tests and twelve production cases, including Shadow DOM. Component
tests verify live French host overrides, no value-change event on reveal and
disabled synthetic-click guards for both ordinary and OTP presentation.

## Component inspection before implementation

For each renderer change, inspect the installed target library exports and source,
then its official documentation. Use the library's composed component when it
exists, rather than reimplementing its presentation over lower-level primitives.
Record the inspected version, selected component and any missing capability before
adding custom behavior. For this OTP change, Flowbite's installed export barrel
and Skeleton 4.12.1's export barrel have no dedicated OTP component; their existing
native-input compositions remain. The compact File renderer is an explicitly
requested presentation exception, not a general exception for other controls.

## Ordinary password text and readonly behavior

Ordinary password inputs, including compact cell inputs, now use the same text
draft controller as String/MultiString. Completed length checks count Unicode
code points; unfinished composition remains local and blocks consuming actions.
External data/schema/path replacement cancels drafts. Native readonly inputs stay
focusable for inspection and copying; Clear actions are hidden, while mutation
callbacks also enforce readonly state.

## OTP editing adapter

Bits UI 2.19.5 still uses UTF-16 units for `maxlength`, string `slice` and cell
indexing, and its input handler does not protect unfinished composition. The
private shadcn `passwordOtp.svelte.ts` adapter retains native Root/Group/Slot:

- The shared text controller owns drafts and pending action coordination. Input
  capture bypasses the native code-unit truncation; clipboard edits use the same
  controller so inserted text does not truncate unchanged suffixes.
- The native input permits enough UTF-16 units for the schema's code-point limit.
  During composition its HTML length limit is removed. Completed edits enforce
  the schema bound, and exactly that number of native Slots is rendered.
- Native selection is expanded to whole code points, including supplementary
  characters. During composition a scoped window capture listener prevents the
  native document listener from rearranging the IME selection. Event listeners
  are removed when the input or renderer is removed.
- Host data/schema/path replacement, permission changes and switching back to an
  ordinary password cancel pending OTP edits. Late composition events cannot
  update the replacement target.

Flowbite/Skeleton retain native character inputs through `PasswordSegments`.
Their composition now registers pending ownership, blocks consuming actions,
cancels on target replacement, and clears ownership on removal. Native readonly
attributes preserve inspection and navigation while callbacks guard form writes.

Browser regressions cover partial strings, code-point paste and display, native
keyboard replacement, readonly inspection, cancellation and consuming Button
actions. Updated production acceptance passes all twelve family/locale/host cases.
Native focus and narrow/wide geometry pass source checks, and light/dark screenshots
were reviewed. The password/OTP acceptance item P3.6 is complete; this does not
establish full renderer or native-library parity.

OTP initial focus uses the native input's autofocus behavior; only the first
Flowbite/Skeleton character input receives it. Native boxes can shrink to 24 CSS
pixels on narrow layouts. Longer codes retain horizontal scrolling, while normal
six-character codes fit beside their actions. Wide layouts keep the actions next
to the boxes instead of stretching the gap across the field.

OTP clear actions use a named field group: nonempty editable values reveal Clear only on field hover or focus, including focus on Clear itself. Other ancestor hover states cannot reveal it. The visibility toggle remains independently available. Shadcn disables the native PinInput optional password-manager width-push strategy: widening the transparent input can introduce a focus-only scrollbar inside the OTP scroll container. The native input and autofill remain enabled. Focused six-slot geometry and narrow layouts are tested.
