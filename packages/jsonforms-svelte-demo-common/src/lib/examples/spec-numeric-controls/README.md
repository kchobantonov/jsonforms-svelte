# Numeric controls: numbers and integers

**Example ID:** `numeric-controls`\
**Demo entry:** **Spec: Numeric controls: numbers and integers** (`#spec-numeric-controls`)\
**Domain:** office stock line\
**Specs covered:**

- [Numeric controls: numbers and integers](../../docs/spec.md#1819-scalar-controls-and-temporal-editing)
- [Numeric parsing and representation limits](../../docs/spec.md#1819-scalar-controls-and-temporal-editing)
- [Slider control](../../docs/spec.md#1819-scalar-controls-and-temporal-editing)

The three go together: they are the same value seen through three editors, and
the parsing rules apply to all of them.

## Files

| File                | Role                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `schema.json`       | Integer and number properties with bounds, `multipleOf`, an exclusive bound, a negative range and a slider-eligible property. |
| `uischema.json`     | The same values through plain entry, `options.step` and `options.slider`.                                                     |
| `data.json`         | Deliberately invalid in two places, and valid-but-easily-mishandled in several others.                                        |
| `config.json`       | `restrict: true` and `showUnfocusedDescription`, both top level.                                                              |
| `translations.json` | English and Bulgarian keyword error messages.                                                                                 |

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly two errors:

| Instance path | Keyword            | Message               |
| ------------- | ------------------ | --------------------- |
| `/batchCount` | `multipleOf`       | must be multiple of 2 |
| `/weightKg`   | `exclusiveMinimum` | must be > 0           |

Everything else is valid, including the values most likely to be mishandled.

## What to try

**Type `1.9` into Quantity.** It must stay `1.9` and report "must be integer".
It must not become `1`. `parseInt('1.9')` is `1`, which silently commits a
different number from the one on screen - the specification names this case,
and it was the behaviour here until recently.

**Type `1e3` into Quantity.** It must become `1000`, not `1`. The spec: an
integer editor may refuse exponent syntax, "but it must not interpret 1e3 as
1".

**Clear a field.** It must become empty, not `0`. `Number('')` is `0`, so a
parser that does not test emptiness first turns clearing into committing a
zero.

**Zero and negative values are real data.** Quantity is `0`, weight is `0`,
discount is `0` and tolerance is `-2.5`. None is an empty field, and none
should be replaced by a default or a placeholder. The slider shows `0` rather
than jumping to its `default` of `10` - the truthiness fallback the spec
forbids, and the bug this example was written to catch.

**Switch the demo to Bulgarian.** The error messages carry `{limit}` and
`{multipleOf}` placeholders filled from `error.params`. Core does no
interpolation of its own - the spec puts that on the translator - so a catalog
message renders literally unless the translator substitutes.

## Adapter checks

Compare `options.step` with the schema's `multipleOf`, test inclusive and
exclusive bounds with `restrict`, and verify that zero is shown as a real
value. An unset slider needs a visible and accessible unset state. Numeric
entry must avoid committing non-finite numbers or silently losing precision.
These checks require interaction with the selected renderer, beyond schema
validation of the fixture.

## Fallback behaviour

| Situation                                                          | Result                                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| No `options.step`                                                  | Falls back to the renderer default, not to the schema's `multipleOf` (a known gap).                    |
| `slider: true` on a property without `minimum`/`maximum`/`default` | The range tester rejects it and ordinary numeric entry is used.                                        |
| Unparseable entry                                                  | Nothing is committed; the previous value stands. `NaN` and `±Infinity` are never written to form data. |

## Conformance scope

This walkthrough describes the portable contract. Renderer support must be checked
by a host adapter; the package validates the authored assets, not live UI behavior.

## Standalone host setup

Load the JSON assets listed in [the catalog](../catalog.json) into a host
with the relevant renderer capabilities. No framework registration module is
required by this package.

## Feature navigation

Explore one feature at a time using the tabs: **Integers**, **Numbers**, **Slider**. Tab titles are localized in English and Bulgarian. The tabs share the existing form data.
