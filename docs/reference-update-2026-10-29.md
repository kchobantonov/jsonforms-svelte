# Reference refresh, 2026-10-29

The imported specification examples and conformance assets are now pinned to
`jsonforms-extended-spec` revision `1c6e2a046fb5bafa966682735ddcba1b901e21d0`.
The current React Antd/shadcn comparison checkout is
`jsonforms-react-renderers` revision `7133e3c2174bdb73f1db9f9b135dc6ef500edd23`;
this is an observed comparison revision, not a claim that every intervening
React behavior has been accepted in Svelte.

All 47 imported example fixtures match the source checkout by canonical JSON
content. The temporal example's source label still describes the older
time-only date-time `views` behavior, while current spec §18.2a requires both
date and time views. The Svelte demo keeps the corrected English and Bulgarian
wording in its translation supplement without modifying the imported source
JSON. The `button-actions` example's committed `fullWidth`/span change is now
included in the pinned provenance rather than marked as a working-tree override.

The conformance snapshot includes the two new proposed `$dynamic` behavior
vectors (`template-data-subscription-replacement` and
`template-policy-update-preserves-draft`) and the updated layout-gap schema
description. The layout helper already defaults to 16 CSS pixels for both row
and column directions, with explicit zero and namespaced defaults taking
precedence. The `$dynamic` vectors are recorded as open proposal coverage;
importing them does not establish runtime support. The flat `config.restrict`
authoring/config-consumption changes and Button `fullWidth` schema were already
present in the Svelte snapshot and now match the committed spec revision.

Focused verification: `node scripts/check-spec-examples.mjs --source
../jsonforms-extended-spec` passed for 47 fixtures; `pnpm exec vp test --run
tests/conformance.spec.ts tests/config-consumption.spec.ts` passed 20 tests.
The installed `@jsonforms/core` resolves to `3.9.0-alpha.1` in all 12 Svelte
packages. `pnpm run audit:jsonforms-core` verifies their catalog declarations,
the lockfile snapshot, and all 112 distinct runtime names imported from the
package root. This is a package-root check; the installed package's `module`
file is for bundlers and cannot be loaded directly by Node because it uses a
Lodash extensionless subpath. Packed Vite consumer builds exercise that path.
The audit script reads its expected version from the shared catalog and
lockfile; it does not hard-code `3.9.0-alpha.1`. An upgrade changes the catalog,
updates the lockfile with pnpm, then reruns this export check and the normal
type/build/behavior gates. The lockfile makes the installed dependency
reproducible; it is not an additional version constraint in the audit.
The separate 18-path copied/adapted source audit passes. P0.1's later
current-source packed minimum-version browser matrix also passes at all four
declared Svelte floors; see the final checkpoint in
[verification-baseline.md](verification-baseline.md).

A separate workspace resolution audit read each of the 12 package manifests,
resolved each declared peer from that package's `node_modules`, and checked
the installed version against its declared range with SemVer (using the
catalog's `^3.9.0-alpha.1` for JSON Forms and accepting `workspace:*` for
workspace peers). All **107** peer resolutions were present and compatible.
This is workspace evidence; the isolated exact-floor tarball consumers remain
the stronger published-package evidence. The per-component upstream source
classification is recorded under P0.8.
