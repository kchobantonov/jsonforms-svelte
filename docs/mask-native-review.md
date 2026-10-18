# Masked input review

Flowbite and shadcn use their native Input components; Skeleton uses its styled
native input. All three use Maska's pure `Mask` engine, matching the React
reference. The engine formats strings without attaching its own DOM input
listener, which would rewrite unfinished IME composition.

The shared Svelte `useMaskedInput` adapter reuses the ordinary text draft and
pending-edit lifecycle. It masks completed input, stores either masked or
unmasked strings as authored, and preserves incompatible imported values on
render. The caret follows the same token-position calculation as React's
`maskFormat.ts`. Restriction counts stored code points and permits reducing an
already-invalid value. HTML `maxlength` is omitted because its UTF-16 and display
length do not match the stored JSON string.

Composition remains provisional and blocks consuming actions through the shared
pending-edit contract. Host data/schema/mask replacement, readonly transitions,
clearing and unmount cancel drafts. Ordinary partial mask input commits
immediately; completeness remains schema validation's responsibility.

## Token contract

The shared `maskTokens.ts` follows `maskFormat.ts` in the React reference at
`935122d5c3a5c0a606ef841e73238a653083cd81`. It keeps the default ASCII digit,
letter and alphanumeric tokens, applies authored overrides/removals and tries
Unicode regex syntax before the legacy unflagged syntax. Invalid overrides
retain the default token and display a catalog diagnostic rather than throwing
while the form renders. Token names are own properties, including prototype-like
names. Only the portable repetition flags are copied.

Native host RegExp patterns remain supported in Svelte for compatibility with
existing callers. These are runtime values, not serialized UI-schema features.
`tokens` takes precedence over `maskReplacers`; Maska still receives the authored
`tokensReplace`, `eager` and `reversed` settings.

Diagnostics use the shared JSON catalog and host translator. Readonly input and
clear callbacks reject stale events even when the host keeps readonly controls
enabled for inspection.

## Verification

All 54 native field cases and three real-table cell cases pass. These cover mask
flags and live changes, invalid imports, token diagnostics, stored length,
composition completion/cancellation, caret insertion, readonly inspection and
pending validity without changing neighboring cells. Four shared token-parser
cases cover safe regex compilation and token names.

All twelve canonical String controls production combinations pass: three families,
EN/BG and native/Web Component hosts. Native keyboard entry and composition retain
exact stored values in the Data editor, with no page errors. Narrow light/dark
screenshots are reviewed for all three families.
