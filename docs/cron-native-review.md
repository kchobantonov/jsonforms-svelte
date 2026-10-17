# Cron controls

The shared controller follows the spec's six-field, seconds-first profile and the React reference's period-first picker. It preserves aliases, advanced expressions and invalid imported strings. Opening or cancelling never seeds data. Apply commits a staged draft; `showActions: false` commits edits immediately. The default extended Ajv registers the same grammar validator. Hosts supplying their own Ajv own its format registration.

## Native adapters

- **shadcn:** Input, Button, Popover and Select, including multiple field selection. Portal placement uses the host target.
- **Flowbite:** Input, Button, Popover, Select and MultiSelect. The popover sits beside its trigger so native anchoring also works inside Shadow DOM. Its trigger delay and transition duration are zero: the library’s delayed trigger and outgoing transition can interfere with a rapid Cancel/reopen edit. A real-pointer regression covers that sequence. The built-in MultiSelect close control is hidden in favor of translated field actions.
- **Skeleton:** Popover and Portal with the library's styled native inputs, buttons and selects. The installed Skeleton package has no Select component export; the native HTML select supports both single and multiple values.

All text lives in JSON catalogs. Host translators can override messages independently of locale names. Field labels, month and weekday names, actions and diagnostics have English and Bulgarian defaults.

## Evidence

- 40 shared parser/validator tests, including malformed advanced tokens and unchanged error paths.
- Eight browser cases per family: alias preservation, staged Apply/Cancel, immediate edits, invalid imports, advanced syntax, clearing, absent/UI-only values, readonly guards and period/hour selection.
- The canonical example is imported without rewriting its intentional invalid data. Schema label supplements support both demo locales.
- All 12 production cases in `tests/demos/cron-control.spec.ts` pass: three families × EN/BG × native/Web Component. They verify staged cancellation, Apply and retained unsupported dialects.
