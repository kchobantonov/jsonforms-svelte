# Example: string controls

**Example ID:** `string-controls`\
**Demo entry:** **Spec: String controls** (`#spec-string-controls`)\
**Domain:** customer intake\
**Specs covered:**

- [Masked string control](../../docs/spec.md#18186-masked-string-control)
- [Input composition and Unicode string length](../../docs/spec.md#18186-masked-string-control)
- [Shared placeholder hints](../../docs/spec.md#18186-masked-string-control)
- [Established presentation options](../../docs/spec.md#18186-masked-string-control) (`multi`, `mask`)
- [Honest rendering of invalid data](../../docs/spec.md#18186-masked-string-control)
- [The masked string control](../../docs/spec.md#18186-masked-string-control)

One intake form, seen through every string presentation the model defines. The
point of the example is that **a mask describes how a value is typed, and the
schema describes what is stored** — two decisions that a single field makes
separately, and that disagree more often than they look like they should.

## Files

| File                | Role                                                                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema.json`       | Eleven string properties: three plain, seven masked in different ways, one with a temporal `format`.                                                                                      |
| `uischema.json`     | `multi`, `suggestion`, `placeholder`, and six masks — unmasked and masked storage, alternative patterns, custom tokens, eager literals, and a boolean `mask` that must not select a mask. |
| `data.json`         | A valid value in every representation, one incomplete, and one the mask cannot carry at all.                                                                                              |
| `config.json`       | `showUnfocusedDescription`, `restrict` and `clearable`, all top level the specification and §11.9.                                                                                        |
| `translations.json` | English and Bulgarian, including two per-property error messages.                                                                                                                         |

No `uischemas.json`: nothing here nests.

## What the form contains

```text
Customer intake
  Coordinator name          plain text + placeholder           -> "Marta Oliveira"
  Office city          suggestion (free text + hints)     -> "Portland"
  Appointment notes       multi                              -> two lines
  ---
  Booking reference    mask ###-###, restrict, maxLength 6 -> stores "482913",   shows 482-913
  Contact phone        returnMaskedValue: true             -> stores "+1 (503) 555-0142"
  Account number       mask ["#### ####", "#### #### ####"] -> stores "123456789012", shows 1234 5678 9012
  ---
  Deck position        mask D-##, tokens { D: [A-C] }      -> stores "B07",      shows B-07
  Bay label            mask AAAA, tokens { A: \p{L} }      -> stores "Süd",      shows Süd
  Gate code            mask ##-##, eager                   -> stores "814",      shows 81-4  (invalid)
  ---
  Legacy reference     mask ###-###                        -> "PENDING-REVIEW"   (invalid, verbatim)
  Scheduled meeting     format: date, "mask": false         -> "2026-10-14"
```

## Validation state

Validated with Ajv (`allErrors`, `strict: false`, `ajv-formats`), the supplied
data produces exactly two errors:

| Instance path      | Keyword   | Message                         |
| ------------------ | --------- | ------------------------------- |
| `/gateCode`        | `pattern` | must match pattern `^[0-9]{4}$` |
| `/legacyReference` | `pattern` | must match pattern `^[0-9]{6}$` |

The two are there for different reasons, and the difference is the point.

**Gate code fits its mask perfectly and is still invalid.** `814` masks to
`81-4` with nothing rejected — a mask guides structure, and the spec says
plainly that "a generic mask does not imply that partial input is withheld
until the mask is complete". Completeness is the validator's job, and the field
shows a normal error for it. A renderer that withheld partial input here would
have nothing to report and an empty field.

**Legacy reference cannot be masked at all**, and is invalid for that reason.

## Expected behaviour

**Type into Booking reference and read the Data tab.** The field shows
`482-913`; the data holds `482913`. `returnMaskedValue` is off, so the
separator is presentation and never reaches storage.

**Contact phone is the opposite choice.** `returnMaskedValue: true` stores the
literals, so its `pattern` describes the punctuation too. That is a
consequence the author accepts, not something the renderer arranges: the renderer contract
requires that "the schema must instead describe the stored representation
containing the separator", and that the renderer "must not rewrite the schema
when this option changes".

**Clear Booking reference and type all six digits back.** All six go in. This is
worth trying deliberately: the field is `maxLength: 6` with `restrict: true`,
and the displayed text is _seven_ characters. Forwarding the schema limit to the
input's own `maxlength` stops the field at six displayed characters and makes the sixth digit
impossible to type. The limit here is checked against what would be stored, in
Unicode code points, after masking.

**Account number picks its mask by length.** Delete digits down to eight and the
grouping becomes `1234 5678`; type twelve and it becomes `1234 5678 9012`. One
control, two shapes, one stored string.

**Deck position rejects a `D`.** Its token map narrows the first position to
`[A-C]`; `#` and the other defaults are still there, because custom tokens are
applied _over_ the default table rather than replacing it.

**Bay label accepts any alphabet.** Its token is `\p{L}`, a Unicode property
escape, which only works because token patterns are compiled with the `u` flag
first. Type Cyrillic or Greek into it. This is the regex-compatibility
statement the renderer contract asks every implementation to make.

**Gate code inserts its separator before you reach it.** `eager: true`, so the
`-` appears as soon as the second digit is typed rather than when the third is.
Now delete back to empty: the stranded `-` goes with it.

**Legacy reference is shown exactly as imported.** `PENDING-REVIEW` is not
something `###-###` can carry, so it is displayed verbatim, and **nothing is
written on mount** — the renderer contract: existing data must not be normalized "solely by
mounting the control". Showing the masked remnant would have put `123-456` on
screen while the data still held fourteen characters. Type into it and the mask
takes over from that edit onward.

**Scheduled meeting carries `"mask": false` and is still a date picker.** That
boolean is the temporal control's own opt-out, and the spec says a "boolean
temporal option must not by itself request a generic masked field". Selecting on
the option's _presence_, as the neighbouring families do, turns "mask this less"
into "mask this generically"; selection here requires an actual pattern.

**Put the caret in the middle of Account number and type.** It stays after the
character you typed rather than jumping to the end or falling behind the group
separator.

**Switch the demo to Bulgarian.** Both error messages, the clear-value tooltip
and the descriptions translate. The stored values do not change.

## Fallback behaviour

| Situation                                                                   | Result                                                                                                       |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| No `placeholder` on a masked field                                          | The mask is the hint — `###-###`. Booking reference shows this; Contact phone overrides it.                  |
| `placeholder: ""`                                                           | No hint at all; the fallback is suppressed, per the renderer contract.                                       |
| A set of alternative masks and no placeholder                               | No hint — several masks have no single shape.                                                                |
| No `returnMaskedValue`                                                      | The value is stored without the mask literals.                                                               |
| No `eager` / `reversed`                                                     | Off. An explicit `true` turns them on, which is worth stating because the neighbouring families invert both. |
| `tokens` and `maskReplacers` both present                                   | `tokens` wins outright; the two do not merge.                                                                |
| A token whose regex does not compile                                        | Dropped with a console warning; the rest of the mask still works.                                            |
| A token with a `transform` function                                         | Dropped — function-valued options are not part of the portable model.                                        |
| `mask` on a string with `format: date`/`time`/`color`/`password`/`duration` | Ignored; the format's own editor wins.                                                                       |
| A stored value the mask cannot carry                                        | Shown verbatim, left unwritten until edited.                                                                 |
| `restrict: false`                                                           | The limit is not enforced while typing; an over-long value is reported by the validator instead.             |

## Conformance scope

This walkthrough describes the portable contract. Renderer support must be checked
by a host adapter; the package validates the authored assets, not live UI behavior.

## Standalone host setup

Load the JSON assets listed in [the catalog](../catalog.json) into a host
with the relevant renderer capabilities. No framework registration module is
required by this package.

## Feature navigation

Explore one feature at a time using the tabs: **Plain text**, **Input masks**, **Custom mask tokens**, **Fallback behavior**. Tab titles are localized in English and Bulgarian. The tabs share the existing form data.
