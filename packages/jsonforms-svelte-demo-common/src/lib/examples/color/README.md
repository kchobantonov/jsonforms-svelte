# Color formats

Short color uses `colorSaveFormat: "hex3"` and a schema pattern requiring
three hexadecimal digits. Picker and opaque text edits round to the nearest
representable short color: `#ed5050` saves as `#e55` and previews as `#ee5555`.
This format cannot represent transparency. Existing transparent values are
preserved with guidance to enter an opaque color or clear the value.

Brand color and overlay color demonstrate full hex input and existing alpha
data. Loading the example does not normalize its initial values.
