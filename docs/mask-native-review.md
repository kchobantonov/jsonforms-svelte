# Masked input native component review

Contract: spec §18.18.6 at `f0183923295c495c60024fddca58dbe99e82e816`.

Flowbite and shadcn now use their native Input components. Svelte's
`createAttachmentKey` and `fromAction` forward the Maska action through the native
component to its actual input. The installed Svelte implementation documents
`fromAction` from 5.32; Flowbite's 5.40 and shadcn's 5.33 peer floors already cover
it. Skeleton retains its styled native input and action, preserving its 5.29 floor.
No generated native UI component is patched.

## Supported profile

- Pattern strings, Maska pattern arrays and trusted build-time mask functions.
  Functions are not a portable serialized UI-schema feature.
- Default tokens `#`, `@`, `*`, token overrides/removal, tokensReplace and legacy
  maskReplacers. Explicit tokens take precedence over maskReplacers.
- Regex strings compile with JavaScript Unicode semantics (`u`), including
  `\\p{L}`. RegExp-valued host token patterns retain their flags.
- Eager and reversed options are enabled only by true. Both default to false.
- Partial edits commit masked or unmasked strings according to returnMaskedValue.
  Schema maxLength restrictions count the stored string, excluding display
  separators when the stored representation is unmasked.
- An incoming value that cannot round-trip through the mask remains visible in
  the native input without attaching the destructive formatter. An explicit edit
  can correct it; mounting does not normalize the stored value.
- Clear is translated in EN/BG. Flowbite's native CloseButton is placed explicitly
  to support translation and avoid dismissing an enclosing dialog.
- Boolean temporal mask options do not select the generic string mask renderer.

## Verification and remaining work

Browser suites cover native attachment, live mask changes without replacing the
input, masked/unmasked storage, eager/reversed flags, Unicode tokens, imported
fallback values and localized clear actions. Registry tests distinguish string
masks from temporal booleans. The source String controls fixture is imported with
Bulgarian field and explanatory-label supplements.

Full IME/caret, malformed token diagnostics, table-cell and narrow/dark visual
acceptance remain open. Authored placeholder localization belongs to the wider
field-text/i18n audit; copied source literals are preserved.
