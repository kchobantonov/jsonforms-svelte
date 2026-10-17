# Example: boolean controls

**Example ID:** `boolean-controls`\
**Demo entry:** **Spec: Boolean controls** (`#spec-boolean-controls`)\
**Domain:** employee onboarding consent\
**Specs covered:**

- [Boolean checkbox and switch controls](../../docs/spec.md#1819-scalar-controls-and-temporal-editing)
- [Shared table-cell behavior](../../docs/spec.md#1819-scalar-controls-and-temporal-editing)
- [Honest rendering of invalid data](../../docs/spec.md#1819-scalar-controls-and-temporal-editing)

One example, because every boolean renderer answers the same three questions:
what is true, what is false, and what is neither.

## Every renderer that handles a boolean

| Renderer               | Where                                                              | Shown as                                                     |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `BooleanControl`       | `notifications`, `newsletter`, `handbookAccepted`, `payrollOptOut` | Checkbox                                                     |
| `BooleanToggleControl` | `remoteWorker`, `importedCount`                                    | Switch (`options.toggle`)                                    |
| `BooleanCell`          | `team[].active`                                                    | Checkbox in a table cell                                     |
| `BooleanToggleCell`    | `team[].onCall`                                                    | Switch in a table cell                                       |
| `EnumArrayRenderer`    | `channels`                                                         | Checkbox group — membership of an array, not a boolean value |

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly four errors:

| Instance path       | Keyword | Message                   |
| ------------------- | ------- | ------------------------- |
| `/handbookAccepted` | `const` | must be equal to constant |
| `/legacyFlag`       | `type`  | must be boolean           |
| `/importedCount`    | `type`  | must be boolean           |
| `/team/1/active`    | `type`  | must be boolean           |

## The three states

**True and false are both answers.** `notifications` is `false` and is
_required_: presence is satisfied, so there is no required error. Required means
the property must exist, not that it must be true.

**Absent is not false.** `newsletter` is missing, so its checkbox renders
**indeterminate** rather than unchecked. Rendering it must not write `false`
into the data — open the Data tab and confirm the property is still absent.

**A switch has no third state.** `remoteWorker` uses `options.toggle`. Where a
switch has no committed boolean it carries an accessible _"Not set"_, since it
cannot show indeterminate. Inspect it with a screen reader or check
`aria-describedby`.

## Values that are not booleans

This is the part the implementation used to get wrong.

| Property         | Holds                | Must render as                                     |
| ---------------- | -------------------- | -------------------------------------------------- |
| `legacyFlag`     | the string `"false"` | **not checked** — indeterminate, with a type error |
| `importedCount`  | the number `0`       | switch off, announced as not a true/false value    |
| `team[1].active` | the string `"false"` | same rules inside a table cell                     |

`!!data` made the string `"false"` render as **checked**, which the
specification names as forbidden: _"the string 'false' must not be shown as
checked"_. Truthiness also made `0`, `''` and `{}` look like deliberate
answers. The data is preserved for correction and reported by validation; it is
never presented as a valid true or false selection.

## Agreement is a schema rule, not a widget

`handbookAccepted` is `{"type": "boolean", "const": true}` and holds `false`,
so it shows a `const` error. Neither a checkbox nor a switch implies a
true-only constraint on its own — the renderer contract is explicit that a required boolean with
value `false` satisfies presence.

## Nullable

`payrollOptOut` is `["boolean", "null"]` and holds `null`. Null is a permitted
stored value here and is valid; it is **not** the same as absent, and the
control must not coerce it to `false`.

## Checkbox group is not a boolean control

`channels` renders checkboxes, but each one reflects whether its value is **in
the array**. Ticking one adds a string; it never stores a boolean. It is
included here because it is the renderer most often mistaken for one.

## Fallback behaviour

| Situation                    | Result                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| No `toggle` option           | Checkbox, the default presentation. No variant is involved.                           |
| Value is not a boolean       | Indeterminate checkbox / off switch, plus the validation error. Nothing is rewritten. |
| Locale switched to Bulgarian | "Not set" and the type messages translate; the stored values do not change.           |

## Conformance scope

This walkthrough describes the portable contract. Renderer support must be checked
by a host adapter; the package validates the authored assets, not live UI behavior.

## Standalone host setup

Load the JSON assets listed in [the catalog](../catalog.json) into a host
with the relevant renderer capabilities. No framework registration module is
required by this package.

## Feature navigation

Explore one feature at a time using the tabs: **Checkboxes**, **Switch**, **Invalid values**, **Checkbox groups**, **Table cells**. Tab titles are localized in English and Bulgarian. The tabs share the existing form data.
