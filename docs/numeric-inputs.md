# Numeric input behavior

Number and integer controls use each family's native input. A shared adapter parses the complete entry before it changes form data. Integer fractions stay visible as local drafts with a whole-number message; exponent notation is parsed completely. Clearing uses the existing context-specific empty-value contract.

New entries must be finite JavaScript numbers. Integral values must stay between `Number.MIN_SAFE_INTEGER` and `Number.MAX_SAFE_INTEGER`. Decimal entry must survive conversion to the number's shortest decimal spelling without losing supplied significant digits. This supports ordinary decimals such as `0.1`; it does not claim exact decimal arithmetic internally. Incoming numeric values are displayed as received; precision already lost before the renderer cannot be reconstructed.

Supported inclusive and exclusive bounds guard commits when `restrict` is enabled. An already-invalid value can move toward the violated bound. `restrict: false` keeps schema validation and removes entry prevention. Suitable explicit steps override `multipleOf`-derived increments; integers use whole-number increments. Invalid explicit steps produce a diagnostic and use the schema/fallback increment.

Incomplete signs and exponents belong to the native input's editing buffer. The Svelte adapters bind native component view values independently from form values, preventing a component update from restoring the old number over an incomplete entry. Invalid drafts block pending-edit transitions and isolated-dialog Apply. Host value/path replacement resets the draft; language changes translate its feedback.

Reference review: React common `toCommittableNumber` parses whole input, but the inspected shadcn input still truncates integers and the Antd integer adapter rejects fractions. Svelte follows the normative no-truncation requirement and the Antd local-rejection behavior. The numeric example README describes fractions remaining on screen; its authored assets remain unchanged.

Sliders use the native components with shared zero-based decimal grids, typed-value feedback, readonly guards and context-aware clearing. See [numeric component review](numeric-native-review.md) for supported precision, reference compatibility and verification. The demo validator materializes schema defaults: clearing the canonical Discount field therefore returns stored 10. A host validator without default application leaves the field absent, as covered by the component harness.
