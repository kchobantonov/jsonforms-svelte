# Monaco editor integration

The code-editor profile uses Monaco itself. Native family wrappers supply their field frame and theme variables. Shared editor behavior does not replace Monaco with a textarea.

## Drafts and validation

Converted JSON keeps an editable draft independent of committed data. Explicit null is rendered as `null`; only absent data renders as an empty editor. This follows the JSON-value contract even though the current React helper renders both as empty. Invalid JSON does not overwrite the last parsed value; valid edits preserve the user's whitespace when the form echoes the parsed value. Equivalent schema/config and locale updates retain the draft. A changed field value, schema, language, conversion mode or path invalidates the old draft.

`propagateErrors` resolves from the local boolean, then `config.jsonformsExtended.propagateErrors`, then the legacy flat boolean, and defaults to false. Invalid non-boolean values do not mask a valid fallback. Monaco bags use whole-object replacement: an authored local `monaco` object replaces global rows, native options and initialization actions rather than inheriting omitted members. Renderer selection still reads the authored UI schema independently. Legacy flat-option deprecation diagnostics remain part of the wider configuration migration work. Enabled converted-JSON editors publish one parse summary through their own error-store owner. Disabling publication removes only that owner's summary. Local feedback remains available when publication is off, and other control errors remain visible. English/Bulgarian messages and maximize/restore actions use the form translator with localized fallbacks.

The shared store provides pending generations for future language-service integration. This first adapter publishes synchronous JSON parse errors only. Converted-JSON editors register their section schema against their own model URI and resolve local references against a separately registered document root. Updates and teardown preserve other editors and host registrations, including the host diagnostics policy. Schema-bearing keywords are traversed for reference rebasing; literal values in const/default/enum/examples are preserved. Language-service summaries/pending analysis, logical array-item reassociation and full literal-property path handling remain open. Do not infer complete Monaco profile conformance from this slice.

## Native lifecycle exception

Real browser typing followed by teardown exposed `TextModelPart is disposed` from Monaco 0.55.1's `CompletionAdapter` in `esm/vs/language/common/lspLanguageFeatures.js`: it awaits worker completion and then asks the model for a word range without checking cancellation or disposal. Detaching and disposing the editor first reduces the race but does not eliminate it.

The renderer detaches the model and disposes the editor, then guards late `getWordUntilPosition` calls on that one owned model. After disposal, the guard returns an empty range for the already-cancelled completion; before disposal, it delegates to Monaco unchanged. The model is still disposed immediately. This does not patch global providers, alter host-owned models, retain models indefinitely or suppress browser errors. All three native browser teardown regressions pass with the workaround, including real typing and maximize/restore interactions.

The default occurrence-highlighting option matches the demo editors (`off`) because background occurrence requests also produced cancellation rejections during teardown. Native `monaco.options` can override this default. Host readonly/disabled flags always take precedence over native options that would enable editing.
