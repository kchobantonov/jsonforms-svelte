# Example: password control

**Example ID:** `password-control`\
**Demo entry:** **Spec: Password control** (`#spec-password-control`)\
**Domain:** account credentials\
**Specs covered:**

- [Password control interaction](../../docs/spec.md#1824-one-time-password-presentation)
- [Schema-driven and UI-driven format selection](../../docs/spec.md#1824-one-time-password-presentation)
- [Shared table-cell behavior](../../docs/spec.md#1824-one-time-password-presentation)
- [`variant: "otp"`, a fixed-length code editor](../../docs/spec.md#1824-one-time-password-presentation)

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly two errors:

| Instance path       | Keyword     | Message                               |
| ------------------- | ----------- | ------------------------------------- |
| `/password`         | `minLength` | must NOT have fewer than 8 characters |
| `/verificationCode` | `minLength` | must NOT have fewer than 6 characters |

The second is the point of the OTP field below: a half-entered code is stored
and reported, not hidden.

Ajv also warns that `password` is an unknown format and ignores it. That is
correct and expected: `password` is "a custom format convention supported by
this project, not a built-in JSON Schema validation format". It selects a
presentation; it constrains nothing.

## Both selection paths

Section 5 keeps these separate on purpose — schema `format` describes the data,
UI `options.format` requests a presentation without changing the schema — and
requires both to work.

| Field                            | Selected by                                                 |
| -------------------------------- | ----------------------------------------------------------- |
| `password`                       | `"format": "password"` in the **schema**                    |
| `recoveryPhrase`                 | `"options": { "format": "password" }` on a **plain string** |
| `verificationCode`, `backupCode` | schema format again, plus `"variant": "otp"`                |

The second used to render in clear text: the renderer only looked at the schema
format. The `hint` field beside it is an ordinary string, for contrast.

## What to try

**Reveal, then check the Data tab.** Toggling changes presentation only. It
must not write form data, fire a change event, alter validation or mark the
value dirty, and the reveal state is never stored anywhere.

**Tab to the toggle and press Enter.** It is a single focusable button.
Its accessible name states the action it performs: “Show password”, becoming
“Hide password” once revealed. The tooltip uses the same wording.

**Reveal and clear are separate controls.** Each has its own name and its own
hit target; neither reaches the other.

**Length is an ordinary constraint.** `password` holds `"short"` and reports
`minLength`. The presentation imposes no complexity rules of its own — the spec
is explicit that "password presentation itself imposes no complexity rules or
additional content validation".

**Enter the verification code.** `options.variant: "otp"` draws it one
character per box — six of them, because the schema says `minLength: 6` and
`maxLength: 6`. It is still the same password: masked by default — each box a real password
input showing a bullet — with the same reveal button and the same clear action. Only the editor changed, which is why
this is a `variant` and not a new `format`.

**Type two digits and stop.** The partial code is stored and reported as too
short. Each keystroke must update form data, including incomplete codes.

**Backup code asks for the same variant and does not get it.** Its schema sets
no `minLength`/`maxLength`, so there is no honest number of boxes to draw and it
falls back to an ordinary password field. Drawing six boxes would be the widget
asserting a constraint the schema does not carry.

**A PIN is this variant plus a constraint.** `verificationCode` adds
`"pattern": "^[0-9]*$"`. There is no separate `pin` variant: the numeric rule
belongs in the schema, where validation can see it.

**Look at the service accounts table.** The `token` column is masked too.
Without a password cell it fell through to the plain text cell and printed the
token for anyone looking at the screen.

**Switch to Bulgarian.** The toggle and clear names translate; the stored
values do not change.

## Fallback behaviour

| Situation                                   | Result                                                                                                                |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Neither format supplied                     | An ordinary text control.                                                                                             |
| Renderer set without the password entry     | The string control wins at a lower rank and the value shows in clear text.                                            |
| `clearable: false`                          | No clear affordance; the reveal toggle is unaffected.                                                                 |
| `variant: "otp"` without both length bounds | The ordinary password field. Not an error, not an empty control.                                                      |
| `variant: "otp"` inside a table cell        | The ordinary masked password cell — a row of boxes does not fit a column, and only masking has to survive delegation. |
| `minLength` lower than `maxLength`          | `maxLength` boxes; the trailing ones are optional and the floor is reported by validation.                            |

## Conformance scope

This walkthrough describes the portable contract. Renderer support must be checked
by a host adapter; the package validates the authored assets, not live UI behavior.

## Standalone host setup

Load the JSON assets listed in [the catalog](../catalog.json) into a host
with the relevant renderer capabilities. No framework registration module is
required by this package.

For renderers supporting this OTP example, partial codes are committed
immediately; reveal changes presentation only. Without both length bounds, OTP
falls back to the ordinary masked password editor. Table cells stay compact and
masked rather than rendering segmented boxes.

## Feature navigation

Explore one feature at a time using the tabs: **Password**, **UI format selection**, **Verification code**, **Table cells**. Tab titles are localized in English and Bulgarian. The tabs share the existing form data.
