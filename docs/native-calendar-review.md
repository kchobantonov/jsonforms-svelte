# Native calendar localization

Date and date-time renderers retain the calendar components, keyboard handling,
selection and popup behavior supplied by their UI libraries. Renderer text comes
from the shared JSON catalogs and the host translator, including live locale
changes and intentionally empty translations.

## Skeleton 4.12.1 / Zag Date Picker 1.34.1

The native DatePicker exposes `locale`, `translations`, `focusedValue` and
`onFocusChange`. Both renderers now supply the form locale and catalog messages
through those APIs. Explicit native translation overrides are merged above the
catalog defaults. Native Content/Table attributes provide localized role
descriptions where Zag has fixed internal descriptions.

Opening a staged picker sets its native focused date from the stored value.
Subsequent navigation updates the local focus through `onFocusChange`; locale
changes do not reset navigation or commit a date. This also fixes the date-time
picker opening on today's month while its selected value belongs to another month.

## Flowbite 1.33.1

Datepicker localizes dates through `locale`, but its calendar name and month/year
navigation labels are fixed in `dist/datepicker/Datepicker.svelte`; there are no
translation props or header snippets for those attributes. The date-time renderer
now passes the form locale, as the date renderer already did.

The private LocalizedDatepicker composition forwards the native props and action
snippet. A MutationObserver confined to that calendar replaces the five native
ARIA labels with catalog messages and disconnects on removal. The English strings
in the adapter identify upstream attributes; they are not translation fallbacks.
A WeakMap retains the identity of a translated element across locale updates.

Remove this adapter when the upstream Datepicker exposes equivalent navigation
and calendar-label props, retaining the existing locale and view-switch tests.

## shadcn / Bits UI 2.19.5

The existing shadcn Calendar exposes a root ref, value and placeholder bindings,
and a native `calendarLabel`. Its composed navigation and month/year selects do
not expose their label props through that wrapper. LocalizedCalendar preserves
those bindings and applies catalog ARIA names through the native root ref. Both
project copies of the generated UI components remain unchanged.

Bits UI's date announcer writes fixed English selection messages to a shared
`data-bits-announcer` element in the owning document. The adapter associates an
announcement with the calendar that received the pointer, keyboard or click
event. It translates only the two known Calendar message forms. Registrations
are separate per document and calendar; cleanup flushes queued observer records
before removing the owner, so closing a popup on selection retains its translated
announcement. Other widgets' announcements and native announcer ownership remain
with Bits UI.

Replace these bridges when the native Calendar exposes translation hooks for its
composed controls and announcements. They do not patch dependencies, alter stored
data or replace native calendar widgets.

## Readonly presentation

Numeric, masked and temporal text inputs pass the effective readonly state to the
native input while remaining enabled when `separateReadonlyFromDisabled` is true.
Clear actions remain hidden and the existing change boundary still guards writes.

- Bits UI Calendar exposes `readonly`, allowing focus and month navigation while
  preventing date selection. Effective `readonly` and `disabled` are passed after
  native Calendar option bags so those bags cannot override form permissions.
- Skeleton DatePicker exposes `readOnly`. Its native trigger refuses opening in
  that state; an existing popup closes when permission is revoked.
- Flowbite Datepicker has no readonly calendar API. Its picker trigger is disabled
  and an existing popup closes, while the text input stays focusable for inspection.
- Time picker controls expose disabled selection rather than readonly selection.
  Their editing controls are disabled; standalone time popups close on revocation.

The native field acceptance tests exercise keyboard input, focus, hidden Clear
buttons and restoration of editability. Shadcn also verifies calendar navigation
and unchanged selection with a conflicting native `readonly: false` option.
