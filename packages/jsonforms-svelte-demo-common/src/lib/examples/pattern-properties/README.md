# Overlapping property patterns

Both objects render price_total as one number control with bounds 0–1000,
regardless of pattern order or the additionalProperties fallback.

- Change price_total to 1001 or -1 to see validation from the corresponding pattern.
- price_unit matches only the number/minimum pattern and has no upper bound.
- Add price_tax_total to exercise both patterns.
- Rename price_unit to price_subtotal to gain the upper bound without changing its value.
- Unmatched names use the fallback: unrestricted values in the first object,
  string values in the second. Renaming into a different schema preserves data
  and reports incompatibility rather than converting the value.

Rename text_quantity to count_quantity in the final object. The string "five"
is preserved with a type error. Hover or focus the hint icon beside the numeric
input to inspect the stored value. Enter 5
to correct it; changing renderer selection never converts the original string.
