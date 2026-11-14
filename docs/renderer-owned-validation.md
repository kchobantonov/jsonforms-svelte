# Renderer-owned validation

`JsonForms` provides `useOwnedErrors()` and `onvaliditychange` for the integration required by spec §§15.4–15.6. The ordinary `onchange` event retains its JSON Forms contract: data and schema errors. It does not fold additional errors into `errors`.

## Publishing

A participating renderer obtains the store during Svelte component initialization and calls `createOwner()` once per editor instance. Publication must be enabled through that renderer's documented local/config option. This mechanism does not opt renderers in automatically.

- `begin(instancePath, pending)` clears this owner's previous result and returns a generation token. Paths are JSON Pointers, including escaping; an empty string targets the root.
- `publish(token, errors, pending)` replaces only this owner's results. Error paths are relative to the owner's pointer. Results from an older generation or disposed owner are ignored.
- `relocate(instancePath)` moves the same subject's error paths, including results that are still pending. Call it only after matching the logical subject; an array index or label alone is not sufficient evidence.
- `clear()` invalidates outstanding work and removes this owner's errors and pending state.
- `dispose()` removes the owner on editor unmount. Form teardown also invalidates all remaining generations.

After an external replacement that cannot be matched reliably, begin a new generation and reevaluate. Keep pending true while participating asynchronous validation is unresolved. Do not infer relocation from the index. Application errors remain owned by their producer and are never rewritten by this store.

A renderer mounted outside this form integration receives `undefined` from `useOwnedErrors()`. If publication was requested, it must report that missing integration through its diagnostics; it must not silently claim to have published an error.

## Consuming validity

`onvaliditychange` receives `{ errors, additionalErrors, current, pending, valid }`. Changes to owned errors, host errors or pending state notify the callback without requiring a data edit. `current` indicates automatic schema results for the current core data/schema. `NoValidation` reports `current: false` and `valid: false`, even with empty errors. In validating modes, `valid` requires current results, both error collections empty and no participating validation pending. Hidden messages do not remove errors from this decision. Additional-error contributions remain available in every validation mode. Mode changes notify without a data edit. A cached snapshot belongs to its form lifetime; a host must invalidate it when replacing that form rather than reuse an old result.

Publication merges into current core state. It does not replay a captured data snapshot, and replacing host errors preserves independently owned renderer errors.

The demo wrappers forward validity events, and all three Demo badges combine schema and additional errors. Pending validation and submission gates remain separate from this error-count display.

## Remaining integration

The store and form channel are implemented and tested. The extended form forwards the callback and exposes merged additional errors in its action context. Web Components emit a typed `validity-change` CustomEvent with the same payload; attach listeners before inserting the element. Monaco editors opt in through `propagateErrors` and publish one owned parse or language-service summary. Error-level markers are scoped to the editor model; language changes and corrections retract that editor’s summary, while schema validation and host errors remain independent. The canonical additional-errors demo supplies simulated server actions and field-value-based retraction. Pending language analysis, generation rejection, collection occurrence identity, property rename, tuple-tail and mixed literal-detail reassociation now have targeted native and production acceptance. Text/password/duration lifetimes are also covered. Host-owned submit rules can close over the reactive validity callback, requiring `current && !pending` and empty schema/additional errors; these rules are verified against all three native Button implementations. This does not add a validation-state field to core rule context or serialized UI schemas. Local file-operation warnings do not use this channel: rejected selections that leave valid data unchanged remain local feedback under the newer file contract.
