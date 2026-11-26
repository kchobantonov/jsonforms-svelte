# Renderer parity and implementation guidance

For renderer behavior changes, use the installed
`@chobantonov/jsonforms-extended-spec@0.2.0` as the contract. Consult its
[implementation guide](node_modules/@chobantonov/jsonforms-extended-spec/docs/implementation-guide.md)
and [implementation pitfalls](node_modules/@chobantonov/jsonforms-extended-spec/docs/implementation-pitfalls.md).
The package manifests and lockfile record the consumed release. Use a sibling
`jsonforms-extended-spec` source checkout when proposing changes to the spec,
then update the package version when adopting a new release.

When resolving a commonly overlooked semantic, usability, presentation,
accessibility or performance distinction, record the lesson in the spec's
implementation guidance and add an acceptance example/vector where practical.
Clarify the normative spec when the contract itself needs clarification.
Do not catalogue ordinary coding mistakes. Preserve behavior across renderer
sets; explicitly record platform limitations and unverified support instead of
claiming parity. Distinguish executable tests from proposed acceptance cases.

Before reporting renderer work complete, run the repository lint and format
checks (`pnpm run lint` and `pnpm run check-format`). Fix errors in changed files
and report any remaining warnings or failures accurately.
