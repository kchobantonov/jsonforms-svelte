# Cron controls

The shared controller follows the spec's six-field, seconds-first profile and the React reference's period-first picker. It preserves aliases, advanced expressions and invalid imported strings. Opening or cancelling never seeds data. Apply commits a staged draft; `showActions: false` commits edits immediately. The default extended Ajv registers the same grammar validator. Hosts supplying their own Ajv own its format registration.

## Native adapters

- **shadcn:** Input, Button, Popover and Select, including multiple field selection. Portal placement uses the host target.
- **Flowbite:** Input, Button, Popover, Select and MultiSelect. The popover sits beside its trigger so native anchoring also works inside Shadow DOM. Its trigger delay and transition duration are zero: the library’s delayed trigger and outgoing transition can interfere with a rapid Cancel/reopen edit. A real-pointer regression covers that sequence. The built-in MultiSelect close control is hidden in favor of translated field actions.
- **Skeleton:** Popover and Portal with styled native inputs/buttons, a native select for the repeat period, and the library's Combobox for multiple values. The collapsed Combobox replaces a permanently expanded HTML multiple select, keeping the picker compact. Its native clear trigger uses the translated Every action.

All text lives in JSON catalogs. Host translators can override messages independently of locale names. Field labels, month and weekday names, actions and diagnostics have English and Bulgarian defaults.

## Evidence

- 40 shared parser/validator tests, including malformed advanced tokens and unchanged error paths.
- Eight browser cases per family: alias preservation, staged Apply/Cancel, immediate edits, invalid imports, advanced syntax, clearing, absent/UI-only values, readonly guards and period/hour selection.
- The canonical example is imported without rewriting its intentional invalid data. Schema label supplements support both demo locales.
- All 12 production cases in `tests/demos/cron-control.spec.ts` pass: three families × EN/BG × native/Web Component. They verify staged cancellation, Apply and retained unsupported dialects.

## Compact picker trigger

The picker uses an icon button inside the input frame, matching React shadcn's
CalendarClock trigger. The native popup trigger and staged editing remain intact.
Input padding reserves space for the leading picker and trailing clear action;
logical start/end positioning also follows text direction. The picker accessible
name and title use `cron.choose` through the JSON catalog/host translator. There
is no visible Choose a schedule text button alongside the field.

The clear action matches the corresponding color control: shadcn uses its native
ghost icon-xs button, Flowbite uses CloseButton, and Skeleton uses its compact
styled icon button. It is present only for a nonempty editable value and visible
only while the cron field is hovered or contains keyboard focus. A named Tailwind
group prevents unrelated ancestor hover states from exposing it. Its accessible
name comes from `control.clearValue` in the translation catalog.

## Compact picker layout

Match the AntD layout with horizontal label/control rows. Flowbite and Skeleton use a 20rem popup; shadcn uses 24rem, capped by the viewport, to leave more room for multiple selections. Full-width Every buttons are replaced by inline native reset icons, with translated accessible names and tooltips. Selected-value summaries truncate within their allocated width. Advanced expressions stay editable as text, and Apply/Cancel retain the existing staged semantics. The production scenario exercises Month mode and checks popup dimensions; the source tests verify reset ownership and native selection.

Shadcn bounds its native option list to 16rem and keeps native scrolling and scroll controls. Production tests wheel to minute 59 before selecting it. Text, clear icon and dropdown arrow have separate space; the clear icon is centered and only visible on hover/focus within that field. Selected text uses logical start alignment.
