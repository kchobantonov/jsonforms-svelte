# Upgrade verification baseline

Date: 2026-10-03. Implementation phase 0, following approval of the upgrade plan.
This report covers the existing implementation and initial tooling/regression fixes;
it does not certify the new specification features.

## Changes in this first implementation slice

- Shared official Svelte ESLint configuration with package-specific Svelte/TS roots,
  explicit root dependencies, generated-output ignores, and coverage for shared
  extended code and the Pages shell. Existing package rule exceptions are retained.
- Root lint, format, type-check, unit-test and demo-test commands. CI now gates clean
  tooling/Pages/base-shadcn lint and runs the previously omitted demo tests.
- Complex-registry tests check tuple registration in all three families, replacing
  the obsolete seven-entry count without dropping the existing registration checks.
- Tuple tails use position keys. A browser regression edits the correct tail position
  after removal and external replacement, including duplicate scalar values.
- Date-time regressions preserve the initial document errors when displaying local
  picker feedback. Timezone-free stored values can already fail the schema's date-time
  format; an empty document-error list was an incorrect assumption.
- Flowbite's grid regression checks its current native edit icon and accessible action,
  retaining object/array dialog constraints instead of asserting an obsolete SVG path.
- Flowbite and Skeleton Web Components use Svelte's supported `shadow: 'open'` option.
- Shadcn source-audit tooling has explicit registry/report types and typed file-error
  checks; its staging, validation and write behavior remains intact.

## Executed tests

The complete package run initially exposed failures in Flowbite base and extended
tests. After fixing them, both package suites were rerun in full. Together with the
unchanged passing suites, the final results are **1,415 passing package tests**.
There is no claim that the first run itself passed or that all results came from one
invocation.

| Package                                | Passing tests |
| -------------------------------------- | ------------: |
| jsonforms-svelte                       |            96 |
| jsonforms-svelte-extended              |            43 |
| jsonforms-svelte-flowbite              |           343 |
| jsonforms-svelte-shadcn                |           361 |
| jsonforms-svelte-skeleton              |           341 |
| jsonforms-svelte-flowbite-extended     |            55 |
| jsonforms-svelte-shadcn-extended       |            58 |
| jsonforms-svelte-skeleton-extended     |            56 |
| jsonforms-svelte-flowbite-webcomponent |            21 |
| jsonforms-svelte-shadcn-webcomponent   |            22 |
| jsonforms-svelte-skeleton-webcomponent |            19 |

Commands:

```sh
pnpm -r --no-bail --workspace-concurrency=1 --filter './packages/**' --if-present run test
pnpm -r --no-bail --workspace-concurrency=1 --filter @chobantonov/jsonforms-svelte-flowbite --filter @chobantonov/jsonforms-svelte-flowbite-extended run test
pnpm --filter './apps/*-demo' test
```

All **9 demo tests** pass: Flowbite 2, shadcn 5, Skeleton 2. These are the existing
small suites, not the planned 47-example conformance suite.

Tests emit existing Svelte proxy-identity warnings, ResizeObserver notification
messages, and some Vite shutdown/SSR-disconnection diagnostics. The malformed trusted
tester fixture also logs its expected SyntaxError. Preserve and investigate these
signals in P0.2/P8.3; passing assertions are not evidence of a warning-free lifecycle.
Do not suppress all console errors to make logs appear clean.

## Types, build, and packages

- Full workspace `check` passed with no errors and four warnings: demo-common has no
  `.svelte` input files; the three Web Component hosts warn when checked without their
  production custom-element compiler setting.
- A later shadcn check after the tuple test typing cleanup also passed.
- Installed JSON Forms core is `3.9.0-alpha.1`; the workspace catalog allows
  `^3.9.0-alpha.1`. Keep inference/tuple workarounds version-aware.
- `node scripts/pack-release.mjs` passed, including package validation and Web Component
  declarations. It rehearses changeset versions in temporary copies without versioning
  or publishing the checkout.
- `pnpm build:pages` passed for all libraries, three demos and the aggregate shell.
- The packed Web Component suite passed for Flowbite, Skeleton and shadcn: registration, rendering,
  data changes, readonly behavior and asset loading from their release tarballs.
- The Pages navigation suite (now `tests/navigation.spec.ts`) passed all 12 navigation scenarios:
  each family's standalone demo, relocated demo, shell and relocated shell, including
  client navigation, deep links and reloads.

The root still resolves Vite 5 while renderer workspaces use Vite 7. pnpm reports the
existing Vitest browser peer mismatch at the root. The lint consolidation did not
upgrade the build stack. Align root build/test dependencies in the toolchain follow-up,
then verify the lockfile and all package/worker outputs again.

## Initial lint and formatting debt

Clean gates: `pnpm lint:scripts`, Pages-shell ESLint, and base shadcn ESLint.
The shared config successfully discovers all workspaces and preserves errors in other
packages. The full lint baseline contains existing explicit-any, unused binding,
reactive dependency expression, keyed-each, reactivity, and other rule violations.
The first completed consolidated pass reported 386 errors. Subsequent typed test
cleanup and package lint reruns reduced that to **382 errors** at the end of the first slice. This is baseline debt,
not a disabled rule set.

| Package                                | Initial errors |
| -------------------------------------- | -------------: |
| jsonforms-svelte                       |             68 |
| jsonforms-svelte-demo-common           |              7 |
| jsonforms-svelte-extended              |             41 |
| jsonforms-svelte-flowbite              |            117 |
| jsonforms-svelte-skeleton              |             98 |
| jsonforms-svelte-flowbite-extended     |              5 |
| jsonforms-svelte-shadcn-extended       |              2 |
| jsonforms-svelte-skeleton-extended     |              5 |
| jsonforms-svelte-flowbite-webcomponent |              7 |
| jsonforms-svelte-skeleton-webcomponent |              8 |
| jsonforms-svelte-flowbite-demo         |             11 |
| jsonforms-svelte-skeleton-demo         |             13 |

The root formatting check reported 144 files with style differences before final
documentation edits. Invalid custom-element shadow options initially caused two parse
errors; those are fixed. Broad formatting remains a separate cleanup, and existing
sources were not mass-rewritten. Touched files are formatted individually.

Full lint/format CI gates remain open until these baselines are resolved. Prioritize
semantic/reactivity issues, then replace avoidable `any` types and document narrow
integration-boundary exceptions. Do not simply disable recommended rules across all
renderers. See [tooling commands](linting-and-formatting.md) and [TODO](TODO.md).

## Phase 0 follow-up — shared and extended lint cleanup

The shared extended package and all three family-specific extended packages now
pass ESLint. CI gates all four packages. The core package's lint count fell from
68 to 37 by preserving effect dependency reads with `void`, removing unused callback
destructuring bindings in dispatch helpers, and recognizing intentional exclusions
from forwarded rest props. Remaining core issues stay visible.

The completed full workspace lint rerun reports **298 errors**, down from 382.
Remaining counts: core 37, demo-common 7, Flowbite base 117, Skeleton base 98,
Flowbite Web Component 7, Skeleton Web Component 8, Flowbite demo 11, and Skeleton
demo 13. Full lint/format CI gates remain open.

Dynamic-default arguments, AJV keyword registration, UI-schema tester functions,
Monaco options, native button overrides and test fixtures now use concrete types
or `unknown` instead of explicit `any`. Integration assertions remain at the
vendor option boundary. No new translated UI messages were introduced.

Monaco's temporary ancestor set and AG Grid's UI-schema caches retain ordinary
collections with documented line-scoped exceptions. They are traversal bookkeeping
and memoization, not UI state. Making the grid caches reactive would cause their
writes to invalidate the derived columns that populate them.

Verification for this follow-up:

- Core and shared extended suites: **96 + 43 passing tests**.
- Extended family suites: **55 Flowbite + 58 shadcn + 56 Skeleton passing tests**.
  These are 308 distinct passing tests in total; the shared extended suite was
  additionally rerun during the family command.
- Full workspace `pnpm check`: zero errors and the same four baseline warnings.
- Core and all four extended package builds passed, including Svelte packaging,
  declarations and publint.
- Root `pnpm check-format`: **130 files** still differ. All files touched in this
  follow-up are formatted; broad formatting remains open.
- Browser execution again needed localhost access outside the restricted sandbox.
  Existing proxy-identity and ResizeObserver diagnostics remain visible.

## Phase 0 follow-up — core, hosts and repository formatting

The remaining lint findings are confined to **Flowbite base (100)** and
**Skeleton base (81)**: **181 total**, down from 298 in the preceding slice.
The core, demo-common, Web Component packages and demo apps now pass lint. CI
checks all workspaces except those two base packages; the full root lint command
continues to report their failures.

Changes:

- Core data and mixed-value helpers use `unknown`; configuration and dialog bags
  use typed records. Literal dotted, empty, NUL and prototype-looking keys retain
  their existing behavior and regression coverage.
- Tuple prefix editors use stable position keys. Tuple fixtures no longer disable
  type checking wholesale. Explicit assertions retain the translated-schema and
  Draft 2020-12 cases not represented by the upstream schema types.
- Group regressions cover local toggles, equivalent host options and changed
  collapse options in all three families. The state/effect implementation is
  retained with a scoped lint exception: writable derived state needs Svelte 5.25,
  while the current peer declaration still starts at 5.0. This does not certify
  the entire package against 5.0; P0.1 still owns minimum-version verification.
- Demo menus have stable keys, effect subscriptions remain explicit, and host
  registries, example data and translation arguments have concrete types.
- Demo-common now has a test script, so root package testing includes its previously
  skipped AG Grid fixture tests.
- A separate repository-wide Prettier pass applies the existing configuration.
  Copied native UI components remain excluded. Three mixed/CRLF JSON files were
  normalized to LF to satisfy `git diff --check` as well as Prettier.
- CI now includes explicit format and workspace type gates. Full lint gating
  remains open under P0.7. Existing translation memoization/fallback defects and
  migration from `${...}` to the spec's interpolation model remain under P1.11.

Verification for this follow-up:

- The full package run passed **1,418 tests**. The newly enabled demo-common suite
  separately passed **2 tests**, for **1,420 distinct tests** across 12 packages.
- All **9 demo tests** passed. The final group implementation was separately
  rechecked with **15 passing browser tests** across the three base families.
- The final full `pnpm check` passed with zero errors and the same four baseline
  warnings.
- Root Prettier checking passed after the formatting pass. `git diff --check`
  also passed after line-ending normalization.
- `pnpm build:pages` passed for all libraries, Web Components, demos and the shell.
- Release tarball validation passed. All three packed Web Components passed browser
  checks for registration, rendering, data changes, readonly behavior and assets.
- All **12 Pages navigation scenarios** passed, including standalone/relocated
  demos and shells, SPA navigation, deep links and reloads.

## Base renderer type follow-up

Flowbite and Skeleton scalar adapters, Ajv temporal bounds, mixed-schema selection,
structural-change helpers and tree-building inputs now use explicit types. Numeric
adapters explicitly convert input to strings before parsing, preserving the existing
empty/null/undefined clearing branches. The date-time menu effect retains its
reactive dependency read. No UI copy or translation keys changed.

Semantic lint now reports **91 findings**: **55 Flowbite** and **36 Skeleton**,
down from 181. Remaining work includes vendor-option contracts, tree-view types,
keyed rendering and reactivity findings. P0.7 remains open; CI exclusions are unchanged.

Both affected packages pass Svelte checking with zero errors and zero warnings.
Their browser/server suites pass **686 tests** (344 Flowbite, 342 Skeleton), and
both builds, declaration packaging and publint checks pass. Existing proxy-identity,
ResizeObserver and Vite shutdown diagnostics remain visible in the test output.
After rebuilding both packages, full workspace `pnpm check` passes with zero errors
and the same four baseline warnings. Root `pnpm check-format` and `git diff --check`
also pass. This follow-up does not rerun demo browser tests or packed consumers.

## Tree and adapter follow-up

Remaining semantic lint is **14 findings**, seven in each base Flowbite/Skeleton
composition module. These findings concern applied-option and vendor-prop bags;
P0.7 remains open and CI exclusions are unchanged.

- Flowbite tree nodes, callbacks and snippets preserve their generic payload type.
  Filter values are `unknown`, matching arbitrary property lookup; custom filters
  must narrow before calling string methods. Duplicate node declarations are removed.
- Highlight ranges, mask tokens, mixed-editor data and control adapter inputs have
  explicit types. Clear-value helpers preserve the supplied default's type.
- Breadcrumbs use path keys; collection rows, highlight segments and stepper panels
  use position keys to retain their existing positional behavior.
- Scoped lint exceptions preserve Svelte 5.0-compatible editor state, public unused
  group snippet props and imperative/rebuilt tree maps. They are described in the
  linting guide. No translation keys or UI copy changed.
- Four tree-filter tests cover Bulgarian text, numeric/missing payload values,
  custom filter inputs and repeated highlight matches.
- Both affected Svelte checks pass with zero errors and warnings. All **690 tests**
  pass (348 Flowbite, 342 Skeleton). Both builds, declaration packaging and publint
  checks pass. Existing proxy-identity, ResizeObserver and shutdown diagnostics
  remain visible. This follow-up does not rerun packed consumers or demo browser tests.
- Full workspace `pnpm check` passes against the rebuilt packages with zero errors
  and the same four baseline warnings. Root formatting and `git diff --check` pass.

## Option bags and full lint gate

The final 14 explicit-any findings in Flowbite/Skeleton composition helpers are
replaced with `AppliedOptions` and `VendorProps`. Known options and mask tokens have
explicit types; extension values remain unknown. Native Skeleton callback types and
Flowbite toolbar color types are used where renderer code reads or invokes those
properties. Runtime merging, vendor forwarding, readonly overrides, clearing and
translations are unchanged. These declarations are not runtime schema validation.

Root `pnpm lint` passed with **zero findings** across tooling and all workspaces.
CI now runs that command without excluding either base renderer package. P0.7
is complete; the remaining Phase 0 and spec-conformance tasks remain open.

Both affected packages pass Svelte checking with zero errors and warnings. All
**690 tests** pass (348 Flowbite, 342 Skeleton). Both builds, declaration packaging
and publint pass. Existing test diagnostics remain visible. Packed consumers and
demo browser tests are not rerun for this type-focused change.

The full workspace type run passed 14 packages/apps and exposed one untyped dialog
callback in Skeleton extended. That callback now uses native Dialog props; its
package type check and lint pass after the fix. Its **56 tests** pass, bringing this
follow-up to **746 passing tests** across the three affected packages. The four
baseline warnings remain in the other workspace checks. Root formatting and `git diff --check` pass.

## October 3 reference refresh and detail resolver

The upgrade targets now include spec `9d8a6915bd19972b7ce9fe3b584926fc23e66fb7`
and React `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`. The requirements and TODO
owners are recorded in [the reference update](reference-update-2026-10-03.md).

A shared detail resolver is exported by the core Svelte package and used by object,
array-layout and master/detail renderers in all three families. It normalizes bare
elements containers and preserves GENERATE across delegated fallback Controls.
This does not complete choice-card support or P4.1.

- Core server tests: **96 passed**, including 12 resolver cases covering registry
  selection/bypass, fallback, explicit layouts, paths and immutable inputs.
- Targeted object/array-layout/master-detail browser suites: **51 passed**,
  17 per family. Six new cases verify English/Bulgarian authored labels, relative
  nested edits and preservation of sibling values. These authored-label cases do
  not certify translated choice-card example coverage.
- Core and all three base renderer Svelte checks pass with zero errors/warnings.
- Core and all three base package builds, declaration packaging and publint pass.
  Lint passes in all four affected packages. Root formatting and `git diff --check`
  pass. Full demo and packed-consumer suites
  are not rerun in this detail-resolution slice.

## Native choice cards and further detail integration — October 3

- Shared card selection, detail and confirmation helpers: 126 core server tests pass.
- Native card browser coverage passes seven cases per family: typed object/null
  values, incomplete branch edits, EN/BG generated/registered detail, keyboard
  navigation, confirmation cancellation and host readonly replacement.
- Full Flowbite suite after fixing delayed modal close cancellation: 359 tests pass.
  Full Skeleton suite: 353 tests pass. Full shadcn rerun: 374 tests pass. Its first
  run was invalidated by adding an import before rebuilding the shared dependency.
- All library and Web Component builds pass. The subsequent core and three base
  renderer builds also pass after URL policy integration. Existing custom-element
  compiler warnings remain in Web Component checks.
- Workspace lint and root formatting pass for the card slice. The URL policy adds
  25 passing helper tests and browser checks for blocked image sources.
- After top-level/scoped image integration: all 158 core tests and 45 targeted
  image/card browser tests pass. Image diagnostics support EN/BG and host overrides.
  Core and all three base renderer builds/checks pass. Compact diagnostic
  presentation, dynamic source evaluation and full example acceptance remain open.

## Null cells and array error ownership — October 3

- Null control browser suites: 12 tests pass across the three families, including
  actual table cell dispatch, explicit null versus absent property, unchanged
  siblings and readonly host replacement. Mixed string/null schemas do not match
  the null cell tester.
- Array summary browser regressions: nine tests pass across table, stacked and
  master/detail renderers. Direct array errors remain visible with child summaries
  hidden; local false overrides global hide; `showValidationIndicator: false`
  suppresses child summaries. Equivalent AG Grid code is updated; its runtime
  acceptance still needs separate coverage.

## Full checks before the typed-choice follow-up

The completed card/image/array slice passed all **1,556 package tests**, all nine
app tests, all library/Web Component/demo builds, release tarball validation and
the packed Web Component browser checks for all three families. Build warnings
remain as previously documented. A subsequent built-demo review found a duplicate
choice-key crash in the full spec example; the typed-choice follow-up is under
verification and must not inherit those earlier results as its final validation.

## Local execution notes

Logs were collected under `/tmp/jsonforms-upgrade-*.log`, `/tmp/third-*.log` and
related temporary check files; they are temporary local
evidence, not repository artifacts or portable links. Browser tests needed execution
outside the restricted sandbox because Vitest's localhost bind was denied with EPERM.
No packages were published and no site was deployed.

## Portable layouts and native Group follow-up

Verified during the continuing upgrade:

- Shared core: 193 tests passed before the final minimum-width/default fallback follow-up; that follow-up passed 13 targeted model tests.
- Native Group and portable layout tests: 45 passed (15 per family).
- The new Group source fixture: keyboard toggling, independent nested disclosure and live EN/BG translation passed in all three families.
- Flowbite's complete base suite: 388 tests passed. The other full base suites and cumulative Pages/Web Component builds are still being checked; this is not a new all-workspace pass claim.
- Root formatting passed before the final Group fixture additions, which were separately formatted. Lint identified the callback-consumed `legacyColumns` prop; its scoped exception documents why the template-only rule cannot see the use. The complete lint rerun is pending.

Group geometry now delegates to the shared vertical layout. Shadcn/Skeleton use native Collapsible components; Flowbite's explicit Button exception and the breaking default layout migration are documented in [layout-sizing-migration.md](layout-sizing-migration.md).

### Broader verification and import cost

The cumulative `build:pages` run passed, including all native packages, standalone Web Components, demos and the Pages shell. It precedes the final minimum-width fallback and shadcn per-icon import follow-up, which are being rebuilt separately.

Skeleton's full suite passed 384 tests and failed the newly added configured-minimum-width case while consuming the old core `dist`; that case requires the follow-up core rebuild. It is not recorded as a complete pass.

Shadcn's server test delay was traced to whole icon-catalog imports in `icon-mappings.ts`. The isolated layout entry test passed after 100 seconds, with 99 seconds spent importing modules. A trial with per-icon imports let the complete 62-test server suite finish in 9 seconds. The final implementation uses supported per-icon exports for Lucide, Tabler and Remix. Hugeicons 4.2.2 advertises missing per-icon declarations, so its typed barrel import is retained; the final full suite is being rechecked. The original broad shadcn run was interrupted during import diagnosis; it is not a passed suite.

The follow-up shared-core and shadcn builds passed. The configured-minimum-width and Group tests passed in Flowbite and Skeleton against rebuilt core exports (18 tests).

Final follow-up results: shadcn base 407 tests, shadcn extended 69, Skeleton extended 67, shared extended 126 and Flowbite extended 66 passed. Shadcn's native Card spacing and navigation rerun passed 28 tests. Nested vertical sizing then passed 63 layout tests across the three families. Whole-workspace ESLint passed; later test-prebundle/config/Group changes passed targeted lint and checks.

Built shadcn Group screenshots were reviewed in English/light desktop (1280px) and Bulgarian/dark narrow (390px), with no page errors or horizontal overflow. The review caught a missing native Card header gap after wrapping it in Collapsible; native spacing and Card.Content are now restored and guarded by a geometry test. These two screenshots do not establish complete visual acceptance across all families and themes.

Portable sizing completion: core model tests (10), core/native builds and 91 browser layout/Group tests passed after both-axis dimensions were added. This covers configured minimums, explicit local zero, maximum-width redistribution, nested height allocation and reactive weight redistribution. P4.4 is complete; splitter semantics and comprehensive fixture visual acceptance remain separate tasks.

## Root inference and unrestricted schema follow-up

Core tests pass (227), including root scalar/array/null inference, external type replacement, same-type input identity, and shared mixed-schema selection. Native registry tests pass for all three extended families (9 total), covering missing data with omitted versus explicit unrestricted schemas and absent/string/absent transitions. Existing array tests pass (9 total). Native mixed selection/editing suites pass (61 total); finite choices and compositions keep their specialized renderer even when declaring an array-valued type.

Demo-common tests pass (9), covering source fixture omissions, live EN/BG text and scoped Monaco association removal. All three demo Svelte checks pass with zero errors/warnings after making schema/UI/data optional. Shared-core/native builds and workspace ESLint pass. The cumulative Pages build and new built-demo editor test are being run; do not treat the earlier Pages build as verification of these latest changes.

Logs: `/tmp/upgrade-mixed-core-final-tests.log`, `/tmp/upgrade-unrestricted-native-tests.log`, `/tmp/upgrade-mixed-registry-tests.log`, `/tmp/upgrade-inference-demo-tests.log`, `/tmp/upgrade-inference-app-check.log`, and `/tmp/upgrade-inference-lint-full.log`.

### Extended host and editor navigation findings

The first built-demo run exposed an independent object-only inference path in the extended JsonForms host. It now uses the exported core inference/UI helpers. Shared extended tests pass (127); the dedicated host/registry tests pass (14 before the later cancellation cases). Source inference UI tests pass in each native family.

Fast tab navigation exposed pending debounced edits being lost with their form host. Native adapters now flush on blur and cancel on control removal. The complete base suites pass: Flowbite 395, shadcn 412, Skeleton 390. Extended-host root tests pass (12), including cancellation before external root replacement. A later Bulgarian run found delegated mixed inputs losing the parent's i18n key; that is fixed and covered by 42 targeted mixed tests and native builds.

The development Flowbite editor acceptance passes in EN/BG: paste/apply, invalid JSON retention, explicit/cleared schema, array/null/absent data, cleared/reloaded UI schema, reloaded absent data, and a blank authored Schema tab after inference. Production native/Web Component acceptance is still running. Monaco test input uses a paste event to avoid typed quote/bracket completion. One intermediate production rebuild was deliberately stopped after the locale follow-up made it stale.

Relevant logs: `/tmp/upgrade-inference-extended-full-tests.log`, `/tmp/upgrade-blur-full-native-tests.log`, `/tmp/upgrade-blur-root-tests.log`, `/tmp/upgrade-mixed-locale-final-tests.log`, and `/tmp/upgrade-inference-dev-final.log`.

### Production inference acceptance complete

The final builds and release tarballs pass. Packed Web Component browser tests now cover absent/scalar/array/null roots, explicit `{}`, serialized string `"null"`, data edits and readonly in all three families. The built demo regression passes all 12 combinations (three families × EN/BG × native/Web Component), including invalid JSON retention, fast navigation, clearing/reloading Data and UI Schema, and authored schema remaining blank after inference. CI now runs `tests/demos/inference.spec.ts` through the workspace test runner after building.

The Monaco cancellation stack traced to 0.55.1's `WordHighlighter.runDelayer`, whose focus/cursor handlers leave the delayed promise unhandled on disposal. Demo tab editors use the public `occurrencesHighlight: 'off'` option until that upstream behavior is fixed. They also avoid redundant automatic formatting (the model factory already formats JSON) and clear disposed editor references. Other editor features remain covered separately under P6.5.

Final evidence: `/tmp/upgrade-inference-built-skeleton.log`, `/tmp/upgrade-inference-built-final.log`, `/tmp/upgrade-inference-final-packed-tests.log`, `/tmp/upgrade-inference-monaco-app-build.log`, `/tmp/upgrade-inference-monaco-shell-build.log`. Workspace lint passed before the final editor option/script additions; those are included in the next continuing verification gate.

## Shared catalog translation

P1.11 is complete. Core tests pass (233); demo-common and Web Component server tests pass (69 total). Core/demo-common/Web Component builds, release packaging and packed browser tests pass. The packed tests now use an incomplete `bg-BG` catalog, fall back to `bg` for the field label, then switch to English while retaining data. All consumers use `createCatalogTranslator` from core. Template parsing is cached per translator; substituted results are never cached, and expression/template code remains literal text.

The private demo-common package now declares its core workspace dependency; family/root build commands build core first. Offline dependency resolution encountered stale registry metadata for an already-locked dependency. Only the workspace link was added to the lockfile and local modules; `pnpm install --lockfile-only --offline --frozen-lockfile` then passed, preserving installed dependencies.

Logs: `/tmp/upgrade-catalog-core-tests.log`, `/tmp/upgrade-catalog-consumer-tests.log`, `/tmp/upgrade-catalog-wc-build.log`, `/tmp/upgrade-catalog-pack.log`, `/tmp/upgrade-catalog-packed-tests.log`, `/tmp/upgrade-catalog-frozen-lockfile.log`. Demo production bundles are being refreshed for the new shared dependency.

## Splitter interaction continuation

Shared weighted sizing has four unit tests, including invalid weights, span fallback and finite normalization for very large weights. All three native renderer suites pass: Flowbite 7, shadcn 6, Skeleton 7. They cover weighted geometry, hidden-pane removal/restoration without data loss, disabled handles and re-enabled keyboard resizing, vertical fallback height and Bulgarian diagnostics. Flowbite and Skeleton additionally verify active-drag unmount restores the previous document cursor and text selection.

Shared extended and the affected shadcn/Skeleton base packages build and pass package validation. All three extended packages pass Svelte checks with zero warnings; demo-common has its existing no-Svelte-input warning. The native shadcn keyboard test waits two animation frames for initial ResizeObserver constraints before sending a single key.

Flowbite 1.31 exposes no disabled handle or label property and leaves window drag listeners on removal. The adapter preserves native panes and dividers, scopes changes to immediate handles, and invokes native drag cleanup when disabled or removed. Skeleton retains its existing custom splitter because this family has no equivalent native component. Full normal initial sizing and RTL acceptance are still tracked in P6.10.

The full native extended suites pass after this change: Flowbite **74**, shadcn **76**, Skeleton **75**; the base shadcn SplitPane suite passes **5** tests, including ShadowRoot input and responsive stacking. Demo-common passes **10** unit tests. Root formatting and workspace ESLint pass. Package-level formatting commands now explicitly use the root ignore file; core package lint passes after a build without scanning generated `dist`.

### Svelte peer-floor evidence for P0.1

The installed native packages require newer Svelte releases than the workspace's current `^5.0.0` peer declarations: Flowbite Svelte 1.31.0 requires `^5.40.0`, Bits UI 2.18.1 requires `^5.33.0`, PaneForge 1.0.2 and Skeleton Svelte 4.12.1 require `^5.29.0`. Core `DialogActionHint.svelte` also uses `$props.id()`; installed Svelte declarations identify that API as introduced in 5.20.0. These are inspected dependency/API requirements, not a passed minimum-version matrix. The successful builds use Svelte 5.50.1. P0.1 must correct the advertised lower bounds and verify package consumption before closing; this finding does not justify claiming 5.0 compatibility.

The cumulative `build:pages` gate passes after the splitter changes. The source splitter production flow passes **all 12** combinations (three families × EN/BG × native/Web Component), including real keyboard resizing, disabled mouse dragging, cross-tab committed edits, middle-pane removal/restoration and vertical separator orientation. Bulgarian shadcn desktop and 390px screenshots were reviewed: pane content stays reachable; the narrow demo toolbar still needs its separate shell-responsive audit. Shared extended passes **131** tests.

The peer-floor correction now declares core/shared extended/demo-common **5.20.0**, Flowbite **5.40.0**, shadcn **5.33.0** and Skeleton **5.29.0**. Exact-version compiler checks pass for **303** library/demo-common components/rune modules in both client and server modes. Frozen offline lockfile validation passes without changing installed dependencies. The runtime browser suites still use 5.50.1; no lower-version runtime matrix is claimed.

## Single-file lifecycle continuation

Shared `createFileReadSession` detaches read callbacks, aborts obsolete readers, settles cancellation even when no browser abort event arrives, and supplies a currency check after awaiting the result. The native adapters also check the current data, scope, schema, limits and enabled state before committing. This prevents a pending read from replacing externally supplied data or completing after unmount.

User cancellation follows spec §18.18.4: native chooser `cancel`, an empty chooser change and the progress Cancel action use normal Clear semantics. Internal invalidation (a newer selection, external changes or unmount) preserves the current value. Read failures preserve existing attachments. The native input `cancel` event is handled where browsers provide it; no focus-based cancellation heuristic is claimed.

The shared file helpers pass **17** tests. Native file suites pass **46** tests: Flowbite **16**, shadcn **15**, Skeleton **15**. Coverage includes binary filename encoding, unchanged byte/base64 storage, replacement races, stale load/progress callbacks, readonly/data/schema changes, unmount, Bulgarian controls, cancellation clearing and explicit empty picker filters. Native package builds/type checks pass; the subsequent removal of redundant unlocalized progress-close buttons is awaiting the next combined gate.

Flowbite retains its native Fileupload and CloseButton. The Fileupload's built-in clear action hard-codes its accessible name; a sibling native CloseButton supplies the translated name and prevents dismissal of an enclosing dialog. Binding the native progress dialog's open state makes native dismissal cancel the read.

The file section contains older additional-error requirements alongside newer local-operation feedback requirements introduced in spec `66e398c728a515b20c1f76ae00686dfb1bdb4794`. Current React file adapters use local feedback. Full size/restrict/feedback reconciliation remains open; this slice does not claim owner-error or multiple-file conformance.

Persisted filename follow-up: native file suites now pass **52** tests (Flowbite 18, shadcn 17, Skeleton 17), and shared file helpers pass **18**. Stored binary filenames are decoded safely; plain base64 uses EN/BG fallback text after remount, and external values cannot reuse another attachment's local name. A rejected replacement retains the committed local filename and data. The filename parser checks the data-URL prefix before scanning metadata so ordinary base64 payloads are not traversed for display.

## File arrays and authored restriction defaults

Core exposes authored host configuration separately from JSON Forms' reducer defaults. `resolveRestrict` uses an explicit local boolean, then an authored global boolean, then true. Core's upstream reducer behavior remains intact. The full core suite passes **240** tests, including reactive configuration changes.

The shared reader now supports atomic sequential batches with aggregate progress, chooser ordering and cancellation between reads. Shared file-schema helpers recognize homogeneous file arrays, including item references, while excluding tuples, boolean items and ordinary strings. The shared extended suite passes **158** tests.

All three native file renderers now append complete batches, enforce array counts using authored restriction precedence, deduplicate encoded values only for uniqueItems, and remove one occurrence by position. Stored names remain bounded, with EN/BG fallback and localized removal actions. Clear-all writes an empty array and respects minItems, readonly and clearable. Native file suites pass **64** tests before the additional readonly/reference regression; all three native extended builds and package validations pass. Subsequent full-suite evidence is recorded below when complete.

The ninth imported source fixture is `spec-file-control`; the provenance check passes against the current source checkout. File-size validation-only semantics and local feedback severity/cell presentation remain unfinished. No completed file-conformance claim is made.

The complete native extended suites pass after file-array dispatch and readonly/reference regressions: Flowbite **91**, shadcn **92**, Skeleton **91**. Subsequent local-feedback tests pass **73** cases across native controls and real table-cell registries. Rejected selections use warning styling without setting aria-invalid on valid stored data; read failures use error styling. Compact cells expose the message through a focusable native popup rather than adding a feedback paragraph. This follows the newer local-operation rule pending reconciliation of the spec's older conflicting paragraph. Size-bound validation-only behavior remains open.

Exact peer-floor compiler checks now pass **306** sources after the three native file-feedback components. These are compile checks, not minimum-version browser runs.

## Continuation verification (2026-10-09)

The reference revisions remain unchanged. Fresh runs pass core **240**, shared extended **159**, and native extended **93 Flowbite / 94 shadcn / 93 Skeleton** tests. Workspace ESLint passes. These results cover the file-array and local-feedback checkpoint before the subsequent grid changes.

The built Flowbite source-fixture flow exposed parent `variant: "ag-grid"` propagation into array-valued file cells: selecting the AG Grid tab created nested grids. The fix removes only the inherited parent variant before merging explicit per-column options. A real-grid regression will check that array file columns dispatch file pickers and keep original encoded values while their default filter/sort values contain only persisted filenames. Production acceptance remains pending until the rebuilt hosts pass.

The fresh full `build:pages` gate passes for that checkpoint, including all native libraries, three Web Components, three demos and the Pages shell. The source file fixture's first production run failed on nested grids rather than a compilation error; the grid fixes are being verified separately.

The filename helper passes **3** unit tests, including referenced schemas, invalid/nameless attachments and ordinary-column fallback. Real-grid file regression and existing interaction suites pass **21** tests across all families. Shared extended and all three native extended packages build and pass package validation after these changes; targeted package ESLint passes. Rebuilt host production tests are next.

The production fixture then exposed a focused Flowbite warning popover that remained closed, and a screenshot showed overlapping chooser/clear/filename elements inside grid columns. The revised layout uses localized native chooser buttons, hidden platform inputs and native filename badges; compact cells keep controls in one bounded row. Flowbite feedback explicitly opens on focus/pointer entry/activation with the native click-triggered top-layer popover. The component rationale is in [file-native-review.md](file-native-review.md).

After that revision, **79** file/control/cell/grid browser tests pass across all families, as do **391** Skeleton base tests after the compound-label correction. All three native extended Svelte checks have zero errors and warnings; all native extended builds/package validations pass. Skeleton's test process exits successfully despite the previously observed Vite SSR transport-disconnected log during shutdown. A scoped autofocus suppression documents the explicit authored focus option; its explanatory text is kept in a separate comment for the ESLint parser.

Further production diagnosis showed that the warning-button focus attempt happened while the progress dialog was still closing; waiting for dialog dismissal fixes that test race. Flowbite's production CSS also omitted its extended renderer source, leaving new compact size utilities ungenerated. All hosts now explicitly scan shared extended sources, and Flowbite additionally scans its native extended package. The production test asserts a minimum 24px chooser target to catch this omission.

Production file scenarios now pass English/Bulgarian native and Web Component hosts for Flowbite and shadcn (eight scenarios). The real shadcn chooser exposed a generated Input string binding that attempted to restore a nonempty file path after clearing; the renderer now uses an uncontrolled hidden platform input, and the component regression dispatches both input and change. Shadcn's 26 targeted file/cell/grid tests pass. Narrow-screen screenshot review confirms the focused warning fits the viewport after scrolling the target into view; the production script checks its bounds.

Skeleton's native English production scenario passes, but its Web Component exposed an unreplaced dependency `process.env.NODE_ENV` check. The standalone library build now replaces that expression with production mode; rebuilt browser verification is pending. This is a runtime failure, separate from the existing custom-element compiler warning.

The rebuilt Skeleton Web Component and demo pass all four file scenarios. All **12** production file scenarios now pass across three families, EN/BG and native/Web Component hosts. Workspace formatting and ESLint pass for the file checkpoint. Shadcn's narrow-screen test also waits for popup positioning and asserts viewport bounds.

Column-heading follow-up: native table headings now use JSON Forms label translation keys, and AG Grid invalidates its column cache for translator, locale and path changes. Schema references are resolved before translation. Explicit native column headings still win; empty translations remain empty. Browser regressions pass **12** table-summary/heading tests and **6** real-grid file/heading tests across the three families. Updated package builds are pending.

Exact minimum-version compiler checks pass again for all **306** sources after the file UI and heading changes (client and server output). Renderer inventory remains **166** entries / **12** test inventories, and provenance checks cover **9** imported fixtures. The heading builds initially caught test-fixture type errors; localized schema fixtures now retain their precise draft-compatible inferred types and translators use the core `createTranslator` adapter.

All six native renderer package builds and package validations pass after the heading fixture corrections. Targeted package ESLint and workspace formatting pass; repeated table/grid heading suites pass **12 + 6** tests against rebuilt dependencies. Host rebuilds are in progress for production heading checks.

The next core validation slice adds per-instance error ownership, stale-generation rejection, explicit pointer relocation, pending state and teardown invalidation, plus a separate `onvaliditychange` callback. The full core suite passes **248** tests. A regression caught unrelated host-error replacement restoring an older data value; internal edits now keep the synchronization value current, and unchanged incoming data does not overwrite it. Schema/type replacement and existing inference tests remain green. Core Svelte checking reports zero errors/warnings. See [renderer-owned-validation.md](renderer-owned-validation.md) for the API and remaining renderer/host integrations.

The extended wrapper forwards combined validity and publishes merged additional errors into its action context. Its full suite passes **163** tests against the rebuilt core. Core/shared extended builds and package validations pass. All **12** file-fixture production scenarios also pass with translated table/grid headings after rebuilding their hosts.

The new context hook brings the exact-floor compiler inventory to **307** sources; all compile for client and server with their advertised minimum versions. Native full suites and packed Web Component validation-event checks are running against the owned-error channel.

Full native suites pass after the owned-validation channel: base **397 Flowbite / 414 shadcn / 392 Skeleton**, extended **96 / 97 / 96** (**1,492 total**). Release rehearsal validates all tarballs and standalone declarations. All three packed Web Component browser flows pass, including typed validity notifications when server errors are added/cleared without data edits; the edited value remains intact. The standalone event declarations describe their payload without importing framework types. Workspace ESLint and formatting pass for this checkpoint.

Monaco follow-up is in progress. The shared draft regression passes opt-in parse-error publication, Bulgarian feedback, live locale/options changes, preserved malformed drafts and valid whitespace, external replacement and readonly guarding. Native Svelte checks pass with no errors/warnings. A real Monaco browser test passes its editing assertions but exposed teardown failures; editor/model disposal order and background occurrence requests are being checked before accepting this slice.

The scoped Monaco model guard passes all three real native keyboard/edit/maximize/locale/teardown tests with no unhandled errors. It is documented in [monaco-native-review.md](monaco-native-review.md). The final shared suite passes **164** tests, and exact-floor client/server compilation passes **308** sources. Native extended builds and package validations pass. The tenth imported fixture, `spec-code-editor`, passes source provenance and EN/BG catalog checks; its production hosts are rebuilding.

All **12** code-editor production scenarios pass across EN/BG, native/Web Component and the three families. The full native extended suites pass **97 Flowbite / 98 shadcn / 97 Skeleton** tests after correcting two asynchronous test assumptions (color fade completion and AG Grid cell mounting) and dismissing the native completion popup before maximize.

The next Monaco schema slice passes a real-worker test with two independent editors and an existing host model. Section references resolve against the matching document root; changing one schema leaves the other model's diagnostics unchanged, and teardown preserves host resources. Literal `$ref` values inside const/default remain unchanged. Targeted schema/editor/draft/scalar tests pass **9** cases before the subsequent native-option guard test; Svelte checking has zero errors/warnings. These schema and explicit-null changes require refreshed production builds.

The refreshed core and shared suites pass **249 + 168** tests. Real native Monaco tests pass in all three families with explicit null, server-error preservation and worker-safe schema snapshots; nested Svelte proxies are converted to plain JSON at the worker boundary. The scoped schema worker test covers an escaped definition name. Release tarball validation and all three packed Web Component browser flows pass against these rebuilt libraries. The full demo build and production fixture reruns are still in progress at this checkpoint.

The full `build:pages`, workspace lint and formatting gates pass for that checkpoint. All **12** code-editor production scenarios pass. File scenarios pass all eight Flowbite/Skeleton cases and both English shadcn cases; the Bulgarian native shadcn narrow-screen check stops when its feedback element detaches during viewport resizing. This failure remains to be investigated; the later inference/split-layout commands did not run. Subsequent demo validity wiring now combines schema and additional errors in the Demo badge and forwards Web Component validity events; this wiring awaits the next batch verification.

The next focused batch passes all **3** demo wrapper forwarding/cleanup tests and all three demo Svelte checks with zero errors/warnings. The live shadcn demo passes Bulgarian native and Web Component code-editor flows, including badge updates from owned errors without data changes. The single Bulgarian native narrow file scenario passes against existing production assets after revealing AG Grid's virtualized attachment column and creating feedback on its current cell. Its macOS scrollbar viewport exists while its overlay scrollbar is hidden; the test no longer requires the scrollbar itself to be visible. These checks did not require a full workspace rebuild. Subsequent Monaco option-precedence changes are awaiting their batch checks.

Monaco option precedence and splitter dimensions pass **14** shared helper/draft tests and **26** native Monaco/splitter browser tests. All three native package type checks pass after adding explicit guards for unknown focus/placeholder options. The splitter dimension regression verifies global defaults, local overrides and preservation of pane input instances. No full workspace build was repeated for this batch.

The color batch passes **29** shared parser/serializer/validator tests and **33** native color/hex3 tests, plus focused translation and picker-only accessibility follow-ups in all three families. Native package Svelte checks have zero errors/warnings. The demo-common check has zero errors and its existing no-Svelte-input warning. Eleven source fixtures pass provenance checking. The new color scenario passes English and Bulgarian in the live native shadcn demo; the full production native/Web Component matrix remains pending.

Incremental packaging must use each package's `prepack` script. A raw `svelte-package` call bypassed shadcn's alias-preservation environment and produced invalid consumer imports plus untracked UI declarations. Re-running shadcn prepack restored the aliases, package validation passed, and only the generated untracked declaration artifacts were removed. The live scenario also caught a picker-only accessible-name issue, fixed by retaining the field label and moving the action text to the title. Monaco-rendered Data text is normalized for nonbreaking spaces in the scenario assertion. These were focused corrections, not repeated full builds.

## Verification cadence

Batch related implementation and regression-test changes before verification. During development, run targeted tests only when they resolve a specific uncertainty or failure. At the end of a substantial batch, check all affected packages together, collect failures, fix them together, and rerun the affected checks. Rebuild dependency packages before consumer checks only when their consumed output changed. Reserve full workspace builds, production demo matrices and packed-consumer rehearsals for integration milestones that affect those outputs and the final acceptance gate. Do not repeat successful broad gates without relevant new changes. This cadence follows the user's request to reduce repeated builds and tests while retaining the final verification requirements.

## Password/OTP and File validity checkpoint (2026-10-09)

- Password/OTP browser suites: 24 tests pass across the three base families.
  Real registries cover native segmented input, partial/leading-zero values,
  bounded fallback, readonly mutation and ordinary masked table cells.
- The imported password fixture passes all six live native family × EN/BG runs.
  Shadcn uses Bits UI PinInput; Flowbite/Skeleton use native input compositions.
  Source provenance now verifies 12 imported fixtures.
- File browser suites: 76 tests pass at the unrestricted-size checkpoint.
  Subsequent focused runs pass all three array relocation cases, all three pending
  cancellation cases, and all three intentional-empty-translation cases.
  Three color translation override cases also pass with the typed catalog translator.
- Core/base and shared/native extended checks pass at their corresponding focused
  checkpoints. The latest integration build covers the final accumulated sources.
- Scoped renderer/helper lint, repository formatting, root script lint and source
  inventory checks pass. The integration build and production matrices are tracked
  separately below; these focused results do not imply complete spec conformance.

Integration result for the password/color/File/Monaco snapshot: `pnpm build:pages`
passed, including all libraries, Web Components, demos and the Pages shell.
All 48 production example × family × EN/BG × native/Web Component scenarios
passed. The shadcn OTP scenario uses select-all plus real keystrokes because
PinInput manages focus selection; direct automation `fill` was timing-sensitive.
Release tarball validation and all three packed browser checks passed, including
OTP in Shadow DOM and unrestricted file validity. Desktop and narrow Bulgarian
shadcn File screenshots were inspected; filename pills and feedback stay compact
and within the viewport. These built artifacts precede the next boolean/catalog
parameter batch, which uses focused verification until its integration checkpoint.

### Renderer JSON catalogs and Button script permission

Renderer UI messages now come from `jsonforms-svelte/src/lib/locales/messages.json`;
components no longer select Bulgarian or English strings using locale branches.
The shared resolver supports regional fallback and host catalogs for arbitrary locales.
Core and shared extended packages were incrementally packaged before consumer checks.
All eight affected packages passed Svelte checks with zero errors or warnings.
Focused native suites passed 66 Boolean/password/mask tests and 15 Button tests;
two catalog tests check locale fallback and matching message keys/parameters.
Three additional browser cases verify arbitrary French/German host catalogs and empty
overrides; 27 layout/group cases and four Button executor unit tests also pass.
Scoped ESLint and formatting checks pass.
These changes have not yet been included in the full production/packed integration gate.

Button strings require host `jsonformsExtended.security.allowScriptEvaluation: true`.
UI-schema options cannot grant permission. Trusted function callbacks remain supported,
asynchronous actions prevent duplicate activation, and completion restores availability.
Other script evaluation paths remain on the upgrade TODO; this is not a claim that the
whole execution-policy audit is complete.

### TypeScript integration test organization

Standalone browser scripts have moved to the `tests` workspace as TypeScript Vitest
suites. Demo scenarios are individually named by family, locale and host. Packed
Web Components and Pages navigation are also test files. Root `pnpm test` includes
package tests, demo wrappers and integration tests; CI no longer enumerates per-example
commands. Integration tests use strict TypeScript and the existing Playwright browser
API, with a shared server/browser fixture. Build and packing utilities remain separate
and are never invoked automatically for a filtered test run.

### 2026-10-09 integration checkpoint

`pnpm build:pages` and release packing passed for the Boolean, mask, JSON catalog and
Button batch. The migrated TypeScript integration suite registered 110 cases:
108 demo cases (nine examples × three families × two locales × two host modes),
one packed-Web-Component test and one Pages-navigation test. The last two tests
retain their complete internal family/hosting coverage.

The initial run passed 104 cases and exposed six Button Web Component failures:
the demo wrappers serialized trusted function scripts out of UI schemas. The wrappers
now pass UI-schema objects through custom-element setters. Six focused wrapper tests
pass. Only the demo apps and aggregate shell were rebuilt; a filtered rerun passed
all six affected Button cases and six additional Web Component inference cases.
Thus every integration case has passing evidence; this was not one all-green invocation.
Strict TypeScript, scoped lint, formatting and source provenance checks pass.

### UI-schema script policy follow-up

Ten shared policy tests and two spec choice-example tests pass, plus a mounted Svelte
regression that grants and revokes tester permission without replacing form data.
Shared extended/demo-common type checks pass (the existing demo-common warning remains).
Choice, tuple and placeholder registries use native host testers. The legacy Button
demo now explicitly grants permission and reads script status text from its JSON catalog.
This source batch follows the production checkpoint above and has not had another
full build or production matrix run.

### Validator-local default permissions and validator-profile fixture

- Replaced global dynamic-default provider mutation with a registry per Ajv instance.
- Added a live configuration getter to `createAjv`; shared forms, all three demo apps
  and all three Web Components supply it. Cached validators recheck string permission.
- Six focused validator tests pass, covering isolation, revocation/grant, denied
  malformed source, native defaults, server-host diagnostics and canonical fixture data.
- One demo adapter test passes for the original EN/BG catalogs and permission config.
- Source provenance verifies 16 imported fixtures. This fixture's full UI validation
  routing, rule isolation and presentation acceptance remain open.
- Shared extended package check and prepack passed. Production demo/WC bundles have
  not been rebuilt for this batch; the previous integration checkpoint remains separate.

### Ractive template permission boundary

- Seven focused browser cases pass for rendering, updates, errors, lifecycle races,
  denied parsing and mounted grant/revoke behavior; host French catalog override is covered.
- Five renderer selection cases pass, including namespaced default language precedence.
- Template denial and error titles use the shared English/Bulgarian JSON catalogs.
- Shared extended and demo-common type checks pass (existing demo-common no-Svelte-input
  warning remains); scoped lint passes. Core and shared extended prepack pass.
- Legacy template-layout, template-slot and job demos explicitly grant permission in
  JSON config. No production demo/WC rebuild was run for this source batch.

### Isolated rule evaluation

- Schema rules validate normalized copies with the host Ajv; ordinary form validation
  retains defaults/transforms. Predicate rules receive copied data/fullData.
- Shared controls/cells/layout mappings, layout sizing visibility and extended Button
  mapping use the boundary. Host references, custom formats and `/#/...` are preserved.
- Five helper tests, three mounted rule cases, one readonly dispatch regression and
  three Button mapper tests pass (12 focused cases total).
- Core and shared extended type checks and scoped lint pass. Core packaging passes;
  no full production build or integration-suite rerun was needed for this batch.
- Selection/composition probes outside the shared mapping still require review.

### Compiled probes, live error translation and production checkpoint

- Nine isolated-validator tests pass, including actual JSON Forms oneOf/anyOf/allOf
  mapping and registered-schema/compiled-function probes.
- Five localization tests and one mounted locale-switch test pass. Stored errors remain
  unchanged; nested authored errors retain original keywords, paths and parameters.
- `pnpm build:pages` passed, including all libraries, Web Components, demo apps and shell.
  Log: `/tmp/validator-upgrade-production-build.log`.
- All 12 new validator-profile production cases pass (three filtered family runs).
  All 24 Button/inference production cases pass in one invocation. These 36 cases
  cover all families, English/Bulgarian and native/Web Component modes.
- Integration TypeScript/lint checks pass. Source provenance remains 16 fixtures.

### Subsequent oneOf adapter batch

- Native oneOf adapters now consume shared confirmation and branch-preservation helpers.
- Branch initialization uses generated defaults, preserves enclosing properties only,
  and rechecks readonly/disabled state at commit time.
- This source batch follows the production checkpoint above; its changed oneOf code
  is verified with focused component tests, not claimed as part of those built artifacts.
- All 12 focused oneOf component cases pass across the three families; affected family
  type checks and scoped lint pass. Existing Svelte proxy-identity warnings remain.

### Conditional fields and composition views

- Canonical fixture provenance passes for 18 examples, including combinators and
  conditional-fields. Their two factory/localization tests pass.
- Conditional projection and catalog checks pass (7 cases), as do conditional
  registry selection (3) and object renderer browser tests (24).
- Single-branch and anyOf view selection pass across all three families. Core view
  selection tests pass (3). Core, demo-common and affected family type checks,
  scoped lint and prepack pass.
- Active-branch feedback passes 33 focused anyOf/oneOf browser cases. A further
  18-case anyOf run covers live validation modes and local/global precedence.
  Three helper tests cover caching, isolated defaults, deduplication and local refs.
  Affected type checks and scoped lint pass.
- These are source/package checks following the last production checkpoint above;
  the newly imported fixtures and composition changes still require a production
  demo/Web Component build and integration acceptance.

### Mixed-tree translation catalogs

- All 42 focused mixed-renderer browser tests pass. Expanded trees react to Bulgarian
  locale changes and a French host override; array item labels also update.
- Actions, confirmation and rename messages, search/type placeholders and navigation
  labels now come from the shared JSON catalogs. Affected type checks and lint pass.
- Added production acceptance cases for both new canonical fixtures across all
  families, locales and native/Web Component hosts; execution follows the grouped build.

### Composition production checkpoint and subsequent catalog fixes

- `pnpm build:pages` passed for libraries, Web Components, demo apps and shell.
  Log: `/tmp/composition-production-build.log`.
- All 12 canonical combinator production cases pass; all 12 conditional-field cases
  pass after correcting test locators for generated scalar IDs, required markers
  and hidden retained tab panels. Conditional cases edit a value and retain it when
  moving to the authored layout. Both matrices cover three families, EN/BG and both hosts.
- Subsequent source fixes honor explicit branch i18n prefixes, refresh array/composition
  translations and move dialog/selector/clear labels into JSON catalogs. All 21 oneOf
  browser cases pass, including live dialog locale/host overrides; prefix checks pass
  for anyOf too. Six renderer package type checks and scoped lint pass, as do two
  catalog tests and core/six-renderer prepack.
- These subsequent catalog changes are packaged but are not included in the production
  checkpoint above. No second full build was run for those text-only changes.

### Incoming composition selection and missing-kind feedback

- Object-only array clearing passes through all three real registries (3 new cases).
  Shared data-shape checks preserve array slots without inventing values elsewhere.
- oneOf follows incoming data until a user chooses and clears stale detail on removal;
  browser checks pass in all families. The combined composition run passed Flowbite
  and all anyOf files; Skeleton's new locator initially selected its combobox input,
  then both Skeleton and shadcn oneOf files passed after targeting the field itself.
- Four discriminator tests cover required/distinct constants, inherited-value exclusion,
  references without recursive expansion, empty values and node-specific error routing.
  Four composition helper tests pass. Missing-kind browser feedback passes in all
  three families with Bulgarian updates and hidden validation suppression.
- Core/three-family type checks and scoped lint pass. Core prepack passes. These changes
  follow the production checkpoint and have not triggered another full demo build.

- The final oneOf regression run passes all 30 cases. It additionally verifies that
  choosing a branch with generated `{}` defaults leaves its fields available for
  editing; automatic selection reset must not undo that explicit user action.

### Checkbox array constraints and imported values

- Fifteen shared choice helper cases and fifteen browser cases pass across the families.
  The new cases cover min/max prevention, authored `restrict: false`, imported choices
  and one-occurrence removal while a duplicated value remains checked.
- Native checkbox function bindings keep visual selection consistent with stored data.
  Flowbite/Skeleton tests now use real click events instead of dispatching only `input`.
- Core/affected family type checks and scoped lint pass. Chips and multi-select
  variants and the canonical array-choice fixture remain the next work, not complete.

## Shadcn array-choice variants checkpoint

Added shared array-choice applicability/mutation helpers and a Svelte controller, plus the shadcn chips and searchable multi-select renderer. The presentation follows the React shadcn native-component composition. Translation defaults are in the shared English/Bulgarian JSON catalogs; host overrides remain supported.

Verification for this batch:

- Shared array-choice rules: 23 passing tests; message catalogs: two passing tests.
- Shadcn browser suite: nine passing cases covering exact string identity, positional repeated-token removal, finite-domain/duplicate rejection, bounds and `restrict: false`, typed invalid imported members, IME/Backspace, readonly, Bulgarian defaults, host translation overrides, and multi-select interaction.
- Core and shadcn Svelte checks: zero errors or warnings.
- Scoped package ESLint passes; new files formatted with project Prettier configuration.
- Core and shadcn `prepack` validate the package artifacts. No full production demo rebuild was run for this isolated renderer addition.

P4.8 remains open for Flowbite/Skeleton adapters and canonical array-choice demo integration. The component contract limitations are recorded in [array-choice component decisions](array-choice-components.md). The canonical fixture count remains 18; adding a shadcn renderer does not establish cross-family demo parity.

## Cross-family array-choice checkpoint

P4.8 now includes Flowbite and Skeleton adapters, shared guarded native-selection updates, and the canonical `spec-array-choices` example. There are 19 imported fixtures. Canonical schema/UI/data/config/translations remain unchanged; English/Bulgarian field descriptions and guidance live in a supplemental JSON catalog.

Executed verification:

- Flowbite browser tests: nine passing cases. Skeleton: 11, including native TagsInput and whitespace-distinct values. Shadcn: nine regression cases pass against the updated shared controller.
- Array-choice rules and renderer-message catalogs: 25 unit tests. Canonical demo factory: one passing test.
- Production example: all 12 family × locale × native/Web Component combinations pass. Checks cover translated labels, positional repeated-token removal, free-tag addition, minimum-item protection, and keyboard removal of an imported invalid member.
- `pnpm build:pages` passes, including library checks, package validation, Web Component bundles and the three demo apps. A later Skeleton button-style correction also passes a scoped Skeleton package/Web Component/demo/pages rebuild, without repeating the full build. The final Bulgarian Skeleton Web Component was inspected at a 1440px desktop viewport; tags, translated guidance, duplicate tokens, and the corrected button style are visible without clipping.
- Scoped ESLint, Prettier, source inventory (169 entries), and canonical provenance checks pass. Existing Svelte proxy-identity warnings in browser tests and Web Component/build warnings remain visible; no new type errors were found.

Native component choices and exceptions are documented in [array-choice component decisions](array-choice-components.md). This closes the array-choice implementation task, not the full spec upgrade or the project-wide dark/RTL/narrow/screen-reader acceptance matrix.

## Cron and mixed composition checkpoint (2026-10-09)

- Cron shared grammar/default-Ajv tests: 40 passed. Native adapter component cases: eight per family passed. The canonical cron example preserves invalid source values and adds live EN/BG schema-label supplements; its factory test passed. Integration-test TypeScript check passed.
- Mixed composition narrowing: 35 shared applicability/semantic tests passed. Four delegation regressions passed per family. The shadcn mixed renderer's 15 browser cases passed, including an explicit type union with oneOf.
- The combined production build found a new test fixture's Draft-04/Draft-07 annotation mismatch. The fixture now uses the explicit Draft-07 type; the build resumed at the first unfinished package. Final production cron results remain pending.
- A browser regression exposed that primitive compositions, like object/array controls, require narrowed schemas at their original parent scope. Source adapters are corrected; the in-progress production build started before this last correction, so final packaging must include it.

- Subsequent mixed-tree checks: imported forbidden-item browser cases pass in all three families; all three type checks pass. The six-case child/delegation unit suite passes in shadcn; shared family sources use identical resolution logic. Root boolean schemas pass 14 core browser cases and 14 inference unit cases, including exact original Ajv false-schema errors and host schema replacement.
- Canonical cron production acceptance: Skeleton's four EN/BG × native/Web Component cases pass. Flowbite exposed a Cancel/reopen draft reset through real pointer/focus events; a focused regression reproduces it. The shared open-state correction awaits repack and rerun.

### Cron production acceptance and mixed clearing

- All 12 canonical cron production cases pass. Shadcn and Skeleton passed after the combined build. Flowbite passed after setting native popover trigger delay and transition duration to zero, retaining native positioning, outside-click and Escape behavior. The full-demo native EN/BG flow also passed in development before the final targeted rebuild.
- All 36 React-equivalent mixed scalar clearing cases pass: root/nested × clear button/typed deletion × string/number/integer, preserving sibling fields, empty string/zero and distinct clear-type behavior. Flowbite's native clear actions now use JSON catalog labels; its existing scalar/array-clear suite passed 11 cases.
- Boolean schemas also remain boolean in Monaco data-validation associations; the focused registration test passes. All three base package type checks passed after widening root-value test fixtures and typing native event callbacks.
- The canonical mixed-control fixture is imported with source provenance and EN/BG supplements; its factory regression passes. Its production scenario is still pending.

## Mixed presentation and confirmation checkpoint (2026-10-09)

- Shared applicability/composition tests: 38 pass. Child/delegation constraints: eight per family pass, including referenced allOf constraints, overlapping patterns, boolean items and integer defaults.
- The mixed browser batch passes 63 cases each in shadcn and Skeleton. Flowbite passes 62 in the batch; its remaining dialog close/reopen race is fixed and all four focused confirmation cases then pass. The earlier 57-case batch passed in all families before adding per-type detail and confirmation cases.
- All three extended Monaco adapters pass the whole-value mixed code test: mandatory JSON conversion, invalid-draft error ownership, null commits, and cleanup when leaving code mode. Ordinary code controls retain their configured language.
- Root type/schema tests cover numeric intent, empty-value versus type clearing, host translations, forbidden imported children and true/false schemas. Native frames keep interactive selectors outside their collapse buttons and preserve user expansion through unrelated config changes.
- Six base/extended type checks passed before the confirmation adapter addition. A later check caught one unused Flowbite import after extracting the dialog; it was removed. The accumulated production build and canonical mixed demo acceptance are in progress.
- Reference revisions remain spec `f0183923295c495c60024fddca58dbe99e82e816` and React `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`. The canonical example count is 21. Broader recursion, cell, visual and packaging acceptance remains open in TODO.md.

## Recursive trees, depth and dispatcher dependencies

- Added the canonical recursive-tree and tree-max-depth fixtures; provenance now covers 23 imported fixtures at spec `f0183923295c495c60024fddca58dbe99e82e816`.
- All three families pass 23 affected browser cases each (69 total): recursive selected-node edits, guarded rename/deletion, replacement-target protection, readonly navigation, error indicators, min/max/global restriction overrides, EN/BG five-level editing and additional-error updates, native array translations/host overrides, and oneOf behavior.
- Core verification: 312 server tests and 21 browser tests pass. Core, demo-common and all base family type checks pass; demo-common retains its existing no-Svelte-input warning.
- Browser profiling found unbounded repeated Svelte dependency traversal during nested mount and teardown. Dispatcher snapshots now bound dependency propagation; branch context exposes errors independently, core reducer state remains immutable, and unchanged additional errors do not trigger reducer updates. The original shadcn depth/array batch now completes seven cases in under four seconds, including cleanup.
- Earlier production mixed/code and boolean-inference batch: all 24 EN/BG × family × native/Web Component cases passed. New recursive/depth production acceptance is tracked separately and is not implied by these browser results.

### Recursive production and scoped detail checkpoint

- Recursive tree and five-level depth: 24 production scenarios pass across Flowbite, Skeleton, shadcn, EN/BG and native/Web Component hosts. Four initial shadcn locator ambiguities were corrected to distinguish expansion from node selection.
- Canonical array-detail-modes and editor-details fixtures are imported with exact source assets, trusted registry adapters and EN/BG JSON supplements (25 imported fixtures total).
- Mixed details now resolve against the selected value schema and full value path. The mixed/detail regression batch passes 135 tests across the three families.
- Shared composite summaries distinguish absent, empty, unspecified, generated and literal values; localized native dialog actions and decorative type-indicator precedence have browser coverage. The subsequent composite/detail/recursive batch passes 81 tests; the core browser suite passes 22 tests. All three base family type checks pass.
- Default anonymous recursive-schema compilation has three focused unit cases and a mounted schema replacement case. Supplied host validators remain host-owned.
- The consolidated three-family Web Component/demo build passes. All 12 production scenarios for the two new detail examples pass, including edit, Cancel/reopen and Apply/reopen in EN/BG on both host types.

### Collection pagination and isolated draft checkpoint

- Imported canonical collection-pagination, property-pagination and additional-items-pagination fixtures; source provenance now covers 28 fixtures.
- Shared pagination option tests pass (4), state reconciliation browser test passes (1), and tuple-tail error navigation passes all 6 EN/BG family cases.
- Canonical table/property paging plus existing array/property tests pass 27 cases; expandable/list/default pagination regression batch passes 45 cases. Explicit list selection and immediate edit flushing pass 21 cases across families.
- All base family and extended type checks pass. Dialog ownership lifecycle browser test and eight owned-error-store unit cases pass, including cancellation and stale publication handling.
- Consolidated Web Component/demo builds and all 12 EN/BG × family × host production pagination scenarios pass, including real pointer resizing and edits across table/property/tuple-tail pages. Full filter/sort behavior, whole-row detail production acceptance, and remaining literal-key/identity cases are still pending. These counts do not establish full collection conformance.

### Portable table columns checkpoint

- Shared column selection/order/width normalization passes two unit cases. Native table/property pagination and resize interactions pass 15 browser cases; whole-row summary editing adds three passing cases, preserving hidden fields.
- AG Grid portable/native precedence passes six real-grid cases across the three families, including explicit empty columns, native groups/computed values, and whole-row summary columns.
- Core and all three base/extended families pass type checks. Scoped table implementation/test ESLint checks pass. The production pagination matrix passes all 12 scenarios against the consolidated build.
- Native tables use a shared focusable resize separator because their native Table components provide no column resizing primitive. The implementation follows the React common resize handle: measured widths, pointer capture, keyboard bounds, RTL direction, and a fixed table layout after resizing. Native table markup and styling remain family-owned.

- Production pointer tests exposed missing scoped Svelte styles in Web Component shadow roots. The Web Component Vite configurations now use Svelte's `emitCss: false` so scoped styles are injected into the owning root. All three builds and the 12 production scenarios pass after the fix.
- Whole-row native table dialog tests pass six EN/BG family cases: authored item-relative detail, hidden-field preservation, Cancel, atomic Apply, stale external replacement rejection and readonly inspection. Panel presentation is being verified separately.

### Whole-row detail and Label summary checkpoint

- Canonical table-row-details fixture imported; source provenance now covers 29 fixtures with EN/BG supplements.
- Native row detail tests pass 12 dialog/panel cases across the three families. The combined collection/composite/row-detail regression batch passes 60 tests.
- Six real AG Grid row-detail cases pass, including original sorted/paged indices, atomic dialogs and preservation of grid state through panel toggles. Six canonical EN/BG Label-summary and table-detail cases pass.
- Row actions include their original row number in localized accessible names, avoiding ambiguity with composite cell actions. Label summaries use existing renderer dispatch and interpolation; cells without explicit detail follow the React summary-only action rules.
- Core, demo-common and all base/extended families pass type checks; demo-common retains its existing no-Svelte-input warning. Scoped core/base/grid implementation and test ESLint checks pass. The consolidated row-detail production build/matrix is in progress.

## Detail-dialog geometry and narrow row panels

Six focused native EN/BG geometry cases pass across Flowbite, shadcn and Skeleton. They cover configured dimensions, container focus, reachable actions, maximize/restore, viewport reduction, cancellation/reset and disabled maximization. Canonical row-detail tests also pass in both languages in all three families with a 700px AG Grid side-panel container. The shadcn component test dispatches tab clicks directly, matching the existing categorization tests; the production matrix retains real pointer clicks. Production drag/resize acceptance is still in progress.

## Label summary and host round-trip follow-up

The focused native batch passes 39 geometry/summary cases. Three shared unit cases verify Label detail-scope error routing, including required and additional errors. Six canonical additional-properties browser cases preserve dotted/empty keys and siblings. Sixteen core form cases include equal serialized host echoes, and nine demo-wrapper cases cover trusted events and native-function forwarding. All three native-family type checks and touched-file lint checks pass.

Fourteen shared Label-evaluation unit cases and 15 real-grid browser cases pass: labels use resolved translated text for filtering/sorting, permission revocation removes sensitive search values, root updates refresh results, and native getters retain precedence. The older file-heading fixture now lists both intended native columns explicitly, matching the spec's whole-list override contract.

The production row-detail matrix passes all 12 EN/BG × family × native/Web Component scenarios across all six fixture modes. It covers Label-text sorting, resized viewport-edge dragging, maximize/restore, Escape focus return and persistent panels. Measured rectangle bounds account for Skeleton scrollbar centering. Explicit native trigger restoration fixes Flowbite outro and shadcn shadow-root focus. The additional-properties production matrix also passes all 12 scenarios. The complete core suite passed 353 tests before the subsequent parent-dialog transition guard; that guard receives focused grid/dialog coverage.

## Native grid localization and canonical tuples

- Six grid locale cases pass across all families: EN/BG/French host messages, native and empty overrides, saved GridState and isolated draft preservation. Three Label-summary cases also pass with guarded access to the replaced grid API. All three extended type checks and touched grid lint checks pass.
- Native grid action buttons use Flowbite/shadcn components and Skeleton presets. The 18 existing interaction cases pass after making their editing fixture explicitly unpaged and selecting the add button by accessible name. Flowbite source tests still log native ResizeObserver delivery warnings; production acceptance checks page errors explicitly.
- The canonical tuple fixture passes all six EN/BG source cases; 29 existing tuple tests pass per family. Nine focused tuple-layout cases then pass, covering omitted errors, invalid scopes, per-position summaries/details and orientation precedence. Core and all base-family type checks pass. The consolidated build and all 24 tuple/row-detail production scenarios pass in EN/BG across the three families and both hosts, with no page errors.

## Numeric drafts and canonical examples

- The shared numeric parser passes 17 unit cases. Native draft tests pass seven cases per family, including fractional integer rejection, precision loss, bounds repair, incomplete keyboard entry, locale changes and host replacement. The shadcn/Flowbite binding preserves Svelte's null view value without committing it as form data.
- Canonical numeric fixtures pass all six EN/BG source cases across the three families, retaining zero values, exponent entry and rejected fractional drafts. Canonical null fixtures also pass all six EN/BG source cases. These examples still need production acceptance.
- Core and shadcn type checks pass; the Flowbite recheck passes after documenting its narrower native input type. All nine grid locale cases pass, including invalid numeric drafts across locale changes in each family. Existing Flowbite tab navigation passes both regression cases. Slider alignment, formatted presentation and the remaining numeric acceptance matrix are still open.

## Categorization selection and navigation

The focused native tab/stepper batch passes 24 cases across the three families. It covers named initial selection, schema replacement/reordering, hidden selection fallback, all-hidden panels, existing navigation and live BG/host translation overrides. Category bindings now follow the current UI schema instead of retaining the initially mapped children. Shared selection and touched family lint checks pass. Native accordion, orientation and category indicators remain open.

The shared core checkpoint passes 381 tests (48 files), before the accordion extension to category state. Native accordion tests then pass nine cases across all three families. They cover named initial precedence, mounted closed content, persistent all-closed state, visibility fallback and live collapse settings. The final accordion/stepper/canonical example batch passes 24 cases, including six EN/BG canonical examples. All three family type checks pass. Skeleton visibility after explicit closure is tested through a real form checkbox: testing-library synchronous rerender after the native click exposed a nested Svelte flush error, while the normal data-edit path passes.

Flowbite now uses its native DetailedStepper and VerticalStepper instead of custom progress markup. Shadcn and Skeleton receive native orientation settings. Full category indicators, Flowbite vertical tabs and production acceptance remain open.

The upstream shadcn audit on this checkpoint used commit `8cbccdc8214e68709239fe9752e789e763f90aaa`, nova style and CLI 1.7.0. All 32 installed component wrappers differ from generated upstream source in both copies. The check exits nonzero; wrapper migration remains a separate change requiring preservation of local behavior and production coverage. No bulk synchronization was performed during the native renderer build.

## Numeric, null and categorization production checkpoint

The consolidated Web Component/demo builds pass for all three families. All 12 categorization production cases pass. All 12 numeric production cases pass after correcting the assertion to compare the numeric value of exponent input; native inputs may retain `1e3` as their display spelling. The null matrix exposed pointer-target movement in Flowbite/Skeleton: removing the preceding focused description between pointer-down and pointer-up dropped the click. Reserving description space fixes both focused native regression cases; affected-family type checks and lint pass. Both affected Web Component/demo rebuilds pass, and all eight affected null production cases pass. Combined with the four unchanged shadcn cases, all 36 numeric/null/categorization production scenarios pass with no page errors.

## Section validation indicators

Six shared helper cases pass, including identity-cached scope collection, and the earlier combined group/catalog batch passes 11 cases. Six EN/BG native indicator tests pass across all three families: counts deduplicate overlapping controls, additional errors remain when schema errors are hidden, local false wins, and tooltips do not toggle the surrounding collapsed Group. Six canonical categorization cases pass after the marker changes. All three family type checks and touched layout/badge lint pass. Flowbite's native popover uses fixed positioning and an explicit width; the focused rerun has no ResizeObserver errors. The consolidated Web Component/demo builds pass. All 12 categorization production cases pass with native tooltip interaction, unchanged accordion selection, correction-driven marker removal and no page errors.

## Category orientation and canonical container validation

Nine native tab cases pass across the three families for horizontal/vertical geometry, arrow/Home/End selection, roving focus and unique tab IDs. Flowbite supplies these missing behaviors around its native Tabs/TabItem API. Its two existing selection regressions pass, as do six shadcn/Skeleton stepper navigation cases after switching component keys to category identity. Flowbite type checks/lint pass.

The 35th canonical fixture, container-validation-indicator, preserves all source JSON and uses EN/BG supplements for missing field labels. Six source cases pass: expanding the initially collapsed Group, correcting its phone, clearing its marker and preserving all siblings. Demo-common type checking passes with its existing no-Svelte-input warning. Production acceptance for this new fixture is pending.

## Pre-touch errors and shadow-root disclosure

Eight shared pre-touch helper cases and six mounted EN/BG cases pass. Filtering uses schema errors allowed by the validation mode plus mapped additional errors; blur reveals the original message while structured errors/data remain unchanged. All three family type checks and touched composition/test lint pass. The canonical pre-touch fixture is imported with matching source hashes, bringing the total to 36.

The combined category/container production batch passed 22/24 cases. The two failures were Skeleton Web Component Group triggers retaining aria-expanded=true after their content closed. A native Collapsible shadow-root resolver fixes the focused repeated-toggle regression. Stretch alignment also overrides the native root's centered-child default, restoring full-width headings and content. Final production re-verification is pending.

The subsequent production run passes all four Skeleton container cases, including full-width heading geometry and repeated native/Web Component disclosure state. It exposed two remaining Flowbite keyboard-tooltip dismissal races and all 12 pre-touch demo cases exposed host defaults overriding Config-editor changes. The native Flowbite adapter now blocks late reopening after Escape until another focus/pointer/activation interaction; repeated source interactions pass in EN/BG. A shared demo config resolver separates defaults, authored values and explicit overrides; three unit cases pass and all three demo type checks pass. Production re-verification is pending.

## Consolidated section/config production checkpoint

All 60 production cases pass across five fixtures (pre-touch errors, container validation, categorization, numeric controls and null controls), EN/BG, all three renderer families and native/Web Component hosts. Every scenario checks for page errors; none were reported. This verifies applied Config values, unchanged pre-touch validity/data, native tooltip dismissal/reopening, Skeleton shadow-root disclosure state and heading geometry, plus related input/navigation regressions. The final affected builds pass; all three demo type checks and touched lint pass. Provenance covers 36 source fixtures and the renderer inventory remains consistent at 178 entries.

## Canonical object/array source checkpoint

At unchanged spec `f0183923295c495c60024fddca58dbe99e82e816` and React `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`:

- Six canonical object EN/BG cases pass through the real base registries: explicit/registered/generated detail ordering, legacy bare-elements compatibility, edits and sibling preservation.
- Twelve object registry recursion cases pass: absent/empty/summary-only options, editable generated fallback and independent reuse.
- Six canonical array EN/BG cases pass: native table editing, localized columns and selected choices, translated composite dialogs and cancellation without data changes.
- Six demo-common tests pass for localization, schema validity, canonical data preservation and detail precedence. Twenty core detail/pre-touch tests pass.
- Core and demo-common checks pass (demo-common retains its existing no-Svelte-input warning). All three base package checks have zero errors and warnings. All four library packages plus demo-common package successfully.
- The canonical array source tests use base registries/validators; their unused staff color field produces an unknown-format warning. Production demos use the extended validator and registry.

The schema localization regression involved a property named `title`: a truthy object was incorrectly recognized as metadata. The helper now requires string metadata and keeps property dictionaries intact. Native column scopes and composite dialog translation were also corrected. Production verification follows the batched build.

The batched Web Component/demo builds succeeded. All 12 production object/array scenarios passed (EN/BG × three families × native/Web Component), with no page errors. These cover canonical registry delivery, object edit persistence, table editing and translated composite-dialog opening/closing. Full object/array validation and presentation acceptance remains open.

## Object feedback and frame source checkpoint

- All 39 native cases pass across Flowbite, shadcn and Skeleton: canonical EN/BG direct-error correction, rejected-key removal, static/dynamic/mixed frame variants, registry cycles, outer Group ownership, non-Group error placement, host-error visibility modes and French host title suppression, plus independent section-indicator regressions.
- Five direct/rejected-error indexing and message-catalog tests pass. Literal rejected names remain attached to their owning object, and host errors retain their visibility behavior.
- Core and all three base packages have zero type-check errors or warnings. Package generation passes. Pure error indexes live in a normal TypeScript module; reactive bindings remain in the Svelte module.
- The new native cards preserve non-Group detail layouts. Embedded additional-property editors have no extra border, and dynamic-only Groups have no empty static-fields block.

Production rebuild/verification is in progress for this checkpoint; the earlier 12 production passes apply to the preceding fixture/registry batch.

The object feedback/frame production checkpoint passed all 24 scenarios: expanded object/array coverage and ordinary container-validation regressions, EN/BG × three families × native/Web Component. No page errors occurred. All Web Component and demo builds succeeded; touched ESLint and integration TypeScript checks passed. This closes the pending verification above for the covered cases.

### Destructive confirmation across collections

The source checkpoint passes 24 base confirmation cases and six AG Grid cases across Flowbite, shadcn and Skeleton. Coverage includes EN/BG canonical configuration, Cancel/Accept, local never overrides, nonempty/empty composite values, tuple-tail prefix preservation, sorted batch deletion, stale replacement and readonly transitions. The affected tuple, composite, table, list and additional-property regressions pass 156 cases. Seven package type checks pass.

Flowbite confirmation modals now have explicit accessible names; shadcn array-layout cancellation no longer nests native buttons. Shared deletion callbacks accept native click handlers without interpreting their events as request identities. Additional-property disableRemove/readonly rules are checked at action time. All 12 canonical destructive-confirmation production cases pass (three families × EN/BG × native/Web Component), with no page errors. All three Web Component and demo builds passed. Touched core/base/extended ESLint checks and integration TypeScript checks passed.

### Temporal bounds and native picker views

Shared temporal/catalog tests pass seven cases. The first browser checkpoint passed 75 cases, then the time-view additions passed 81 cases. The final focused temporal suite passes 18 cases across all three families, including EN/BG month Apply/Cancel, column visibility independent of storage, live relative `$data` bounds, namespace/local restrict precedence and exclusive time bounds without clamping imported values. Tests await the native popup's close before reopening it. Core/demo-common/base types pass; the existing demo-common no-Svelte-input warning remains. Native/Web Component production verification is pending. See [temporal native review](temporal-native-review.md).

### Temporal, presentation and metaschema production checkpoint

All 24 combined production cases passed across three families, EN/BG and native/Web Component hosts, with no page errors. All three Web Component and demo builds succeeded. Flowbite temporal popovers now use adjacent native trigger elements, avoiding the vendor document selector lookup outside a shadow root. Presentation/metaschema native evidence is 36 base presentation cases, 27 extended presentation/link cases and six metaschema cases. The four affected base/demo-common type checks pass; demo-common retains its existing no-Svelte-input warning. Canonical provenance covers 42 of 47 fixtures.

A subsequent temporal correction separates complete typed range violations from restricted picker selections, as specified. Verification for that follow-up is tracked separately from this successful build checkpoint.

The typed-range follow-up passes 54 focused native cases. DateTime draft feedback now uses the shared JSON catalogs and an accessible input description; 21 Apply/Cancel cases pass, including live Bulgarian and arbitrary French host translations with unchanged committed data. The touched ESLint and integration TypeScript checks pass. These source changes will join the next production rebuild.

### Named template source checkpoint

Six canonical EN/BG family cases and four shared renderer cases pass. Coverage includes shared caller data, first fallback, local/inherited slot precedence, exact name lookup independent of testers, duplicate/missing diagnostics, bounded indirect cycles and sibling reuse. Provenance covers 43 fixtures. The temporal follow-up base type checks pass with zero warnings. Combined production build verification is in progress.

The combined temporal/named-template production batch passed all 24 scenarios without page errors after all three Web Component and demo builds. Temporal coverage now includes retained typed range violations and correction-driven invalidity removal. Named-template coverage includes shared edits and nested overrides in both host modes.

### Template engine source checkpoint

The shared suite passes 26 cases; canonical TemplateLayout and named-template fixtures pass 12 native EN/BG family cases. Ractive/native permission differences, translated diagnostics, live context, slot keys/collisions and DOM preservation are covered. The source inventory now includes the native Svelte profile (179 entries); provenance covers 44 fixtures. TemplateLayout production acceptance follows the next combined build.

The final lazy-loader refinement passes six lifecycle cases, and all three family registry export tests pass with the native template and existing Cron entries included. Shared and demo-common type checks pass with zero warnings. Touched shared/common lint is clean. The native Svelte profile build is in progress; prior production passes apply to the preceding named-template/temporal batch.

### Template runtime bridge production checkpoint

Direct host-compiled Svelte components failed inside independently bundled Web Components because they crossed Svelte runtime boundaries. `defineNativeTemplate` now mounts host components in their own runtime and delegated slots in the renderer runtime using public Svelte APIs. Three native binding/disposal cases pass. All 12 canonical TemplateLayout production cases pass across EN/BG, three families and native/Web Component hosts, with no page errors. Shared/demo-common types and touched lint pass. All three Web Component/demo rebuilds pass. JSX remains unsupported and receives an explicit translated diagnostic.

### Monaco language markers and additional-errors fixture

Monaco now forwards only error-level markers from its owned model. The draft adapter publishes one summary through its existing per-instance owner, preserves host errors, refreshes translations, and avoids duplicating schema-validation messages. Five real editor cases and two draft-adapter cases pass, including JSON-to-Markdown retraction. Shared and all three family extended type checks pass. The canonical additional-errors assets are imported unchanged with EN/BG host supplements (45 of 47 fixtures); host server-error tests cover literal JSON Pointers, unchanged values, field-specific retraction and example teardown. Native family and production acceptance for the new fixture are in progress.

The additional-errors native fixture passes six EN/BG family cases; demo host tests pass two cases without compiler warnings. All three app and extended-family type checks, touched lint and integration TypeScript checks pass. The last two canonical fixtures add two factory/validator cases and 12 native family cases: normal/native grid pagination, translated grouped headers and job-application edits. All 47 canonical fixtures now pass provenance checking. Production builds for this combined batch pass; scenario results follow below.

The corrected combined production run passes all 24 additional-errors and final-catalog scenarios with no page errors. It covers server actions and field-specific clearing, editor summaries/correction, native grid overrides/grouped headers, and job-application edits across EN/BG, all three families and both hosts. Demo action wiring was corrected in shadcn/Skeleton; tests account for editors retained in hidden tabs and use the installed AG Grid's row roles. The final demo rebuilds pass.

The subsequent catalog registration check passes three family cases. Demo labels and source metadata now come from the pinned generated catalog without freezing locale getters. Provenance includes the catalog hash and rejects missing/unlisted examples. The new source-link UI is checked separately from the preceding production interaction checkpoint.

### Code-editor loading and host integration follow-up

The spec's plaintext default now applies when a string control explicitly requests code presentation without a language. This deliberately broadens the narrower current React tester, which requires a language option despite §18.26's fallback contract. Monaco loading/initialization failures now produce translated feedback and release owned resources; host-supplied worker providers remain authoritative. Focused helper/editor/draft tests and a simulated initialization-failure case cover these changes. Shared and all demo type checks pass; the updated source-link UI and worker behavior join the next consolidated production build.

## Template policy and demo workers — October 10

- Template-owned URL attributes and image URL lists are checked after Ractive DOM updates. Delegated renderer roots are excluded; local updates preserve surviving placeholder identity. Automatic two-way data binding is disabled. Compiled components receive live URL policy. Focused template regressions: 24 passed; shared types and touched lint clean.
- All three Web Component and demo production builds completed. TemplateLayout production acceptance: 12 passed across families, EN/BG and native/Web Component hosts. Monaco acceptance: 12 passed across the same matrix after routing JavaScript/TypeScript to the demo's TypeScript worker. The first run used a stale Skeleton build; only those four cases were rerun after completion.
- Canonical behavior vectors are now copied with pinned revision and a semantic SHA-256 check. Initial helper vectors: six passed. Native enum, tuple, literal-key, layout and pattern vectors pass across the three families.
- The literal-key vector exposed declared-control dot-path aliasing. The shared dispatch boundary now passes five focused cases plus seven readonly/rule/ownership regressions; native literal and referenced nested-object edits pass in all families. The core package check and packaging passed. Broader expression-context and native/Web Component acceptance of the new boundary remain pending.

## Canonical conformance checkpoint — October 10

All 21 behavior vectors now pass in their declared shared/native scopes; see [per-vector results](conformance-results.md). The 154 authoring vectors and 47 example authoring checks pass (201 total), including the two intentional-invalid source cases. Asset provenance checks pass. Native duration acceptance covers EN/BG and existing duration interactions in all families. The eight changed renderer/core packages passed type checking before the final summary-text correction; that correction also passes the shared package check and touched lint. Full production acceptance for the literal-property, duration and summary-text batch remains pending.

## Duration quantities, draft lifecycle and native picker upgrade

- Shared duration parser: 20 cases passed, including quantities above clock-field limits, exact integer boundaries, incomplete prefixes and mixed-week refusal. Three browser lifecycle tests passed for local drafts, pending validity without additional errors, unchanged zero weeks, staged/immediate updates, replacement and readonly.
- Native duration adapters: the original five cases per family passed. Added keyboard/native-selector/staged-cancel and live EN/BG clear-action checks; 21 cases pass across the focused runs. Skeleton's final clear test focuses the input before looking up its focus-only native affordance.
- Canonical unchanged-duration adapter: nine cases passed across three families with EN, BG and a host-provided French catalog.
- Literal dispatch: six browser cases passed, including control-to-layout-to-control replacement. Boundary selection now uses the same immutable props snapshot forwarded to the child; an outgoing control retains a valid scope until teardown.
- The affected shadcn production scenario passed after rebuilding: literal property edits preserve siblings, dynamic UI-schema replacement stays usable, and unchanged `P0W` survives picker confirmation.
- Flowbite temporal clear controls: three native cases passed for live EN/BG accessible names, clearing, empty-state hiding and `clearable: false`. Native CloseButton uses `name`/`ariaLabel`; its default name overrides a raw `aria-label` attribute.
- All 24 production duration/literal-property cases passed across the initial run and targeted reruns. The reruns corrected an assertion racing popover closure and stale copied shadcn Web Component assets. A freshness check now catches stale copies before browser interaction. Later document-context and visual/catalog changes require refreshed artifacts.

## Button fullWidth and document context — October 16

- Spec authoring tests: 49 passed, including boolean/default fullWidth cases and invalid types. Spec validation covers 47 examples, 169 documents and six schemas.
- React Antd/shadcn: two focused native-class transition regressions passed; affected adapter type and lint checks passed.
- Svelte Button: 21 native tests passed across three families, including true/false/omitted transitions.
- Core document/path/catalog checks: eight passed. Shared document-label, Monaco path and duration-draft checks: seven passed. Native duration: 21 passed after catalog and visual refinements.
- Core/shared and all three extended Svelte type checks report zero errors/warnings. Touched shared/adapters/integration lint and integration TypeScript pass.
- Imported canonical Button JSON and the authoring schema include documented working-tree overrides over the pinned spec revision; all 47 example asset hashes match the sibling checkout.
- All three Web Component and all three demo builds passed, with the existing custom-element check warning and bundler warnings. All 36 refreshed production cases passed: Button actions/cell geometry, canonical duration editing, and literal-property/unchanged-duration scenarios across three families, EN/BG and native/Web Component hosts. The refreshed authoring suite passed all 201 cases and provenance checks passed all ten cases. These scoped results do not establish full spec parity.

## Official shadcn Input OTP — October 16

- Replaced renderer-authored Bits UI cell markup with official shadcn Input OTP Root, Group and Slot. Imported the pinned nova component source into both host UI directories, with utility aliases and the registry icon placeholder resolved to Lucide Minus.
- Five focused OTP tests and four ordinary-password tests pass. Coverage includes leading zeros, paste, partial values, invalid imported values, readonly guards, table cells, external replacement, masking, reveal and clearing.
- Shadcn source type check reports zero errors/warnings; touched renderer/test/component lint and formatting pass. Both host component copies match.
- Shadcn Web Component and demo production builds pass. The Web Component retains its existing custom-element check warning.
- All four affected EN/BG native/Web Component production scenarios pass, including valid-code invalid-state removal. The Bulgarian native screenshot was inspected. Flowbite and Skeleton were unchanged and excluded from this targeted production run.
- Consumers must add the app-owned input-otp component; the package installation instructions and changeset record that requirement. Full renderer parity remains open.

## Template data experiment — October 16 (superseded)

- Ractive, direct compiled Svelte and mounted native-template descriptors now use the original-document data context inside literal-property editors and isolated drafts.
- Sixteen focused template browser tests passed. The three new profile cases additionally passed after strengthening them to edit through delegated slot inputs, verifying snapshot isolation, Cancel and Apply with newer sibling data preserved.
- Shared extended Svelte type checking reports zero errors/warnings; touched lint passes and package prepack/publint passes.
- Representative shadcn Web Component and demo builds passed with existing build warnings. All eight EN/BG native/Web Component TemplateLayout and Template/Slot production scenarios passed. Other families were not rebuilt for this shared-only change.
- Superseded by the React-aligned context implementation below. The extra original-document projection was an implementation choice, not a required spec API.

## React-aligned isolated contexts — October 16

- Removed the separate form-document/data-isolation API and its projection helpers. Literal controls now expose their selected value at `core.data`, `scope: "#"` and path `""`, matching the React isolated-property editors. Labels, search and all template profiles read that context directly.
- Detail dialogs retain the existing copy of their current JSON Forms core data. Their isolated validator now matches their schema. Existing parent error mapping, renderer-owned error locations, required presentation, readonly guards, sibling preservation and literal-key clearing remain covered.
- 141 focused tests passed: 21 core cases, 26 shared label/template cases, and 94 native literal-property/aggregate cases (30 Flowbite, 34 shadcn, 30 Skeleton).
- Core and shared extended type checks reported zero errors/warnings. Touched source/test ESLint and formatting passed; both package prepack/publint checks passed. This batch did not rerun full demo/Web Component production builds or the full workspace suite.
- The earlier whole-document projection experiment above is superseded. No second data store is required. Broader spec parity and P1.3 acceptance remain open.

## Literal bracket paths and Button rejection — October 16

- Collection error pagination, shared section indicators, Flowbite stepper feedback and label nearest-item lookup now use the existing JSON Forms data-path parser. Brackets remain literal key characters; `rows[0]` does not become `rows.0`. Explicit segment arrays remain available for already-separated literal dotted keys.
- Thirty focused path/indicator tests passed: twelve core, thirteen shared presentation and five Flowbite stepper cases. Regressions distinguish literal versus nested fields, preserve host feedback under ValidateAndHide, follow external data replacement and exercise native stepper feedback with EN/BG locale configuration and a host translation override.
- Thirty native Button tests passed across Flowbite, shadcn and Skeleton. Nine new cases cover rejected host handlers, registered callbacks and trusted scripts: the platform receives the original rejection, pending clears, duplicate activation is suppressed and retry succeeds. Expected browser rejection events are captured explicitly; production errors remain unswallowed, matching spec §14.1 and the React reference.
- Core, shared extended and Flowbite type checks reported zero errors/warnings. Touched source/test lint and formatting passed. Package output was refreshed; unrelated full workspace tests and demo/Web Component builds were not rerun.
- P1.3 and the remaining Button visual acceptance stay open. This evidence closes these specific cases, not full renderer parity.

## Skeleton splitter bounds — October 16

- Corrected the resize clamp when the configured pane minimums exceed the available container size. Keyboard/pointer resizing can no longer produce negative pane percentages; the active pair preserves its available total.
- Four new mounted tests pass for horizontal/vertical × LTR/RTL, including pointer input, keyboard input, growth back to usable space and preservation of input identity/value. Eight existing extended SplitLayout cases also pass against the refreshed package.
- Skeleton type checking reports zero errors/warnings; touched lint/formatting and package prepack/publint pass. No full workspace or production build rerun was needed for this component correction.
- Component evidence and remaining fixed-dimension, per-pane constraint and Flowbite RTL gaps are recorded in [splitter component review](splitter-native-review.md). P6.10 remains open.

## Flowbite update and RTL split panes — October 16

- Retained the Flowbite Svelte upgrade from 1.31.0 to 1.33.1 across development dependencies and bundled demo/Web Component hosts. Existing compatible peer ranges remain unchanged. The published 1.33.1 SplitPane still lacks RTL deltas; the compatibility action adapts input while retaining native panes and resize state.
- Eleven mounted RTL/LTR splitter cases, twenty mixed-renderer cases, four row-detail cases and eight extended SplitLayout cases pass. The row-detail test clicks the editable input area explicitly to avoid the native clear button in narrow cells.
- Four production Flowbite EN/BG × native/Web Component scenarios pass, including RTL keyboard, real mouse and browser-dispatched touch resizing. Other families were intentionally excluded from this Flowbite-specific run.
- Base type checking, integration TypeScript checking, touched lint/format checks and base prepack/publint pass. Flowbite Web Component and demo production builds pass; the existing custom-element configuration and bundle-size warnings remain.
- Fixed child dimensions, per-pane constraints and remaining family acceptance still keep P6.10 open. This batch does not establish full spec parity.

## Scoped splitter direction across families — October 16

- Expanded the canonical split-layout production scenario to exercise horizontal RTL keyboard, real mouse and browser-dispatched touch input for every family. It exposed PaneForge 1.0.2 reading document direction instead of inherited group direction; all four shadcn scenarios failed before the fix. Skeleton's four scenarios passed.
- Added a shadcn compatibility action that translates horizontal input only when inherited direction differs from document direction. Native PaneForge retains rendering, constraints and resize state. This applies to all uses of the shared shadcn SplitPane, including Shadow DOM hosts.
- Seven mounted cases pass for matching/opposing document and group directions, vertical resizing and live direction changes preserving the input. All twelve family × EN/BG × native/Web Component production scenarios now pass the expanded RTL checks.
- Shadcn type checking, touched ESLint/Prettier, integration TypeScript checking and prepack/publint pass. Refreshed shadcn Web Component and demo production builds pass with existing custom-element/bundle warnings. Unchanged Flowbite and Skeleton production assets were reused.
- Fixed initial pane dimensions, per-pane min/max sizing and vertical/nested production acceptance remain open; React Antd/shadcn references also currently initialize split panes from weights only. P6.10 is still partial.

## Vertical splitter interaction and touch ownership — October 16

- Expanded the canonical split-layout production test to cover vertical keyboard, mouse and browser-dispatched touch resizing under inherited RTL, in addition to horizontal acceptance. It initially failed all four Skeleton scenarios: pointer hit-testing reached the following pane's label instead of the handle.
- Raised Skeleton handles above adjacent content and disabled browser touch scrolling on the resize target. The new mounted hit-area regression and four existing bounds cases pass.
- A new shadcn multi-touch regression reproduced an active pane jumping from 56% to 17% when a second finger restarted the native drag. The adapter now consumes additional touch starts/ends and preserves the original touch identity; cancellation stops the forwarded native drag. All eight direction/touch cases pass.
- After one rebuild per affected host, all twelve family × EN/BG × native/Web Component production scenarios pass horizontal and vertical keyboard/mouse/touch resizing. Flowbite's unchanged assets were reused.
- Shadcn/Skeleton type checking, integration TypeScript checking, touched ESLint/Prettier and both prepack/publint checks pass. Both affected Web Component and demo builds pass with existing custom-element/bundle warnings.
- The sizing review records native API limitations and the still-open fixed, vertical content-based and per-pane constraint work. P6.10 remains partial.

## Complete splitter sizing — October 16

- Completed fixed CSS dimensions, weighted remainder, natural vertical Auto sizing, per-pane minimum/maximum bounds, gap, minItemWidth precedence, cross-axis dimensions, alignment and constrained overflow. Data updates preserve controls and user shares. Responsive stacking restores shares without remounting; removing panes while stacked does not restore obsolete layouts.
- Retained native shadcn Resizable/PaneForge, forwarding its layout API through the styled wrapper and preserving that adaptation in the sync tool. Flowbite 1.33.1 lacks controlled per-pane constraints, so its public Pane/Divider/theme components now use the shared bounded controller. Skeleton uses that controller with its existing styled components. See [the component review](splitter-native-review.md) for the API evidence and rationale.
- 99 mounted browser cases (38 extended sizing, 37 Flowbite base, 10 shadcn base, 14 Skeleton base) and nine allocation unit cases passed. Core, shared extended, all three base/extended families and demo-common type checks passed. Affected ESLint/Prettier and prepack/publint checks passed.
- All three Web Component builds and all three demo builds passed. Existing custom-element configuration, Tailwind sourcemap and bundle-size warnings remain.
- Production acceptance passed **24/24** cases: canonical and supplemental splitter examples across three families, EN/BG and native/Web Component hosts. Coverage includes both axes, RTL keyboard/mouse/touch, fixed/min/max limits, nested keyboard/touch isolation, edited data, resized shares, parent resizing and narrow constrained overflow. No browser page errors occurred.
- Renderer inventory and all 47 imported spec fixtures pass their audits. P6.10 is closed; unrelated renderer parity work remains tracked separately.

## Native detail dialogs and production geometry — October 16

- Migrated Skeleton detail editors to its native Dialog and Portal, including Trigger, Backdrop, Positioner, Content, Title and CloseTrigger. Host portal/root-node resolution supports Shadow DOM. Native modal pointer access survives geometry updates, including maximize/restore.
- Seventeen focused Skeleton component cases pass: two EN/BG geometry cases, four row-detail cases and eleven composite-summary/action cases. Geometry covers initial container focus, drafts, dimensions, local false overrides, viewport changes, reset and Escape/focus return.
- Expanded the canonical table-row-details production scenario to exercise both row and composite-cell dialogs: real pointer resizing, negative drag offsets, all four viewport edges after resizing, maximize/restore, header/footer reachability after viewport shrink, cancellation and focus return. Category selectors retain localized validation-indicator text in accessible names.
- All **12/12** family × EN/BG × native/Web Component production scenarios pass. The same scenarios verify native-table and AG Grid dialogs, sorted row identity and persistent side/bottom panels.
- Skeleton and integration TypeScript checks, touched ESLint/Prettier and prepack/publint pass. Only Skeleton Web Component/demo bundles were rebuilt; both pass with existing build warnings. Flowbite and shadcn assets were reused. P4.12 is closed; other table/grid acceptance remains tracked separately.

## Locale-independent spec catalogs — October 16

- Removed EN/BG-only catalog selection from 31 spec adapters. A shared merge retains every declared locale and applies supplement precedence per message key. Source JSON remains untouched; English supplements now explicitly contain the existing authored text for boolean, string, password and color examples.
- All 104 catalog checks pass: three family-registration cases, 47 EN/BG key/parameter cases, 47 source-data/omitted-input cases and seven trusted-registry cases exercised across families and locale changes. Another 24 example/helper cases pass, including French/German fallback, empty translations, immutable catalogs and own-property handling. All 201 canonical authoring cases pass.
- Demo-common type checking, example ESLint/Prettier and prepack/publint pass. Source provenance and renderer inventory audits pass. This catalog-only batch does not rebuild UI-library bundles or rerun unchanged browser suites. P2.4 is closed; demo-shell translations remain in P1.10.

## Localized demo navigation — October 16

- All three demo headers use the shared JSON catalog for example-menu, form-view, renderer-switch and settings actions. Flowbite also translates theme-color choices and mode tooltips, and supplies accessible names for its form-view and settings buttons. The existing source link uses the same translator. Regional and English fallback use the shared form-catalog policy.
- Two focused catalog cases pass for matching message keys/parameters, regional fallback and unsupported-locale fallback. All twelve family × EN/BG × native/Web Component production scenarios pass: menu interaction, current renderer names, a live locale change through native settings controls, translated source links and persisted locale. No browser page errors occurred.
- All three demo production builds pass, including their Svelte checks. Unchanged Web Component bundles were reused. Demo-common and integration type checks, affected ESLint/Prettier, prepack/publint, source provenance and renderer inventory checks pass. Existing bundle-size and custom-element warnings remain.
- Settings, editors, home/sidebar strings and remaining renderer acceptance are still tracked in P1.10 and P7; this verifies navigation localization only.

## Localized settings and editor actions — October 16

- Flowbite, shadcn and Skeleton settings now use shared EN/BG JSON messages for labels, locale/validation/layout choices, descriptions and keyword actions. Choices update with the locale. Descriptions consistently describe the enabled behavior. Existing native controls and stored option values are retained.
- Editor Reload/Apply titles, tooltips, notifications and object/array diagnostics use the same catalog. Flowbite icon actions now have accessible names. The demo translator returns the supplied fallback or message key when no message exists, while preserving intentional empty fallbacks.
- All twelve family × EN/BG × native/Web Component production scenarios pass. Each changes locale through settings, verifies translated navigation/settings/source text, enters an invalid Config array, checks the localized diagnostic, and successfully reloads and applies the original config. No browser page errors occurred.
- All three demo builds and their Svelte checks pass. Demo-common checking, integration TypeScript, affected ESLint/Prettier, two catalog cases and prepack/publint pass. Renderer inventory and all 47 source-fixture audits pass. Unchanged Web Component bundles were reused; existing build warnings remain.
- P1.10 remains open for editor headings, home/sidebar/theme-picker text and native-component default announcements. P7.2 still tracks broader editor isolation, validation and lifecycle acceptance.

## Localized home, sidebar and theme controls — October 16

- Home-page text, sidebar search names/empty states and theme controls use the shared EN/BG catalog. Flowbite now displays an empty-search result message. Shadcn design-option labels are translated while persisted values and library/font/style identities remain unchanged.
- Flowbite settings uses its native CloseButton with the supported translated `name` prop and disables only the drawer's default close button. Shadcn uses Sheet.Close with the native Button child and disables the wrapper's default English close button. Generated UI components remain unchanged.
- All twelve family × EN/BG × native/Web Component production scenarios pass across the focused runs: four Flowbite and eight shadcn/Skeleton. Coverage includes search and empty results, native theme controls (including shadcn color selection), live locale changes, translated settings dismissal, editor diagnostics/Reload/Apply and the localized home page. No browser page errors occurred.
- All three demo builds and Svelte checks, focused ESLint/Prettier, integration TypeScript, two catalog cases and prepack/publint pass. Renderer inventory and all 47 source fixtures pass their audits. Unchanged Web Component bundles were reused.
- Editor headings and remaining native-component default announcements remain open under P1.10; this batch does not establish full demo or renderer parity.

## Localized editor headings and inference acceptance — October 16

- All three demos translate editor tabs/headings, the combined Demo and Data label, document titles/descriptions and missing-example messages from the shared JSON catalog. Tab values, routes and authored form labels remain unchanged.
- Browser editor selectors resolve accessible names through `helpers/demo-labels.ts`; ten existing suites were updated. The inference error assertion also uses the localized catalog prefix. The helper's intended scope and live-locale usage are documented in `tests/README.md`.
- All 24 production cases pass: twelve inference and twelve shell-localization cases across three families, EN/BG and native/Web Component hosts. Coverage includes every editor tab/heading, missing examples, localized Config diagnostics and recovery, omitted schemas, invalid JSON preserving data, explicit boolean schemas, clearing and reload. No browser page errors occurred.
- All three demo builds and Svelte checks, affected lint/format, integration TypeScript, two catalog cases and prepack/publint pass. Renderer inventory and all 47 spec fixtures pass their audits. Unchanged Web Component bundles were reused; unrelated renderer suites were not rerun for selector-only changes.
- Remaining native-component default announcements and the broader renderer acceptance work remain open in the TODO.

## Localized keyword controls — October 16

- Demo settings use JSON messages for keyword actions and announcements. Skeleton retains native TagsInput with its translations API; a value-change live region compensates for the installed Zag Svelte adapter's nonreactive announcement log. Flowbite uses native Input, Badge and CloseButton because its Tags component exposes no translation hooks. The component review and adapter removal condition are recorded in [demo keyword controls](demo-keyword-controls.md).
- Flowbite and shadcn safely render imported duplicate keywords and remove only the selected entry. Flowbite preserves Backspace editing and prevents keyword removal from dismissing the settings drawer.
- All twelve family × EN/BG × native/Web Component production scenarios pass across focused runs: eight Flowbite/shadcn and four Skeleton. Coverage includes imported duplicates, duplicate rejection, addition/removal, settings containment and live locale changes. Skeleton's translated addition/removal announcements are verified. No browser page errors occurred.
- All three demo builds and Svelte checks, integration TypeScript, affected ESLint/Prettier, two catalog cases and demo-common prepack/publint pass. Renderer inventory and all 47 spec fixtures pass their audits. Unchanged Web Component bundles were reused.
- P1.10 remains open for the remaining native-component messages and announcements; broader renderer acceptance remains tracked in the TODO.

## Password production acceptance and Flowbite OTP geometry — October 16

- Flowbite OTP inputs now sit in fixed-width character containers. This prevents Flowbite 1.33.1's base `w-full` style from expanding each character to the form width while retaining the native Input and existing interaction logic.
- All twelve canonical password scenarios pass across three families, EN/BG and native/Web Component hosts. Coverage includes schema/UI selection, bounded paste with leading zeros, keyboard reveal/hide, independent backup-field masking, clearing, ordinary masked table cells and committed data. Shadcn checks masked slot contents and valid-code error-state removal; Flowbite/Skeleton check compact character-box geometry. No browser page errors occurred. The corrected Flowbite screenshot was inspected.
- Flowbite prepack/publint, Web Component build and demo build pass. The demo Svelte check reports zero errors/warnings; the Web Component retains its existing custom-element warning. Touched ESLint, integration TypeScript, formatting and diff checks pass. Unchanged shadcn/Skeleton bundles were reused, and focused reruns excluded passing Flowbite cases.
- Full theme/narrow-layout, IME and remaining invalid-value/interaction acceptance remain open under P3.6.

## Native password reveal tooltips — October 16

- Ordinary password and OTP controls use each family's native Tooltip with one reveal button. Tooltip text and accessible names share the existing JSON messages and host overrides. Reveal disables with the control and guards synthetic clicks, matching the React reference; it changes no form data. Skeleton positioning and shadcn native event handling are preserved.
- All 31 focused component cases pass across the three families, including real keyboard focus, Bulgarian labels, live French host overrides, unchanged change-event counts and readonly replacement. All twelve EN/BG × family × native/Web Component production cases pass, covering native tooltip visibility, keyboard reveal, paste, clear, compact OTP geometry, masking and table cells. No browser page errors occurred.
- All three renderer type checks, prepack/publint, Web Component builds and demo builds pass. Affected lint/format, integration TypeScript and diff checks pass. Existing custom-element/bundler warnings remain. Heavy builds and final browser suites ran serially.
- Composition input, complete theme/narrow-layout and remaining invalid-value acceptance remain open under P3.6.

## Complete root inference acceptance — October 16

- Extended the canonical inference scenario with numeric, boolean and object root replacement/editing. Exact zero/false values, committed edits and the absent authored-schema distinction are verified alongside the existing string/array/null, explicit boolean schema, invalid JSON and clearing/reload cases.
- All twelve family × EN/BG × native/Web Component production scenarios pass without browser page errors. Fourteen inference unit cases and sixteen mounted JsonForms cases pass, including omitted/explicit schemas, external root-type changes, original false-schema error paths and NoValidation.
- Inspected the installed JSON Forms 3.9.0-alpha.1 generator: its public schema generator still delegates directly to `schemaObject`. The React-aligned wrapped-value adapter remains necessary. No inference implementation or dependency changes were needed.
- Integration TypeScript, focused ESLint/Prettier and diff checks pass. Existing production bundles were reused. P1.4 is closed; generic JSON presentation and recursive-reference acceptance remain separately tracked.

## Presentation spacing and boolean image schemas — October 16

- The canonical presentation scenario now measures default/explicit/zero Spacer heights, assistive-technology exclusion, static separator orientation and native painted-line thickness. Skeleton's native `vr` uses a border within its allocated cell; its geometry assertion respects that implementation.
- All twelve presentation production cases pass across families, EN/BG and native/Web Component hosts. These also retain image visibility/clearing, safe/inert links, external-link rel tokens and recursive metaschema editing coverage. No browser page errors occurred.
- Fixed ImageView's shared scoped-schema check: `false` rejects the source; `true` permits strings. Thirty-four image/URL-policy unit cases and 42 mounted presentation cases pass, including EN/BG diagnostics, live false-to-true replacement and unchanged data in all three families.
- Core type checking and prepack/publint pass. Focused lint/format and integration TypeScript pass. The small boolean-schema resolver correction was verified through unit tests and freshly packaged core in real renderer registries; the production spacing runs reused the preceding UI bundles and do not establish bundled acceptance of that new edge case.
- P6.8 acceptance is completed in the later image diagnostics and literal-scope results below.

## Scoped images and compact native diagnostics — October 16

- ImageView reads literal property segments and checks the actual schema for an empty property name. False schemas reject the source; true schemas allow strings. Reference and composition lookup still delegates to JSON Forms, with an adapter for its skipped empty path segments.
- Literal isolation distinguishes editable Control/ListWithDetail bindings from presentation elements; mixed, tuple and generic array selection requires Control elements. Scope-bearing presentation elements retain their own renderer. Full registry regressions cover normal, dotted and empty property names with false, true, annotation-only, nullable-string and tuple schemas.
- All 63 native presentation cases pass. Coverage includes localized compact warnings, keyboard focus, click access, Escape dismissal, live host translations, authored source precedence and schema/data replacement. The three families use their native Tooltip and button components; bounded descriptions never display refused source payloads. Flowbite and shadcn retain dismissal until a fresh interaction so hover cannot reopen an Escape-dismissed warning.
- All 54 shared image, URL-policy, tuple-selection and translation-catalog cases pass. Existing literal-property aggregate and tuple-control suites also pass across the three families. All six Web Component/demo builds pass. All 36 focused production cases pass across three families, EN/BG and native/Web Component hosts: twelve image diagnostics/policy cases, twelve string-control cases and twelve canonical presentation cases. The image cases also pass with real touchscreen taps, hover, Escape dismissal, bounded native tooltips, live schema/config/data replacement and all five diagnostic codes. No browser page errors occurred. Core and renderer type checks, prepack/publint, affected package lint, formatting, integration TypeScript, the renderer inventory and all 47 source-fixture audits pass.

## Catalog labels for native theme and clear actions — October 16

- Exported theme controls in all three families describe the next light/dark/system action using the renderer JSON catalog. Host labels, including intentional empty labels, remain authoritative; decorative icons have no separate English accessible name.
- Flowbite multiline and free-string suggestion controls retain native Textarea/Input editors and compose native CloseButtons. Flowbite 1.33.1 exposes no label prop for those embedded clear buttons. The adapters supply translated names, preserve readonly clearing policy and restore editor focus without invoking an enclosing dismiss action.
- Six theme component cases, ten Flowbite clear-action cases and the shared catalog checks pass. The twelve production shell-localization cases pass across families, EN/BG and native/Web Component hosts. All twelve expanded string-controls production cases also pass, including translated clearing, restored editor focus and committed edits.

### Literal image scopes and native Select localization

Image source resolution now preserves repeated escaped tildes, literal hash/empty
members and boolean schemas through local references and composition fallback.
The private resolver retains JSON Forms' reference-first lookup and branch order,
uses own members, and terminates recursive references. It does not introduce a
new public form-data API. The 57 focused image, URL-policy and schema-scope unit
cases pass. Full native registries also cover repeated-tilde/hash source keys.
Literal `ListWithDetail` bindings remain editable alongside `Control` bindings;
all 33 list/detail cases pass across the three native families, including repeated tildes and hash keys. Another 29 focused core cases cover editable literal values, required/error state, isolated details, groups and section ownership.

Flowbite Select remains the native component. Its installed 1.33.1 source exposes
`placeholder` and `elementRef`, but hardcodes the embedded clear action label.
A private composition adds the native CloseButton with catalog messages and
restores native select focus. Enum, oneOf and mixed type selection share it.
Cron/duration selectors suppress the library placeholder because they already
provide a translated option; month/year and page-size selectors have no empty
choice. This follows the library's [custom-options and elementRef API](https://flowbite-svelte.com/docs/forms/select).
The eight focused enum/oneOf cases pass in EN/BG, including clear values, focus,
readonly, a host French translator and explicit empty placeholders.

The final focused Flowbite native batch passes 31 select/composition/month/pagination
cases and 18 cron/duration cases. The duplicate-placeholder checks exercise native
option elements. Core and all three base packages pass type checks and package
validation; Flowbite extended and the integration test project also pass type checks.

Skeleton enum, constant-oneOf, composition and mixed-type triggers now use the
native Combobox translations API. All 21 focused native cases pass, including
live BG → EN → French-host translation changes and readonly trigger state without
changing data. The affected package type/lint checks and package validation pass.
All six production Web Component/demo builds pass for the pointer and selector
batch. All twelve object-choice production scenarios pass, including native selection/clearing, exact JSON storage, sibling preservation and Data-editor reapplication. All twelve expanded image cases also pass: six cases in `image-pointer-production-final.log`, the focused shadcn/BG/native case in `image-scroll-regression.log`, and five remaining cases in `image-pointer-production-final-five.log`. All five diagnostic codes, touch/hover/Escape interactions and escaped/reference source cases are covered; P6.8 is closed.

The choice catalog's exact-key supplements pass 108 catalog/choice checks. All
three demo hosts were rebuilt successfully after that catalog update. The later
literal-field i18n-key correction passes all nine mounted core literal cases,
core type/lint checks and package validation; it is included in the successful
six-build text/action production batch below. It derives translations from the same decoded scope
used for the stored value, preserving repeated tildes in default translation keys.

Typed choice identity is accepted under P3.7: 15 shared helper tests, all 27 native
control/cell cases and all twelve production choice scenarios pass. Table cells
exercise every JSON type, distinguish duplicate labels by selected value, retain
parsed object selections and preserve an invalid neighboring row.

### Native text drafts and consuming Button actions

The native String, MultiString and AnyOfStringOrEnum controls now preserve IME
composition, apply schema length limits in Unicode code points and retain the
unchanged suffix/caret when restricting an insertion. Imported invalid strings
remain unchanged on render and can be shortened toward validity. External data
replacement, readonly changes, clearing and disposal cancel queued edits; feedback
from the control's own commit preserves later keystrokes.

- `text-edit-{flowbite,shadcn,skeleton}-final.log`: 19 focused browser cases per
  family, 57 total, passed. These include simulated IME events, supplementary
  Unicode characters, combining sequences, middle insertion, caret preservation,
  unrestricted edits, suggested strings, clear cancellation and commit feedback.
- `text-action-{flowbite,shadcn,skeleton}-tests.log`: 12 native Button cases per
  family, 36 total, passed. Actions resolve pending text without blur, block
  unfinished composition and cancel preparation on disposal. Existing handler,
  callback and script rejection/retry scenarios remain covered.
- `text-pending-core-tests.log`: 14 existing literal-control, dialog and owned-error
  browser cases passed after introducing the root pending-edit scope.
- Core, all three base families and all three extended families passed their
  affected type checks. Library packaging/publint passed. Focused package ESLint
  and integration TypeScript/ESLint checks passed.
- Renderer inventory and spec-example audits still match 179 renderer entry files,
  12 package test inventories and 47 canonical fixture sets.

This does not close mask/OTP composition, OS-specific IME acceptance, all validator
transformation profiles or every consuming-action integration. Those remain in
P3.2/P3.3/P3.6 and P1.5.

All six `text-{family}-{wc,demo}-build.log` production builds passed. They include
the literal default-translation-key correction and the native text/action changes.
The Web Component checks retain the known custom-element compiler warning; demo
bundles retain the known size notices. All twelve String controls production
scenarios in `text-actions-production.log` passed with simulated composition and
supplementary Unicode text in the imported canonical example.

All twelve Button production scenarios also pass in
`text-buttons-production-final.log`. They verify unfinished composition blocks
consumption and completed text reaches the actual action payload without blur,
for all three families, both locales and both host modes. The updated integration
TypeScript and ESLint checks pass.

## Native calendar localization and Button variants

The installed native calendar APIs and the remaining upstream label limitations
are documented in [the calendar review](native-calendar-review.md). Skeleton uses
native translation and focus APIs. Flowbite and shadcn retain their native pickers
with private label adapters; shadcn also translates its shared date announcements
without taking ownership of the upstream announcer.

- `calendar-{flowbite,shadcn,skeleton}-regressions.log`: 55, 55 and 51 focused
  browser cases passed respectively. These include date/time range, staged Apply,
  immediate commits, parsing and live calendar localization.
- Calendar cases cover EN/BG and arbitrary French host translations. shadcn
  additionally covers independent forms and selection that closes the popup;
  Skeleton covers native translation overrides and selected-date focus.
- The three base package checks and packaging/publint passed. Shared message
  tests passed (2 cases); focused package ESLint and formatting passed.
- `native-button-tests.log`: 20 shadcn helper/component cases passed. Semantic
  colors now select native Button variants, matching the React shadcn reference;
  explicit native variant overrides remain supported. The extended package
  type check and packaging/publint passed.
- Integration TypeScript and ESLint checks passed. Renderer inventory and
  example provenance checks still match 179 entries, 12 package inventories and
  47 canonical examples.

All six `calendar-{family}-{wc,demo}-build.log` production builds passed.
`calendar-temporal-production.log` passes all 12 family/locale/host scenarios,
covering localized calendar controls, month navigation without data changes,
shadcn selection announcements, native popup dismissal and the existing temporal
editing/range checks. EN/BG calendar screenshots were inspected for all three
families. The initial Button interaction matrix also passed all 12 scenarios;
palette screenshots identified a Flowbite warning foreground and a Skeleton
Web Component surface utility correction. Their final visual recheck is recorded
below.

This entry does not close the remaining native announcement audit or full spec
parity.

## Pending controls, ordinary passwords and native readonly text

- `password-final-flowbite-tests.log` and `password-final-shadcn-tests.log` pass
  55 and 56 cases respectively. `password-skeleton-guard-tests.log` passes 60,
  including native enum/oneOf selection and typed choices; the separate
  `password-final-skeleton-tests.log` passes 10 password/OTP cases. Together these
  181 cases cover the current source changes.
- Native text/multiline/password tests cover completed and unfinished composition,
  Unicode code-point restriction, caret retention, clear cancellation, external
  replacement and focusable readonly fields without Clear actions. The ordinary
  password uses one shared text debounce; OTP retains its native components.
- Queued-write cases cover readonly/disabled revocation, restoration, data/schema
  replacement, path movement and locale-only updates. Synthetic disabled date
  input cannot mutate data. Both debounce-time checks and Skeleton's deferred
  native Combobox callbacks are guarded.
- `native-choice-capture-tests.log` additionally passes all six enum callback
  cases with authored capture handlers, verifying that the private adapter
  preserves those hooks.
- The three base type checks passed with zero errors/warnings. Focused ESLint,
  integration TypeScript/ESLint and affected library packaging/publint passed.

All six `password-palette-{family}-{wc,demo}-build.log` production builds passed.
`password-palette-production.log` passes all 24 Password/Button scenarios across
three families, EN/BG and native/Web Component hosts. Password cases now include
simulated composition, completed Unicode text and password table-cell edits,
alongside the existing native OTP checks.

All six light/dark Button palette screenshots were reviewed. They show native
keyboard focus rings and the corrected Skeleton surface. Runtime assertions
verify that the Skeleton surface is opaque and changes with mode, and that
Flowbite's default warning label meets a 4.5:1 contrast ratio in both modes.
The Button acceptance item P6.9 is complete. Native OTP composition and the broader
enabled/readonly adapter audit remain open.

## Native OTP composition and Bits UI update

Bits UI is now 2.19.5 in the shadcn renderer, demo and Web Component manifests and
lockfile. `bits-ui-update-regressions.log` passes 67 affected calendar, password,
choice, dialog, destructive-action, boolean and categorization cases; the shadcn
check reports zero errors and warnings. The update retains native components and
does not resolve upstream PinInput's UTF-16 editing behavior by itself.

- `otp-final-flowbite-tests.log` and `otp-final-skeleton-tests.log` each pass 17
  password/OTP cases. `otp-adapter-final-shadcn-tests.log` passes 19.
- `otp-import-{family}-tests.log` adds 15 imported-value preservation cases across
  the three families and one shadcn pre-touch validation case. Together the source
  suites cover 69 current password/OTP cases.
- `otp-action-{family}-tests.log` passes one consuming Button case per family:
  unfinished composition blocks the action and completed text reaches its data
  context without requiring blur.
- Cases cover code-point paste and slots, native keyboard replacement, focusable
  readonly inputs, schema/data replacement, permission revocation, editor removal
  and switching from OTP to ordinary password. No native shadcn component source
  or dependency is patched; the bounded adapter uses native events and slots.
- Core and base package checks and packaging/publint passed. Focused package
  ESLint and integration TypeScript/ESLint checks passed.

`otp-production.log` and `otp-temporal-production.log` each pass all twelve
production scenarios after the OTP adapter and Bits UI update. Final narrow
layout and native readonly production acceptance is tracked below.

## Native readonly fields and OTP layout/focus

- `native-fields-flowbite-tests.log`, `native-fields-shadcn-tests.log` and
  `native-fields-skeleton-tests.log` pass 8, 10 and 8 cases respectively. These
  verify native readonly numeric/masked/temporal inputs, shadcn readonly calendar
  navigation despite conflicting native option bags, and OTP sizing/initial focus.
- `native-readonly-opening-{family}-tests.log` passes one additional case per
  family: applying readonly during a time popup's opening leaves it closed and
  preserves a focusable readonly text input.
- `otp-width-{family}-tests.log` passes the final narrow/wide geometry case per
  family: all six boxes fit beside actions at narrow widths, and wide layouts
  keep actions adjacent to the boxes.
- The three base type checks report zero errors and warnings. Targeted package
  ESLint and integration TypeScript/ESLint checks passed.

All six `native-fields-{family}-{wc,demo}-build.log` builds passed, including
base library packaging/publint. Web Component builds retain their existing single
custom-element compiler warning. `native-fields-production.log` passes all 24
Password/Temporal family/locale/host scenarios. The three English Web Component
password cases also pass with animation-disabled screenshot capture in
`native-fields-theme-production.log`; all six narrow light/dark captures were
reviewed. Six boxes remain visible beside actions, with readable theme colors.
P3.6 is complete; the wider readonly audit remains tracked under P1.13.

## Validator transformations in text controls and cells

`text-transform-{family}-tests.log` passes two real-registry cases per family
(six total). The extended validator trims and uppercases initial and edited
values; the visible input follows the validated value, subsequent edits work,
and sibling values remain unchanged in both form controls and table cells.
Focused ESLint, formatting and all three extended package type checks passed
with zero errors and warnings.

## Boolean readonly native presentation

`boolean-readonly-{family}-tests.log` passes ten cases per family (30 total).
New cases enable separate readonly/disabled presentation, exercise native pointer
and keyboard behavior, and restore editing. Existing typed-value, required-false,
invalid-cell and arbitrary-host-locale cases also pass. The source changes follow
the installed native readonly APIs; unsupported widgets use disabled presentation.
The six production builds recorded above precede this small boolean adapter change.

All three base type checks report zero errors and warnings after the boolean
change. Focused ESLint, Prettier and package/publint checks passed.

## Compact cron and panel actions

The focused initial batch passed 144 source cases covering text editing, row detail,
icon tooltips, cron and AG Grid. Final clear visibility regressions pass in all
three families, including hover outside the field, focus within, clearing and
empty values. Skeleton's complete cron suite passes ten cases with picker bounds.
All three row-detail suites pass four cases each, including right/bottom panel
selection and toolbar action geometry. Focused lint, formatting and extended type
checks pass; extended checks report zero errors and warnings.

All twelve production panel scenarios pass with translated native tooltips and
selection/edit retention. All twelve cron scenarios pass across EN/BG and native/
Web Component hosts: eight Flowbite/shadcn cases in `icon-controls-production.log`
and four final Skeleton cases in `cron-clear-skeleton-production.log`. Checks
cover picker bounds, clear visibility on hover/focus/blur, keyboard clearing,
Apply/Cancel and retained dialect values. Focused clear screenshots were reviewed
for all three families. Six production builds passed; Skeleton was rebuilt after
its picker sizing correction. Web Component checks retain the existing
`options_missing_custom_element` warning; builds succeed.

The final toolbar grouping edit is verified by source browser geometry tests in
all three families. Skeleton's final production build includes it; Flowbite and
shadcn artifacts precede this grouping-only edit and will receive it in the next
integration build. Avoid repeating full builds for each small presentation edit;
follow the [renderer porting checklist](renderer-porting-checklist.md).

## Shadcn row-detail and tab overflow

`shadcn-panel-scroll-tests.log` passes ten source browser cases. Tall right/bottom
details scroll independently inside PaneForge panes, keyboard focus reaches the
last input, and panel height stays bounded. Tab-strip tests cover wide/narrow
widths, no vertical overflow, horizontal overflow when needed and keyboard access
to the last tab. Existing row selection, edits, resize retention and translated
dialog tests remain green. Focused ESLint passes; the shadcn package type check
reports zero errors and warnings. Production build verification is deferred to
the next integration batch; current built demos do not yet contain these fixes.

## Detail/object acceptance and extended permissions

Reference refresh: spec `b9247f0` retains dynamic overlays as a future proposal;
its executable schema change aligns the gap description with the existing 16px
rule. React remains `935122d`. No current `$dynamic` runtime support is claimed.

The detail/object acceptance batch passes 21 shared tests and 22 native cases per
family (66 total). Coverage includes ranked detail lookup, inline/generated/
registered modes, root references, branch details, object frame ownership,
translated direct-only errors and registry cycles. The existing production builds
pass all 24 detail-examples/object-array family/locale/host scenarios without a
rebuild for those unchanged implementations. P4.1 and P4.2 are complete.

The extended permission batch passes 148 native cases across color, duration,
file and null controls. New cases use `separateReadonlyFromDisabled`, inspect
readonly text, cancel pending color/file operations, close duration editing and
restore native editing. Shadcn null uses native checkbox readonly; HTML checkboxes
in Flowbite/Skeleton use disabled presentation. All three extended type checks
report zero errors and warnings; focused lint and formatting pass.

### Batched production checkpoint

All six demo/Web Component builds and base/extended package checks pass after
combining toolbar grouping, shadcn pane/tab overflow and extended permission
changes. This supersedes the earlier artifact-pending notes for these changes.
The existing custom-element compiler and Tailwind sourcemap warnings remain.

All 60 targeted production scenarios pass across three families, EN/BG and native/
Web Component hosts. Final evidence is split across
`parity-checkpoint-production.log` (36 color/duration/null cases),
`parity-checkpoint-collections-production.log` (12 file cases and eight
Flowbite/Skeleton panel cases), and
`parity-checkpoint-shadcn-scroll-production.log` (four shadcn panel cases).
File tests match translated header text while allowing the native resize handle's
accessible label. Panel assertions target visible tabs and verify scrolling to the
last field directly; focusing a textarea alone need only reveal its caret.

Reviewed `shadcn-bottom_panel-scroll.png` and
`shadcn-ag_grid_bottom_panel-scroll.png`: the bottom Notes field is reachable
inside the bounded detail pane. Horizontal tab strips have hidden vertical
overflow; toolbar actions remain grouped. Integration TypeScript, formatting and
diff whitespace checks pass. No full workspace conformance claim is made.

## Color channels and compact text cells

- Color adapters: 14 focused native browser cases per family, 42 total, pass.
  They cover view/save-format separation, reset on opening, alpha editing, hex3
  transparency refusal/repair, invalid imported values, host translations,
  compact cells, readonly and existing platform-picker debouncing.
- All three extended package checks report zero errors and warnings. Focused
  ESLint checks pass for the shared controller/components and native adapters.
- Compact text cells: three real-registry cases per family, nine total, pass.
  IME remains provisional and blocks combined validity; completed Unicode commits
  once, host replacement cancels queued text, readonly remains inspectable, and
  clear preserves sibling fields and rows. Logs: `tests/test-results/text-cell-*.log`.
- All 48 canonical color/boolean/duration/null production scenarios pass across
  three families, EN/BG and native/Web Component hosts. Final results are split
  across `scalar-final-production.log` (boolean/null),
  `scalar-final-color-duration.log` (shadcn/Skeleton color and duration),
  `scalar-final-flowbite-accepted.log` (Flowbite color/boolean/duration), and
  `skeleton-portal-production.log` (updated Skeleton duration/file, eight cases).
  Initial stale test selectors in the first log were corrected and rerun in the
  focused logs; the earlier failed run is not counted as a passing suite.
- Boolean native state/clear tests: 60 pass; duration tests: 30 pass; null tests:
  15 pass. Compact duration drafts preserve pending validity and sibling values.
  Light/dark narrow screenshots cover all four controls. Flowbite clear contrast
  uses native theme variants; Skeleton duration/file resolve the current portal
  root when requested, with 37 focused native tests and eight production cases.
- All three base/extended packages and demo/Web Component builds pass. The known
  custom-element compiler warning remains in Web Component checks. Subsequent
  AG Grid boolean alignment and styled-harness acceptance are tracked separately.

## Registry and role inventory

All seven package registry contracts pass: 186 tests cover 179 entry modules
plus public export and duplicate-registration checks. The three family extended
contracts also check delegated cells and the separately exported lazy AG Grid
entry. The shared extended registry has its own source contract.

The pinned role map covers all 65 audit roles. Its 172 integration tests
verify audit IDs, source/helper paths and entry coverage. The scan is restricted
to package source trees, avoiding installed dependency copies. Logs:
`registry-*-base.log`, `registry-*-extended.log`, `registry-shared-extended.log`,
and `registry-role-map-final.log`. Integration TypeScript passes. These results
establish wiring and inventory coverage, not completion of every renderer's
behavioral acceptance.

## AG Grid and native picker follow-up

All 33 focused native AG Grid, hex3 and canonical row-detail cases pass across the
three families. Boolean widgets stay centered with the clear action at the cell
edge; Flowbite's color trigger uses the updated popup markup. Tests exercise the
native popup and dialog APIs and allow translated tab validation badges. Logs:
`flowbite-grid-final.log`, `grid-final-shadcn.log`, `grid-final-skeleton.log`.
The final production build checkpoint combines these changes with the slider
contract work.

## Masked-input readonly guards

All 36 focused native masked-input cases pass across Flowbite, shadcn and
Skeleton (`mask-readonly-native.log`). The added cases retain stale input/clear
references, enable readonly while preserving enabled controls, and verify that
neither action changes form data. Full mask composition/caret and visual/cell
acceptance remains under P3.3.

## Numeric and slider acceptance

The shared numeric/grid suite passes 21 cases. The three mounted family suites
pass 69 cases, with one additional Skeleton shadow-root regression (70 total).
The latter also verifies visibility, native keyboard commits and retained focus;
its twelve focused cases pass in `slider-shadow-native.log`.

All twelve EN/BG × family × native/Web Component numeric production cases pass:
`numeric-flowbite-production-final.log`, `numeric-final-shadcn-production.log`
and `slider-shadow-production.log`. Narrow light/dark slider screenshots are
reviewed for each family. The demo's default-applying validator intentionally
restores the schema default after clearing; mounted tests separately verify
absence without that host transformation.

The combined base/extended/demo/Web Component checkpoint passes for all families;
Skeleton was rebuilt after the shadow-root correction (`slider-shadow-pack.log`,
`slider-shadow-wc.log`, `slider-shadow-demo.log`). Its subsequent package type
check has zero errors/warnings. Web Component builds retain the previously
recorded custom-element compiler warning. Focused slider/mask lint passes.
The masked-input readonly change is verified at source level; Flowbite/shadcn
production artifacts predate that separate change.

## Mask token diagnostics

Four shared parser cases and all 39 native masked-input cases pass
(`mask-tokens-core.log`, `mask-tokens-native.log`). Invalid regex definitions no
longer throw during rendering; stored data is retained and the diagnostic changes
with the form locale. The parser also covers Unicode and legacy regex escapes,
portable repetition flags, host RegExp values and prototype-looking token names.
These source checks do not replace the remaining P3.3 composition/caret and
production acceptance.

## Masked-input contract acceptance

P3.3 is accepted across all three families. The pure Maska engine now runs through
the shared Svelte text-draft lifecycle; native Input components remain in place.
The field suite passes 51 cases (`mask-lifecycle-acceptance.log`), with three
additional mask-replacement cases (`mask-schema-replacement.log`) and three
real-table cell cases (`mask-cells-native.log`): 57 mounted cases total. The four
parser cases from the preceding checkpoint remain applicable.

All twelve canonical String controls production scenarios pass
(`mask-final-production.log`), covering EN/BG and native/Web Component hosts.
Native keyboard input, composition and exact Data-editor storage are verified;
no page errors occur. Narrow light/dark screenshots are reviewed for each family.

Shared/core and family type checks, scoped lint, package checks and all six
production builds pass (`mask-final-*`). Web Component checks retain the existing
custom-element compiler warning. Integration TypeScript/lint pass after excluding
generated `test-results` and coverage artifacts from source discovery. The source
inventory matches 179 entries and twelve package test inventories. No release or
publishing action was performed.

## Single color popup, compact cron and example-source navigation

All three color adapters now expose the color surface directly in one popover. Pointer/keyboard selection, typed channels, alpha, hex3 rejection, readonly transitions and table cells pass 51 mounted cases (`color-single-*-test.log`). All twelve color production cases pass across EN/BG and native/Web Component hosts. Narrow light/dark images show the inline surface; no browser color input or second chooser is rendered.

Cron uses horizontal rows, native collapsed selectors and inline Every reset icons. All 36 mounted cron cases pass (`cron-compact-*-final-test.log`), including native selection and staged reset/Apply ownership. All twelve production cases pass (`demo-cron-shadcn-production.log`, `demo-cron-final-production.log`): Month mode remains below 440px in height and 360px in width, with Apply/Cancel visible. Flowbite's longer translated placeholder remains on one line and its reset icon is separate from the dropdown arrow. Monthly popup screenshots are reviewed for all families.

All 107 demo-catalog cases pass (`demo-sources-catalog.log`). The public source filter defaults to Spec, includes all 47 canonical examples, and separates prefixed JSON Forms originals. Development fixtures and old direct links remain in the route registry. All twelve source-filter production cases pass, verifying EN/BG controls, search, both hosts and retained form edits while filtering. Native sidebar screenshots cover the requested source/search layout.

Scoped formatting, lint and type checks, package validation and all six production builds pass. Web Component checks retain the existing custom-element compiler warning. The inventory matches 179 renderer entry files and twelve package test inventories. The two demo review follow-ups in TODO are complete; remaining spec-parity items, including searchable-choice production acceptance, stay open.

## Searchable choices and picker review

P3.8 is complete. All twelve searchable-choice production cases pass (`choices-accepted-search-final.log`, `choices-accepted-final.log`), with scoped fixes for native popup exit animations and host data settlement. The demo source cases pass all twelve combinations, including Bulgarian sidebar containment. The catalog has 107 passing cases. Shared string suggestions pass 21 cases; family checks report no errors or warnings.

The picker review passes 42 color and 13 shadcn cron mounted cases. All twelve compact color production cases and four shadcn cron cases pass (`picker-review-*-production.log`), including real mouse-wheel selection of minute 59. Screenshots verify the compact channel row and bounded cron list. Six production builds pass for that batch.

The final text-start and OTP follow-ups use focused verification rather than repeating the full build: the alignment geometry case passes; OTP suites pass 22 shadcn, 19 Flowbite and 19 Skeleton cases, followed by two focused shadcn focus/visibility cases. These latest source changes require the next production build checkpoint before claiming production bundle acceptance.

## Choice-card confirmation and shared dropdown bounds

All 27 mounted choice-card cases pass across the three families, including cancellation on host data replacement and permission revocation, and a fresh selection after cancellation (`cards-confirmation-*.log`). Core check and package validation pass. P3.9 remains open for its remaining acceptance coverage.

The shared shadcn Select bound passes a focused 100-option height and End/Enter selection regression (`dropdown-shared-bounds.log`). The rule applies to all dropdowns in demos and renderers; the broader wheel/touch/keyboard and Shadow DOM audit remains open in TODO. No full production rebuild was repeated for this batch.
