# Renderer localization source audit

This audit completes the P1.10 source inventory. It covers production Svelte
renderers and extended renderers, plus the three demo shells. The mounted and
production locale evidence for the dynamic controls and shell behavior is
recorded under P1.10 in `TODO.md`.

## Catalog references

The shared `messages.json` catalog currently has 429 keys in English and 429 in
Bulgarian, with identical key sets. A source scan of production `.svelte` and
`.ts` files under `packages/jsonforms-svelte*/src/lib`, excluding `.spec.ts`,
finds 210 literal `message(...)` or `messages(...)` first arguments. Of those,
204 have shared catalog entries. The other six are intentional: `array.` and
`confirm.` are concatenated with a runtime action, `choose` and `clear` use the
Color control's local message function, and `interpolationFailed` and
`interpolationLoadFailed` use the presentation message namespace. This scan
does not treat dynamic keys as automatically complete; their corresponding
renderers and message helpers have separate focused coverage.

## Native labels and announcements

A production renderer source scan finds no English prose directly assigned to
`aria-label` or `title`. Literal placeholders are empty strings for controls
whose native widget supplies the entry hint, and `--` for blank time segments.
Visible renderer text-node scans find no literal English prose in markup.
Native status and alert regions use catalog messages, author diagnostics,
validation text, or the authored form value; the template loading indicator is
the language-neutral ellipsis.

In the demo shells, the two literal `aria-label` values are product brand names
on home links. The Shadcn direction selector displays `LTR` and `RTL` as
direction abbreviations. The copied Shadcn Sheet close icon and Breadcrumb
ellipsis contain English defaults, but current shell usage disables the Sheet
default close icon and renderer Breadcrumb usage supplies its own translated
root label without an ellipsis. The copied Dialog close icon is used by five
renderer dialogs; those callsites now pass `dialog.close` in the active locale,
and a mounted test verifies EN/BG plus an open-dialog locale change.

## Acceptance boundary

The source inventory, complete EN/BG catalog key/parameter parity for all 47
spec examples, native-component review notes, focused locale-only mounts and
built-host matrices in `TODO.md` complete P1.10. The independent P8.2
accessibility and visual review still covers keyboard operation, computed
tooltip presentation, RTL and narrow/theme profiles; P8.6 owns the final
workspace-wide gate.
