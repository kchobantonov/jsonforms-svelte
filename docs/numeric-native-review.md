# Numeric and slider component review

## Native components

Flowbite uses Input and Range. Shadcn uses Input and its Bits UI Slider wrapper.
Skeleton uses its styled number input and native Slider. Clear actions use each
family's button primitives. The shadcn wrapper forwards the existing accessible
name, description, validity and value-text attributes to its native thumb; the
visible value tooltip uses the same text. Both demo and Web Component copies
carry that change.

The shared numeric input parser preserves incomplete drafts, rejects fractional
integer commits and parses complete exponent notation. It applies the restrictive
bound-repair policy without clamping incoming values. Local feedback uses the
JSON catalogs and host translator. The scalar cell delegates the same behavior.

## Slider values and increments

The thumb position is presentation state. Missing values can borrow the schema
default but remain visibly and accessibly “Not set”. Null, strings, objects,
fractional integer values and values outside the selectable grid retain their
stored data and expose its JSON representation separately. Zero is a present
answer. Only explicit native pointer/keyboard interaction commits a number.

`multipleOf` determines slider increments; text-input `options.step` does not.
The shared calculation uses decimal integer arithmetic to align the minimum and
maximum to multiples measured from zero, including negative and exclusive bounds.
Integer schemas intersect fractional increments with the integer grid: for
example, `multipleOf: 1.5` permits 3, 6 and 9 within bounds 1–10. A range with one
allowed value supports an explicit keyboard/pointer selection without writing
that value on mount.

Readonly and disabled controls reject stale callbacks. Clearing ordinary fields
removes the property, dynamic properties retain their key through the existing
empty-value policy, and primitive array slots become zero without shifting
neighbors. Clearing does not recommit the fallback thumb position.

## Numeric representation

The implementation uses finite JavaScript numbers. New integral values must be
safe integers. Decimal text must round-trip without losing authored digits;
unsupported precision, overflow and underflow have localized feedback. Numeric
schemas are left intact. Sliders also reject unusable grids or increments too
small to advance at their range endpoints. This does not recover precision lost
before data reaches the renderer.

## Reference distinction

React Antd and shadcn provide a legacy `NumberFormatCell` accepting host
`toFormatted`/`fromFormatted` callbacks. JSON Forms core selects that cell with an
integer schema and **boolean** `options.format: true`. The current portable UI
schema defines `options.format` as a string and does not define those callbacks
or a currency/number-format presentation contract. That legacy API is recorded
as a compatibility difference; it does not establish a new portable option.
The portable numeric contract is implemented through number/integer controls and
their cells.

## Verification

The focused shared suite has 21 numeric/grid tests. Each family passes 23 mounted
numeric/slider scenarios (plus a Skeleton shadow-root regression), including the canonical EN/BG example, native keyboard
steps, readonly changes, invalid values, clearing and array slots. All twelve production combinations of family, EN/BG locale and native/Web Component
host pass. Narrow light/dark screenshots are reviewed for all families. Skeleton
mounts its native slider after the containing root is available for measurement,
shares the thumb ID with its native tooltip and handles single-value activation
during event capture. A direct shadow-root test checks visibility, keyboard
changes and retained focus.
