# Example: mixed control

**Example ID:** `mixed-control`\
**Demo entry:** **Spec: Mixed control** (`#spec-mixed-control`)\
**Domain:** product listing attributes\
**Specs covered:**

- [Mixed-value control and deep-structure navigation](../../docs/spec.md#1820-mixed-value-controls-and-navigation)
- [Tuple control](../../docs/spec.md#1820-mixed-value-controls-and-navigation) (the open tail delegates here)
- [Honest rendering of invalid data](../../docs/spec.md#1820-mixed-value-controls-and-navigation)
- [An array element's type cannot be cleared](../../docs/spec.md#1820-mixed-value-controls-and-navigation)

Eight values whose **type is data**. The point of the example is that a mixed
value carries its own type alongside its contents: the selector says which, the
editor beside it says what, and changing one is not the same as clearing the
other.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Six union-typed properties, one unconstrained schema, and a tuple with an open tail. |
| `uischema.json` | Plain controls — a union type selects this renderer with no variant. |
| `data.json` | A value of each type, an explicit `null`, an absent one, one the schema refuses, and two structured ones. |
| `config.json` | `showUnfocusedDescription` and `restrict`, both top level. |
| `translations.json` | English and Bulgarian for the selector, the tree and the type error. |

No `uischemas.json`: nothing here registers a detail form.

## What the form contains

```text
Product listing attributes
  Label        [string, number, boolean, null]     -> "Priority handling"
  Quantity     [number, boolean, null]             -> 42          (integer under number)
  ---
  Surcharge    [string, number, boolean, null]     -> null        (explicit)
  Reference    [string, number, null]              -> absent      (no selection)
  Priority     [string, number]                    -> true        (invalid, preserved)
  ---
  Payload      [object, array, string, null]       -> object      (structure workspace)
  Anything     {} (unconstrained)                  -> object      (every type offered)
  ---
  Project phases   tuple, open tail                    -> ["Portland", 2, true]
```

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly one error:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `/priority` | `type` | must be string,number |

Everything else is valid, including the explicit `null` and the absent value —
neither is an error, and the difference between them is not a validation
question at all.

## Expected behaviour

### The type comes from the value

**Every selector starts on the type its value already has**, without replacing
or coercing it. Label reads `string`, Payload reads `object`.

**Quantity holds `42` and reads `number`.** the renderer contract: "an integer is also admissible
under number." The selector does not offer `integer` separately here because the
schema does not list it; the value is unchanged either way.

**Choose a different type on Label.** The value is replaced by that type's
normal initial value — `0` for number, `false` for boolean. Choosing the type it
already has does nothing.

### Null, absent, and refused

**Surcharge holds JSON `null`**, and the selector reads `null`. That is a
*value*. **Reference is absent**: no type is selected, and no value editor is
drawn beside the selector — there is nothing to edit yet.

**Clear Surcharge with the × and watch the difference.** The value goes and the
field becomes like Reference. the renderer contract keeps these apart: "selecting null writes JSON
null; clearing removes the selection/value using the shared clear-value
contract. Empty string, null, and absence remain distinct."

**Priority holds `true` where only string and number are allowed.** The value is
kept and reported, not replaced — §19. The selector shows no type, because
`boolean` is not one this field offers.

### Structured values

**Payload opens the structure workspace**: a searchable tree on the left, the
selected node's editor on the right, with a resizable splitter, breadcrumbs, and
a **Show primitives** toggle. Each node carries its own type selector, so a
property can be turned from a string into an array in place.

**Anything has no schema at all.** An unconstrained schema is admitted to this
renderer — otherwise nothing would know what editor to offer — and every JSON
type is on the menu.

### Inside an array

**Project phases is a tuple whose tail is open**, so its trailing values have no
schema of their own and are edited here. Item 2 is a number and Item 3 a
boolean, each with its own selector.

**Those selectors offer no clear.** the renderer contract: "for an array item, do not offer a
clear-type action and guard the handler against unsetting the slot." Clearing
would delete the element in place and leave a hole, which serializes to `null`
— and the same section forbids exactly that: "never create undefined values or
sparse array slots". Removing a trailing value is the **Delete** action in the
Additional items section; removing the *type* is not an operation an array
element has.

**Switch the demo to Bulgarian.** The selector's label and placeholder, the tree
label, the rename/delete actions and the type error all translate.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| A union of two or more types | This renderer, with no variant needed. |
| A single-type schema | Its ordinary control; this renderer does not apply. |
| An unconstrained (`{}` or `true`) schema | This renderer, offering every type. |
| A `false` schema | Not admitted — it permits nothing, which is not the same as permitting anything. |
| A value outside every permitted type | Preserved and reported; no type is selected. |
| An absent value | No selection, no value editor. |
| A value at an array index | No clear-type action, in the tree and on the control alike. |

## Conformance scope

This walkthrough describes the portable contract. Renderer support must be checked
by a host adapter; the package validates the authored assets, not live UI behavior.

## Standalone host setup

Load the JSON assets listed in [the catalog](../catalog.json) into a host
with the relevant renderer capabilities. No framework registration module is
required by this package.


## Feature navigation

Explore one feature at a time using the tabs: **Scalar types**, **Null and invalid values**, **Structured values**, **Array items**. Tab titles are localized in English and Bulgarian. The tabs share the existing form data.

## Type and composition

The additional tab demonstrates explicit string/integer alternatives, an object whose field is contributed by `allOf`, and overlapping `oneOf` alternatives. The initial `abcd` matches both text branches and is intentionally invalid. Switch the scalar type and check that incompatible typed alternatives disappear. Labels include English and Bulgarian translations.

The Scalar types tab includes both Integer and Number. Quantity starts at 2: select Number and enter 2.5, then select Integer to see the local whole-number error without changing the data.

## Table cells

The Table cells tab uses an array of objects with a mixed `value` property. Rows include string, integer, fractional number, boolean, null, object and array values, plus a missing required value. Use the cell editor to change types and explore structured data; the numeric rows exercise explicit Integer/Number selection. Column and navigation labels include English and Bulgarian translations.

## Optional active-branch feedback

The Branch feedback tab compares two editors for the same value. Global `validateActiveBranch: true` enables the first; `options.validateActiveBranch: false` disables the second. Select Short text without modifying the value to see local feedback only in the first editor. The long-text alternative keeps the document valid.

### Branch feedback comparison

The two labelled groups bind the same object, `branchFeedback`, whose `text` starts as `Longer text`. Each exposes Short text (maxLength 5) and Long text (minLength 3) tabs. Select Short text in both: only the enabled group shows a local length error. The document value remains valid through Long text. Switching to Long text clears local feedback. This comparison uses object branches so its navigation is visible independently of scalar editor selection.

The structured payload starts collapsed using `config.jsonformsExtended.mixed.collapsed: true`, overriding the shared expanded default. Opening the frame does not change tree-node expansion or data.
