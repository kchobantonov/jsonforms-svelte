# Errors before a control is blurred

`enableFilterErrorsBeforeTouch: true` hides control error text until its first blur. Focus alone does not reveal the text. A nonempty `filterErrorKeywordsBeforeTouch` list suppresses only matching keywords; an absent or empty list suppresses all eligible text. Local control options override global defaults, including explicit false.

The shared filter considers schema errors allowed by the validation mode and mapped host additional errors together. Suppressing a required error does not drop a nonmatching server error. Disabling filtering does not reveal errors hidden by the validation mode. Structured errors, data and validity remain unchanged.

## Current boundary

Touch state belongs to the mounted control. Container and array summaries do not yet share child touch state, so they continue to show eligible errors. They no longer permanently suppress a keyword merely because filtering is enabled. Summary participation, remount persistence and row relocation remain tracked in TODO.md; the control implementation does not claim those capabilities.

The canonical pre-touch-errors fixture retains its initial invalid data and source configuration. Its filter is initially off so the demo can show the change when filtering is enabled. English and Bulgarian labels, descriptions and explanatory text are editable JSON supplements. Existing source error-translation prefixes are preserved.
