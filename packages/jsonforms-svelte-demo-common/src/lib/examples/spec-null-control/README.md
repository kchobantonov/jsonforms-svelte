# Example: null control

**Example ID:** `null-control`\
**Demo entry:** **Spec: Null control** (`#spec-null-control`)\
**Domain:** project declarations\
**Specs covered:**

- [Null control](../../docs/spec.md#18-renderer-behaviour-specifications)
- [Shared clear-control behavior](../../docs/spec.md#18-renderer-behaviour-specifications)
- [Honest rendering of invalid data](../../docs/spec.md#18-renderer-behaviour-specifications)

A `{"type": "null"}` property can hold exactly one value, so the control's only
job is to say whether that value is **there**. The point of the example is that
**absent, `null` and `""` are three different things**, and only the middle one
is what this control writes.

## Files

| File                | Role                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `schema.json`       | Three `type: "null"` properties, one of them required, plus three contrast properties that are not null controls.   |
| `uischema.json`     | Plain controls; the null control needs no options.                                                                  |
| `data.json`         | One explicit `null`, one absent required value, one value the type does not admit, and an empty string beside them. |
| `config.json`       | `showUnfocusedDescription` and `restrict`, both top level.                                                          |
| `translations.json` | English and Bulgarian for the two keyword messages this data produces.                                              |

No `uischemas.json`: nothing here nests.

## What the form contains

```text
Project declarations
  No surcharge applies            type: null            -> null        (ticked)
  No exceptions          type: null, required  -> absent      (invalid)
  Additional approval not required  type: null            -> "n/a"       (invalid)
  ---
  Review note                   type: string          -> ""
  Reference number                     type: string          -> absent
  Inspection remark               type: [string, null]  -> null        (mixed control)
```

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly two errors:

| Instance path     | Keyword    | Message                                         |
| ----------------- | ---------- | ----------------------------------------------- |
| `` (the object)   | `required` | must have required property 'exceptionsChecked' |
| `/legacyApproval` | `type`     | must be null                                    |

The first is attached to the **object**, not to the field: an absent property
has no instance path of its own. The second is the out-of-domain value.

## Expected behaviour

**No surcharge applies is ticked, and the data holds `null`.** Untick it and the
property becomes **absent** — not `false`, and not `""`. Tick it again and
`null` comes back. That is the whole of the control: a two-state switch between
`null` and not-present.

**No exceptions is required and absent**, so it is unticked and
reports the missing-property error. Ticking it writes `null`, which satisfies
`required` — because the property then exists. This is the case the control is
for: a declaration that has to be _recorded_, where leaving the box untouched
must not read the same as saying no.

**Additional approval not required holds `"n/a"`.** The box is drawn
**indeterminate** — neither ticked nor unticked — because the value is neither
`null` nor absent, and §19 forbids showing it as either. The value stays in the
data for the validator to report; the control does not quietly replace it.
Ticking the box overwrites it with `null`, which is an edit, not a normalization.

**Review note is `""`, and that is a value.** An empty string is a note that
says nothing; it is not the same as Reference number, which nobody has filled in.
Neither is the same as `null`. Read the Data tab: `reviewNote` is present with
an empty string, `referenceNumber` is not there at all.

**Inspection remark is not a null control.** Its type is `["string", "null"]`,
a union, which selects the **mixed control** — so it shows a type selector and
writes `null` only when null is the selected type. The null control is for
`type: "null"` alone, which is the distinction the two rows make side by side.

**Switch the demo to Bulgarian.** Both messages translate. The values do not.

## Fallback behaviour

| Situation                            | Result                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| Value is `null`                      | Ticked.                                                                                  |
| Value is absent                      | Unticked.                                                                                |
| Value is anything else               | Indeterminate, preserved, and reported by the validator.                                 |
| The control is disabled or read-only | The box is disabled; the value is untouched either way.                                  |
| `type: ["string", "null"]`           | Not this control — the mixed control, which offers null as one type among several.       |
| A `required` `type: "null"` property | Ticking it satisfies `required`, because the property then exists with the value `null`. |

## Conformance scope

This walkthrough describes the portable contract. Renderer support must be checked
by a host adapter; the package validates the authored assets, not live UI behavior.

## Standalone host setup

Load the JSON assets listed in [the catalog](../catalog.json) into a host
with the relevant renderer capabilities. No framework registration module is
required by this package.

## Feature navigation

Explore one feature at a time using the tabs: **Explicit null**, **Other empty values**. Tab titles are localized in English and Bulgarian. The tabs share the existing form data.
