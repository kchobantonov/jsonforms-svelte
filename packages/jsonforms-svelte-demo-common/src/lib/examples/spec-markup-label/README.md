# Spec Markdown labels

Fixtures copied unchanged apart from formatting from `jsonforms-extended-spec` commit
`9d8a6915bd19972b7ce9fe3b584926fc23e66fb7`, `examples/markup-label`.
The shared extended Label renderer supplies Markdown and CEL interpolation.
The native light/dark typography screenshots, production family/locale/host
matrix and contextual normal-table/card Markdown policy checks are recorded in
`docs/verification-baseline.md`. Other text-bearing acceptance remains under
P6.7 in the upgrade plan.

The factory merges a separate EN/BG supplemental catalog for form controls and
category labels missing from the source example. Source JSON remains intact.
