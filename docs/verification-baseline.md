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

At the initial baseline, the root resolved Vite 5 while renderer workspaces used
Vite 7, with a Vitest browser peer mismatch. The October 23 tooling update below
replaces these versions with one shared catalog.

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
array-layout and master/detail renderers in all three families. At this
checkpoint it normalized bare elements containers; that behavior was superseded
by the 2026-10-31 typed-detail checkpoint below. It preserves GENERATE across
delegated fallback Controls.
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

The `spec-additional-items-pagination` production file now passes **24/24**
across Flowbite, Skeleton and Shadcn, EN/BG, and native/Web Component hosts.
It checks the fixed shipment reference after tail deletion, config-disabled
pagination of the second shipment, retained edits across localized tabs,
custom local page size 10, default pagination after removing config, and
last-page deletion moving back to an existing page. This accepts the canonical
example row; wider collection filter/sort acceptance remains separate.

The canonical `spec-property-pagination` production file passes **24/24**
across Flowbite, Skeleton and Shadcn, EN/BG and both hosts. The command matrix
rejects a duplicate rename to `guest-01` while it is on another page, then
renames `guest-06`, adds/removes a new key, and checks the exact stored object
and declared booking reference. The option matrix checks local page size 10,
local precedence over scoped config false, inherited config false, and the
default five-row pagination after clearing config. The spec and React
renderers do not define a separate property filter for this example.

The `spec-collection-pagination` production acceptance now includes a
**12/12** action matrix alongside the previously passing **12/12** paging,
editing and resize matrix. All three families, EN/BG and both hosts show five
and ten visible rows from the authored selector, reveal a newly added applicant
on its page, and reconcile after the last page is emptied. Shadcn exercises
row selection plus Delete selected; Flowbite and Skeleton exercise row Delete.
The final stored applicants match the unchanged source rows after those
deletions. The fixture does not author table filtering or column sorting;
general sort/filter-before-page behavior remains a separate contract check.

The `spec-array-controls` Add/remove bounds case passes **12/12** across
Flowbite, Skeleton and Shadcn, EN/BG and both hosts. With `restrict`, the
single round cannot be deleted, two Add actions create exactly two
`{ "active": true }` items, and Add then becomes disabled at `maxItems: 3`.
The checklist keeps its Add/Delete actions disabled while its fields remain
editable. A failed `reviewers.contains` stays on the array, without projecting
Ajv's candidate-item errors onto the row or its checkbox. The shared unit
suite passes 14/14, and the rebuilt production case passes 12/12 with this
assertion. Other array presentations and error cases are still open.

The `spec-array-controls` expandable production case passes **12/12** across
the same family, locale and host matrix. Speakers start with the first item
open and show data-derived headers and index markers; editing the first name
updates its header and stored data. Announcements start with their panel and
items closed, hide the avatar, and keep a newly added item closed. Existing
table, list-detail, grid and row-detail suites cover related behavior, but
their evidence has not yet been reconciled into complete example acceptance.

The same source example's AG Grid sort matrix passes **12/12** across families,
EN/BG and both hosts. Sorting the `code` column reverses the visible tickets
while leaving their stored array unchanged; AG Grid hides its row-drag handle
while sorted and restores it after clearing the sort. Filtering `code` to one
row also hides the handle, and clearing that filter restores both rows and the
handle without changing the stored array. The sort-clear assertion checks the
header's `aria-sort` state, since ascending order happens to match the original
row order. Handle assertions check visibility rather than DOM removal, matching
React's `suppressRowDrag` behavior.

The authored Sessions row-detail matrix passes **12/12** across the same
families, locales and hosts. Dialog Cancel discards both a Title and nested Room
draft, while Apply commits both; the second session remains unchanged. The
side and initially collapsed bottom panels edit the same stored session
immediately. The staff composite-cell matrix also passes **12/12**: the table
address dialog discards a cancelled street edit, applies a confirmed edit,
and preserves the rest of the staff data. AG Grid's horizontally virtualized
address column is not asserted in that matrix; separate grid-cell tests cover
its renderer registration.

The authored Sessions dialog-geometry matrix passes **12/12** across families,
EN/BG and native/Web Component hosts. Both the row-detail dialog and its
independent Room-cell dialog use their authored widths, move by the header,
resize from the corner, maximize to the viewport and restore their resized
widths. Cancel closes each without committing a draft.

The authored Sessions Table Room-cell case passes **12/12** across families,
EN/BG and both hosts. It verifies the nested `room` stays a summarized column,
opens an independent detail dialog, discards Cancel, and applies Name/Floor
atomically while preserving the sibling session. The existing table reorder/Add
and sponsor ListWithDetail identity suites also pass **12/12** each. The list
suite needed a 15-second case limit for two Skeleton native cases that exceeded
the previous five-second limit; their assertions pass without product changes.

The authored staff grid pagination matrix passes **12/12**. After the table
name edit commits on blur, grid page one shows the new name, page two shows the
unchanged sibling, returning to page one restores the edited view, and the
stored staff order stays unchanged. This covers the example's one-row page
setting and shared data path. The page-size selector offers the authored
`1`, `2`, and `10` choices; selecting `2` shows both staff rows. The matrix
does not exercise every specialized staff popup.

The authored staff phone-number composite case passes **12/12** across the
family, locale and host matrix. Its array-valued cell previews the original
numbers; confirming Clear only changes the dialog draft, Cancel restores the
original summary, and a second confirmed Clear plus Apply commits `[]` for the
first staff member without changing the sibling.

The staff scalar-cell matrix passes **12/12** across the same family, locale
and host combinations. It checks initial age, localized enum selection,
specialized color and duration controls, and the three temporal picker
triggers. Editing age, duration and Active updates stored data while preserving
the sibling staff member. It does not exercise every specialized popup.

The authored staff grid column matrix passes **12/12** across those same
combinations. It verifies the Name and Active columns are 170 pixels wide,
Address and Phone numbers are 240 pixels wide, filtering remains available on
Name but is disabled on Active and both composite columns, and the horizontally
virtualized composite cells show their stored summaries. The remaining
specialized popup interactions still need acceptance.

The staff table date-picker matrix passes **12/12** across families, EN/BG and
native/Web Component hosts. Each renderer opens its calendar from the cell,
selects October 15, 2026, and stores that date for the first staff member while
leaving the second record intact. Web Component calendars remain in their
shadow root. The staff time and date-time picker matrices each pass **12/12**:
advancing the displayed time by an hour advances the stored UTC time, and
selecting the next calendar day advances the stored date-time without changing
the sibling record. The color-picker matrix passes **12/12** after the Flowbite
input adornment fix; a pointer click opens each picker and a Hex edit updates
only the intended staff badge. Full example acceptance still needs the
remaining registry, grid-cell and specialized-editor interactions reviewed.

The staff AG Grid color-cell matrix passes **12/12** across families, EN/BG and
native/Web Component hosts: a pointer click opens the badge picker, and a Hex
edit updates only the first row. The grid date, time and date-time matrix passes
**12/12**, preserving the second row while committing edits through each
specialized cell. The grid role and duration matrix passes **12/12** with a
localized enum selection and a duration edit, again preserving the sibling row.

The staff AG Grid composite-cell matrix passes **12/12** across the same
family, locale and host combinations. Address edits cancel and apply through
the authored dialog, while the phone-number Clear confirmation changes only
the dialog draft until Apply. Both edits preserve the second staff member.
The shared-data matrix also passes **12/12**: a grid Name edit appears in the
normal table, an Active toggle appears in both views, and the stored first row
contains both changes without altering the second row.

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
- The focused grid locale suites now also verify generated column-heading translation and no form-data event during a live language change while preserving sort, filter, page, width and selection. Shadcn passes 3/3, Flowbite 4/4 and Skeleton 4/4. This is native component evidence; the remaining production grid acceptance stays open under P6.6.
- Required grid headings now append `*` for schema-required fields after generated/native column ordering, including nested groups. Root `hideRequiredAsterisk` and per-cell overrides recompute headings on live option changes. Focused header-plus-locale suites pass 4/4 Shadcn, 5/5 Flowbite and 5/5 Skeleton; each extended package check reports 0 errors and warnings. Production grid visual acceptance remains open.
- A row-local server error stays on the same source cell after native sorting, disappears when the row is filtered out, and reappears when filtering clears. The identity suite passes 5/5 in each extended family, alongside its duplicate-row and detail-selection checks. Other grid error presentation and production acceptance remain open.
- The generated AG Grid drag column now follows the React editable guard: it disappears on a live read-only transition and returns when editing resumes. Full command suites pass 27/27 in each family; all three extended Svelte checks have 0 errors and warnings. Authored native drag columns still use `suppressRowDrag`, and production visual acceptance remains open.
- AG Grid's runtime stylesheet is now shared per ShadowRoot and released when its last mounted grid goes away. A host-owned same-ID style remains in place. The mounted lifecycle check passes 1/1 in each family, and all three extended Svelte checks report 0 errors and warnings. Rebuilt extended packages, Web Components and demos pass the 3/3 production reconnect suite, which verifies one style through reconnect, cleanup on removal, a post-reconnect edit, required headings, live readonly drag affordances and grid background changes on light/dark mode. A separate native production matrix passes 6/6 family × locale cases for live light/dark grid backgrounds with the same grid DOM node and no page errors. Full visual acceptance remains open.
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

- Six canonical object EN/BG cases passed through the real base registries: explicit/registered/generated detail ordering, then-current legacy bare-elements compatibility, edits and sibling preservation. The bare-elements expectation was superseded by the 2026-10-31 typed-detail checkpoint below.
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

The 2026-10-29 focused rerun passes **8/8 per native family**. Shadcn's
canonical table assertions now select a row and use the current batch Delete
action; they still verify Cancel/Accept, the local `never` override, target
replacement and readonly invalidation. Flowbite and Skeleton retain their
individual row actions. Composite confirmation and empty-container behavior
pass in all three suites. This confirms the shared composite deletion policy
already recorded here rather than leaving it as a P4.11 blocker.

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

## Choice-card detail acceptance

All twelve canonical Card detail modes production cases pass (`cards-production-final.log`): three families, EN/BG and native/Web Component hosts. They verify generated/registered editor synchronization, keyboard branch selection, cancellation preserving edited data, confirmed switching and subsequent nested edits. Tests wait for native confirmation dialogs to finish closing before interacting with the underlying form.

All ten shared choice-card contract cases pass (`cards-contract-final.log`), including enum precedence over oneOf and generated fallback for unmatched registry modes. Integration TypeScript and scoped lint/format checks pass. These production checks use the existing built artifacts; they do not replace the pending production build checkpoint for the latest source-only confirmation, dropdown and OTP changes. P3.9 remains open for rich presentation policy and broader context acceptance.

## Searchable and multi-select viewport bounds

The shadcn searchable enum popup previously extended to 409px in a 260px viewport.
Both searchable enum and checkbox multi-select popups now cap their complete height
using Bits UI's native available-height variable and a 20rem maximum. The search
field stays visible while the options shrink and scroll; checkbox rows retain their
height. This follows the existing native React compositions (`AntdSelect.tsx` and
shadcn `EnumControl.tsx`) and the installed Bits UI positioning contract; see the
[Popover API](https://www.bits-ui.com/docs/components/popover).

Executed with Node 22.22.0:

- `pnpm --filter @chobantonov/jsonforms-svelte-shadcn test tests/controls/ChoicePopupBounds.svelte.spec.ts tests/controls/SearchableChoices.svelte.spec.ts tests/complex/ArrayChoicesRenderer.svelte.spec.ts`: 27 browser tests pass. Eight new geometry cases cover EN/BG at 360×260 and 1280×720, unchanged data on open, internal scrolling, native keyboard selection of option 99 and exact stored values. Multi-select checks also verify that the final focused checkbox and search field remain inside their containers.
- `pnpm --filter @chobantonov/jsonforms-svelte-shadcn check`: zero errors and warnings.
- Scoped ESLint and Prettier checks pass for the changed renderer sources and browser tests.

The browser runner required local-server access outside the sandbox. The following
production checkpoint completes the host and scrolling verification for these two
shadcn popup compositions; the broader dropdown audit remains open.

### Production checkpoint

- `pnpm build:shadcn` passes, rebuilding the shared dependencies, renderer packages,
  Web Component and demo (`tests/test-results/choice-popup-shadcn-build.log`). Checks
  report zero errors; the existing custom-element compiler warning and bundle
  chunk warnings remain. The runner verifies the demo embeds the current Web
  Component bundle.
- `pnpm --filter @chobantonov/jsonforms-svelte-integration-tests test demos/choice-popup-bounds.spec.ts`:
  all four EN/BG × native/Web Component cases pass
  (`tests/test-results/choice-popup-production-final.log`). Both 100-option popup
  types remain within a 390×450 viewport before and after scrolling. Wheel,
  keyboard and real Chromium touch gestures independently reach and select option
  99 (24 interaction paths). Search remains visible, selection can be cleared or
  removed, and Web Component popups remain in the shadow root. Each path resets
  only the starting scroll position; reaching the last item uses the stated input
  method. Tests wait for controlled data updates before reopening.
- The related `choice-cards`, `choice-selects` and `array-choices` production suites
  pass all 36 family/locale/host cases
  (`tests/test-results/choice-related-production.log`). The same initial run
  identified retained native scroll positions in the new test setup; the corrected
  popup-only run above passes all four cases.
- Integration TypeScript, scoped ESLint, Prettier and `git diff --check` pass.

Reviewed `choice-popup-{single,multiple}-{native,shadow}.png` under
`tests/test-results/`: final options are visible in bounded lists with search above
and trigger below. The test runner now accepts an explicit family list for native
component-specific suites; its default three-family matrix remains unchanged and
is exercised by the 36 related cases. This checkpoint does not claim a full
integration suite, all-dropdown inventory, or light/dark/RTL acceptance.

## Vite 8 and Vitest 5 tooling update (2026-10-23)

The shared pnpm catalog now pins Vite 8.3.5, Vitest 5.0.5, and matching browser
and V8 coverage packages. Compatible Svelte, Tailwind, and static-copy adapters
are aligned across packages, demos, and the workspace root. Node 22.18+ (22.x)
and pnpm 10.28.2 match the React workspace requirements. React currently uses
Vite through Vite+; this change uses upstream Vite and retains the separate Vite+
evaluation item.

Browser render helpers, their callers, and cleanup now await the asynchronous
Svelte testing API. Existing partial text assertions and locator matching are
explicit under Vitest 5. Web Component builds use Rolldown chunk groups and
preserve registration side effects and chunk execution order. Static-copy 4 uses
a recursive file glob and strips only the package directory prefix so demos
retain their existing `/js` entry, chunk, and worker URLs.

The upgrade verification also corrected stale tests for registry membership,
Unicode-safe text restriction, numeric draft restriction, mixed selection timing,
and the custom color picker. Mixed boolean controls center their checkbox and
clear action when the inner control wrapper is hidden.

- Frozen offline lockfile validation passes. All resolved Vite/Vitest instances
  use the catalog versions, with no install-time peer mismatch.
- Workspace lint and type checks pass (the latter includes a focused rerun of
  the three base renderer packages after their final type fixes).
- Core V8 coverage runs successfully with the Vitest 5 provider.
- Renderer inventory and imported-spec provenance audits pass.
- Release packing passes after removing the ignored demo-common version entry
  from 16 mixed changeset headers; publishable entries and descriptions are retained.
  Packed Web Components pass registration, rendering, change, readonly, and asset
  checks for all three families.
- `pnpm build:pages` passes; the three demos and shell were rebuilt again after
  the static-copy fix. Their type checks and the integration TypeScript check pass.
- Final production coverage includes all 40 choice cases, the 12-scenario Pages
  navigation test, and byte-for-byte checks of every copied Web Component file.
  The initial run caught the copy-layout migration and one coalesced-touch test
  failure; the corrected four-case popup suite passes with frame-paced gestures.
- Core, shared extended, Flowbite, and shadcn suites pass (670, 334, 804, and 818
  tests). Skeleton's 787 cases are verified by its full run plus the corrected
  12-case clearing rerun; equivalent clearing reruns also pass for the other families.
- All 4,208 unit/component cases across 15 test workspaces are covered by the
  full matrix and focused corrections. The matrix's six stale-test failures
  (Skeleton clearing and Flowbite shadow-DOM clear-button selectors) pass in
  their final 12-case and two-case reruns. All extended, Web Component, and demo
  suites otherwise pass. Evidence is saved in `tests/test-results/vite8-vitest5-*.log`.
- Browser-component servers still log SvelteKit's `cookie` CommonJS/SSR fallback
  diagnostics under Vitest 5. The production and packed-browser checks pass without
  application errors; these diagnostics do not fail the component assertions.
- Whole-repository formatting still reports 22 existing files outside this
  tooling migration, including imported specification fixtures. Changed files
  are formatted without modifying those pinned fixtures.

### Full integration follow-up (2026-10-23)

The subsequent 704-case integration run reported 11 failures in four suites.
The tree test matched the Bulgarian example search label as well as the five
name fields; its accessible-name expression now anchors the field label and
allows the required asterisk. Container validation retains its zero-marker
assertion with a five-second deadline for debounced validation and rendering.
Cron bounds are measured together in one browser frame. Nested splitter tests
wait for a stable handle before taking their baseline and give touch movement
a frame to process before ending the gesture.

All 48 cases in these four suites pass after the test corrections. Integration
TypeScript, focused ESLint, and formatting checks pass. No renderer changes were
needed. The full 704-case suite was not rerun; its other 693 passing cases are
recorded in the supplied run. A separate repeat of all 24 cron and splitter cases
also passes. Evidence: `tests/test-results/four-fixed.log` and
`tests/test-results/geometry-repeat.log`.

### Choice-card pending edits (2026-10-23)

Compared React Antd and shadcn `controls/ChoiceCards.tsx` and their shared
`jsonforms-react-renderer-common/src/choiceCards.tsx` at
`94808fd6ff8feb9c28363edf32cc54f3ae171311`. Both adapters share the same confirmation
implementation. Spec §18.4 requires data-consuming actions to resolve pending
edits without relying on blur; the input-composition contract forbids treating
unfinished composition as committed data.

Svelte's shared card controller now runs the existing pending-action coordinator
before computing discarded data. It guards duplicate activation and rechecks
permissions, visibility, schema/path and choice availability after preparation.
All three native adapters restore committed selection after a blocked attempt.
No new UI components, messages or authored options were introduced.

All 33 native choice-card cases pass (11 per family), including completed-draft
confirmation, IME blocking, cancellation, retry, exact stored values and unchanged
siblings. Core packaging/publint, focused ESLint/formatting, and all four affected
package type checks pass (zero errors or warnings). Evidence is in
`tests/test-results/card-pending-*.log`. Production demos/Web Components and the Pages shell have now been rebuilt with
`pnpm build:pages`. All 12 choice-card family × EN/BG × native/Web Component cases
pass, including unfinished composition, no-blur completion, Cancel retention and
confirmed synchronized branch detail. Pages navigation and copied-asset checks
also pass. The first integration run exposed an editor-order assumption in the
new assertion; the final test compares both values without relying on their order.
Integration TypeScript, focused lint and formatting pass. The build retains the
three existing Web Component custom-element warnings and has no type errors.
Evidence: `card-production-build.log`, `card-production-tests.log`, and
`card-production-final.log` under `tests/test-results/`. Broader P3.9 acceptance
and the final whole-workspace release gate remain open.

### Destructive branch/type actions and comparable reference tests (2026-10-23)

This bounded parity area covers ordinary oneOf branch selection/clearing and mixed
JSON type selection/clearing, alongside the previously verified choice cards.
Collection mutations and non-destructive tab/tree navigation remain separate
acceptance areas; this does not close all composition or mixed-renderer parity.

The React comparison uses revision `94808fd6ff8feb9c28363edf32cc54f3ae171311`.
Reference paths below are relative to `packages/jsonforms-react-*-renderers/test`;
Svelte paths are under each base family's `tests/complex` directory.

| Reference behavior                                                                            | React tests inspected                                                           | Comparable Svelte tests                                                 |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Inspect the discarded value; honor always/never/complex; confirm clears and preserve siblings | Antd `confirmationRenderers.test.tsx`; shadcn `mixedWorkspace.test.tsx`         | `BranchPendingEdits.svelte.spec.ts`, `MixedConfirmation.svelte.spec.ts` |
| Preserve enclosing properties and change only branch-owned data; retain cancellation          | Antd `combinators.test.tsx`                                                     | `OneOfRenderer.svelte.spec.ts`, `ChoiceCardsRenderer.svelte.spec.ts`    |
| Delegate compatible mixed/scalar composition and avoid single-branch navigation               | Antd and shadcn `mixedComposition.test.tsx`                                     | `MixedRenderer.svelte.spec.ts`, `ScalarComposition.svelte.spec.ts`      |
| Controlled type selection, null and type-specific constraints                                 | shadcn `complex/MixedRenderer.test.ts`; Antd `renderers/MixedRenderer.test.tsx` | `MixedRenderer.svelte.spec.ts`, `BranchPendingEdits.svelte.spec.ts`     |

The new pending-edit tests extend these comparisons for spec §18.4: flush completed
edits before calculating discarded data, block unfinished composition, retry the
same native selection after completion, reject stale data/schema targets and
revoked permissions, and preserve exact sibling values. The tests mount real
registries and native widgets. Svelte mounting, composition dispatch and portal
locators differ from React's act/jsdom setup; behavioral assertions remain
comparable. Native dialog dismissal waits for removal after its transition.

All 204 source-browser cases pass across the three families (68 each), including
54 new cases. Final Flowbite and shadcn reruns verify native controlled-state
corrections; Skeleton's matrix and final 17-case rerun pass. The shadcn fix uses
[Bits UI's fully controlled function binding](https://www.bits-ui.com/docs/components/select#fully-controlled),
verified against installed Bits UI 2.19.5 source. Flowbite's confirmation open state
also remains owned by the renderer so native toggle events cannot revive an
invalidated request. An outgoing oneOf renderer also tolerates replacement by a
scalar schema while its pending confirmation is being removed. Complex oneOf confirmation excludes supported fixed
primitive discriminators, matching the existing choice-card policy.

Evidence: `tests/test-results/branch-pending-families-final.log`,
`branch-pending-shadcn-final.log`, `branch-pending-flowbite-verified.log`, and
`branch-pending-retry-final.log`, and `branch-schema-source.log`. The rebuilt base packages, Web Components, demos and Pages shell pass. All 12 new
production cases pass (each covers both oneOf and mixed actions), spanning three
families, EN/BG and native/Web Component hosts. They exercise actual selector
widgets, cancellation, completion/retry and exact stored data including siblings.
Production fixture setup removes old controls before replacing schemas, scopes
selectors to the form control and locates popup options by their exact labels.
Evidence: `branch-schema-build.log` and `branch-production-passed.log`.

The other 37 production regressions also pass against these final artifacts:
choice cards, combinators and mixed controls (12 cases each), plus Pages navigation
(12 deployment/relocation scenarios in one test). Evidence:
`branch-production-final.log`. That earlier batch also contains eight failures from
the new test's unscoped sidebar/option locators; all twelve new cases subsequently
pass with corrected locators in `branch-production-passed.log`. Thus all 49 targeted
production cases pass across the final runs. Scoped ESLint, integration TypeScript,
formatting, renderer inventory and diff whitespace checks pass.

### Collection deletion and pending edits (2026-10-23)

The shared collection-deletion path now waits for completed edits before evaluating
confirmation, blocks unfinished composition even with policy `never`, prevents
duplicate preparation, and rechecks the owner, schema, permissions, removal limits
and captured data before committing. Stale confirmations close when their target
or permissions change. Native dialog callbacks belong to the request that created
them; composite-cell and tuple-tail adapters forward those callbacks reactively.
Flowbite array-layout dialogs keep an immutable request snapshot through their
outgoing transition, so delayed native events cannot affect a fresh request.

Comparable React coverage was inspected in
`jsonforms-react-antd-renderers/test/arrayDeleteConfirmation.test.tsx` (table,
expandable layout and list/detail deletion, actual discarded values and `never`)
and `jsonforms-react-shadcn-renderers/test/arrayActions.test.tsx` (cancel, confirm,
policy and action constraints). The three new
`tests/complex/CollectionPendingEdits.svelte.spec.ts` suites add 39 cases covering
real table/layout/list widgets, EN/BG completed drafts, cancellation, exact row and
sibling preservation, duplicate activation, unfinished composition and retry,
and data/schema/readonly/disableRemove invalidation. Native Flowbite tests wait for
the dialog element to leave the top layer before retrying after cancellation.

The focused source matrix passes 223 cases: 73 Flowbite, 77 shadcn and 73 Skeleton.
It includes existing table, layout, list/detail, literal-property, additional-property,
canonical array and destructive-confirmation coverage. Six additional sorted
AG Grid batch-deletion cases pass across all three extended families. Evidence:
`collection-all-final.log` (one earlier Flowbite lifecycle failure),
`collection-flowbite-owned.log` (all 13 final Flowbite pending-edit cases pass), and
`collection-grid-source.log`. Core build/type checks pass in
`collection-core-final.log`.

All 61 targeted production cases pass across final runs: 12 new pending-edit cases,
48 existing object-array/property/tuple/destructive-confirmation cases, and Pages
navigation (12 deployment/relocation scenarios in one test). All three families,
EN/BG and native/Web Component hosts are covered. The new test copies the whole
Monaco document before comparing exact data, because its visible DOM is virtualized.
Evidence: `collection-production-build.log`, `collection-production-tests.log`
(49 existing cases pass; the initial new cases attempted to parse only visible
Monaco lines), and `collection-production-pending-final.log` (all 12 new cases pass).
Core and rebuilt base/extended/Web Component/demo packages and Pages shell pass;
scoped lint, integration TypeScript, formatting, inventory and whitespace checks pass.

This completes the shared deletion-coordination area, not the whole collection
contract. Add/reorder actions, other collection navigation, owner-error relocation,
and combined-validity/command gates remain separate acceptance work.

### Ordinary array add/reorder coordination (2026-10-23)

Ordinary tables, expandable layouts and list/detail arrays now use shared pending
preparation before adding or reordering. The action guard blocks unfinished
composition and duplicate preparation, then rechecks schema/path, enabled/readonly,
visibility, options and bounds after completed drafts reach form state. Layout
expansion and list selection follow renderer-owned swaps, including when the
adjacent row is the selected one. New layout rows use the insertion index captured
before dispatch and honor `collapseNewItems`; Flowbite expansion is controlled.

React comparison (revision `94808fd6ff8feb9c28363edf32cc54f3ae171311`):
Antd `test/arrayOptions.test.tsx` covers opening newly added items, preserving
expansion with `collapseNewItems`, and expansion following reorder. Shadcn
`test/arrayActions.test.tsx` covers disabled actions, readonly, and restrict/min/max
semantics. The three `CollectionPendingEdits.svelte.spec.ts` suites now have 37 cases
each, adding 72 cases for add/reorder across real table/layout/list controls.
They check exact data and siblings, no-blur drafts, composition blocking/retry,
duplicate activation, editing the moved row, late permission/schema/option changes,
maxItems with and without restrict, expansion preferences, boundary actions and
cancellation after unmount. The affected source matrix passes 295 distinct cases
(97 Flowbite, 101 shadcn, 97 Skeleton), recorded in
`collection-actions-regressions.log` and `collection-actions-lifecycle-source.log`
(the final focused run passes all 111 pending-edit cases).

Core, base/extended packages, Web Components, demos and Pages shell build successfully.
Evidence: `collection-actions-build-final.log`, `collection-actions-lifecycle-build.log`
and `collection-actions-lifecycle-production-build.log`. Integration TypeScript,
scoped lint, formatting and whitespace checks pass.

The initial production run passed all 36 object-array, row-detail and destructive
confirmation cases. New add/reorder cases exposed test assumptions about default
objects and localized Add selectors; these were corrected without relaxing exact
data assertions. Five pending-edit host checks overlapped the final rebuild and
correctly rejected missing/stale bundles. The final production run waits for all
builds to finish and passes all 25 add/reorder, pending-edit and deployment
navigation cases (`collection-actions-production-final.log`). Together with the
36 unchanged regression cases in `collection-actions-production.log`, all 61
distinct production cases pass across the completed runs.

Scope is ordinary array add/reorder; specialized tuple/property, mixed-tree and
AG Grid commands and owner-error relocation remain separate work.

## Vite+ migration (2026-10-23)

User-authorized tooling migration, separate from renderer parity. Ran the official
`pnpm dlx --package=vite-plus@1.4.0 vp migrate --no-interactive --no-agent --no-hooks --no-editor`
from the workspace root, preserving existing work and editor/agent settings. The
configured local registry refused connections; CLI/install used a command-scoped
public npm registry override. No persistent registry setting changed.

The migrator reported 30 config updates and 700 import rewrites, migrated
Prettier/Oxfmt and ESLint/Oxlint configuration, installed dependencies, and wrapped
Vite plugins with `lazyPlugins`. Its only rule skips were `no-dupe-args` and
`no-octal`, superseded by strict mode. Reviewed pnpm aliases, Vitest/browser/coverage
versions and SvelteKit plugins. Evidence: `viteplus-migration.log`,
`viteplus-install.log`.

Manual workspace reconciliation:

- Expanded the root Oxlint scope to package/app JS/TS; retained explicit migrated
  rules and existing shadcn exceptions without adding unrelated advisory policy.
- Restored package-aware ESLint for Svelte components and rune files, including
  script/template/accessibility rules. Generated outputs remain ignored. Restored
  the existing public-generic ESLint suppression that the migrator renamed to
  Oxlint in a rune file. The first full fallback lint run passed 14 packages and
  identified that one core suppression; the corrected core file passes separately.
- Kept `svelte-check`, TypeScript integration checks, `svelte-package`, shadcn alias
  preservation and `publint`. Generic Vite+ type checking does not replace these.
- Centralized Oxfmt configuration, retained package-specific Tailwind sorting,
  removed standalone Prettier configs/dependencies, and adapted inventory and
  shadcn comparison scripts to `vite-plus/fmt` with explicit formatter-error checks.
- Existing CI command names continue to invoke the migrated tools and the Svelte
  fallback. No publishing, upstream UI replacement or renderer behavior change.

Completed checks: all libraries, Web Components, demos and Pages shell build
(`viteplus-build.log`); release tarballs validate (`viteplus-pack.log`); integration
TypeScript passes (`viteplus-integration-types.log`). `vp check` reports 2,530
formatted files and 1,387 ordinary JS/TS files with no lint warnings/errors
(`viteplus-check.log`). Package-local format resolution, Svelte 5 rune formatting,
47-fixture provenance and 179-entry/12-package inventory checks pass.
The read-only pinned shadcn audit completes and reports differences in 34 components
across two copies (`viteplus-shadcn-audit.log`); upstream parity is not claimed or
changed by this migration.

All 4,379 unit/component/demo cases and 740 integration cases are covered by the
full runs and focused corrections. This is aggregate acceptance, not a claim that
the initial `pnpm test` invocation exited successfully:

- `viteplus-tests.log`: core 670 passes; integration 738 passes and two failures.
  The full production run took 1,103.89 seconds and includes packed Web Components.
- `viteplus-remaining-package-tests.log` and `viteplus-package-tests-rest.log`:
  remaining source workspaces run once, with three failures in the same
  `port-numeric-intent` conformance vector. The old fixtures typed before the
  async type selector committed. They now wait for the actual selected type;
  unchanged data, local-error and document-validity assertions pass in all three
  complete 12-case conformance suites (`viteplus-*-conformance-final.log`).
- `viteplus-choice-production-final.log`: all 12 choice-select scenarios pass after
  screenshot preparation reacquires options replaced by filtering/theme updates.
  The popup touch case remained intermittent with manually dispatched frames.
- `viteplus-popup-touch-final.log`: all four popup scenarios pass using Chromium's
  scheduled native touch gesture with fling disabled. No `scrollTop` assignment is
  used to reach the last item; viewport, search visibility, keyboard, wheel, touch
  reachability and selection assertions remain. A second complete run checks
  stability: all four cases pass again (`viteplus-popup-touch-repeat.log`).

The source-browser `cookie` CommonJS/SSR diagnostics and production build warnings
are retained from the earlier Vite 8/Vitest 5 baseline. No application error was
suppressed and no renderer behavior was changed. The integration reporter is now
explicitly verbose so future long matrices show progress as each case completes.

A cold and unchanged repeat of `vp run --cache --filter
@chobantonov/jsonforms-svelte check` both succeed but report 0/2 cache hits: the
SvelteKit synchronization step modifies tracked inputs, including
`.svelte-kit/ambient.d.ts`. Evidence: `viteplus-cache-check-cold.log` and
`viteplus-cache-check-repeat.log`. Caching is therefore not enabled by default,
and no build-speed improvement is claimed. Configuring stable sync/type-check
task boundaries remains a measured optimization, separate from renderer parity.

## Tuple tail add coordination (2026-10-23)

Bounded scope: P4.9/P1.13 tuple tail **Add**. The shared AdditionalItems controller
now uses the existing collection-action coordinator. It flushes pending drafts,
blocks composing editors, rejects duplicate activation and unmounted/stale-schema
owners, and rechecks readonly, disableAdd and maxItems before constructing the
next array. Existing prefix/default filling and tail initialization remain intact.

Comparable reference scenarios: both React Antd and shadcn
`test/tupleControl.test.tsx`, “the additional items section” (tail-schema defaults,
protected prefix, maxItems/restrict and readonly), plus the portable tuple
validation/pending-edit contract. Svelte tests exercise actual native editors and
commands rather than React test harness implementation details.

Source acceptance: `TuplePendingEdits.svelte.spec.ts` (9 cases per family) and the
existing `TupleControlRenderer.svelte.spec.ts` (29 per family) pass in Flowbite,
shadcn and Skeleton: **114 cases**, including **27 new cases**. New scenarios cover
EN/BG no-blur draft preservation, duplicate activation, IME rejection/retry,
readonly/schema/option changes, unmount and restrict on/off. The initial runs
against the old packaged shared module reproduced seven failures; rebuilding the
shared package with the fix closes them without changing assertions.

Production acceptance: all **12** `tests/demos/tuple-control.spec.ts` cases pass
(three families × EN/BG × native/Web Component). The canonical inspection tuple
blocks Add during IME, appends exactly once after composition ends despite two
activations, and preserves both the prefix draft and the existing tail value.
Existing position edits, complex detail saves and forbidden-tail deletion checks
also pass. No page errors were reported.

`pnpm run build:demo` passes all dependency-ordered library, Web Component and demo
builds, including their Svelte/type/package checks. Integration TypeScript,
changed-file formatting/Oxlint, the shared rune-file ESLint check and diff checks
pass. Existing build warnings remain. Logs are retained under
`tests/test-results/tuple-{shadcn,flowbite,skeleton}-final.log`,
`tuple-production.log`, `tuple-build.log`, `tuple-integration-types.log` and
`tuple-eslint.log`.
This closes only tuple tail Add coordination, not all of P4.9. Property add/rename,
remaining tuple presentation/validation acceptance and other specialized commands
remain separately tracked; the top-level 31 accepted / 54 open count is unchanged.

## Property add/rename coordination (2026-10-23)

Bounded scope: P4.3/P1.13 additional-property Add and Rename in all three native
families. Both commands now use the shared pending-action coordinator. Rename
preparation flushes value drafts before opening the native dialog; submission
blocks name composition and rechecks the source name, proposed name, permissions
and schema owner. Removing the source, replacing the schema or revoking edit
permissions closes the obsolete dialog. Required keys cannot be renamed under
restrict; unrestricted rename preserves the value and exposes the resulting
required-key validation error. Add honors readonly and disableAdd, serializes
activation, and rechecks limits after pending input resolves.

The tests exposed stale additional-property options: calling the reactive options
factory inside a derived expression retained old options. Each adapter now creates
that helper once with a live control getter. Runtime restrict/disableAdd changes
are verified without remounting. Native property-name inputs also honor readonly
independently of disabled presentation.

Reference scenarios were reviewed in React shadcn's
`test/complex/AdditionalProperties.test.tsx`, React Antd's corresponding renderer
and literal-name tests, and the portable additional-property contract (required
key protection, collisions, literal names and value preservation). Svelte browser
checks use actual native editors and dialogs. Skeleton keeps closed dialogs in the
DOM, so the common adapter checks visibility instead of requiring DOM removal.

Source acceptance: **72 cases** pass across all three families, comprising 22 new
`PropertyCommands.svelte.spec.ts` cases and two existing canonical literal-key
cases per family. Coverage includes EN/BG exact-data and sibling preservation,
value/name composition, duplicate activation, readonly/schema/option changes,
source removal, unmount, collisions, maxProperties/restrict and required-key
rename with restrict on/off. A multi-editor regression also verifies unique input IDs
and accessible rename label associations. The first production run exposed duplicate
static IDs in mounted Skeleton dialogs; each adapter now derives the rename input ID
from its owning control. All **12 production cases** now pass across three families, EN/BG and native/Web
Component hosts. The production scenario exercises add during value composition,
one addition after duplicate activation, literal-key draft preservation through
rename, name-composition rejection/retry and unaffected neighboring values.
Skeleton modal assertions include hidden background controls when checking that a
blocked rename has not removed the source.

The complete dependency build passes; after the ID correction, the affected base
renderers, Web Components and demos were rebuilt again successfully. Integration
TypeScript, Svelte-aware lint, focused Oxlint/formatting and diff checks pass.
Evidence is retained in `tests/test-results/property-native-ids.log`,
`property-production-complete.log`, `property-build.log`,
`property-build-final.log`, `property-integration-types.log` and
`property-eslint-final.log`. This closes property command coordination under
P4.3/P1.13; it does not certify every remaining property-schema/validation profile.
The top-level 31 accepted / 54 open count stays unchanged.

## Mixed-tree command coordination (2026-10-24)

Bounded scope: mixed-tree Rename/Delete under P5.4/P1.13 in all three families.
Rename uses shared pending-action preparation, blocks composition, validates names
and rechecks the owner, source and permissions. Delete uses shared destructive
confirmation and pending-edit preparation, including required-key, minProperties
and disableRemove guards. Selection follows literal-key rename and returns to the
parent after deletion; native inline name errors and breadcrumbs have accessible,
translated names. Stale dialogs/rename sessions cannot publish after removal,
schema replacement, readonly changes or unmount.

Production acceptance exposed a separate unrestricted array-detail defect: core
UI generation returns null for an empty schema, and its control mapper substitutes
the root schema when resolving an empty schema at `#`. Shared detail resolution now
supplies a value control and generic control bindings preserve the explicit empty
schema. Missing array-layout item schemas also normalize to unrestricted schemas.
A regression in each family verifies an editable mixed-array item, exactly one
root-only label, and exact-data/sibling preservation.

React reference checks cover common mixed-tree immutable deletion and ordered
rename, Antd mixed selected-type behavior and shadcn mixed renderer selection.
The native Svelte suites exercise those outcomes through actual tree actions,
editors and dialogs, with pending-input and lifecycle coverage.

Verified evidence:

- **117 native cases**: 18 new tree-command cases, 20 existing mixed-renderer cases
  and one unrestricted-array-detail case per family.
- **15 shared detail-resolution cases**, including registry/GENERATE behavior and
  the unrestricted fallback.
- **24 production cases**: new tree-command and existing mixed-control scenarios
  across all three families, EN/BG and native/Web Component hosts. The command
  scenario checks detail/name composition, literal-key rename, declined deletion,
  selection and exact persisted data.
- Shared package, all three base renderers, Web Components and demos build and
  type-check successfully. Existing custom-element compiler and Tailwind source-map
  warnings remain. Svelte-aware ESLint, focused Oxlint/formatting, integration
  TypeScript and diff checks pass.

Logs are retained in `tests/test-results/mixed-tree-native-verified.log`,
`mixed-tree-detail-unit.log`, `mixed-tree-production-final.log`,
`mixed-tree-build-final.log`, `mixed-tree-eslint-final.log`,
`mixed-tree-lint-final.log` and `mixed-tree-integration-types-final.log`.
Earlier diagnostic runs are not acceptance evidence. This closes mixed-tree
command coordination only; compact mixed cells and remaining mixed/recursive
contracts stay open. The top-level count remains **31 accepted / 54 open**.
Next bounded batch: AG Grid commands.

## AG Grid command coordination (2026-10-24)

Bounded scope: Add/Delete/drag reorder under P6.6/P1.13 in all three families.
Add and reorder now use shared pending-action preparation, block active composition
and duplicate activation, and recheck permissions and schema ownership after queued
work. Reorder retains the captured row-key order, resolves source indexes at commit,
and rejects stale targets, suppressed dragging and sorted/filtered views. Add now
honors live disableAdd and readonly state; toolbar Delete and native drag suppression
also reflect readonly. Existing shared deletion confirmation retains selected source
indexes under sorting and cancels obsolete confirmation after data/schema/permission
changes.

The final spec review found that checking only the column-filter model missed quick
filters. The implementation now uses AG Grid's `isAnyFilterPresent()` API, whose
installed contract includes quick, column, external and advanced filters. A quick-
filter regression joins the column-filter and sorting cases. Explicit native drag
columns remain supported.

React reference: common `agGridReorder.test.tsx` checks unsorted movement, sorting
and filtering guards, and native column behavior; Antd/shadcn grid cell/detail suites
supply comparable interaction profiles. Svelte tests use a real grid and native
cells, invoking the installed drag callback for precise lifecycle cases. Production
checks additionally perform a real pointer drag.

Accepted evidence:

- **60 new native command cases**, 20 per family: EN/BG draft-preserving Add,
  duplicate activation, cell composition blocking/retry for Add/Delete/drag,
  multi-index reorder, sort/column-filter/quick-filter/hidden-drag guards, sorted
  source-row deletion, confirmation decline/staleness, live options/readonly,
  minItems/maxItems/restrict, queued owner changes and unmount.
- **49 existing native grid cases** pass across interaction, row detail, paging,
  locale, file and label-summary suites. The full groups passed 35/35/36 before
  the additional quick-filter case; all 60 command cases then passed with the
  final filter guard. These are **109 distinct accepted native cases**, not a
  claim that all ran in a single invocation.
- **12 production cases** pass across all families, EN/BG and native/Web Component
  hosts. They verify composition-blocked Add, pointer reorder, declined and accepted
  deletion, duplicate-suppressed Add and exact stored data with unrelated values
  preserved. Native Skeleton required a five-second post-drag polling budget;
  inspection confirmed correct DOM values, and final exact-data checks remain.
- All three extended renderer packages, Web Components and demos build/type-check.
  Focused Svelte-aware ESLint, Oxlint, formatting, integration TypeScript and diff
  checks pass. Existing compiler/source-map warnings remain.

The old interaction tests issued four Add clicks synchronously; they now await each
completed addition while retaining the original six-row interaction assertion.
Duplicate activation is independently covered by the new suite. The initial shadcn
edit accidentally removed its differently positioned native-option block; that block
was restored before successful acceptance. The draft-7 fixture type and production
row selector were corrected during verification. Failed/interrupted diagnostic runs
are not counted as acceptance.

Evidence: `tests/test-results/ag-grid-command-flowbite-native.log` (explicit success
excerpt), `ag-grid-command-native-remaining.log`, `ag-grid-command-final-targeted.log`,
`ag-grid-command-production-verified.log`, `ag-grid-command-build-verified.log`,
`ag-grid-command-eslint-final.log`, `ag-grid-command-oxlint-final.log` and
`ag-grid-command-integration-types-final.log`.

This closes the bounded grid command batch. P6.6 remains open for its other portable
options, cell/error, native override and packaging acceptance profiles. Overall
progress remains **31 accepted / 54 open** top-level requirements. Next: P1.5 shared
error ownership, automatic subject reassociation and combined-validity gates.

## Monaco diagnostic ownership and pending validity (2026-10-24)

Bounded scope: Monaco publication and asynchronous validation under P1.5/P6.5
in Flowbite, shadcn and Skeleton. Diagnostic requests now belong to a model,
content version and logical target. Obsolete results cannot clear or publish
errors for the current target. Participating JSON, JavaScript/TypeScript and
CSS/SCSS/LESS validation exposes pending state, including initial validation;
worker failure publishes localized failure feedback rather than confirmed validity.
Monaco's installed HTML-family worker has no validation method and retains its
existing marker behavior. Publication remains opt-in and preserves host errors.

External value, target and schema replacements receive separate model URIs,
while retaining the editor instance and selection. Ordinary edit feedback retains
the model and input DOM. A reliably matched same-object move preserves an invalid
draft and republishes at its new pointer; distinct equal-content targets invalidate
old callbacks. Reconciliation waits for settled data/path bindings. This does not
claim automatic identity for primitive or duplicate collection entries.

Installed Monaco drops marker model-version metadata and does not notify empty
results when no marker changed. Direct versioned worker requests therefore provide
the completion signal. A native regression also exposed a reactive validation loop:
validity publication re-triggered validation of unchanged input. Validation now
tracks explicit input/configuration and does not track host callback reads.

React reference: Antd `monacoAdditionalErrors.test.tsx` and the shadcn Monaco
publication/action tests cover opt-in summaries, host-error coexistence, invalid
JSON and schema-aware suppression. Svelte acceptance uses real native editors
and workers, with controlled worker promises for deterministic stale-result cases.

Accepted evidence:

- **23 shared browser tests**: 11 editor/model/real-worker tests, eight draft and
  publication tests, and four controlled asynchronous generation/failure/disposal
  tests. These include no false-valid state during pending reassociation, scoped
  schemas, model isolation, host errors and preservation of own edit feedback.
- **12 native renderer tests**, four per family: existing localized editing and
  mixed-code behavior plus EN/BG target replacement, stale marker rejection,
  exact data preservation and recovery.
- **24 production scenarios**: code-editor and additional-errors matrices, each
  covering three families, EN/BG and native/Web Component hosts.
- Shared extended, three extended renderer, three Web Component and three demo
  builds pass. Final native type checks, Svelte-aware ESLint, Oxlint, formatting
  and diff checks pass. Existing icon prebundle/compiler warnings remain.

Logs: `tests/test-results/monaco-ownership-shared.log`,
`monaco-ownership-flowbite.log`, `monaco-ownership-other-families.log`,
`monaco-ownership-production.log`, `monaco-ownership-shared-build.log`,
`monaco-ownership-host-build.log`, `monaco-ownership-native-types.log`,
`monaco-ownership-eslint.log`, `monaco-ownership-oxlint.log` and
`monaco-ownership-format.log`. The shared-build log also records an initial
native-test declaration failure, subsequently fixed and verified by the host-build
and final native-type logs; that failed native attempt is not acceptance evidence.

This closes the bounded Monaco diagnostic lifecycle batch. P1.5 remains open for
collection target reassociation, other producer lifecycles and remaining combined-
validity/submit gates. P6.5 retains its remaining editor profile acceptance.
Top-level progress remains **31 accepted / 54 open**; do not reopen this batch
merely because those parent requirements are open.

## Duplicate row-detail selection identity (2026-10-24)

The P1.5 collection identity audit found that shared row-detail selection used
`indexOf` and unchanged-index equality to identify an occurrence. After an external
deletion, two equal primitives or repeated references could therefore transfer
selection to another item. The shared helper now invalidates that ambiguous
selection. Unique-object reorder and deletion of an earlier item retain selection;
ordinary immutable editing of the selected row retains the existing behavior.
Equal display labels do not establish identity.

This is a bounded selection fix used by native tables and AG Grid, not completion
of automatic error-owner reassociation. Array layout renderer instances are still
keyed by paths, and AG Grid's row-key matcher still has positional fallback and
duplicate occurrence matching. Those mechanisms need explicit operation identity
before they can establish ownership for primitive/duplicate targets. Do not use
this selection helper as proof that an arbitrary external row replacement is the
same logical error target. File-size publication is also a separate producer to
include in the remaining P1.5 audit.

React reference: common `src/rowDetail.tsx` preserves immutable selected-row edits
and follows references on moves. It has the same first-match duplicate ambiguity;
Svelte follows the specification's no-guessing requirement for this additional case.

Verified: **10 shared identity unit tests**, **20 native row-detail tests** across
Flowbite/shadcn/Skeleton, and **six AG Grid row-detail tests**. New native tests open
the second duplicate's detail pane, externally delete one occurrence, and verify
that the editor and current-row marker are removed. The detail pane itself remains
with its existing empty-state prompt. Core packaging/publint, core and three-family
type checks, focused Oxlint, Svelte-aware ESLint, formatting and diff checks pass.
No new production matrix is claimed for this helper-only fix.

Evidence: `tests/test-results/row-identity-unit.log`,
`row-identity-native-final.log`, `row-identity-grid.log`,
`row-identity-core-pack.log`, `row-identity-types.log`, `row-identity-lint.log`,
`row-identity-eslint.log` and `row-identity-format.log`. Top-level requirements
remain **31 accepted / 54 open**.

## Collection occurrence ownership: tables and array layouts (2026-10-24)

The form now keeps occurrence ids outside business data and UI schemas. Core
add/remove/move metadata is checked against the actual resulting data before ids
are retained. This distinguishes equal primitive occurrences and survives core's
deep cloning of array rows, including nested collections. Explicit descendant
edits retain their containing rows. Mismatched command results fall back to
conservative reconciliation; external replacements match only unique object
references, never labels, duplicate values or position alone.

`useJsonFormsArrayControl` exposes `control.rowKeys`. All three native table and
array-layout implementations now key their row instances by those ids and provide
`CollectionItem` context to nested editors. Monaco uses that context plus its
relative field path to retain invalid drafts and diagnostic ownership through
reliable moves. Removed/replaced occurrences dispose their owners. Current-pointer
publication and pending reassociation preserve host errors and reject obsolete
callbacks. This closes the path-keyed instance gap for these six implementations.

A Flowbite regression exposed competing native and renderer-controlled accordion
selection during external row replacement. The renderer already enforces one open
row; native shared-selection feedback is now disabled while controlled expansion
and collapseNewItems behavior remain covered. Tests were not weakened: the
identity cases compare actual DOM node references, and existing expansion
assertions remain unchanged.

Reference behavior: React common row-detail and array command implementations
supply immutable edit/reorder profiles; installed JSON Forms core action metadata
provides explicit occurrence operations. The specification's logical-target and
no-guessing rules govern duplicate and external-replacement behavior.

Accepted evidence:

- **690 core tests pass**, including eight new occurrence-store tests using the
  actual core reducer, verified command mapping, nested clones, duplicate values,
  external matching and changed middleware results.
- **16 new shared Monaco collection cases** cover object and primitive targets,
  move/deletion/replacement, with and without host errors. They assert retained
  drafts, disposal, stale callbacks, pending validity and absence of old error
  paths in settled events. Eight existing draft tests also pass.
- **135 native cases** pass (45 per family): 24 new table/layout identity cases
  plus 111 existing collection pending-command cases. New cases compare mounted
  node identity through local moves/deletion and external replacement/reference
  matching, with exact data assertions.
- **36 production scenarios** pass: collection-actions, collection-pending-edits
  and code-editor, each across three families, EN/BG and both host types.
- Full `build:demo` succeeds, including all libraries, Web Components and demos,
  with package/type checks. Focused Oxlint, Svelte-aware ESLint, formatting and
  diff checks pass. Existing build warnings remain.

Evidence: `tests/test-results/collection-identity-core-full.log`,
`collection-identity-monaco.log` (initial collection/draft group),
`collection-identity-monaco-path-events.log` (final 16-case matrix),
`collection-identity-native-verified.log`, `collection-identity-production.log`,
`collection-identity-build.log`, `collection-identity-lint.log`,
`collection-identity-eslint.log` and `collection-identity-format-check.log`.

P1.5 is still open. Next consumers are list/detail, AG Grid, specialized tuple and
mixed collections, plus file-size publisher lifecycle and remaining validity gates.
The earlier duplicate-selection helper is not sufficient identity evidence for
those consumers; they must use explicit occurrences or invalidate ambiguous
results. Do not reimplement the accepted table/layout identity batch. Top-level
progress remains **31 accepted / 54 open**.

## List/detail occurrence ownership and primitive applicability (2026-10-24)

ListWithDetail now selects the form-owned occurrence key in all three families.
Local reorder and deletion of earlier items preserve the selected editor; removing
the owner or an ambiguous external replacement clears selection. Reinserting a
removed occurrence does not resurrect a retired selection. Reliably matched
external object references retain selection; primitive external replacements do
not guess which occurrence survived. Detail dispatch is keyed by the selected
occurrence and supplies CollectionItem context to nested publishers.

Nested horizontal/vertical layouts use their containing occurrence identity
instead of its changing absolute path for child keys. This prevents field and
Monaco model remounts while a retained row moves. List testers now claim primitive
arrays as well as objects, matching Antd's explicit primitive-array contract.
Error indicators use exact row data paths with a segment boundary: Flowbite no
longer compares JSON Pointers with data paths, and row 1 cannot match row 10.

React references: Antd `test/renderers/ListWithDetailRenderer.test.tsx` and
`src/additional/ListWithDetailRenderer.tsx` cover primitive applicability and
selected-index adjustment after deletion; shadcn `test/listWithDetail.test.tsx`
covers nested detail delegation. Svelte adds occurrence/instance assertions for
reorder, ambiguous replacements, exact indicator routing and live diagnostics.

Accepted evidence:

- **255 native cases**, 85 per family: 87 new list identity/indicator cases and
  168 existing list, pending-command and table/layout identity regressions. The
  new matrix covers object and primitive items, EN/BG, move, earlier/owner
  deletion, external replacement/reference movement, edit, append, reinsertion,
  exact saved data and actual retained DOM references.
- **Six real-Monaco list cases**, EN/BG per family: duplicate primitive rows,
  unchanged editor model through reorder and non-owner deletion, errors at the
  current pointer, disposal after owner deletion and preserved host errors.
- **36 production scenarios** across three families, EN/BG and native/Web
  Component hosts: 12 new list/detail cases plus the existing collection-actions
  and collection-pending-edits matrices. New cases verify declined/accepted
  deletion, preserved selected editor and pending draft, exact stored data and
  clearing the detail when its owner is deleted.
- All three base packages, Web Components and demos build. Extended-package
  type checks, integration TypeScript, focused ESLint/Oxlint, formatting and diff
  checks pass. Existing build/prebundle warnings remain.

Initial failures exposed the primitive tester gap and path-keyed nested editor
remounts; both were fixed without weakening identity assertions. The new fixtures
use UISchemaElement for the non-Control ListWithDetail type. The first production
attempt needed to reopen the list category after returning from the host Data tab;
that navigation was corrected before the final passing matrix. Diagnostic runs
are not acceptance evidence.

Logs: `tests/test-results/list-identity-native-verified.log`,
`list-identity-monaco.log`, `list-identity-production-final.log`,
`list-identity-build-verified.log`, `list-identity-extended-types.log`,
`list-identity-integration-types.log`, `list-identity-eslint.log`,
`list-identity-lint.log`, `list-identity-production-lint.log` and
`list-identity-format-check.log`.

This closes list/detail occurrence ownership and primitive applicability under
P1.5/R33. Remaining R33 acceptance is recorded in the renderer audit; the next
identity consumer is AG Grid, followed by specialized collections and other error
producers. Top-level progress remains **31 accepted / 54 open**.

## AG Grid occurrence and detail ownership (2026-10-24)

Accepted bounded scope under P1.5/R28: all three AG Grid adapters use the shared
form occurrence keys instead of independent positional heuristics. Local moves,
adds and deletion of other rows retain cell/detail editors; removing or replacing
the selected owner clears its detail and diagnostics. Reliable external object
reference moves retain ownership; equal-content replacements do not inherit it.
Shared native/grid detail panels pass collection context to nested renderers.
Replaced native table occurrences dispose their isolated dialogs, requiring
reopening rather than permitting stale Apply.

Grid row wrappers remain stable for validation-only updates. Updating native row
data explicitly refreshes retained cells even when their values have not changed:
a moved occurrence must bind its new source path. Production pointer tests exposed
this missing refresh; the final fix is applied to all three adapters. The native
regressions now check both the immediate distinct moved value and a subsequent
write to its new row, alongside DOM identity.

Comparable React references reviewed: common `rowDetail.tsx`, both Antd/shadcn
`agGridRowDetail.test.tsx`, and extended `agGridReorder.test.tsx` (renderer identity,
drag restrictions, source-row details and staged edits). Svelte adds real-grid
occurrence and real-Monaco model/error assertions for duplicate rows.

Verification:

- Core: **690 tests**, including explicit operation identity and conservative
  external matching. Native table details/toggles: **20 tests**.
- Extended native grid suites: **84 tests** (28/family): commands, row details,
  four new occurrence cases and two real-Monaco cases per family. These verify
  retained models, moved error paths, owner disposal and preserved host errors.
  The obsolete private grid identity helper/test is removed; shared operation
  identity tests and actual grid consumers replace its positional assumptions.
- Production: **24 distinct passing cases** across both locales, all families,
  native and Web Component hosts. The full matrix's final Flowbite/Skeleton
  cases pass; after correcting the shadcn adapter, all eight shadcn cases pass in
  a targeted rerun. Do not count the overlapping reruns as extra scenarios.
  Pointer drag checks stable row IDs and the same input DOM node with correct
  moved values; command cases also assert exact stored data and confirmation.
- Full package/demo build passed, followed by affected extended/Web Component/demo
  rebuilds for the cell refresh fix and a final shadcn-only rebuild. Type checks,
  integration TypeScript, focused ESLint/Oxlint, formatting and diff checks pass.
  Existing compiler/bundler warnings remain.

Diagnostic failures are not acceptance: the first Skeleton fixture omitted its
stylesheet; an initial production run exposed unchanged-value cells retaining old
paths; the first refresh edit missed shadcn's differently structured effect. Each
was corrected and covered before accepting this batch.

Logs: `tests/test-results/grid-identity-core.log`,
`grid-identity-native-details-final.log`, `grid-identity-native-final.log`,
`grid-identity-production-final.log` (Flowbite/Skeleton acceptance and the superseded
shadcn failures), `grid-identity-production-shadcn-final.log` (all eight final
shadcn cases), `grid-identity-build.log`, `grid-identity-rebuild-final.log`,
`grid-identity-shadcn-build-final.log`, `grid-identity-eslint.log`,
`grid-identity-eslint-final.log`, `grid-identity-shadcn-eslint.log`,
`grid-identity-tsc-final.log`, `grid-identity-lint-final.log` and
`grid-identity-format-final.log`.

Top-level progress remains **31 accepted / 54 open**. This closes the grid and
shared detail occurrence batch, not the entire P1.5/P6.6 contract. Next: specialized
collection/error-producer reassociation and remaining combined-validity gates;
remaining grid options, locale/theme and visual acceptance stay in R28.

## File metadata lifetime and grid-cell reactivity (2026-10-24)

Two concrete lifecycle defects are closed under P1.5/P6.3/R24/R28:

- Selection-time file-size metadata is discarded once its encoded value leaves
  the control. A later imported equal string does not inherit the removed
  attachment's error. Retained values still preserve metadata across reordering;
  unrelated host errors remain untouched. Six new scalar/array regressions cover
  this across all families. Both Flowbite cases failed before the helper fix.
- AG Grid cell components mount in a microtask independently of the parent Svelte
  reactive effect. A cell initialized during a paused/retiring tab effect must
  remain reactive to later asynchronous file feedback. Scheduled mounts use the
  latest refreshed props and skip cells destroyed before the microtask runs.
  This fixes the shadcn Web Component's missing compact file-count rejection:
  the file handler published feedback, but the cell's rendering effects did not
  update. The final production scenarios verify the visible feedback and keyboard
  inspection after switching from table cells to AG Grid.

The file contract was checked against spec sections 15.5–15.6 and 18.18.4:
subject replacement must not revive stale owned errors, and imported values must
not claim selection-time byte validation without retained metadata. React Antd
`fileRejection.test.tsx` and shared file-array scenarios remain behavioral
references for rejected selections preserving committed data.

Verification:

- **181 native browser tests**: Flowbite 61, shadcn 60, Skeleton 60. These combine
  file controls/cells/grid values with grid occurrence identity, commands,
  row details and real Monaco ownership. The file-only subset has 97 cases,
  including the six new metadata regressions; do not add overlapping counts.
- **36 production cases pass in one final run**: file controls, grid commands and
  row details, across all families, EN/BG and native/Web Component hosts. These
  verify visible compact feedback, retained attachment data, pointer drag with
  stable DOM identity, exact command data, and detail interactions. Metadata
  removal/reinsertion itself is asserted by the native tests, not inferred from
  the production scenario.
- Shared extended type checking and packaging pass. All affected extended
  packages, Web Components and demos build. Focused ESLint/Oxlint, formatting
  and diff checks pass; existing build warnings remain.

The first production file run exposed the two shadcn Shadow DOM failures.
Diagnostic builds and traces are not acceptance evidence and their logging was
removed. A focused rebuilt case passed before the final all-family matrix.

Logs: `tests/test-results/file-ownership-native-final.log`,
`file-ownership-production-final.log`, `file-metadata-check.log`,
`file-metadata-pack.log`, `file-independent-shadcn-build.log`,
`file-independent-other-build.log`, `file-metadata-eslint.log`,
`file-metadata-lint.log`, `file-grid-eslint.log`, `file-grid-lint.log`, and
`file-ownership-format.log`.

Top-level progress remains **31 accepted / 54 open**. The next ownership audit
covers specialized collections and file owners within them, then remaining
combined-validity/submit gates. This checkpoint does not close the full file
profile or all of P1.5.

## Literal additional-property error ownership (2026-10-24)

Accepted bounded scope under P1.5/R30: dotted and empty additional-property names
now use the existing parent-scoped `LiteralControl` adapter through dispatch,
rather than constructing a separate `JsonForms` value form. The adapter maps
owned errors/pending state to the parent store and maps parent host errors back
to the literal field. It preserves nested literal pointer segments, root schema
references, sibling data and dynamic property keys on Clear. The redundant
manual literal-value change handlers are removed from all three families.

The original Flowbite regressions demonstrated missing parent file errors for
both a dotted name and an empty name; a slash/tilde name already passed. The
final tests also cover a literal parent containing a slash-bearing child,
field-specific host error display, pending reads, exact stored values, clearing
only renderer-owned errors, and preserving host errors after target removal.

Reference behavior: spec sections 15.5–15.6 and the literal property contract;
React common `additionalPropertyName.ts` plus Antd `additionalPropertyNames.test.tsx`
and shadcn `complex/AdditionalProperties.test.tsx` establish exact key editing and
rename behavior. The Svelte parent-validity tests cover the error integration
explicitly rather than assuming a value-rooted editor publishes to its parent.

Verification:

- **199 base browser cases**: literal and bracketed keys, pattern constraints,
  referenced schemas, additional-property examples and commands (65 Flowbite,
  69 shadcn, 65 Skeleton).
- **100 extended browser cases**: file control behavior plus four new literal
  ownership cases per family (34 Flowbite, 33 shadcn, 33 Skeleton).
- **24 production cases**: twelve new literal-file ownership cases and twelve
  additional-property scenarios across all families, EN/BG and native/Web
  Component hosts. The new scenario configures the canonical inference demo via
  its public editors, verifies the parent validation indicator on oversized
  uploads under dotted/empty keys, clears errors, and checks exact data with both
  keys retained. Existing scenarios cover editing, Add, Rename and pending edits.
- All base packages and all Web Component/demo hosts build. Extended package
  type checks, integration TypeScript, focused ESLint/Oxlint, formatting and diff
  checks pass. Existing build warnings remain.

Older property tests used fixed rename-dialog IDs and, in Skeleton, edited the
still-hidden dialog before its opening transaction completed. They now use the
per-instance ID suffix and wait for visibility, as the accepted command tests
already do. A JSON Schema draft-union annotation was corrected during type
checking. Intermediate failures are not acceptance evidence.

Logs: `tests/test-results/literal-owner-base-final.log`,
`literal-owner-extended-final.log`, `literal-owner-production-final.log`,
`literal-owner-build-final.log`, `literal-owner-integration-types.log`,
`literal-owner-eslint.log`, `literal-owner-lint.log`, `literal-owner-format.log`.

Top-level progress remains **31 accepted / 54 open**. Literal value error
integration is closed; property-rename identity, tuple-tail subject ownership and
remaining combined-validity gates remain next in P1.5. This does not claim full
R30 or tuple acceptance.

## Property rename identity, errors and focus (2026-10-24)

Accepted bounded scope under P1.5/R30: confirmed local additional-property
renames preserve the mounted editor, selection-time file metadata, owned errors
and focus across all three families. A component-local occurrence store transfers
identity only after the local mutation succeeds. External rename/removal is not
inferred from equal values, and old rendered identity snapshots remain immutable.

All additional-property values now use the same parent-scoped value adapter,
including ordinary-to-literal and literal-to-ordinary renames. Property metadata
is derived synchronously from current data; the previous effect-delayed metadata
briefly exposed a missing value during rename and discarded file metadata.
Explicit stable identity lets the adapter relocate owned errors to the new JSON
Pointer without moving host-supplied errors. Owner registration remains callable
outside component initialization, and component teardown releases scoped owners.

Rename actions restore focus to the surviving trigger. Flowbite restoration runs
after the dialog's outro; the modal lifetime follows the active rename and uses
the native cancel event. The production consecutive-rename test exposed a modal
that remained visible after a successful rename; this is corrected and covered.

Comparable reference cases are React Antd `additionalPropertyNames.test.tsx` and
shadcn `complex/AdditionalProperties.test.tsx`; the spec additionally requires
logical rename identity/focus and owner-scoped error relocation. New native tests
exercise ordinary, dotted and empty names in EN/BG, actual file-input identity,
exact data, unchanged host errors, moved producer errors, no intermediate loss of
producer errors, and restored focus. Production cases perform two consecutive
renames using Enter, retaining an oversized-upload error and the original input,
then clear each value and verify exact parent data.

Verification:

- **694 core tests** pass, including four property-identity cases and the existing
  literal-owned-error API regression.
- **199 base cases** pass across all three families; Flowbite's 65 cases pass again
  after the modal lifecycle correction.
- **124 extended cases** pass (42 Flowbite, 41 shadcn, 41 Skeleton): file controls,
  literal ownership and eight rename cases per family. Flowbite's twelve focused
  ownership cases also pass after the final modal change.
- **24 production cases** pass in one clean final run: additional-property and
  literal-file/rename scenarios across all families, EN/BG, native/Web Components.
- Core/base and integration type checks, package generation, all Web Component
  and demo builds, ESLint/Oxlint, focused formatting and diff checks pass.
  Existing host build warnings remain. Intermediate failures are superseded by
  the final evidence, not counted as acceptance.

Logs in `tests/test-results`: `property-core-final.log`, `property-base-final.log`,
`property-flowbite-base-final.log`, `property-extended-final.log`,
`property-flowbite-dialog-native.log`, `property-production-final.log`,
`property-check-final.log` (core/Flowbite success; initial shadcn type failure),
`property-check-remaining.log` (corrected shadcn/Skeleton/integration success),
`property-flowbite-check.log`, `property-pack-final.log`,
`property-production-build.log`, `property-shadcn-final-build.log`,
`property-flowbite-final-build.log`, `property-eslint-final.log`,
`property-lint-final.log` and `property-format-check.log`.

Top-level progress remains **31 accepted / 54 open**. Property-rename identity is
closed; tuple-tail subject ownership and remaining combined-validity gates are
next in P1.5. Full R30 acceptance still includes its other recorded constraints.

## Tuple-tail occurrence and error ownership (2026-10-24)

Accepted bounded scope under P1.5/P4.9/R38: tuple-tail entries now use the form's
operation-aware occurrence keys and collection-item context. Add/Remove publish
checked core array-operation evidence. Existing tuple-field edits preserve their
descendant path/context instead of replacing the entire array, while missing
positions still initialize atomically. Fixed prefix fields remain positional.
Pagination uses tail occurrence keys and continues to address original indices.

The initial duplicate-file regression failed because removing an earlier tail
entry retained the wrong input. After keying by occurrence, a second regression
exposed transient old-path/new-data bindings discarding file metadata. The shared
file-size producer now waits for the settled target before pruning metadata or
publishing, with revision/unmount guards. Removed-value metadata still expires;
property rename, ordinary file controls and grid file regressions remain green.

A further literal-scope regression reproduced editor replacement even on an
upload. `LiteralControl` now carries the local array/descendant identity evidence
through its parent-member projection. The new tests explicitly include ordinary
and dotted tuple property names, duplicate encoded values, unchanged host-error
paths, moved file errors, disposal of the removed occurrence, retained Monaco
models on local edits/removal, and disposal/error clearing on external replacement.

Reference behavior: spec sections 15.5–15.6, 18.11 and collection pagination;
React Antd/shadcn `tupleControl.test.tsx` cover tail mutations, bounds, confirmation,
missing positions and scoped pagination. The Svelte regressions additionally
verify actual mounted editor/model identity and parent-owned error paths. Monaco
editors are located by rendered tuple position, not global creation order.

Verification:

- **694 core tests** pass after the literal-scope adapter change.
- **129 existing tuple browser tests** pass (43 per family): tuple fields,
  layout/summary/detail, missing/default/null behavior, constraints, imported
  extras, dialect handling and pending commands.
- **151 extended browser tests** pass (51 Flowbite, 50 shadcn, 50 Skeleton):
  six new tuple ownership cases per family plus file controls, native/grid file
  cells, property rename and literal-property ownership regressions.
- **48 production cases** pass in one final run: tuple ownership, canonical tuple,
  file-control and literal-file/rename scenarios across all families, EN/BG and
  native/Web Component hosts. The new tuple scenario uses a dotted property name,
  verifies actual file-input identity after deleting an equal preceding value,
  retains the parent error until the owner is removed, and checks exact data.
- Core/shared-extended/base type checks, integration TypeScript, package generation,
  all Web Component/demo builds, focused source ESLint, Oxlint, formatting and diff
  checks pass. ESLint ignores the browser test files by existing configuration;
  those files were executed in the browser matrix. Existing build warnings remain.

Logs in `tests/test-results`: `tuple-core-final.log`, `tuple-base-final.log`,
`tuple-extended-final.log`, `tuple-production-final.log`, `tuple-check.log`,
`tuple-literal-check.log`, `tuple-final-pack.log`, `tuple-literal-pack.log`,
`tuple-production-final-build.log`, `tuple-eslint.log`, `tuple-literal-eslint.log`,
`tuple-lint.log`, `tuple-format-check.log`. Intermediate failures are diagnostic
history and are not counted as acceptance.

Top-level progress remains **31 accepted / 54 open**. Tuple-tail subject ownership
is closed. The next P1.5 target is mixed literal-detail ownership, followed by
remaining combined-validity gates. Full tuple/R38 acceptance still includes the
other constraints recorded in the TODO/audit; this checkpoint does not claim them.

## Mixed literal-detail parent ownership (2026-10-24)

Accepted bounded scope under P1.5/R43: selected mixed-tree literal details now use
`LiteralControl` within the parent context instead of constructing another
`JsonForms` form. Encoded tree segments become literal JSON Pointer scopes through
a synthetic schema path. The adapter retains the single parent tree/navigation,
shared error/identity stores, validator/config/locale context, and current enabled
state. Existing-member-only writes prevent a delayed selected-detail update from
recreating a removed member. Redundant nested-form data/change/config wiring is
removed from all three family adapters.

The before-fix regression showed an oversized selected-node file upload updating
parent data without its owned error reaching parent validity. Final native cases
cover dotted and empty keys, a dotted key with slash/tilde escaping, EN/BG, pending
reads, exact data and siblings, field-specific host error display, and owner
cleanup after external deletion. Production cases select dotted/empty tree nodes,
upload oversized files, verify the parent error indicator, remove each node with
the native tree Delete action, and verify exact remaining data. The selected detail
intentionally hides Clear; tests use its supported removal action.

React references reviewed: Antd `test/renderers/MixedRenderer.test.tsx`, shadcn
`test/complex/MixedRenderer.test.ts`, shared/extended mixed dispatch and the mixed
empty-value regressions. The Svelte tests preserve comparable navigation/type/
mutation coverage and explicitly exercise parent ownership required by spec
sections 15.5–15.6.

Verification:

- **694 core tests** pass.
- **273 mixed browser tests** pass (91 per family): navigation, literal keys,
  schema/type changes, permissions, confirmations and pending commands.
- **72 extended browser cases** pass (24 per family): six new selected-literal
  cases plus literal property, rename and tuple ownership regressions.
- **36 production cases** pass in one final run across all families, EN/BG and
  native/Web Component hosts: selected literal ownership, canonical mixed control
  and tree commands.
- Core/base and integration type checks, package generation, all Web Component/
  demo builds, focused source ESLint, Oxlint, formatting and diff checks pass.
  Existing host build warnings remain.

Two older test assumptions were corrected without changing the safety contract.
The ancestor-readonly confirmation test now captures the old Yes button before
permission changes dismiss the dialog, then checks that a stale click cannot
mutate data. The production tree-command example has another asynchronous editor
of the same value: after composition/rename, fresh Rename/Delete attempts wait
for its pending validation to settle. Composition still blocks the action and
stale/duplicate protections remain covered. The first attempted production runs
are diagnostic history, superseded by the final clean 36-case matrix.

Logs in `tests/test-results`: `mixed-core-final.log`, `mixed-base-final.log`,
`mixed-extended-final.log`, `mixed-production-final.log`, `mixed-literal-check.log`,
`mixed-integration-types.log`, `mixed-literal-pack.log`, `mixed-production-build.log`,
`mixed-core-eslint.log`, `mixed-flowbite-eslint.log`, `mixed-shadcn-eslint.log`,
`mixed-skeleton-eslint.log`, `mixed-lint.log`, `mixed-format-check.log` and
`mixed-production-format-check.log`.

Top-level progress remains **31 accepted / 54 open**. Selected mixed literal-detail
ownership is closed. The next P1.5 pass checks the remaining text/password/duration
producer lifetimes, then combined-validity/submit gates; full R43 acceptance remains
tracked separately.

## Text, password and duration producer lifetimes (2026-10-24)

Duration drafts retained historical local commits indefinitely. After committing P2D,
receiving P3D from the host and beginning an incomplete draft, a host return to P2D
could leave that draft and pending validity alive. Acknowledged commits now expire;
newer typing still survives feedback from the current local commit. Both text and
picker regressions failed before the fix and pass afterward.

Comparable text, multiline, password and OTP cases verify rollback to an earlier
commit, cancellation of composition, rejection of late composition events, disposal
and preservation of host errors. Existing replacement, permission and table-cell
cases remain covered. Table replacement assertions now inspect the new mounted
input and deliver stale blur to the disconnected old input. Shadcn OTP uses its
single native input; Flowbite/Skeleton use native segment inputs.

React references reviewed: Antd extended `test/durationPicker.test.tsx` and shadcn
extended `test/durationControl.test.tsx` (unit selection, cancel/apply, immediate
edits, unrestricted quantities, clear, host errors and translations). The new
rollback cases extend the equivalent existing duration acceptance.

Verification:

- **26 shared duration tests** pass, including current commit feedback and historical rollback.
- **174 base browser tests** pass: text, multiline, password, OTP and compact text cells
  (57 Flowbite, 60 shadcn, 57 Skeleton).
- **42 duration browser tests** pass (14 per family), including EN/BG text/picker rollback.
- **48 production cases** pass across all families, EN/BG and native/Web Component hosts:
  duration lifetime, canonical duration, literal duration and password controls.
- Shared extended and integration type checks, focused ESLint/Oxlint/format checks,
  package generation and all six production builds pass. Existing build warnings remain.

Logs in `tests/test-results`: `draft-lifetime-shared.log`, `draft-lifetime-base-final.log`,
`draft-lifetime-duration.log`, `draft-lifetime-production-final.log`,
`draft-lifetime-check.log`, `draft-lifetime-integration-types.log`,
`draft-lifetime-eslint.log`, `draft-lifetime-lint.log`, `draft-lifetime-format-check.log`,
`draft-lifetime-pack.log` and `draft-lifetime-build.log`.

Top-level progress remains **31 accepted / 54 open**. This closes the remaining
text/password/duration producer-lifetime batch within P1.5. Next is combined-validity
and submit acceptance: the current callback incorrectly reports an empty-error
NoValidation form as valid; spec section 15.3 requires an explicit unvalidated state.

## Combined validity and submit gates (2026-10-24)

The validity callback previously reported an empty-error NoValidation form as valid.
It now includes `current`, false without automatic schema results, and requires it
for `valid`. Mode transitions notify hosts with unchanged data. All three public
Web Component event declarations and package documentation describe the same contract.
The ordinary change event remains schema-only; additional errors and pending work
retain their independent notifications.

A host-owned reactive rule closes over the combined-validity callback; no new core
rule-context field or authored option is introduced. Equivalent native Button tests
exercise unvalidated/valid states, host errors, renderer pending/results/clear,
hidden schema failures and restored validation with unchanged data. Active-branch
and pre-touch cases now also assert the combined callback directly, proving that
presentation does not redefine document validity. Spec §§15.3–15.6 and §15.9's
host-owned rule example govern this behavior. Existing React schema-rule helpers
likewise do not treat collected additional errors as schema-condition data.

Verification:

- **695 core tests** pass; mode transitions include initial NoValidation and unchanged valid data.
- **43 native Button/submit cases** pass (14 Flowbite, 15 shadcn, 14 Skeleton).
- **57 native branch/pre-touch cases** pass (19 per family).
- **12 rebuilt production Button cases** pass across EN/BG and native/Web Component hosts.
- The **packed Web Component matrix** passes for all three families, exercising initial
  validity, NoValidation/current transitions without data edits, host errors, file
  publication and correction, plus existing packed rendering/OTP/readonly behavior.
- Core, shared extended and integration checks pass. Package generation, all six
  production builds, release tarball validation, focused Svelte ESLint/Oxlint,
  formatting and diff checks pass. Existing build warnings remain; ESLint delegates
  ordinary TypeScript to the passing Oxlint check.

Evidence is in `tests/test-results/validity-{core-focused,core-all,core-check,core-pack,
button-tests,display-tests,production-build,release-pack,packed-browser,
production-buttons,fixture-check,integration-check,eslint,lint,format-check}.log`.
Tarballs are in `/tmp/jsonforms-validity-packs`.

**P1.5 is accepted: 32/85 top-level requirements accepted, 53 open.** Its ownership
requirements are supported by the prior occurrence, literal-property, rename,
tuple, mixed-detail and producer-lifetime checkpoints; this run closes validity
and presentation separation. Those tests remain regression coverage. Next is P1.6
error routing and structured summaries, followed by validator/error precedence
acceptance; these distinct requirements remain open.

## Structured collection errors, P1.6 checkpoint (2026-10-25)

Root-array and row summaries now retain one entry per validator error, including
separate rows with the same schema path. The shared formatter supplies translated
field labels and one-based row context. Flowbite, shadcn and Skeleton expose
bounded, keyboard-accessible summaries with localized Show more/less controls;
row badges sit outside accordion header buttons. The shadcn badge uses its shared
Popover and the Web Component portal target. The production test positions its
trigger before focusing it, avoiding an in-progress page scroll during disclosure.

Verification: **707 core tests** pass; focused native suites pass **15 cases per
family**; all **24 production cases** for structured summaries and adjacent
collection actions pass across EN/BG and native/Web Component hosts. Core and
three base-package checks, focused lint/format, package generation and all six
production builds passed for this batch. See `tests/test-results/summary-*.log`.

The next section-indicator batch routes each error to its bound Group/Category
scope, including literal property-name targets and overlapping controls. A collapsed
section presents three entries initially and expands to the full list with the
same translated field labels. Native header triggers stay free of nested native
buttons. The shadcn indicator uses an explicit, bounded dialog because its
focusable status span sits inside a collapsible header; the shadcn collection
badge continues to use the shared Popover component.

Follow-up verification: **708 core tests**, **12 native section cases** and **36
production cases** pass across the three families, EN/BG, and native/Web Component
hosts. Core, base-family and integration type checks pass; all nine base,
Web Component and demo builds pass. See `tests/test-results/summary-section-*.log`.

Object-owned Groups now retain separate schema and host entries, and rejected
additional properties retain separate literal dotted/slash names. The three native
ObjectErrorBoundary suites pass **7 cases each**, and the EN/BG ObjectControlSpec
suites pass **2 cases each**. The rebuilt production `object-array` and section
matrices pass **24 cases** across all families and both host modes. All nine
base/Web Component/demo builds, type checks and focused lint pass for this batch;
see `tests/test-results/summary-object-*.log`.

Mixed-tree and recursive-tree indicators now route each visible schema/host error
to their bound container, including literal property-name targets; hidden modes
exclude schema errors while keeping host errors. All three families use bounded,
keyboard-accessible native summaries with localized Show more/less. Focused native
mixed and recursive suites pass **5 and 6 cases per family**, respectively.
The rebuilt object, recursive, section and mixed production matrix passes **48/48**
cases across all families, EN/BG and native/Web Component hosts. Mixed production
cases cover five entries, expansion, viewport bounds, Escape and unchanged data.
All nine base/Web Component/demo builds, package type checks, focused lint and
the full **709/709 core test suite** pass. See
`tests/test-results/summary-mixed-*.log`.

**P1.6 accepted: 33/85 top-level requirements accepted, 52 open.** Next is P1.7
validator profile acceptance; preserve the P1.6 production matrices.

## Validator profile, P1.7 acceptance (2026-10-25)

The extended Ajv profile is accepted without a runtime change. Focused tests
verify `allRequired`, discriminated `oneOf`, `$data` format bounds, dependencies
and their original nested error paths. Existing fixture and error-localization
tests cover custom transforms, static and computed defaults with permission
rechecks, nested `errorMessage` unwrapping and locale refresh without mutating
the original errors. The expanded validator-profile production matrix verifies
all four transforms, false/static and computed defaults, URL/hash query defaults
and field-owned schema messages in **12/12** family × EN/BG × host cases. The
complete extended package suite passes **369/369** tests, its type check is clean,
and focused formatting passes. See `tests/test-results/p17-*.log`.

**P1.7 accepted: 34/85 top-level requirements accepted, 51 open.** Next is P1.1
config consumption ledger, then P1.2 precedence; P1.12 remains the independent error
precedence/catalog audit.

## Config inventory, P1.1 in progress (2026-10-25)

The canonical 145-entry React/spec consumption inventory is pinned in
`tests/fixtures/spec-conformance/config-consumption.json` with its source hash.
A new path check verifies distinct inventory entries, every inventory path
declared by the pinned config schemas, and the inverse schema diff. It found
eight currently declared paths beyond the canonical inventory; these are listed
in `svelte-config-additions.json` with reviewed Svelte consumers, defaults,
effects, precedence and tests. The review files contain 21 general rows,
10 disclosure rows, 10 collection/tuple rows, three radio rows and
14 Monaco rows, three sort-flag rows, four additional-property rows, three
readonly rows, two field-presentation rows, five text-control rows and one
autocomplete row (`svelte-config-review*.json`): **76/145 canonical rows**. A second schema-diff check pins
**183 declared local option paths across ten UI-schema roles**, including nested
members; open vendor bags remain open. The focused config/provenance suites pass
**16/16** cases; 38 confirmation/layout/pagination and 37 security/indicator
tests pass. P1.1 remains open: **69 canonical entries** and the local option
paths still need consumer, default, precedence, effect and test review.
This inventory work does not change the **34 accepted / 51 open** count.

A source-token sweep initially found no direct Svelte `src/lib` reference for
`separateReadonlyFromDisabled`, `showArrayLayoutSortButtons` or
`showArrayTableSortButtons`. The first is consumed by the installed JSON Forms
core mapper; the sort aliases are now implemented and verified below.

The layout review also found that `jsonformsExtended.layoutDefaults.minItemWidth`
is consumed by the Svelte sizing helper but is undeclared in the pinned config
schema. It is recorded as a compatibility decision for P1.2, not silently
counted as a declared global option.

The P1.2 decision is to retain that existing Svelte-only runtime fallback for
legacy forms while keeping it out of the portable config schema. New portable
UI schemas should set `options.minItemWidth` on the layout. The local value,
including zero, wins over the fallback; absent values add no minimum. React
Antd/shadcn use the local layout option and do not consume this global key.
The shared sizing suite and each family's portable-layout defaults suite cover
the retained precedence. A config-schema regression asserts the compatibility
key remains undeclared.

The array-collapse gap is closed. All three families now apply
`jsonformsExtended.array.collapsed` to the outer table/stacked panel when
collapsible, and to the first stacked item. Local `collapsed: false` wins; the
former local `initCollapsed` still works when no portable collapse default is
specified. The shared resolver passes 7 focused tests; all six focused native
array suites pass, all nine renderer/Web Component/demo builds pass, and the
production family × EN/BG × host matrix passes **12/12**. The gap ledger is empty.

The radio gap is closed. A shared resolver now applies local `vertical` before
`jsonformsExtended.radio.vertical` to both enum and oneOf radios in all three
families, ignoring the removed flat `config.vertical`. The base resolver test,
**5 native radio cases per family**, all nine renderer/Web Component/demo builds,
and **12/12 production** family × EN/BG × host cases pass. This closes a
consumption row inside P1.1; the parent requirement remains open.

Conditional-field opt-in is also reviewed: the local `conditionalFields` option,
including explicit false, takes precedence over
`jsonformsExtended.conditionalFields`. The shared projection keeps document data
and validation intact. The existing production example passes **12/12**
family × EN/BG × host cases, and each native ObjectRenderer suite passes
**9/9** cases after adding a mounted config/local override test. The two
rename tests in each suite now locate the generated dialog field ID; Skeleton
uses real browser input for its native bound field.

The scoped mixed `structuredLayout` default is reviewed as well. Shared resolution
ignores the removed flat location; mounted tests in all three families exercise
global nested, default tree and local nested overriding global tree. All three
MixedRenderer suites pass **21/21** cases, matching the React precedence test.

The Monaco config batch reviews flat `config.monaco` and each of its six
declared members, plus the seven removed `jsonformsExtended.monaco` paths.
The resolver uses a whole-bag local replacement, ignores the removed namespace,
and applies editor defaults to absent members. Its focused helper suite passes
**16/16** tests, including explicit values for every member and the removed
location. These rows are in `svelte-config-review-monaco.json`.

Array sort aliases now match the React Antd OR behavior after local/global
option merging: generic `showSortButtons` and the table/layout-specific legacy
flag each enable reordering, including when the other flag is false. The table
flag also enables AG Grid row drag; the unrelated presentation flag is ignored.
The shared helper passes **2/2** cases, native table/layout reorder tests pass
**2/2 per family**, and all three AG Grid command suites pass **21/21**. The
three config rows are in `svelte-config-review-sort.json`.
All native, extended, Web Component and demo package builds pass. The built
demo matrix passes **12/12** scenarios across Flowbite, shadcn and Skeleton,
English/Bulgarian and native/Web Component hosts; each scenario applies flat
sort aliases through the Config editor and verifies persisted table and layout
row order after moving items. The refreshed matrix additionally sets flat
`disableAdd` and `disableRemove`: any displayed Add/Delete action is disabled
while table and expandable-array reorder still changes the exact stored rows.
Flowbite's Web Component may hide the disabled Add action. Mounted
expandable-array tests verify local and global disable settings leave reorder
available in all three families; the focused suites pass **45/45** each.
Existing collection-action production scenarios also pass **12/12**.

The additional-property gate review covers flat
`allowAdditionalPropertiesIfMissing` and `allowEmptyPropertyNames`, plus both
removed namespaced locations. The missing-schema gate is false by default,
local false overrides global true, local true overrides global false, and the
option does not override an explicit `additionalProperties: false`. An Add
case verifies persisted new data beside a fixed property. The empty-name
tests cover global/local precedence and confirm the removed namespaced path is
ignored. Focused native suites pass **38 Flowbite, 42 shadcn and 38 Skeleton**
cases. The four config rows are in `svelte-config-review-additional-names.json`.
The existing built-demo additional-property matrix also passes **12/12**
family × locale × host scenarios for literal keys, edits, Add and Rename.

Core `readOnly`, `readonly` and `separateReadonlyFromDisabled` are now pinned to
their mapper precedence. Focused native text cases pass **7/7 per family**:
flat `readonly` wins over flat `readOnly`, local false/true takes priority, and
the separation flag keeps readonly fields focusable while edits cannot publish
data. The existing native readonly control suites cover numeric, date/time,
mask and popup interaction; these three rows are in
`svelte-config-review-readonly.json`.

Field presentation now has **8/8** focused cases per family for flat/local
`hideRequiredAsterisk` and `showUnfocusedDescription`, including explicit
local false over global true. The tests distinguish hidden helper content from
a visible description and keep required labeling independent. The two rows are
in `svelte-config-review-field-presentation.json`.

The string-control suggestion path now reads the merged flat config and local
option bag, matching React Antd's index-wise array merge. Focused real-control
cases pass in Flowbite, shadcn and Skeleton: a local first suggestion replaces
the global first suggestion while a second global suggestion remains available.
The `config.suggestion` row is in `svelte-config-review-suggestions.json`.
Native, Web Component and demo package builds pass. The built-demo suggestion
matrix passes **12/12** family × locale × host scenarios, including the local
four-item list retaining a fifth flat-config suggestion.
The existing built-demo string-control matrix remains green at **12/12**.

Flat `config.multi` now selects the existing multiline renderer even when the
UI schema has no `multi` option. Local `multi: false` keeps a single-line
input; local true selects the textarea. Focused cases pass **5/5 per family**
and verify stored newline behavior. Native, Web Component and demo builds
pass. The built-demo matrix passes **12/12** family × locale × host scenarios,
verifying the textarea, local single-line override and persisted newline data.
The row is in `svelte-config-review-multiline.json`.

The remaining basic text options now have **8/8** focused cases per family.
`placeholder` and `clearable` obey local-over-flat precedence, including local
empty/false values; ordinary text still preserves surrounding whitespace when
legacy `trim: true` is supplied, matching the React inventory's default-only
finding. These rows are in `svelte-config-review-text-basics.json`.

Finite-choice `autocomplete` now has **3/3** flat/local precedence cases per
family. Flat true exposes search, local false suppresses it, and local true
overrides flat false. Existing searchable-choice suites cover filtering and
selection value behavior. The row is in
`svelte-config-review-autocomplete.json`.

Eight temporal config paths now have mounted flat/local precedence and storage
checks across Flowbite, shadcn and Skeleton: date, time and date-time display
and save formats, plus 12-hour picker mode. The focused suites pass **22/22**
per family, and the shared temporal helper passes **6/6**. Date `views` now
falls back to the display format rather than the save format; date and time
view precedence and storage independence are covered in the same suites.
Date-time calendars now apply year/month views while retaining full date-time
storage; local array entries override flat config index-wise. The built-demo
matrix passes **12/12**
family × locale × native/Web Component scenarios. English and Bulgarian
supplemental example text now describes both date and time views. The eight
completed rows are in `svelte-config-review-temporal.json`; no canonical
config gaps are currently recorded.

Temporal pickers use local `options.restrict`, then authored flat
`config.restrict`, then `true`, matching the shared form-wide restriction
contract. The extension namespace has no `restrict` option. Core's injected
`restrict: false` is not an authored choice. Native
temporal constraint/bounds suites pass **28 Flowbite, 26 shadcn and 26
Skeleton** cases, including flat/removed-namespace conflicts and both local
overrides. The rebuilt 12-case family × EN/BG × native/Web Component production
matrix passes flat/local picker precedence. The focused config-consumption and
shared temporal suites pass **14/14**, including rejection of the nested key.
React Antd's focused picker suite passes explicit flat true/false and local
overrides; JSON Forms core seeds an omitted React config with flat false, so a
React host that wants preventive restriction enabled must supply flat true.
The additional-property production matrix also passes **16/16**, including
specific translated `propertyNames` failures on rename. The
collection-action matrix also passes **12/12** with a 20-second per-case
timeout; two Skeleton native scenarios take longer than the suite's default
five seconds. Native string max-length precedence passes **14/14 per family**:
default restriction, flat false, both local overrides and the removed namespace
preserve the expected stored value. The canonical flat config row is in
`svelte-config-review-restrict.json`.

The canonical config inventory now contains **144** paths: the obsolete
namespaced `restrict` audit row has been removed from both the spec source and
this pinned review fixture. Earlier 145-row counts in this verification log
record the inventory size at the time of those checks.

Flat `config.showActions` and the removed
`config.jsonformsExtended.showActions` location are now reviewed. Temporal
pickers default to immediate publication while duration and cron default to
staged edits; local `showActions` overrides the flat value in either direction.
Coarse date and date-time month/year selectors previously forced OK/Cancel even
when actions were disabled. All three families now publish valid selections
immediately in that mode, preserve the selected day, and show the action bar
only when requested. The native temporal config suites pass **24/24 per
family**, including consecutive month/year edits. Directly affected temporal
regression suites pass **40 Flowbite / 43 shadcn / 40 Skeleton** cases.
Duration/cron precedence suites pass **38 Flowbite / 37 shadcn / 35 Skeleton**
cases, covering defaults, flat/local overrides, immediate publication and the
ignored removed namespace. All twelve packages and three production demos
build successfully. The rebuilt temporal default and staged-view demo suites
pass **24/24** family × EN/BG × native/Web Component scenarios. The config
ledger contract remains **5/5**, with **88/145** canonical rows reviewed and
**57** remaining.

Four OK/Cancel label paths are now reviewed. Flat `config.okLabel` and
`config.cancelLabel` configure translated temporal and duration action labels,
with local options winning; removed `config.jsonformsExtended` spellings have no
effect. Composite detail dialogs now take these labels only from the selected
cell, tuple or position options, matching the React renderer contract instead
of inheriting form-wide labels. The temporal label suites pass **33/33 per
family**, duration suites **22/22 per family**, shared dialog tests **2/2**,
and composite/tuple native suites **42/42 per family**. All packages and demos
rebuild successfully. The tuple and object-array production suites pass
**24/24** family × EN/BG × native/Web Component scenarios. The ledger check
passes **5/5**, with **92/145** canonical rows reviewed and **53** remaining.

The removed namespaced composite `showEmptyButton` and `emptyLabel` paths are
also reviewed. Optional Clear/Remove actions and their labels now read the
selected cell, tuple or position options; a flat or removed-namespaced Clear
setting cannot add or relabel actions across the form. Row-bound composite
cells still suppress both optional actions. The expanded composite/tuple native
suites pass **46/46 per family**, all package and demo builds pass, and the
rebuilt tuple/object-array production matrix passes **24/24** family × EN/BG ×
native/Web Component scenarios. The config ledger check passes **5/5**, with
**94/145** canonical rows reviewed and **51** remaining.

Flat `config.disableAdd` and `config.disableRemove` are now reviewed. Local
false/true values take precedence over flat values in table actions and AG
Grid, while schema min/max bounds, readonly and contextual permissions remain
independent. The option blocks Add/Delete without disabling existing item
editing or reorder. The focused table suite passes **6/6 per family**, AG Grid
commands **27/27 per family**, and the built-demo flat-disabled matrix passes
**12/12** family × EN/BG × native/Web Component scenarios. Existing tuple,
property and collection command suites retain their local permission cases.
The ledger check passes **5/5**, with **96/145** canonical rows reviewed and
**49** remaining.

Flat `config.collapseNewItems` is now reviewed for the expandable array
presentation. Empty arrays previously opened the first added item under true
because the initial placeholder already selected item 0. Flowbite now clears
that matching expansion; shadcn and Skeleton remove the matching accordion
value. Existing expanded older items remain open, and local false overrides
flat true. The array-layout suites pass **11/11 per family**. All packages and
demos build; the new collapse matrix and existing array-panel matrix pass
**12/12 each** across family × EN/BG × native/Web Component hosts. The ledger
check passes **5/5**, with **97/145** canonical rows reviewed and **48**
remaining.

Three removed flat presentation paths are reviewed without source changes:
`config.childLabelProp`, `config.elementLabelProp` and `config.summary`. The
corresponding selected array/list, cell and tuple options remain local. Global
label props leave the native item fallback unchanged; local aliases select the
requested field, with `elementLabelProp` winning over `childLabelProp` on array
headers. Composite previews ignore a form-wide summary and keep selected-cell
summaries. Array-layout suites pass **16/16 per family**, ListWithDetail suites
**13/13 per family**, and composite suites **18/18 per family**. Existing
object-array and tuple production matrices each pass **12/12**. The ledger
check passes **5/5**, with **100/145** rows reviewed and **45** remaining.

Two detail paths are now reviewed. Removed flat `config.detail` no longer leaks
into every tuple position; selected tuple or cell detail remains local. The
`config.jsonformsExtended.dialog` object supplies member-wise global geometry
defaults, while locally authored members override those defaults, including
explicit `false`. Tuple-control suites pass **31/31 per family** and dialog
geometry suites **3/3 per family**. All packages and demos build, and the
production tuple-control and table-row-details matrices pass **12/12 each**
across family × EN/BG × native/Web Component hosts. The table-detail suite has
a 30-second case timeout for its six mode and geometry interactions. The ledger
check passes **5/5**, with **102/145** rows reviewed and **43** remaining.

Flat `config.hideAvatar` and `config.hideArraySummaryValidation` are reviewed
across expandable arrays and list-with-detail. Hiding the numbered avatar now
keeps a screen-reader item index and preserves row error markers; list-with-detail
also honors global and local avatar choices. Child-summary suppression still
leaves row and own-array errors available, and local `false` overrides global
`true`. The full array-layout and list-with-detail native suites pass **35/35
per family**. All packages and demos build, and the collection-presentation
matrix passes **12/12** across family × EN/BG × native/Web Component hosts,
including AG Grid summary suppression in Flowbite and shadcn.
The ledger check passes **5/5**, with **104/145** rows reviewed and **41**
remaining.

Three composite/tuple presentation paths are reviewed: flat
`config.showTypeIndicator`, flat `config.showBorder`, and the removed
`config.jsonformsExtended.showBorder`. Composite object/array type markers now
remain beside authored Label summaries, matching the spec and React renderers;
local false still overrides global true, markers stay decorative, and summary
text and validation remain independent. Tuple borders honor the flat default
and explicit local values while ignoring the removed namespaced key; borderless
tuples retain their heading, fields and array errors. Composite and tuple
native suites pass **54/54 per family**. All packages and demos build; the new
presentation matrix passes **12/12** and existing tuple/object-array matrices
pass **24/24** across family × EN/BG × native/Web Component hosts. The ledger
check passes **5/5**, with **107/145** rows reviewed and **38** remaining.

Flat `config.enableFilterErrorsBeforeTouch` and
`config.filterErrorKeywordsBeforeTouch` are reviewed as control presentation
policy. The shared filter retains structured schema and host errors, data and
validity; blur reveals the control's text, an empty keyword list hides all
eligible pre-touch text, a local false opts out, and disabling the filter
restores ordinary display. Shared filter and ledger suites pass **13/13**;
the native pre-touch suite passes **4/4 per family** and the built-demo matrix
**12/12** across family × EN/BG × native/Web Component hosts. Container and
array summaries do not share child touch state; this documented boundary
remains tracked under P1.12. The ledger has **109/145** rows reviewed and
**36** remaining.

### Active-branch feedback policy and mixed delegation — 2026-10-25

Flat `config.validateActiveBranch` is reviewed. The selected Control's local
option overrides the form value, including explicit false; `NoValidation` and
`ValidateAndHide` suppress local branch work. Mixed-type delegation now carries
that local option to the generated composition editor without changing data or
document errors. Shared policy/cache/deduplication tests pass **10/10**;
AnyOf/OneOf/Mixed native suites pass **39/39 per family**, and production branch
feedback plus adjacent combinator/mixed-control suites pass **36/36** across
family × EN/BG × native/Web Component hosts. The production test changes the
schema to an object/null union, verifies both delegated editors, local false,
unchanged data, and clearing on the Long text branch. The canonical example
uses an expanded nested mixed view so the delegated branches remain visible;
explicit EN/BG keys survive narrowing. English and Bulgarian screenshots of
the delegated error state were reviewed for all three families. The demo build
passes. **P5.2 is accepted.** The ledger has **110/145** rows reviewed and
**35** remaining.

### Color option namespace review — 2026-10-25

`config.jsonformsExtended.colorSaveFormat` and `colorTextEntry` now follow the
portable extension precedence: Control options, then the namespaced form config,
then `hex`/`true` defaults. Removed flat color keys no longer act as a fallback.
The shared resolver test covers defaults, conflicting flat and namespaced values,
and explicit local overrides. Each of the Flowbite, Skeleton and Shadcn native
color suites passes **15/15**, including an interaction that keeps text entry and
hex storage despite flat color keys, then applies namespaced and local overrides.
The rebuilt `spec-color-control` production example passes **12/12** across
EN/BG, three families and native/Web Component hosts; functional and hex storage,
picker-only entry and clear behavior remain intact. `pnpm run build:demo` passes.
The config ledger check passes **5/5** with **112/145** canonical rows reviewed
and **33** remaining at this color checkpoint. Broader local-option inventory
and compound precedence remain under P1.1/P1.2.

### Stepper navigation config review — 2026-10-25

Flat `config.showNavButtons` is consumed only by Categorization's stepper.
Absent values hide Previous/Next; a local `false` overrides global `true`, and
local `true` overrides global `false` without writing data. This behavior
already existed in all three family adapters; new mounted tests pass **6/6**
for Flowbite and **4/4** each for Skeleton and Shadcn. The existing
categorization and container-validation production matrices pass **24/24**
after their assertions were updated from the old tooltip role to the current
structured error-summary disclosure. The config ledger check passes **5/5**
with **113/145** canonical rows reviewed and **32** remaining.

### Monaco language and built-in appearance — 2026-10-25

Flat `config.language`, root-data `config.:language`, and the removed
`config.jsonformsExtended.language` location are reviewed. A data-bound language
changes the live Monaco model; an unusable binding falls back to the local or
flat fixed language and then plaintext. The removed namespaced key does not
affect the editor. The helper suite passes **17/17**, and the Monaco native
control suite passes **7/7 per family**, including external language changes
without altering the code value.

The same native suites now verify built-in appearance precedence: local `theme`
over flat `theme`, then `mode`, with live light/dark surface updates. The shared
Monaco editor suite passes **16/16**, including explicit appearance against the
host mode, restoration of host tracking, and preservation of built-in and
custom host themes when another editor exists. The built-in fallback now changes
Monaco only when this is its sole editor. An already active named host theme is
retained without a diagnostic; an inactive named theme emits a stable
`monaco.themeNotActive` developer diagnostic without changing the global theme
or form validity. This earlier independent named-theme gap was superseded by the
process-global contract clarified below; the shared theme service cannot
select a separate named theme for each editor. Flat
JSON conversion and its removed namespaced location are reviewed, including
the local non-string dispatch requirement.
Namespaced error publication and its flat compatibility fallback retain local
false precedence; the rebuilt `code-editor` production matrix passes **12/12**
across family, EN/BG and native/Web Component hosts with dark config mode,
parse-error publication, repaired JSON and exact stored data. The full demo
build passes. The ledger check passes **5/5** with **120/145** canonical rows
reviewed, **2** theme/mode gaps recorded, and **23** still unreviewed.

### Initial focus configuration — 2026-10-25

The ordinary String controls in Flowbite, Skeleton and shadcn consume flat
`config.focus`; a local `focus: false` overrides global `true`, and local `true`
overrides global `false`. Each native suite verifies initial focus and that a
data rerender does not reclaim it after focus moves elsewhere (**5/5 per
family**). A dedicated production example verifies initial focus on the name
input in all **12/12** family × EN/BG × native/Web Component hosts, including
focus inside the Web Component shadow root. The full demo build passes. The
config ledger passes **5/5** with **120/145** canonical rows reviewed, **2**
Monaco theme/mode gaps recorded and **23** unreviewed. The canonical `focus`
row remains open for other control types and hidden or repeated contexts under
P1.10; this batch closes the ordinary text path.

### Choice, slider and mount-only focus — 2026-10-25

Antd's select and scalar controls pass `autoFocus` to their native component.
The Svelte Flowbite, shadcn and Skeleton enum/select, searchable choice,
radio and slider controls now request focus on their primary focusable element.
Radio choices prefer the initially selected item, falling back to the first.
Skeleton segmented radio uses its native input rather than its label. Shadcn
and Skeleton sliders focus their thumb on mount without opening a picker.

The shared family control bindings capture the effective `focus` option when a
control mounts. Subsequent changes from false to true, data updates and
validation rerenders do not issue a new focus request. The same capture now
reaches the extended color, duration, file, null and Monaco controls. Native
choice tests pass **4/4 Flowbite, 6/6 shadcn and 6/6 Skeleton**; slider tests
pass **1/1 per family**; ordinary text passes **6/6 per family**, including
readonly-but-focusable input; hidden-category checks pass **1/1 per family**
without revealing or focusing the inactive control. The affected extended
control suites pass **79/79 Flowbite, 78/78 shadcn and 78/78 Skeleton**.
Rebuilt production initial-focus examples pass **48/48** family × EN/BG ×
native/Web Component cases for text, enum choice, radio and slider, including
shadow-root focus. The canonical `config.focus` ledger row remains open for
dynamic option evaluation, repeated-item remounting and wider extended-control
production acceptance; the reviewed count remains **120/145** with **23**
unreviewed and **2** Monaco theme/mode gaps.

### Initial focus acceptance and ledger closure — 2026-10-25

The shared mount snapshot now reaches every standard and extended focusable
Control, including Cron. Native repeated-array cases verify that a newly mounted
item receives its own focus request without later data rerenders reclaiming it;
hidden categorization does not auto-reveal an inactive control, and a control
newly mounted after tab selection can focus. Extended color, Cron, duration, file
and null controls pass **5/5 per family** for local false precedence, mount-time
focus and no repeated focus on updates. The shadcn interactive validation badge
uses its native Popover; its browser test passes **1/1** for expansion and Escape.

The full demo build passes. Rebuilt text, choice, radio, slider, Monaco and
extended-control production focus cases pass **120/120** across all three
families, EN/BG, and native/Web Component hosts, including shadow-root focus.
The canonical `config.focus` ledger row is reviewed: **121/145** entries are
reviewed, **22** remain unreviewed and **2** Monaco theme/mode gaps are explicit.
The spec marks generic `$dynamic` overlays as a future design proposal, outside
current runtime conformance; no dynamic-focus implementation is claimed.

### Monaco dimensions and width ledger — 2026-10-26

React's code editor consumes flat `width`/`height` with same-key local Control
overrides. The shared Svelte Monaco editor now accepts non-negative numeric
pixel dimensions or authored CSS dimension strings, while retaining row-based
height and full-width defaults. Border-box sizing gives the configured outer
dimensions; maximize continues to use viewport geometry. All three extended
families pass native flat/local/removed-namespace geometry tests (**1/1 each**),
the shared helper and editor suites pass **18/18** and **17/17**, and the rebuilt
production demos pass **24/24** family × EN/BG × native/Web Component cases.
The full demo build and package checks pass. Flat `config.width` and removed
`config.jsonformsExtended.width` are reviewed in the consumption ledger:
**123/145** canonical entries reviewed, **20** unreviewed and **2** explicit
Monaco named-theme/mode gaps. `config.height` remains open because it also
applies to grid and split-layout presentations; their precedence and
production behavior have not yet been accepted in this batch.

### Flat height across editor, grid and split layouts — 2026-10-26

The earlier Monaco dimension acceptance now extends to AG Grid and split
layouts. AG Grid resolves local `height`, then compatibility `gridHeight`, then
flat `config.height`, then its 400px default; numbers become CSS pixels and
strings retain their CSS units. Split layouts already resolved local then flat
height and retain a 20rem vertical default. Nested
`config.jsonformsExtended.height` remains ignored. All three native AG Grid
and split suites pass (**14/14 Flowbite, 13/13 shadcn, 14/14 Skeleton**). The
full demo build passes, followed by **48/48** grid/split production height
cases across family, EN/BG and native/Web Component hosts. With the prior
24/24 Monaco dimension cases, flat `config.height` and the removed nested
height row are reviewed: **125/145** canonical entries reviewed, **18**
unreviewed and **2** explicit Monaco theme/mode gaps.

### Split resizability configuration — 2026-10-26

The split renderer resolves local `resizable` before flat
`config.resizable`, defaults to true, and ignores the removed
`config.jsonformsExtended.resizable` location. Native suites pass **14/14
Flowbite, 13/13 shadcn and 14/14 Skeleton**, including global false/local
true and a nonfocusable disabled separator. Demo-common and all three demo
builds pass. The production matrix passes **24/24** across family, EN/BG and
native/Web Component hosts; it checks the separator's DOM `tabIndex` property
because Skeleton need not emit an explicit attribute for -1. These two
canonical rows are reviewed: **127/145** reviewed, **16** unreviewed and **2**
Monaco theme/mode gaps.

### Existing Label dynamic-values gate — 2026-10-26

The nested `config.jsonformsExtended.dynamicValues.enabled` gate defaults
closed. A Label's `interpolate` request cannot bypass it; explicit true lets
declared `textParams` read the permitted dynamic namespaces, while direct
unapproved expression access still fails. The mounted Label interpolation
suite covers gate changes, data replacement and denial. Demo-common and all
three demo builds pass; the production gate matrix passes **24/24** across
family, EN/BG and native/Web Component hosts. The namespace and enabled rows
are reviewed: **134/145** canonical entries reviewed, **9** unreviewed and
**2** explicit Monaco theme/mode gaps. Generic `$dynamic` UI overlays remain
a future proposal outside current conformance.

### Template language defaults and unsupported diagnostic — 2026-10-26

The extended TemplateLayout resolves explicit `lang`, then namespaced
`jsonformsExtended.defaultTemplateLang`, then the flat compatibility default,
then Ractive. The production review exposed a generic Layout tester tie at
rank 1: unsupported configured languages were silently rendered as empty
layouts. All three standard families now reserve `TemplateLayout` for the
extended renderer. Their focused layout suites pass **11/11 each**; the
extended entry suite passes **5/5**. The full dependent library, Web Component
and demo build passes, followed by **36/36** production precedence/diagnostic
cases across family, EN/BG and native/Web Component hosts. Both template
language config rows are reviewed: **136/145** canonical entries reviewed,
**7** unreviewed and **2** explicit Monaco theme/mode gaps.

### AG Grid option-bag precedence — 2026-10-26

AG Grid reads the flat `config.agGridOptions` bag. A local Control
`agGridOptions` bag replaces it rather than merging individual native
settings; removed `config.jsonformsExtended.agGridOptions` has no effect.
Native pagination suites pass **3/3 per family**, including global false,
local true with an explicit page size, and an opposing removed nested value.
Demo-common and all three demos build; the production matrix passes **24/24**
across family, EN/BG and native/Web Component hosts. Both option-bag rows are
reviewed: **138/145** canonical entries reviewed, **5** unreviewed and **2**
explicit Monaco theme/mode gaps.

### Removed file accept and category initial locations — 2026-10-26

The removed nested `jsonformsExtended.accept` value does not replace an
authored file Control `accept` or the schema's `contentMediaType` hint. The
removed nested `jsonformsExtended.initial` value does not select a category;
the Categorization element's own `options.initial` remains the selector, with
the first visible category as default. Native file suites pass **31/31
Flowbite, 30/30 shadcn and 30/30 Skeleton**; native category-selection suites
pass **3/3 per family**. Demo-common and all three demos build, followed by
**24/24** production cases across family, EN/BG and native/Web Component
hosts. Inactive panels may stay mounted but hidden, so production checks
visibility. The two removed-location rows are reviewed: **140/145** canonical
entries reviewed, **3** unreviewed and **2** explicit Monaco theme/mode gaps.

### Removed table/cell locations and namespace completeness — 2026-10-26

The removed nested `jsonformsExtended.table` flag does not select a table;
renderer ranking reads the Control's `options.table`. The removed nested
`jsonformsExtended.cells` bag does not replace a column's local descriptor.
Native table tester suites pass **5/5 per family**, and composite-summary
suites pass **20/20 per family**, including opposing removed and local cell
summaries. The production removed-location matrix passes **48/48** across
family, EN/BG and native/Web Component hosts after demo-common and all three
demo builds. The config ledger passes **6/6**, including a check that every
canonical child of `jsonformsExtended` has a reviewed row. The table, cells,
and namespace container rows are reviewed: **143/145** canonical entries
reviewed, **0** unreviewed and **2** explicit Monaco theme/mode gaps.

### Monaco theme and mode contract correction — 2026-10-26

Extended spec §9.10.2 makes Monaco theme state process-global. It permits
switching only the built-in fallback themes and requires preserving a custom
theme installed by the host. The previously recorded demand to select a
different named theme independently per editor conflicts with that rule and
is not a conformance gap. Flat `theme` and `mode` precedence, light/dark/system
transitions, host custom-theme preservation, active named themes, and a
developer diagnostic for an inactive name are already implemented. The shared
Monaco editor suite passes **17/17** and each extended family renderer suite
passes **7/7**. The config ledger passes **7/7** and now checks **145/145**
canonical rows reviewed, with no remaining canonical gaps. P1.1 stays open
for the separate 183-path local-option review.

### Button and Categorization local-option roles — 2026-10-26

The local-option ledger now reviews all four Button paths and all five
Categorization paths, **9/183** declared role/path pairs. Button's legacy
`options.action` and `options.label` remain below their portable top-level
fields; `options.disabled` blocks activation, and `options.fullWidth` fills
only the allocated cell. The Button renderer suites pass **14/14 Flowbite,
15/15 shadcn and 14/14 Skeleton**, and the canonical production action demo
passes **12/12** family × locale × host cases.

Categorization's local `variant` selects tabs, stepper or accordion; unknown
values fall back to tabs. Local `initial`, accordion `collapsed`, and stepper
`showNavButtons` keep their documented selection and precedence. The review
found that shadcn/Skeleton tabs and all three steppers still read the removed
flat `config.vertical` through merged options. They now read only local
`options.vertical`, as Flowbite tabs already did. Mounted Categorization and
stepper suites pass **10/10 Flowbite, 10/10 shadcn and 9/9 Skeleton**;
selection/accordion/stepper suites pass **12/12 Flowbite, 10/10 shadcn and
10/10 Skeleton**. The full demo build passes. The canonical Categorization
demo passes **12/12**, and a production matrix with opposing local and removed
flat orientation settings passes **72/72** across all removed-location cases.

### ImageView, Label and Separator local-option roles — 2026-10-26

The ImageView schema declares local width and height, but the three Svelte
families previously rendered only natural image size. A shared dimension
resolver now accepts nonnegative pixel counts and supported nonempty CSS
dimensions, ignoring invalid values; local dimensions reach each family's
native image. Separator orientation now reads only local `options.vertical`,
so the removed flat `config.vertical` cannot change it. The base Label's
declared `options.format` has no portable rendering contract: the ordinary
renderer leaves text escaped and literal, while the extended renderer selects
Markdown through its separate `options.markup` key.

The new mounted presentation suite passes **2/2 per family**, the Label suite
passes **3/3 per family**, the full library/Web Component/demo build passes,
and the four-example production matrix passes **48/48** across family, EN/BG
and native/Web Component hosts. These four paths bring the local-option ledger
to **13/183** reviewed role/path pairs.

### ListWithDetail local-option role — 2026-10-26

All five declared ListWithDetail options are now tied to consumers and
behavioral evidence. An inline local `detail` renders in the selected pane;
`elementLabelProp` reads an item-relative dotted data path rather than the
removed flat label setting. Local `hideArraySummaryValidation` suppresses the
summary while preserving row errors, `restrict` guards add/remove at
minItems/maxItems, and `showSortButtons` exposes guarded reorder actions.
Explicit local false values override opposing flat booleans. The mounted
ListWithDetail suite passes **20/20 in each family**. A production example
with all five local options opposed by global defaults passes **12/12**
family × EN/BG × native/Web Component cases after demo-common and all three
demo builds. The local-option ledger is **18/183** reviewed role/path pairs.

### Markup host defaults — 2026-10-26

The shared markup resolver reads only the nested
`config.jsonformsExtended.markup` namespace. Markdown is enabled by default,
an explicit host false refuses a local Markdown request with a localized
diagnostic, the extended profile enables headings, and local typography
overrides its host default. Helper Markdown/markup suites pass **20/20**;
mounted label cases pass **7/7**. Demo-common and all three demo builds pass,
followed by **48/48** production cases across family, EN/BG and native/Web
Component hosts for default, disabled, extended-profile and no-typography
presentations. The five nested markup namespace rows are reviewed:
**132/145** canonical entries reviewed, **11** unreviewed and **2** explicit
Monaco theme/mode gaps.

### AllOf enclosing and referenced fields — 2026-10-25

React shadcn's allOf `$defs` case is now mirrored in all three Svelte native
families. An imported object with an enclosing `code`, a referenced `width`
and a branch `geometry` renders three distinct inputs and retains its data.
The final AllOf suites pass **4/4 per family**; the adjacent scalar-composition
suites pass **5/5 per family**. This closes that bounded P5.1
reference/enclosing-field case; the broader composition presentation and
production matrix remain open.

### AllOf and scalar composition production presentation — 2026-10-25

The canonical combinators demo now has a separate production matrix for
enclosing/branch allOf fields and scalar anyOf/oneOf editors. All **12/12**
EN/BG × family × native/Web Component cases pass: equipment shows its name,
asset tag and working state once; attendees and seats each have one input
without inherited alternative bounds; 30 and 15 are displayed invalid and
stored as exact numbers. Adjacent combinators and active-branch suites bring
the production run to **36/36**. Native EN allOf and BG scalar screenshots
were reviewed for all three families. The shared shadcn tab trigger previously styled an
unemitted `data-active` attribute; it now follows Bits UI's
`data-state="active"`, and the production test checks computed active styling.
Skeleton screenshots wait for the animated indicator to reach the selected
tab. The full demo build passes. P5.1 remains open for broader oneOf/anyOf
selection, contradictory compositions and recursive/reference acceptance.

The follow-up anyOf selection check records the change-call count before a
user-selected view change and asserts no write in all three native families
(**7/7** AnyOf cases per family). The production combinators matrix passes
**12/12** EN/BG × family × native/Web Component cases and confirms the stored
`location` remains `{ "room": "Willow Room" }` after switching to Online and
back to On site. This verifies the selection-without-write case; generated and
authored oneOf transitions and broader composition profiles remain open.

The follow-up canonical combinators matrix passes **12/12** cases across
Flowbite, shadcn and Skeleton, EN/BG, and native/Web Component hosts for the
schema-condition and discriminator tabs. Turning Urgent on shows both authored
`neededBy` controls and a form-level validation error without a required
attribute; turning it off hides only the UI-ruled control and clears the
conditional error. Changing appointment Method from collect to post to none
switches the visible fields while retaining the prior collection point in
stored data. The full combinators and composition-presentation production
files pass **36/36** together. This is bounded evidence; contradictory and
recursive composition acceptance remains open.

The canonical oneOf contact form now passes **12/12** authored and **12/12**
generated production cases across EN/BG, three families and both hosts. The
generated run clears the UI Schema and verifies that the authored category
tabs disappear. Selecting Phone contact and declining confirmation preserves
`{ name, kind: 'email', email }`; accepting preserves `name`, replaces `kind`
with `'phone'`, removes `email` and applies the empty `phone` default. The
test reads the stored Data editor after both decisions, mirroring React
Antd's worked branch-change case.

Generated presentation now has its own **12/12** production matrix. Clearing
the UI Schema removes the authored categories; the default layout shows the
imported allOf equipment name, asset tag and checked working flag once, one
input for each scalar composition without inherited branch bounds, and
localized anyOf tabs. Switching Online and back leaves the stored room intact.
Entering 30 attendees and 15 seats marks both inputs invalid while the Data
editor retains exact numeric values. English native screenshots were reviewed
for all three families. P5.1 remains open for contradictory compositions and
recursive/reference profiles.

### Contradictory scalar allOf — 2026-10-25

The fixture `scalar-contradiction` has an integer with `allOf` minimum 10 and
maximum 5, so no number can validate. The shared projection test and all
three native ScalarComposition suites verify one editable input with no
impossible native bounds; imported 7 remains unchanged while validation
reports both original branch errors. Edits to 12 and 3 retain the exact
numbers and report the corresponding maximum or minimum error. Focused tests
pass **5/5** shared and **6/6** per family. Dedicated authored and generated
demo examples each pass **12/12** EN/BG × family × native/Web Component cases;
the production matrix confirms initial invalid presentation, exact stored 3
after editing and no nested validation-button in Shadcn/Skeleton Demo tabs.
Their validation popovers open and close independently from the tab. All six
English native screenshots were reviewed. The full demo build and
adjacent structured-error-summary matrix pass. Object contradictions and
recursive/reference composition profiles remain open under P5.1.

The spec provenance audit also passes **47/47** imported fixtures after the
mixed-control host's branch i18n and nested presentation options were moved
from canonical source JSON into the demo adapter and supplemental catalog.
The localized active-branch production matrix passes **12/12** with that
adapter, and its focused translation test and demo-common build pass.

### Contradictory object allOf — 2026-10-25

The `object-contradiction` fixture has two allOf branches constraining the
same `element.code` path to at least five and at most two characters. All
three native AllOf suites pass **5/5**: both branch editors display the
imported value, an edit in one updates the other and the exact stored object,
and the original validation changes from both errors to the applicable
maximum error. Authored and generated production examples pass **12/12**
each across EN/BG, three families, and native/Web Component hosts. The matrix
checks both localized branch editors, initial invalid state, synchronized
edits and exact Data editor content. English native screenshots were reviewed
for all three families. The full demo build passes. P5.1 remains open for
recursive-reference composition and direct/local error acceptance.

### Finite recursive allOf reference — 2026-10-25

A local `$defs/Node` reference with an allOf object schema previously rendered
an absent `next` as another full form and overflowed the stack. A shared
ancestor-schema guard now stops that recursion only at missing data and offers
a localized action to create one object child. Required missing-child errors
stay in document validation and display beside that action. The three AllOf
native suites pass **8/8** each: two imported levels render without data
mutation, the action creates exactly one level, readonly disables it, and a
non-terminating required reference moves the error to the new leaf. Explicit
creation also applies a field default from the allOf branch without creating a
grandchild. Optional, required and defaulted `recursive-composition` demos
pass **36/36** EN/BG × family × native/Web Component cases, checking finite
presentation, local required feedback, one-child creation and exact stored
data. English native screenshots
were reviewed for all families; the full demo build passes. Other recursive
combinator/reference profiles remain open under P5.1/P5.8.

### Ordinary-form recursive oneOf — 2026-10-25

The new `recursive-oneof` development example reuses the imported canonical
recursive-tree schema and translations but dispatches `populated` as a regular
Control. Its first file has an invalid empty name. All three native OneOf
suites pass **12/12**: the parent remains a Folder and Add retains the invalid
file while creating one sibling. They also verify that invalid nonempty data
retains its exact value and document errors while the first branch stays open
for correction, matching the React fallback policy. The selection matrix passes **12/12**
EN/BG × family × native/Web Component scenarios. The canonical node's `{}`
default leaves the added child unselected with localized missing-kind selector feedback in all twelve cases. Cancelling
the default confirmation retains that state; confirming Folder initializes
`{ kind: 'folder', children: [] }` without changing the existing file or
nested folder. English native before/after screenshots were reviewed for all
three families. A separate external-replacement matrix passes **12/12**: removing
`populated` clears its selector and stale detail, and restoring a File displays
its incoming values without changing stored JSON. A third **12/12** matrix
confirms that clearing a selected object-only array child retains `{}` in its
original position and leaves both siblings untouched. The combined production
suite passes **36/36**. The full demo build passes. Other recursive OneOf
profiles remain open under P5.3/P5.8.

### OneOf complex confirmation and incoming discriminators — 2026-10-25

After a user explicitly chooses a discriminated branch, all three native OneOf
suites now pass **13/13** and follow a later host-provided value whose valid
discriminator selects another branch. The renderer releases its temporary
user-choice lock once the committed data matches that choice; it does not
clear the lock for ambiguous overlapping alternatives. The imported contact
example passes a new **12/12** EN/BG × family × native/Web Component complex
confirmation matrix: switching from `{ name, kind }` to Phone does not prompt
and keeps `name`; switching from `{ name, kind, email }` prompts, Cancel keeps
the exact email value, and Confirm keeps `name` while applying Phone defaults.
The combined contact OneOf matrix and adjacent recursive OneOf matrix each
pass **36/36**. The full renderer, Web Component and demo build passes.

### Overlapping object oneOf alternatives — 2026-10-25

An authored pair of object branches both require `shared` and offer separate
optional detail fields. The initial `{ shared: "ambiguous" }` matches both, so
oneOf remains invalid. All three native OneOf suites pass **14/14**: selecting
the second editor, then replacing data with `{ shared: "external" }`, keeps
that editor, retains exact data and the original oneOf error. The production
overlap matrix passes **12/12** EN/BG × family × native/Web Component cases.
Flowbite edits `shared` in the mounted form because its Demo tab remounts after
visiting Data; Shadcn and Skeleton apply host data through the retained Demo
tab. All cases retain the second editor and an error indicator. The full
contact OneOf suite passes **48/48**; other recursive/reference profiles
remain under P5.3.

### Nested recursive oneOf child creation — 2026-10-25

The ordinary-form recursive OneOf example now checks creation beneath the
existing Archive folder, one level below Documents. The new EN/BG × family ×
native/Web Component matrix passes **12/12**: it expands Archive, adds one
unselected child, confirms File, and compares the complete populated value.
The pre-existing file, Archive's first child, and all enclosing fields retain
their values; the new child is `{ kind: "file" }` pending its required name.
A further **12/12** matrix switches the existing Archive Folder to File:
Cancel retains Archive and its child, while Confirm removes its branch fields,
initializes `{ kind: "file" }`, and preserves the enclosing Documents fields
and sibling file. The full recursive OneOf production suite passes **60/60**.
Other reference contexts remain open under P5.3/P5.8.

### Root-scoped recursive oneOf reference — 2026-10-25

A derived development example places the canonical File/Folder alternatives at
the document root, then changes Folder `children.items` to `$ref: "#"`. It
retains the canonical node's empty-object default and translations. All three
native OneOf suites pass **15/15**: the root Folder and an existing child
render through real registries without a data write. The EN/BG × family ×
native/Web Component matrix passes **12/12**: an existing File remains editable,
Add creates an unselected child with missing-kind feedback, and confirmed
Folder selection stores one finite child while preserving both siblings. The
full demo build and 47-fixture provenance audit pass. This proves a local root
reference context only; nested `$id` rebasing and supplied external documents
remain open under P5.8.

### Boolean subschema in the Draft-07 metaschema — 2026-10-25

The unmodified official Draft-07 metaschema accepts `false` as an authored
schema value. All three native registry suites pass **3/3**: they load the
inventory document with `properties.quantity: false`, expose its Boolean
editor, change it to `true` and back, and retain the exact imported document
without validation errors. The EN/BG × family × native/Web Component
production matrix passes **12/12** after applying the same document through
each demo's Data editor. It verifies the form transition and the final
`quantity: false` value while retaining all imported fields. Production Ajv
uses `useDefaults: true`, so ordinary validation can add the metaschema's
declared defaults; the matrix allows those additions. The adjacent
presentation/metaschema production suite also passes **12/12**. This covers
boolean schema values authored through the metaschema; nested `$id` and
external-document reference resolution remain open under P5.8.

### Document-local nested `$id` recursion — 2026-10-25

JSON Forms core maps `#` from the document root even inside a nested `$id`
resource. A finite recursive object with `Node.$id: "node.json"` and
`Node.properties.child.$ref: "#"` consequently expanded without bound or
created `{node:{}}` at the child path. The shared form entry now rebases
document-local resource references to root JSON pointers before mapping and
validation, retaining the original schema and data inputs. Ordinary schemas
and identifier-only schemas without a local reference keep identity; user
defaults are untouched, and external URI references are absolutized when a
document-local rewrite needs them. The same pass maps document-local `$anchor`
references to root pointers, both at the root and inside nested resources;
dynamic anchors keep their original path.

All three families now stop at an absent repeated object and offer an explicit,
readonly-guarded Add node action. The shared resource tests pass **4/4**,
including Ajv validation equivalence, escaped pointer names and root/nested
anchors. Each family's native registry tests pass **4/4** for a root pointer,
nested `$id`, root anchor and nested-resource anchor:
populated leaf editing, exact finite child creation and editing the newly
created third level. The pointer and anchor development demos' combined
EN/BG × three families × native/Web Component matrix passes **24/24** with
exact stored data and no page errors. `pnpm run build:demo` and the four
affected package checks pass. This certifies document-local pointer and anchor
resources with an absolute root identifier. Supplied external documents,
dynamic references and broader reference combinations remain open in P5.8;
unknown-anchor diagnostics are covered in the next section.

### Unknown document-local anchor diagnostic — 2026-10-25

An unknown local anchor such as `#missing` makes Ajv throw `MissingRefError`
before the form can mount. The shared form now catches that specific failure,
keeps the supplied value, suppresses the untrustworthy editor, and displays a
translated form-level alert. The same reference appears in one owner-independent
additional error, so validity is `current: false` and `valid: false`. Host data
replacement is retained, and replacing the schema with a resolvable one removes
the diagnostic and restores editing. Local anchor discovery runs before
validation, so initial and switched `NoValidation` modes retain this behavior.
Other compile failures still propagate normally.

Each family now passes **8/8** native local-reference cases, including EN/BG
unknown-anchor diagnostics, host replacement, schema recovery and initial/mode-
switched `NoValidation`. The separate unknown-anchor development demo passes
**12/12** EN/BG × family × native/Web Component production cases with exact
unchanged data and no page errors. Supplied external document resolution and
`NoValidation` diagnostics are covered below.

### Host-supplied external schema documents — 2026-10-25

When the host Ajv already registered an external schema document, validation
could follow its `$ref` but JSON Forms mapping could not render the referenced
fields. The form now builds a presentation-only schema with local pointers to
those registered documents, including transitive documents and local anchors.
The original schema remains in the validation core, preserving Ajv options and
external schema paths in validation errors. No URL is fetched. This profile
supports absolute-root and anonymous-root schemas with absolute external
references to documents discoverable through `ajv.getSchema(documentUri)`;
an unavailable document retains the unresolved reference diagnostic and
recovers when the host replaces Ajv with a registered instance.

The shared resource unit tests pass **11/11**, including transitive anchors,
collisions, anonymous roots, nested Ajv resources, missing documents,
unknown anchors and missing pointers. Native registry tests pass **10/10 per
family** for scalar/object and anonymous-root editing, original external
validation paths, host Ajv replacement recovery, and owner-independent
missing-document, anchor, pointer and anonymous-relative diagnostics under
`NoValidation`. A missing resource remains diagnosed
after switching into `NoValidation` and recovers when a registered host Ajv
arrives. These diagnostics retain data and suppress the unconstrained editor.
The identified, anonymous and nested-resource `supplied-reference` development
examples pass **36/36** EN/BG × family × native/Web Component production cases
with exact stored edits and no page errors. `pnpm run build:demo` passes.

### Unsupported dynamic-reference rendering — 2026-10-25

The default JSON Forms Ajv instance uses Draft-07. A host can supply a validator
that accepts newer dialects, but JSON Forms' static root-pointer mapping does
not preserve `$dynamicRef` scope. The form now detects `$dynamicRef` only in
schema-valued keywords, displays a distinct translated diagnostic, preserves
data and suppresses an unconstrained editor. It emits one owner-independent
`$dynamicRef` error so combined validity stays false, including in
`NoValidation`; replacing the schema with a supported one restores editing.
An anonymous root's relative external `$ref` also receives a diagnostic
without inventing a base URI. Static host-registered absolute external refs
remain supported.

The dynamic-reference scanner passes **2/2** unit cases. Each native family
passes **2/2** EN/BG dynamic diagnostic and recovery cases, plus **10/10**
external-reference cases. The `dynamic-reference` production example passes
**12/12** EN/BG × family × native/Web Component cases; together with the
supplied-reference and unknown-anchor examples, the production reference
matrix passes **60/60**. Full dynamic-scope rendering, conditional-template
combinations and broader visual acceptance remain open under P5.8.

### Conditional object branches reached through references — 2026-10-25

An object control with `allOf: [{ "$ref": "#/definitions/Branch" }]` previously
rendered through the AllOf adapter. Its base field appeared, but the referenced
`if`/`then`/`else` field did not: the conditional enablement check saw only the
root passed to the tester. The shared check now follows references using the
form root, and the object tester resolves the control scope before ranking a
conditional object over generic AllOf. The projector keeps the original
document for validation and data; active-field changes leave inactive members
stored, including in `NoValidation`.

The shared conditional suite passes **7/7**, including local and finite recursive
references. Each family passes **2/2** mounted local/host-registered cases with
active VAT editing, branch switching and exact inactive-data retention. The
`conditional-local-reference` and `conditional-supplied-reference` demos pass
**24/24** EN/BG × family × native/Web Component production cases. A populated
two-level recursive conditional reference also passes **1/1** mounted case per
family and **12/12** production cases: each level projects its own active fields,
child edits retain inactive values at both levels, and traversal stops at absent
children. The combined reference production matrix passes **36/36**. The existing
conditional-fields, composition-presentation and contradictory-object AllOf
production regressions pass **48/48**. `pnpm run build:demo` passes. Other
conditional-template and recursive-reference profiles and broader visual
acceptance remain open under P5.7/P5.8.

### Local layout option consumption — 2026-10-26

The Group, HorizontalLayout and generic Layout option roles are reviewed path by
path, bringing the declared local-option ledger to **42/183** pairs. The shared
sizing helper applies local alignment, justification, gap, wrapping, grid and
minimum-width rules in all three families. Grid columns and minimum item width
affect horizontal children; a Group stays vertical. The splitter variant owns
resizability, while ordinary layouts and Groups do not gain separators from the
boolean alone. The local Group `showBorder: false` now removes the family frame.
The local UI-schema copy now describes the 16px gap default and the splitter
selection rule accurately.

Mounted Group suites pass **9/9** shadcn, **8/8** Flowbite and **8/8** Skeleton;
portable sizing suites pass **13/13** per family. The focused validation-badge
popover test passes **1/1**. All three base-family Svelte checks report zero
errors and warnings. Focused extended SplitLayout suites pass **13/13** shadcn,
**14/14** Flowbite and **14/14** Skeleton. The split-layout production matrix
passes **12/12** family × locale × native/Web Component cases, including fixed
and interactive separators. The local Group border example passes another
**12/12** production cases with computed border removal and retained content.
`pnpm run build:demo` and the rebuilt example apps pass. The remaining **141**
local role paths are still open.

### Control child layout participation — 2026-10-26

The nine declared Control `options.layout` paths are reviewed, moving the
local-option ledger to **51/183** role/path pairs. Bound Controls in each family
now have direct mounted checks for fixed width/height, Fixed-over-Span/Weight
precedence, and min/max dimensions; each portable sizing suite passes **14/14**.
The existing spec layout example passes **12/12** EN/BG × family ×
native/Web Component production cases for 4/8/4 spans, 2/2/1 weights,
fixed width and effective visible children. Shared pure sizing tests cover
invalid hints, vertical weight and zero minimum precedence. The remaining
**132** local paths belong to other Control option families.

### Control temporal local options — 2026-10-26

The eight Control date/time display, save, AM/PM and view paths are reviewed;
the local-option ledger is **59/183**, with **124** Control paths left. Existing
`ConfigTemporal` suites pass **33/33** in each family for local-versus-flat
precedence, independent display/storage formats, 12-hour presentation and
calendar/time view selection. The temporal views and full temporal production
matrices pass **24/24** EN/BG × family × native/Web Component cases together.
One earlier combined run reverted a masked shadcn date input. The production
test now waits for the fixture's initial masked value before editing; the
isolated case passed five consecutive repeats and the corrected combined
matrix passed **24/24**. The earlier intermittent interaction was not reproduced
after the readiness check.

### Control numeric local options — 2026-10-26

The Control `options.slider` and `options.step` paths are reviewed, moving the
local-option ledger to **61/183** role/path pairs with **122** Control paths
remaining. The numeric regression test reproduced a step precedence defect in
both number and integer inputs: an undeclared flat `config.step` overrode the
schema's `multipleOf`. Numeric text inputs now resolve step from the local
Control option, then schema `multipleOf`, then the type fallback. Sliders still
use the schema's step independently. Focused native numeric/slider/constraint
suites pass **34/34** in Flowbite, **34/34** in shadcn, and **35/35** in
Skeleton. The existing and new numeric production examples pass **24/24**
EN/BG × family × native/Web Component cases together. The full demo build
passes. The shadcn validation badge's interactive popover test passes **1/1**.

### Control mask local options — 2026-10-26

The six Control mask paths (`mask`, `returnMaskedValue`, `tokens`,
`tokensReplace`, `eager`, and `reversed`) are reviewed, moving the local-option
ledger to **67/183** with **116** Control paths remaining. A string/array mask
selects the generic masked-string renderer; a boolean temporal mask toggles
date/time input guidance without selecting that renderer. Flat family mask
settings supply defaults, and local options win. Added family-native checks
for storage precedence, `tokens` over legacy `maskReplacers`, and removed
tokens under both `tokensReplace` settings. The complete mask suites pass
**22/22** in each family. The existing string-controls production matrix passes
**12/12** EN/BG × family × native/Web Component cases.

### Control hint and focus local options — 2026-10-26

The Control `placeholder`, `hideRequiredAsterisk`,
`showUnfocusedDescription`, and `focus` paths are reviewed; the local-option
ledger is **71/183** with **112** Control paths remaining. The new production
example verifies flat defaults against explicit local empty/false values,
unchanged input values and required state, visual asterisk suppression,
description visibility on focus and blur, and native/Web Component hosting.
It passes **12/12** EN/BG × family × host cases. The existing initial/choice
focus production matrices pass **120/120**. The native field-presentation and
text-basics suites pass **16/16** in each family, including an explicit check
that hiding the asterisk leaves the input required. The full demo build passes.

### Control editing-policy local options — 2026-10-26

The Control `clearable`, `readonly`, compatibility `readOnly`, and `restrict`
paths are reviewed, moving the local-option ledger to **75/183** with **108**
Control paths remaining. A new production example compares inherited read-only
state with local writable overrides, local clear affordance over a disabled
global default, and local restricted text entry over unrestricted flat config.
It passes **12/12** EN/BG × family × native/Web Component cases; the existing
temporal restriction production matrix passes **12/12** alongside it. Native
read-only, clearable, text constraint, and mutation-guard suites pass **39/39**
in Flowbite, **41/41** in shadcn, and **39/39** in Skeleton. A new native case
confirms local writable state can override schema `readOnly` but not a form-wide
read-only lock. The full demo build passes.

### Control multiline, suggestions, and autocomplete — 2026-10-26

The Control `multi`, `suggestion`, and `autocomplete` paths are reviewed,
moving the local-option ledger to **78/183** with **105** Control paths
remaining. Native multiline, suggestion, autocomplete, and multiline-renderer
suites pass **15/15** in Flowbite, **13/13** in shadcn, and **13/13** in
Skeleton; an added native case in each family confirms suggestions remain
advisory and accept other schema-valid text. The existing choice-selection,
multiline-config, and suggestion-config production matrices pass **36/36**
EN/BG × family × native/Web Component cases. The shadcn popup viewport
matrix passes **4/4** after its test-specific timeout was set to 60 seconds;
the six wheel/keyboard/touch paths take about 33 seconds per matrix run.
Control `options.format`, which selects several other renderer families,
remains open for its own audit.

### Control local format selection — 2026-10-26

The Control `options.format` path is reviewed, moving the local-option ledger
to **79/183** with **104** Control paths remaining. A registry regression
reproduced core's temporal tester accepting UI `format: date`, `time`, or
`date-time` on a numeric Control; all three Svelte families now require a string
target for those renderers. Their native registry suites pass **12/12** per
family, and base/extended/complex registry coverage passes across all families.
The new local-format production example confirms UI-driven temporal and
password selection plus numeric fallback; it passes **12/12** EN/BG × family ×
native/Web Component cases. Combined radio, cards, color, Cron, duration, code,
password, temporal, and local-format production matrices pass **108/108**.
The full demo build passes. The duration and new format tests now wait for
Web Component initialization under parallel load; the Cron scroll test waits
for its final option to settle before selecting it.

### Control choice presentation — 2026-10-26

Enum-array checkbox groups in Flowbite, shadcn, and Skeleton now read
`options.vertical` from the current Control only. A flat `config.vertical`
or tuple default cannot stack their choices. The rendered group declares its
horizontal or vertical orientation. Matching native browser suites pass
**6/6 per family**, including absent/local true/local false precedence and
visual layout assertions. The broader Control `options.vertical` ledger path
is now reviewed with the radio, card, and tuple uses. Choice cards also take
`vertical` and `showRadio` from the current Control; flat config no longer
changes their layout or radio-circle visibility. Flowbite and shadcn card
groups announce their drawn orientation, matching Skeleton's existing
behavior. Combined card, checkbox, radio, switch, and registry native suites
pass **41/41 in each family**. The three Control paths `options.toggle`,
`options.vertical`, and `options.showRadio` move the local-option ledger to
**82/183** with **101** Control paths remaining. The ledger suite passes **8/8**.
The tuple orientation suites pass **39/39 in each family**. The full demo build
passes, and the radio, choice-card, and boolean-control production matrices
pass **36/36** EN/BG × family × native/Web Component cases. The radio scenario
now additionally checks both local checkbox orientations while flat
`config.vertical` is true; its extended matrix passes **12/12**.

### Control variant selection — 2026-10-26

`options.variant` is reviewed for OTP, tuple, chips, multi-select, and AG Grid
selection. The shared array/tuple selector suites pass **30/30**. Native
array-choice, tuple, and OTP suites pass **65/65** in Flowbite, **68/68** in
shadcn, and **67/67** in Skeleton. Added extended-family AG Grid tester cases
confirm that only a local `variant: "ag-grid"` on an array matches; those suites
pass **11/11 per family**. The array-choice, tuple, password, and AG Grid
production suites pass **48/48** EN/BG × family × native/Web Component cases;
the grid scenario needed a 30-second per-case timeout because two native cases
exceeded the previous 5-second test limit under a parallel run, and its
isolated **12/12** rerun passes. The local-option ledger advances to **83/183**
with **100** Control paths remaining. This review covers variant selection;
the full behavior of each selected renderer remains tracked in its own TODO
area.

### Control card-choice customization — 2026-10-26

`options.choices` now validates each custom value or branch identifier before
applying card presentation. Duplicate, unknown, out-of-range, and ambiguous
identifiers are ignored and reported with author-facing diagnostic codes; valid
entries keep their structural value identity and may supply localized labels,
disabled state, safe content, selected content, and branch detail. The shared
choice-card contract suite passes **12/12**. Comparable native card suites pass
**14/14 in each family**, including duplicate/unknown diagnostics, translated
labels, selected-content swapping, typed values, disabled choices, keyboard
selection, and branch detail. The local-option ledger advances to **84/183**
with **99** Control paths remaining. The full demo build and the choice-card
production matrix pass; the latter covers **12/12** EN/BG × family ×
native/Web Component cases.

### Control local confirmation policy — 2026-10-26

The Control `options.confirmation` container and its `typeChange`,
`branchChange`, and `delete` paths are reviewed. Each operation resolves its
local value before the semantic renderer catalog, global default, and fallback;
malformed policy values do not disable confirmation. A new shared case checks
that overriding one operation does not override the other two. Shared policy
tests pass **24/24**; native mixed, oneOf, card, collection, pending-edit, and
tree suites pass **94/94 in each family**. Production deletion, branch pending,
collection pending, oneOf composition, and tuple ownership matrices pass
**96/96** EN/BG × family × native/Web Component cases. The local-option ledger advances to
**88/183** with **95** Control paths remaining.

### Control Add/Delete permissions — 2026-10-26

Control `options.disableAdd` and `options.disableRemove` are reviewed. They
default to false; a local false overrides flat config true, but does not
override readonly, disabled state, schema bounds, or restriction policy.
Neither flag disables editing existing values or reordering. Native array,
tree, tuple, and pending-edit suites pass **70/70 per base family**; extended
AG Grid command suites pass **27/27 per family**. The config-action and
collection-action production matrices pass **24/24** EN/BG × family ×
native/Web Component cases. The collection-action scenario now uses a
30-second per-case test limit because its composition, reorder, and editor
checks exceeded the default 5-second limit in two Skeleton native runs; its
full isolated rerun passes **12/12**. The ledger advances to **90/183** with
**93** Control paths remaining.

### Control sort-button presentation — 2026-10-26

Control `options.showSortButtons`, `showArrayLayoutSortButtons`, and
`showArrayTableSortButtons` are reviewed. Generic and matching legacy
presentation flags are ORed after each local option overrides its flat config
counterpart; the other presentation's alias has no effect. Move controls stay
disabled at boundaries or when a mutation is prohibited, independently of
Add/Delete permissions. The shared resolver passes **2/2**, native array
sort/action suites pass **45/45 per family**, and the separate ListWithDetail
role's generic sort behavior remains covered by **20/20 per family**. The
production alias/reorder matrix passes **12/12** EN/BG × family × native/Web
Component cases. The ledger advances to **93/183** with **90** Control paths
remaining.

### Control composite Clear options — 2026-10-26

Control `options.showEmptyButton` and `options.emptyLabel` are reviewed for
composite cell and tuple-position dialogs. The selected cell or position can
enable and relabel Clear over a tuple-level value; flat and removed namespaced
global values do not expose or relabel it. Clear changes only the dialog draft
until Apply, preserves the object or array position, and remains disabled when
readonly, removal policy, empty data, or restrict/schema prevention disallows
the action. This matches the React Antd composite dialog behavior. Native
composite and tuple suites pass **59/59 per family** across Flowbite, shadcn,
and Skeleton, including added local false and label overrides. The ledger
advances to **95/183** with **88** Control paths remaining.

### Control tuple border — 2026-10-26

Control `options.showBorder` is reviewed for tuple controls. The local boolean
overrides the flat config value in both directions; the removed namespaced
value has no effect. Borderless tuples retain their heading, fields, and
errors, matching the React Antd and shadcn tuple presentation contract.
Native tuple suites pass **59/59 per family**, and the production composite
presentation matrix passes **12/12** EN/BG × family × native/Web Component
cases. The ledger advances to **96/183** with **87** Control paths remaining.

### Control dynamic-property and tuple-tail options — 2026-10-26

The Control `options.additionalProperties` and `options.additionalItems` bags
contain scoped pagination settings. Each local `pagination` value overrides
the corresponding `config.jsonformsExtended` setting as a whole, including
explicit `false`; an absent local child inherits only its own collection kind.
The default is five entries per page. The production pagination matrix passes
**12/12** EN/BG × Flowbite/shadcn/Skeleton × native/Web Component cases,
including edits across pages and tuple-tail Add. The shared pagination tests
pass **5/5**.

Control `options.allowAdditionalPropertiesIfMissing` permits the dynamic-property
editor only when the schema omits `additionalProperties`; explicit schema
`false` still wins. Control `options.allowEmptyPropertyNames` gates literal
empty-string names during Add and Rename. Both local booleans override their
flat config values in either direction; removed namespaced values are ignored.
The corresponding browser suites pass **42/42 shadcn**, **38/38 Skeleton** and
**38/38 Flowbite**. The ledger advances to **102/183** with **81** Control
paths remaining.

### Control collection pagination and presentation — 2026-10-26

Control `options.pagination` selects array page settings for tables, expandable
arrays, list-with-detail and AG Grid. Tables default to five rows per page;
expandable arrays and list-with-detail default to no pagination. A local value
replaces the scoped `config.jsonformsExtended.array.pagination` setting as a
whole, including `false`; the removed flat pagination locations remain ignored.
Control `options.hideAvatar` removes only the visible numbered marker from
expandable arrays and list-with-detail. Control
`options.hideArraySummaryValidation` removes only the aggregate child-error
summary from collection views. Item identity, accessible index, own errors and
field feedback remain. Both local booleans override flat config in either
direction. This matches the React Antd array and list presentation behavior.

New local-true cases complement default, global-true and local-false cases.
Focused browser suites pass **45/45 per family**, and the production pagination
and presentation matrices pass **24/24** EN/BG × family × native/Web Component
cases. The schema-path ledger and shared pagination tests pass **13/13**. The
ledger advances to **105/183** with **78** Control paths remaining.

### Control array disclosure options — 2026-10-26

Control `options.collapsed` supplies the initial outer-panel and expandable-item
state. It overrides the scoped array default and then the shared namespaced
default; legacy local `initCollapsed` applies only without a portable default.
The outer panel closes only when the resolved `collapsible` value is true. The local
boolean overrides namespaced and flat collapsible settings in both directions;
false keeps content visible even when collapsed is true. Control
`options.collapseNewItems` separately decides whether a newly inserted item
starts closed, without closing an already open item. Its local value overrides
flat config, including false. These disclosure distinctions match the React
Antd array behavior.

New local collapsible true/false cases pass with the existing scoped collapse
and insertion cases: **27/27 native browser tests per family**. The array-panel
and new-item production matrices pass **24/24** EN/BG × family × native/Web
Component cases. The schema-path ledger and shared collapse resolver tests
pass **15/15**. The ledger advances to **108/183** with **75** Control paths
remaining.

### Control validation and type indicators — 2026-10-26

Control `options.showValidationIndicator` now has reviewed consumers in mixed
and recursive containers and collection child summaries. Local false suppresses
the marker or child summary without hiding field errors or changing validation.
Control `options.showValidationIndicatorCount` independently chooses a number
or presence-only marker for enabled container indicators. A new local-false
regression verifies that the count can be suppressed over namespaced config.
Control `options.showTypeIndicator` controls the object/array marker on a
composite cell; local false overrides the flat setting, and the marker is
aria-hidden and independent of the summary. These paths match their React
counterparts. The declared Control `showDataIndicator` path was subsequently
reviewed as inapplicable: both the React contract and Svelte consumers scope
the marker to Group and Category headers. A child Control option does not
enable its containing Group indicator; placing the option on the Group does.

The focused indicator and composite browser suites pass **30/30 per family**;
the shared validation and ledger tests pass **19/19**. The production composite
and structured-error matrices pass **24/24** EN/BG × family × native/Web
Component cases against freshly rebuilt bundles. That run exposed an expanded
shadcn Web Component summary ending below a 700px viewport. The shared error
list now scrolls within 35dvh; the production test checks both horizontal and
vertical bounds and the Show less action remains clickable. The ledger advances
to **111/183** with **72** Control paths remaining at that checkpoint.

### Dynamic-property Rename validation parity — 2026-10-26

The Svelte Rename preview now reports the individual `propertyNames` failures
from the same schema as React Antd: `sensor-z` shows the nine-character rule,
and `senso` shows both that rule and the `^sensor-` pattern rule. An unchanged
invalid imported key remains visible as invalid until it is corrected, while
duplicate-name prevention and the host validator still block invalid commits.
The focused name-validation and production demo suites pass **40/40**, and the
shared Svelte package build passes.

### Dynamic-property name fallback and Control data-indicator scope — 2026-10-26

The Svelte dynamic-property name validator now uses its default Ajv when the
host does not supply one, matching React's fallback. A focused regression
proves a name that violates both `minLength` and `pattern` retains both
constraint errors without host Ajv. Fresh demo and Web Component builds pass;
the Additional Properties production matrix passes **16/16** across EN/BG,
three families and native/Web Component hosts, including `sensor-z`, `senso`
and a pattern-only rename draft. The Group tests pass **10/10** shadcn and
**9/9** each Skeleton and Flowbite. They confirm a child Control
`showDataIndicator` option has no effect and a Group-local option enables the
data marker. The local-option ledger advances to **112/183**, leaving **71**
Control paths.

### Control stepper-navigation option scope — 2026-10-26

The declared Control `showNavButtons` path is inapplicable to a child field.
Both React and Svelte consume this option on the Categorization stepper. New
browser regressions place local true on a child Control and observe no Previous
or Next buttons, then place local true on the Categorization and observe both.
The focused suites pass **6/6** shadcn, **5/5** Skeleton and **7/7** Flowbite.
The local-option ledger advances to **113/183** with **70** Control paths left.

### Control collection item-label paths — 2026-10-26

The spec keeps `elementLabelProp` and legacy `childLabelProp` on the collection
Control. Both are item-relative data paths; local `elementLabelProp` wins over
the alias, then the first primitive item property supplies the fallback.
Global fields of these names are removed from common authoring. The existing
array-header and ListWithDetail browser suites verify local, alias, precedence
and fallback behavior; their focused run passes **43/43 per family**. No runtime
change was needed. The local-option ledger advances to **115/183**, with **68**
Control paths left.

### Control composite summary descriptors — 2026-10-26

The selected Control or cell-local `summary` descriptor chooses a bound
Control preview or a Label presentation in place of the generated object or
array summary. A Control summary's `scope` resolves relative to the composite
value, including each array item; Label summaries use their text presentation.
Removed global and nested cell summary locations are not fallback sources.
The focused composite browser suite passes **22/22 per family**, and the
shared summary resolver passes **3/3**. The local-option ledger advances to
**118/183**, with **65** Control paths left.

### Control file-byte format bounds — 2026-10-26

The four local `formatMinimum`/`formatMaximum` variants apply to original file
bytes, with inclusive and exclusive boundaries handled separately. Numeric
byte limits belong in UI options; the normal Ajv string-format keywords reject
a numeric schema bound. New browser cases verify each rejected boundary, an
accepted neighboring size, and a local maximum overriding the same flat
config key. The full FileControlRenderer suite passes **35/35** shadcn and
Skeleton and **36/36** Flowbite. The local-option ledger advances to
**122/183**, leaving **61** Control paths.

### Control picker actions and labels — 2026-10-26

Control-local `showActions` changes picker commit timing, with immediate
date/time/date-time behavior by default and staged duration/Cron behavior by
default. Local `okLabel` and `cancelLabel` override the flat form labels in
staged pickers; selected composite dialogs use only their cell or position
options. Cron uses its own localized action labels, and the removed namespaced
location is ignored. The focused temporal suite passes **33/33 per family** and the
duration suite passes **22/22 per family**. The local-option ledger advances to
**125/183**, leaving **58** Control paths.

### Control array table/detail selection — 2026-10-26

React's array Control selects an expandable item layout for a flat array when
`table: false` or a non-`DEFAULT` `detail` is set, while `table: true` or
`format: "table"` forces the table. The three Svelte layout testers now make
the same selection. Mounted tests cover default, both expandable choices,
registered and inline detail, `DEFAULT`, both table overrides, and primitive
array items, passing **31/31 per family**. All three base renderer package checks report zero errors or
warnings, and the existing array table suites pass **5/5 per family**. The local-option ledger advances to **127/183**, leaving **56**
Control paths.

### Control validation display and editor publication — 2026-10-26

The three Svelte families apply Control-local pre-touch enablement and keyword
lists after flat config, preserving local `false` and empty-list overrides.
Mounted EN/BG cases now include a local keyword list that reverses the global
selection: the required message is shown while the host `server` message is
hidden, with document validity unchanged. The focused pre-touch suite passes
**5/5 per family**. Existing branch suites pass **30/30 per family**, covering local
`validateActiveBranch` on/off and `NoValidation`/`ValidateAndHide`; shared
Monaco tests cover local `propagateErrors` ahead of namespaced and flat config,
including owner-scoped diagnostic publication (**18/18** resolver cases and
**7/7 native Monaco cases per family**). These four Control paths move
the local-option ledger to **131/183**, leaving **52** Control paths.

### Control row-detail presentation — 2026-10-26

The row-detail object and its eleven declared members are reviewed against
the React table behavior. Existing mounted cases cover dialog drafts,
panel selection, right/bottom placement, initial collapse, item detail and
resize persistence. New cases prove a row-detail dialog can locally disable
global maximize, drag and resize settings while retaining local width/height,
and that `resizable: false` disables the panel handle. Focused RowDetail suites
pass **9/9 shadcn** and **7/7 Skeleton/Flowbite**. The production row-detail
matrix passes **12/12** across EN/BG × family × native/Web Component and
exercises dialog dimensions, dragging, resizing, maximization, detail and
panel behavior. The local-option ledger advances to **143/183**, leaving **40**
Control paths.

### Control detail-dialog geometry — 2026-10-26

The separate Control-local `dialog` bag is passed through tuple and composite
editors to the shared native dialog geometry resolver. New mounted tuple cases
verify local width, height, drag, resize and a disabled maximize action across
all three Svelte families; the full TupleControlRenderer suites pass **38/38
per family**. Existing geometry cases verify namespaced defaults, local false
overrides, viewport clamps, maximize/restore and draft preservation (**3/3 per
family**). The six Control dialog paths move the local-option ledger to **149/183**, leaving **34**
Control paths.

### Control mixed type-specific detail — 2026-10-26

Each of the seven declared `<type>-detail` options is selected before the
generic `detail` for its matching mixed alternative. New resolver cases pass
**1/1 per family** across string, number, integer, boolean, null, object and
array; mounted nested/tree cases pass **5/5 per family** and the EN/BG ×
family × native/Web Component editor-detail production matrix passes
**12/12**. Null remains selector-only when it has no value editor. The
local-option ledger advances to **156/183**, leaving **27** Control paths.

### Control Monaco option bag — 2026-10-26

The Control-local `monaco` bag replaces the global bag across all three
extended renderer families. Its six members are passed through to the shared
editor, with Monaco-native `model`, `language`, `theme` and `value` kept under
renderer control. The shared editor now matches the pinned React/schema row
defaults: 10 fixed rows, or 3–30 auto-growing rows based on the current text;
fixed `rows` are independent of the auto-grow bounds. The shared component
tests pass **20/20**, shared option tests **18/18**, mounted renderer tests
**8/8 per family**, and the production code-editor plus ledger suites **20/20**.
The seven Monaco paths advance the ledger to **163/183**, leaving **20**
Control paths.

### Control Monaco language, appearance, conversion and dimensions — 2026-10-26

Seven Control-local presentation paths are covered by the existing shared
Monaco helper/component tests, the mounted native renderer tests in each
family, and the 12-case production code-editor matrix. Local language falls
back from an unresolved `:language` root-data path to the fixed language and
then plaintext. Local `theme` takes precedence over the flat theme and mode;
JSON conversion preserves non-string values, and local width/height override
flat dimensions. Removed namespaced locations remain ignored. These paths
advance the local-option ledger to **170/183**, leaving **13** Control paths.

### Control color, recursive tree, conditional fields and mixed layout — 2026-10-26

Eight more Control-local paths are tied to their consumers and existing
mounted tests. The Shadcn color suite passes **15/15**; recursive and mixed
renderer suites pass **28/28** together. Conditional object tests pass
**9/9 per family** after their rename assertions were updated to the specific
pattern validation message and shared Property Name field label. Local color
options preserve explicit false and override the namespaced defaults;
recursive navigation uses its required child/label keys and selected-node
detail; conditional fields preserve local false precedence; mixed layout
defaults to tree. The ledger advances to **178/183**, leaving **5** Control
paths.

### Control grid presentation and inapplicable declarations — 2026-10-26

The final five declared Control paths are accounted for. Local `agGridOptions`
replaces the global native bag; its explicit pagination and column definitions
override portable settings. Portable `columnDefs` and per-property `cells`
drive table/AG Grid presentation. Mounted Shadcn AG Grid option and behavior
suites pass **8/8**, and the EN/BG × family × native/Web Component composite
presentation demo passes **12/12**. The broad schema also declares
`components` and `interpolate` on Control, but neither has a direct Control
consumer: named components are supplied when registering TemplateLayout
renderers, and interpolation belongs to Label options. Their inapplicability
is recorded explicitly. The local-option ledger reaches **183/183**.

### Applied option array and native-bag replacement — 2026-10-26

The generic Control, Layout, Label and Button option builders now share one
merge rule: a local array replaces the global array, including `[]`; local
Monaco and AG Grid option bags replace their global bags. Other nested option
objects still support per-field overrides, and false, zero and empty text are
retained. This removes the observed suggestion-list index merge that kept
unused global entries. Shared resolver tests pass **8/8**, mounted suggestion
tests **3/3 per family**, six base/extended package checks pass, and
representative Shadcn choice/array/validation and Button/AG Grid suites pass
**24/24** and **18/18**. The complete demo/library/Web Component rebuild
passes, followed by the production suggestion matrix at **12/12** across
family, locale and host. The pinned React implementations still use the
generic lodash merge for some flat options; this Svelte rule follows the
upgrade plan's explicit-local-array contract and removes stale global entries.
P1.2 remains open for compatibility/deprecation
decisions on moved flat keys, `initCollapsed` and vendor props.

### Array collapse and Svelte vendor option compatibility — 2026-10-26

Array item initialization resolves local `options.collapsed`, then
`config.jsonformsExtended.array.collapsed`, then the shared
`config.jsonformsExtended.collapsed`. Legacy local `options.initCollapsed` is
accepted only if none of those portable booleans is supplied. Flat
`config.initCollapsed` is not an array renderer default; the shared resolver
test now locks that distinction. The outer array panel remains a separate
collapsible state, while a namespaced array default also initializes its
disclosure when enabled. All three demo Settings panels previously wrote
flat `config.initCollapsed`, so their switch had no effect. They now read and
write `config.jsonformsExtended.array.collapsed`; the shared demo helper
retains the current example's other namespaced defaults when applying the
override. Its focused regression passes **4/4**.
The demo-common package builds and publishes cleanly, and all three demo
Svelte checks report zero errors and warnings after the rebuild.

The existing Svelte native-prop bags remain `options.shadcn`,
`options.skeleton` and `options.flowbite` (or the same keys in global config).
Their component-keyed values are passed to the corresponding Svelte native
components; React prop names have no compatibility guarantee. Local values
override matching global fields, while unspecified fields and unknown
extension namespaces survive the option merge. A shared regression covers
all three bags, false/empty overrides and an unknown namespace. Mounted
Boolean controls now verify **21/21 per family** that an overridden local
`aria-describedby` reaches the native input while a separate global `title`
survives. We retain
these public bag names; any later rename requires an announced migration.
The separate P1.2 audit of other moved flat keys and diagnostics remains open.

The template-language resolver now reports whether it used deprecated flat
`config.defaultTemplateLang`. A mounted TemplateLayout emits the developer
diagnostic `template.legacyDefaultLanguage` once when that fallback is active;
explicit `lang` and `jsonformsExtended.defaultTemplateLang` suppress it. The
accepted language and tester ranking are unchanged. Focused resolver and
mounted diagnostic checks cover the precedence and warning frequency. The
complete resolver/TemplateLayout suite passes **12/12** and the extended
package Svelte check reports zero errors and warnings. An initial browser run
failed while Vite was optimizing `lodash/mergeWith` and Ractive could not load;
the previously failing Ractive case and then the full suite passed after the
dependency optimization completed.

### Monaco flat error-publication migration — 2026-10-26

`propagateErrors` resolves a local Control boolean, then
`config.jsonformsExtended.propagateErrors`, then legacy flat
`config.propagateErrors`, preserving explicit `false`. Mixed-code controls
force publication and never claim to use the legacy fallback. The shared
resolver now exposes both the value and whether the flat source was selected.
Each native Monaco renderer emits `monaco.legacyPropagateErrors` once per
mounted control only when that fallback is active. Shared Monaco tests pass
**19/19**; the mounted Shadcn, Skeleton and Flowbite Monaco suites pass
**9/9 each**. The shared extended package builds and passes publint, and all
three extended package Svelte checks report zero errors. Skeleton retains
its pre-existing Cron autofocus warning.

### Section flat-option migration — 2026-10-26

The pinned React group and array implementations use local, namespaced, then
legacy flat `collapsible` and `showDataIndicator` values; flat `collapsed` is
excluded. Svelte now resolves the two supported booleans through a shared
source-aware helper without changing their established invalid-value behavior:
Group/data-indicator selection is nullish; array/mixed disclosure selection
uses the first boolean. A flat value, including explicit `false`, is reported
through `section.legacyFlatOption` once per mounted consumer. Visible
SectionIndicators own the data-indicator diagnostic so Group's internal and
visible indicator compositions do not duplicate it. Flat `collapsed` remains
ignored as a removed location.

The shared resolver and group-state tests pass **9/9**, all three Group suites
pass (**11** Shadcn, **10** Skeleton, **10** Flowbite), and array/mixed suites
pass **53/53 per family**. The base package builds and passes publint; all
three family Svelte checks report zero errors and warnings.

The remaining moved-key inventory separates active compatibility fallbacks
from removed locations. The active flat fallbacks are `collapsible`,
`showDataIndicator`, `defaultTemplateLang`, and `propagateErrors`; each has a
source-aware, once-per-mounted-consumer diagnostic above. Flat `collapsed` and
`vertical` are ignored in favor of component-scoped defaults. The former flat
`childLabelProp`, `elementLabelProp`, `detail`, and `summary` locations are
local-only in the applicable Svelte renderers; the family tests exercise
global-versus-local conflicts. Removed namespaced locations are enumerated in
the config-consumption ledger and covered by the focused removed-location
matrix. Supported flat keys such as `restrict` remain flat and are not migration
warnings. This completes the moved-key inventory; P1.2 still needs a
full-surface namespace and option-bag acceptance audit before closure.

After the flat temporal restriction change, `pnpm run build:demo` rebuilt all
libraries, Web Components, and three demos successfully. The fresh production
`config-restrict-temporal` matrix passes **12/12** across family, EN/BG locale,
and native/Web Component host. The focused removed-location, compound
presentation, and template-language matrices pass **120/120** on the same build.
The first browser attempt could not bind `127.0.0.1` in the sandbox; the
permitted local-server rerun produced these results. Broader P1.2 acceptance
remains open until the namespace and option-bag coverage is checked against
the full declared surface.

### Option-review evidence paths — 2026-10-26

The config and local-option review ledgers now have an executable evidence-path
check in `tests/review-evidence.spec.ts`. It expands the family and file brace
notation used by the ledgers, then verifies that every referenced test file
exists. This caught three moved/deleted test paths; their entries now point to
the actual additional-property-name, shadcn field-presentation, and extended
markup suites. The check resolves **1,629** expanded references across **336**
review/addition rows. Together with `tests/config-consumption.spec.ts`, the
focused run passes **9/9** cases. File existence is an audit-integrity check;
it does not replace the pending full-surface behavioral acceptance for P1.2.

### Literal rule scopes — 2026-10-26

JSON Forms core converts rule scopes to dot-separated data paths. A rule at
`#/properties/a.b` therefore previously inspected nested `a.b` instead of the
literal `a.b` member; an empty property name was similarly lost. Core also
decodes only the first `~0` in a rule scope, missing names such as `a~b~c`. The shared
Svelte rule adapter now resolves these scopes with own-property lookup using
decoded JSON Pointer segments and the current ordinary instance path. Schema
conditions still use the host Ajv, including custom formats and keywords, on
isolated data. Leaf, predicate, AND and OR conditions keep their effects and
predicate data isolation. All mapped controls, categories, and direct layout
visibility consumers pass the host Ajv to this adapter.

Focused rule tests pass **12/12** and the mounted rule suite passes **4/4**,
including a live dotted-key value change against a conflicting nested value;
the base package Svelte check reports zero errors and warnings. Native
ObjectRenderer suites also pass **13/13 in each of Flowbite, shadcn and
Skeleton**. Their new cases check child rules beneath literal dotted, empty and
repeatedly escaped tilde parents before and after the parent value changes,
including a conflicting nested lookalike. A nested Group now also retains its
data and child-validation indicators under a literal dotted parent while a
conflicting nested lookalike changes. An empty direct-object error message no
longer suppresses child errors; nonempty direct and child errors are combined
in the indicator summary. Focused GroupRenderer suites pass **11/11 shadcn,
10/10 Flowbite and 10/10 Skeleton**. Mounted ObjectErrorBoundary suites pass
**8/8 per family**, including a Group summary with both a direct `minProperties`
error and a child `minLength` error, and the preexisting host/direct/child case
now lists all three separately. This closes these literal-condition-scope
cases under P1.3. Broader literal
rule/error paths and arbitrary dotted instance-path contexts remain open for a
separate bounded acceptance review.

Label detail summaries also compared core's dotted error paths, allowing a
literal `a.b` field to include errors from nested `a/b`. The shared summary
filter now compares decoded JSON Pointer segments, including `required`
missing-property targets. It also suppresses document errors in both
`ValidateAndHide` and `NoValidation`, while retaining host errors. Its focused
**5/5** suite separates literal dotted, empty, slash and repeatedly escaped
tilde members from lookalikes. Composite-summary suites pass **23/23 per
family**, including a mounted literal-versus-nested Label preview and a switch
to `NoValidation` with a host error, and the base package check reports zero
errors and warnings. The exported dotted-path helper remains for
display compatibility; ownership matching uses lossless segments.

### Reported integration regressions — 2026-10-26

The pasted 13-failure run exposed a stale pinned schema asset, stale packed
Web Component archives, a masked-date paste guard, an over-strict split-pane
pixel assertion, short readiness/action waits under the full demo matrix, and
missing `propertyNames` feedback beside imported dynamic keys. The canonical
UI schema fixture is restored to its pinned hash; `tests/conformance.spec.ts`
passes **11/11**. A complete masked shadcn date paste now commits its parsed
value, with native date tests **6/6** and the reported Bulgarian production
case passing. All **12/12** metaschema combinations pass with bounded editor
readiness waits; the other six reported demo suites passed their full matrix.
After a fresh full page build and release pack, packed Web Component imports
and behavior pass **1/1**.

A shadcn-only verification surfaced two stale native test assumptions:
ListWithDetail ranks every array scope, matching React Antd, and dialog input
IDs derive from the control ID. Corrected native cases pass **7/7 per family**
in focused runs, and the full shadcn base package passes **1203/1203**. The
extended suite also exposed Monaco's asynchronous first JSON worker
registration; the diagnostic reader now waits briefly for it, and the affected
EN/BG editor suite passes **2/2** in isolation. The complete shadcn-only
package stages pass **1203/1203** base, **290/290** extended, **23/23** Web
Component, and **8/8** demo tests. Its 102-file EN/BG × native/Web Component
integration matrix initially exposed one premature tab-background assertion;
after polling the painted state, the affected suite passes **4/4** and the
full filtered integration matrix passes **580/580**. The renderer-family
command filters out the other families' **1152** integration cases.

All three Svelte families now show a validation icon and red dynamic-property
label for invalid imported keys such as `sensor-x`, matching React Antd while
preserving the value. Native AdditionalProperties suites pass **3/3 per
family**, and the shadcn production case passes. This closes the reported
property-name presentation defect, not the remaining broader P4.10/R30 work.
Development-only `index.ts` scenario factories are grouped under
`demo-common/src/lib/fixtures`; pinned shared-spec examples remain JSON
asset-backed under `examples`. The root `test:flowbite`, `test:shadcn`, and
`test:skeleton` commands run one family and its demo matrix.

### Literal composite Control summaries — 2026-10-26

A composite cell's Control summary previously converted its JSON Pointer scope
to a dot path before reading data. For a literal `a.b` property beside nested
`a.b` data, the preview showed the nested value; an empty property name could
not be previewed. The shared summary now decodes scope members and reads own
properties, with the same literal-safe schema resolver for fallback labels.
The core summary suite passes **6/6**, covering object and array previews,
empty, repeatedly escaped and prototype-looking names. The mounted
CompositeSummary suites pass **24/24 per family** (Shadcn, Flowbite, Skeleton),
including a literal-versus-nested table cell. Base packaging/publint and
`svelte-check` pass with zero errors and warnings. Broader P1.3 arbitrary
dotted instance-path acceptance remains open.

### ListWithDetail index announcements — 2026-10-26

ListWithDetail's hidden item index remained English after a locale switch; its
Flowbite avatar also exposed an English `aria-label`. The three families now
use the shared `collection.index` message for those names, with matching EN/BG
parameters and host-translation precedence. Focused browser suites pass
**22/22 Shadcn, 23/23 Flowbite, and 22/22 Skeleton**, including live EN→BG
changes and the Flowbite avatar name. The shared message-catalog suite passes
**2/2**, base packaging/publint passes, and all three family `svelte-check`
runs report zero errors and warnings. The remaining P1.10 native-text audit is
still open.

### Scalar NoValidation feedback — 2026-10-26

Scalar error projection previously hid document errors in ValidateAndHide but
could still display a stale document error after switching to NoValidation.
It now excludes document errors in both modes while keeping host
`additionalErrors` visible. The shared scalar suite passes **7/7**, and the
mounted pre-touch suites pass **5/5 per family** (Shadcn, Flowbite, Skeleton),
including EN/BG and live mode changes. Base packaging/publint and
`svelte-check` pass with zero errors and warnings. P1.12's broader
field/custom/global/AJV precedence and live-locale acceptance remains open.

### Structured host-error locale refresh — 2026-10-26

An open array summary retranslates a host `additionalErrors` entry when the
form locale and `translateError` change without a data edit. The mounted
structured-summary suites pass **4/4 per family** (Shadcn, Flowbite and
Skeleton), including their existing EN/BG, expansion and row-isolation cases.
P1.12's remaining precedence and global/AJV acceptance remains open.

### Complex tuple error display policy — 2026-10-26

Complex tuple positions previously printed stored AJV/host messages directly,
so hidden document errors remained visible and locale-only changes could leave
the displayed text stale. They now use the shared structured-error projection:
NoValidation and ValidateAndHide hide document errors, host additional errors
remain visible, and both error classes use the current translator. The focused
new case and complete tuple renderer suites pass **39/39 per family** across
Shadcn, Flowbite and Skeleton. Base prepack/publint and all four Svelte checks
pass with zero diagnostics. Broader P1.12 precedence work remains open.

### AG Grid structured error disclosure — 2026-10-26

All three AG Grid adapters previously showed a numbered, noninteractive span
whose native title was assembled from stored AJV messages. They now reuse each
family's array validation indicator, with a keyboard-accessible structured
summary and reactive error translation. A locale-only EN→BG update refreshes
an open disclosure without editing data. With concurrent document and host
errors, the visible count falls from two to one in ValidateAndHide and
NoValidation while retaining the translated host error; removing that error
removes the indicator. The adjacent Shadcn grid suite passes **2/2**, and the
Flowbite and Skeleton locale suites pass **4/4 each**. All three extended
package checks report zero errors. A shared structured-summary case also verifies
combined, field-keyword, global-keyword, translated-validator fallback and
stored-message fallback precedence without mutating the error; the shared suite
passes **13/13**. P1.12's broader mounted precedence and search-summary
acceptance remains open.

Skeleton Cron's input uses autofocus only for the authored, mount-only `focus`
option. A scoped Svelte accessibility suppression now documents that intentional
behavior. Its focused suite passes **16/16**, and the extended package check
reports zero errors and warnings.

### Mounted scalar error precedence — 2026-10-26

Each base family now has a mounted locale-only sequence for a schema-invalid
string Control with an explicit i18n prefix. It verifies the combined control
override, field keyword, global keyword and host `translateError` fallback in
order while preserving data and emitting no `onchange`. The focused case passes
**1/1 per family** (Shadcn, Flowbite and Skeleton). Structured-summary pure
precedence remains covered by the **13/13** shared suite. Broader AJV locale
fallback and search-summary acceptance remains open under P1.12.

### Mounted extended-validator locale feedback — 2026-10-26

Each native family now mounts the extended form with its production text Control
renderer and an invalid string. A locale-only EN→BG update changes the displayed
AJV `minLength` feedback; a schema-authored `errorMessage` also follows its
translated catalog key without replacing the document. A subsequent host
`translateError` override takes precedence. Both cases preserve the supplied
data and emit no `onchange`; the focused suites pass **2/2 per family**
(Shadcn, Flowbite and Skeleton). The shared extended tests additionally verify
that the original error object can be presented in either language without
revalidation or mutation. Search-summary and wider catalog acceptance remain
open under P1.12.

The demo-common catalog check now loads all **82** example and supplemental
translation files and compares their English/Bulgarian leaf keys, nonempty
messages and interpolation parameter names, including nested catalogs. Its
focused test passes **1/1**, and demo-common `svelte-check` reports zero errors
and warnings. Runtime search-summary and wider translation acceptance remain
open.

The three native AG Grid Label-summary suites now test column and quick-filter
search invalidation across a locale-only text change. An English query for
`Beta / Austin` stops matching after the translated summary becomes
`Applicants: Austin (Beta)`; the translated query selects the original source
row in either search mode. The sequence emits no data-change event after
initial form setup and preserves the original row.
Focused suites pass **1/1 per family**. A subsequent production filter-menu
matrix passes **12/12** across three families, EN/BG, and native/Web Component
hosts: a query for the displayed `applicant12@example.com` summary narrows the
grid to the original Applicant 12 row. The same 12-case matrix now opens the
filtered row detail, saves a changed note, clears the filter and confirms
Applicant 1 retained its original note, then filters again and confirms
Applicant 12 holds the edit. This tests the displayed-summary match and
source-row identity through a write across both hosts. This adds host-level
search acceptance; other search profiles stay open under P4.11.

The same rebuilt `tests/demos/row-summary-search.spec.ts` matrix now passes 12/12 with the Contact Label summary: Contains matches either city (`Boston`) or phone (`555-01010`), and header sorting orders the displayed summary ascending and descending. Assertions use AG Grid visual `row-index` rather than recycled DOM insertion order. Applicant summary filtered-edit identity checks remain in the same scenario. Other P4.11 editor and eligibility profiles remain open.

The three native AG Grid interaction harnesses now expose a validated text
column and its committed value. Typing `A`, `l`, `e` into the same mounted cell
passes **6/6 Shadcn, 7/7 Flowbite and 8/8 Skeleton** full interaction files.
After every keystroke, the committed value, DOM input identity, focus and caret
match; the temporary `minLength` error appears in exactly one compact cell
frame with an accessible indicator, without an inline label, then clears on
the valid value. Other editor types and ordinary-control identity remain
separate acceptance work.

### Demo URL query precedence — 2026-10-26

The shared demo URL store now reads supported settings from the hash query
before the ordinary query. A write removes the ordinary-query copy, writes the
value once beside the encoded hash route, and preserves unrelated parameters.
The store reacts to hash changes and browser Back/Forward without changing the
selected route. Three pure URL cases and one mounted browser-history case pass;
demo-common and all three demo `svelte-check` runs report zero diagnostics.
Flowbite sidebar selection now compares the decoded route parameter. Full
production legacy-ID and example-data retention acceptance remains under P7.4.

A focused browser route regression now runs against each live demo in EN and BG:
**12/12 dev cases pass** across native and Web Component views. The percent-encoded legacy `Readonly%20Fields`
route resolves, a hash `form-only=false` overrides normal-query `true`, and
editing the cron expression survives a form-only toggle. The write removes the
normal-query duplicate, keeps `campaign=spring` and the example route, and
produces no page errors. Each case also uses real browser Back/Forward between
two hash settings and retains the edited expression in both directions. A
synthetic `popstate` without history state caused a SvelteKit remount and is not
used as evidence for browser navigation. Demo URL writes use SvelteKit's `replaceState` after
router initialization; the early-hydration fallback preserves the current
history metadata when a tab correction occurs before initialization. Focused
demo-common URL tests pass **4/4** and all three demo package checks report zero
diagnostics. The early-hydration fallback can emit SvelteKit's development
warning about native history writes when invoked; remove that fallback when
startup tab normalization can be deferred safely. Built native/Web Component
bundle acceptance and cross-example route transitions remain open.

The integration-test TypeScript gate now passes after typing the initially
empty config-gap ledger by its path contract and constraining the layout-sizing
test's section parameter to its four authored translation keys. The config
consumption suite passes **8/8**; these two edits do not change renderer runtime
behavior.

The rebuilt demo URL routing matrix now passes **12/12** across Flowbite,
shadcn and Skeleton, EN/BG, and native/Web Component hosts. It opens an encoded
legacy ID directly, changes examples through the sidebar without discarding hash
settings, and checks browser Back/Forward. A stronger Back assertion exposed
that cross-example navigation reset edited data; each demo now retains an
in-memory data draft per example and restores it on return, including the data
editor's initial model. The same production matrix verifies the edited cron
value after returning from another example. Shared URL tests pass **5/5**,
the test TypeScript gate and all three demo checks pass, and all three production
demo builds complete. Packed-consumer routing remains part of P7.8.

The pinned config-consumption fixture is now byte-identical to the current
extended-spec source. The authoring and base-config fixtures were already
semantically identical to their source files; their stored semantic hashes were
stale. With those hashes updated,
the focused conformance and config-consumption suites pass **19/19**. The
canonical inventory contains **144** rows, with only flat `config.restrict`.

The final direct-link URL matrix adds **12/12** rebuilt production cases for
`read-only`, `drawer`, `active-tab` and native/Web Component selection, with
opposing ordinary and hash-query values. It checks the actual host element and
read-only input, uses the Schema tab to verify canonical writing, and navigates
Back/Forward between tab, drawer and read-only states while preserving an edit.
This exposed an external-navigation sync gap in all three tab implementations.
Shadcn and Skeleton now follow the URL store after navigation; Flowbite uses a
one-way selected value with explicit tab-click writes so its Tabs component
cannot overwrite a history entry. The complete built route suite passes
**24/24** across family, EN/BG and native/Web Component. The three demo builds,
Svelte checks, test TypeScript gate and focused formatting pass. This closes
P7.4; packed native/Web Component consumption remains P7.8.

For P7.5, the focused production host-transition suite passes **12/12** across
Flowbite, shadcn and Skeleton in EN/BG. It edits the cron field, switches from
native to Web Component, enters and exits form-only mode, and returns to native
without losing the value or reporting page errors. A second scenario changes
flat `config.restrict`, read-only, validation mode, direction and light mode
through the visible settings UI before the same host transitions. The Web
Component receives those values, retains them after its form-only remount, and
the native form remains read-only with its edited data on return. A separate
scenario passes the locale and non-default family theme/palette into the Web
Component. Form-only now removes the demo sidebar and settings panel, releases
the sidebar width, and hides the example title and document-level tabs while
leaving tabs inside the rendered form. The named toolbar controls remain
discoverable. All three Web Component logos are decorative within their named
buttons and have no animation under `prefers-reduced-motion: reduce`.
Skeleton's native Tabs root now receives the current RTL direction; shadcn
settings checkboxes have associated labels. All three rebuilt demos have zero
Svelte-check errors, the adjacent URL/history suite passes **24/24**, and the
focused test TypeScript and formatting gates pass. This closes P7.5; packed
consumer transitions remain under P7.8.

P7.7 has a new focused **3/3** built-demo Web Component host matrix. Each
family accepts schema, UI Schema, data, translations, config, read-only, locale
and mode through pre-mount attributes; updates data, read-only, locale and mode
after mounting; emits a single change after reconnecting the same element; and
dispatches a real `handle-action` event whose callback updates form data through
the event context. Document listeners confirm the change and action events
bubble and cross the Shadow DOM boundary exactly once after reconnect. It also
verifies that changing the flat `config.restrict` attribute changes max-length
prevention for an ordinary string control, and that updating the same config
through the host property changes it back. The three demo pages and their Web
Components construct the same base-plus-extended renderer and cell registries;
the already accepted row-detail and specialized-control production suites
exercise those registries in native and Web Component hosts. The host matrix
also changes `customStyle` live, verifies the resulting input color inside the
ShadowRoot, and confirms that the rule does not affect a light-DOM input. Host
`color-scheme` is explicit for dark, light and both system-preference branches.
The test found Flowbite styled only its inner form,
so its host now exposes `data-mode`; shadcn and Skeleton specify the system/light
host branch explicitly. The three Web Component builds and affected demos pass,
along with **36/36** helper tests, test TypeScript and focused formatting.
The focused Web Component worker lifecycle matrix now passes **3/3** against
rebuilt production demos. A standalone JSON-language Monaco control is removed,
reconnected and edited; the same host then replaces it with an AG Grid, which is
also reconnected and edited. The initial run exposed Monaco 0.55's late model
probes raising `Model is disposed!` during teardown. The shared editor now
guards its owned model before detaching it. The shared Monaco component tests
pass **24/24**, the shared package and three Web Component builds pass, and
the three affected demos rebuild successfully. Further registry competition,
broader portal focus and full Shadow styling remain under P7.7. The existing
row-detail suite passes **12/12** rebuilt production cases, including focus
return from dialogs in native and Web Component hosts across all families and
EN/BG. The Shadcn Web Component overlay suite passes **4/4**; its active EN/BG
cases now verify that date and date-time calendars live in the ShadowRoot, move
focus inside the open calendar, and return it to the trigger after Escape.
The complete temporal-control matrix passes **12/12** across the three
families, EN/BG, and native/Web Component hosts. It also verifies each Web
Component calendar remains inside its ShadowRoot and restores trigger focus
after Escape. Skeleton's controlled DatePicker and Flowbite's Popover had
closed without restoring that focus; their date and date-time adapters now
restore it on Escape.
The array-controls registry competition matrix passes **12/12** in the same
family, locale and host combinations. Its normal table must select the
specialized color and duration cells over the generic string cell and render
both composite cells; it also checks the first row's stored scalar values and
reports no browser page errors. This supplies runtime evidence for matching
native and Web Component cell registries beyond identical import lists.
The Web Component half now edits a table cell, reconnects the same host, checks
the edited value and all specialized/composite cells again, then writes the
original value back. The rebuilt focused matrix remains **12/12**.
The Web Component color-overlay matrix passes **6/6** across three families
and EN/BG. Each open color picker remains inside its host ShadowRoot, its
slider stays within the desktop viewport, and Escape restores focus to the
trigger. The focused host lifecycle matrix passes **3/3** after an added
context-identity check: repeated action events share one live form context,
and each callback receives that same context object.
The same **3/3** host matrix now mounts a second Web Component in each family
with a different custom input color and light appearance beside the original
dark host. Both style and `color-scheme` stay independent; clearing the first
host's custom CSS leaves the sibling unchanged. Reconnecting the first host
retains exactly one base stylesheet in its ShadowRoot.
The cron-overlay Web Component matrix passes **6/6** across all families and
EN/BG. Its picker stays inside the ShadowRoot and desktop viewport, then
returns focus to the trigger after Escape. Combined with the color and temporal
matrices, this covers the main extended, color and calendar popup families;
the full popup inventory remains open.

The duration-overlay Web Component matrix passes **6/6** across all families
and EN/BG. It verifies that the picker remains in its host ShadowRoot, stays
within the desktop viewport, closes on Escape and restores trigger focus.
The shadcn case also opens the nested Add unit selector and verifies that its
options stay inside the same ShadowRoot. The first focused run found Flowbite's
duration editor and native Popover could disagree after Escape because both
handled the trigger separately. The adapter now binds the native Popover's
open state to the duration draft, removes the competing click toggle, and
uses immediate trigger handling. A second run together with the existing
duration behavior suite passes **18/18** across native and Web Component
hosts. The Flowbite extended package, Web Component and demo builds pass.

The compact file-operation feedback Web Component matrix passes **6/6** across
Flowbite, shadcn and Skeleton in EN/BG. In an AG Grid file cell, an over-limit
selection produces a feedback trigger that opens with Enter, closes with Escape
and reopens with a click. Its popup remains in the host ShadowRoot, fits the
desktop viewport and receives pointer hits across the full message. Flowbite
now keeps its native Popover state synchronized with the trigger during focus
return after Escape; Skeleton handles Escape at its trigger. The new matrix and
the existing file-control behavior suite pass **18/18** together. Flowbite's
affected package, Web Component and demo production builds pass; the earlier
Skeleton and shadcn builds remain current for their corresponding cases.

File-array commands now resolve live `disableAdd` and `disableRemove` from
global config with local false overrides in all three Svelte families. The
picker, hidden file input and read handler reject Add when disabled; per-file
Remove and Clear reject deletion when disabled. The focused file-control
component suites pass **38/38** Flowbite and **37/37** each shadcn/Skeleton.
The rebuilt Web Component EN/BG matrix passes **6/6**, checking global denial,
local overrides, a successful upload/removal, and live global changes. The
affected extended packages and Web Components build successfully; their current
bundles were copied into the existing production demo builds for this bounded
test, without rebuilding unrelated demo UI.

File-size checks now evaluate inclusive and exclusive minimum and maximum
limits independently. The previous adapters selected only one lower and one
upper limit, so an inclusive maximum could mask a stricter exclusive maximum.
A shared helper resolves each key from schema before UI options and validates
the original file byte count. Its focused tests pass **2/2**; the renderer
file-control suites pass **40/40**, **39/39**, and **39/39**. A rebuilt Web
Component EN/BG matrix passes **6/6** across the three families, rejecting a
five-byte selection at an exclusive five-byte maximum while accepting four
bytes. Together with the existing file-control suite it passes **18/18**.

React's file pills make their full filename text focusable. The three Svelte
file renderers now do the same for persisted single and multiple attachments,
including when deletion is disabled or hidden. The focused filename cases pass
in all three families, and the rebuilt Web Component permission matrix passes
**6/6** with direct ShadowRoot focus checks in EN/BG. The full name is in the
focused text and its `title`; a separate visual keyboard tooltip review remains
under P6.2/P6.3.

The narrow-viewport searchable-choice Web Component matrix passes **6/6**
across Flowbite, shadcn and Skeleton in EN/BG. After filtering an option, the
popup stays in its host ShadowRoot, fits a 390 × 900 viewport and remains
hit-testable. Escape closes it and returns focus to the choice trigger. The
new overlay matrix and existing native/Web Component choice-selection suite
pass **18/18** together. These checks use the current production demo builds.

P7.2 Data editor isolation now passes **12/12** rebuilt production cases across
Flowbite, shadcn and Skeleton, EN/BG, and native/Web Component hosts. A pending
JSON draft survives form edits. Invalid JSON Apply retains the draft and live
form data; Reload restores the example in the editor without applying it. A
valid Apply updates the form and resumes Data editor synchronization after the
next form edit. All three affected demo builds and Svelte checks pass. Other
editor surfaces, validation counts and pending/submission behavior remain open.

The Schema editor lifecycle matrix passes **12/12** against the same rebuilt
family × EN/BG × native/Web Component grid. A valid Apply changes the form and
Data editor validation. Invalid JSON Apply keeps the draft and active schema;
Reload restores the example text in the Schema editor without applying it.
Navigating to another example and back restores the original schema text and
Data editor diagnostics. The shared demo Apply helper now reports success so
Schema Apply refreshes Monaco's data association only after a successful parse.
The Data editor isolation matrix also remains **12/12** after this change.

The demo validity header now reports localized schema and additional-error
counts separately while retaining the combined icon count. It shows a localized
pending-analysis status from the form validity event. The rebuilt
additional-errors matrix passes **12/12** with server and schema errors together,
and the rebuilt code-editor matrix passes **12/12**, observing pending analysis
while Monaco checks invalid JSON and its disappearance after a valid edit. In
Flowbite, inactive native Tabs do not mount the invalid policy editor until its
tab is selected; the preselection count is therefore two server errors, while
shadcn and Skeleton include that editor's third additional error. P7.6 tracks
the remaining lifecycle-parity decision.

The pending-clear assertion also exposed HTML editors waiting on a diagnostic
reader that does not support HTML. The shared Monaco draft now tracks pending
worker reads only for supported languages; its focused suite passes **9/9**.
Rebuilt shadcn and Skeleton native/Web Component code-editor cases each pass
**4/4** in EN/BG, and the mixed-error validity matrix remains **12/12**.

The `restrict` spelling was also checked against the canonical spec and React
renderers: the spec and schema define flat `config.restrict`, with local
`options.restrict` taking precedence, and reject `restrict` in the extension
namespace. React's shared temporal resolver reads only the flat key; its test
explicitly verifies that a nested key has no effect. The Svelte config
inventory and demo settings use the flat key as well. A pinned-schema
regression now checks that the common schema declares flat `restrict`, rejects
it in `jsonformsExtended`, and that the extended-only schema does not redeclare
it. The focused config-consumption and shared option suites pass **26/26**.

## Demo shell geometry and home action — 2026-10-27

The rebuilt Flowbite home view now includes the localized action that opens
the introductory job-application example, matching shadcn and Skeleton.
Flowbite's narrow sidebar uses its native visible backdrop. The shadcn and
Skeleton narrow drawers now close on Escape as well as backdrop activation.
The focused `demo-shell-geometry` matrix passes **24/24** across three
families and EN/BG: home navigation, fixed desktop header/sidebar/workspace
geometry, no page overflow, header tool order/names/pressed states, sidebar
source filtering and empty-result feedback without navigating away, visible
narrow backdrop and pointer/Escape dismissal. Flowbite and Skeleton expose
pressed state for the form-only and host toggles, and repository action labels
follow the current locale. All three demo Svelte checks and builds pass;
scoped lint and format checks pass. This is a P7.1 checkpoint, not completion
of its native split-pane, RTL or keyboard-focus audit.

The demo/data split checkpoint now passes **6/6** rebuilt EN/BG native cases.
The library-native panes start near 75/25, respond to keyboard resize, reverse
their visual order in RTL, and stack with the handle hidden at narrow width.
Flowbite's pane spacing uses logical inline padding; shadcn and Skeleton pass
the active locale to the resize handle. The narrow shadcn header now hides
only the brand text while keeping a named home link, and workspace flex items
can shrink around Monaco without creating page-level horizontal scroll. The
closed shadcn/Skeleton sidebars no longer contribute offscreen width.
Skeleton's settings drawer now uses its native Dialog for Escape, backdrop and
focus behavior. The rebuilt `demo-shell-split`, `demo-shell-geometry`, and
`shell-localization` suites pass **42/42** together; the latter includes native
and Web Component cases after the Dialog change. All three affected demo
builds and Svelte checks pass. The remaining shell acceptance stays open under
P7.1.

The rebuilt drawer-focus matrix passes **12/12** native cases across all
families and EN/BG. At narrow width, example drawers move focus inside,
contain Tab navigation, close on Escape or backdrop activation, and return
focus to the menu trigger.
All three narrow drawers expose modal dialog semantics while open; Flowbite
keeps its library focus trap and now restores focus on dismissal.
Settings drawers also move focus inside and return it to their triggers after
Escape or backdrop activation. Flowbite waits for its native dialog's closing
transition to remove the dialog before restoring focus; Skeleton gives its
backdrop explicit pointer access while the modal background is inert. The
common demo package and all three demo builds and Svelte checks pass. The
focused drawer and localization pair passes **24/24** together. The remaining
P7.1 shell audit stays open.

The strengthened split matrix now drags the native divider both ways and to
each edge. All three demos request a 200 px minimum pane size; the rebuilt
EN/BG matrix passes **6/6**, retaining at least 190 visible pixels in each
pane at the edge. The rebuilt shell geometry matrix passes **24/24** and now
also verifies that hiding the desktop sidebar expands the workspace and
reopening it shifts the workspace back.

The rebuilt RTL drawer matrix passes **6/6** native EN/BG cases across
Flowbite, shadcn and Skeleton. Settings open at inline end and the narrow
examples drawer opens at inline start. A direct `drawer=false` URL now marks
the responsive drawer default as initialized, so opening it does not reset the
state when that query disappears. Flowbite's native Sidebar needs an explicit
physical right position in RTL and a matching entry transition; its Drawer
settings panel follows inherited direction through logical margins. The
adjacent drawer-focus, geometry and split suites pass **42/42** after the
change, and all three demo builds and Svelte checks pass.

Flowbite now displays the common settings explanation beneath the heading,
matching shadcn and Skeleton. The rebuilt drawer-focus matrix verifies that
copy and focus behavior in **12/12** EN/BG cases. The full shell geometry suite
passes **30/30**, including six cases where keyboard navigation focuses the
renderer and settings actions and exposes each native library's tooltip.

The shell geometry suite now passes **42/42** after six EN/BG cases for long
sidebar labels and six for narrow tab lists were added. Long labels wrap in
all three families; Flowbite and Skeleton already expose the active example
through `aria-current` or `aria-selected`, while shadcn links now expose
`aria-current="page"`. Skeleton's native Tabs list now has its own horizontal
scroll container, so the last tab is reachable at 390 px without page-level
horizontal scrolling. Flowbite and shadcn already met that condition. The
shadcn and Skeleton demo builds and Svelte checks pass.

The full shell geometry and drawer suites now pass **66/66** together. Six
desktop cases scroll the example sidebar independently while the workspace
heading and fixed header remain in place. Six narrow cases scroll each
settings drawer to its final common option and verify that option lies within
the drawer viewport. These checks cover the desktop/sidebar and
settings-scroll points under P7.1; the broader acceptance audit remains open.

The final P7.1 shell matrix passes **90/90** rebuilt native EN/BG cases across
`demo-shell-geometry`, `demo-drawer-focus`, `demo-shell-rtl-drawers`, and
`demo-shell-split`. The added cases verify each home's logo and title, the
example title above its contained tabs, upstream example actions aligned with
the `JSON Forms` heading, and visible native-library focus feedback on
keyboard-focused header actions. Sidebar and settings scrolling, active
example semantics, narrow tab scrolling, RTL drawer placement and split-pane
bounds remain green in the combined run. The affected demo builds and Svelte
checks pass. This closes the demo-shell scope of P7.1; editor, settings, URL,
Web Component host and broader accessibility contracts are tracked in their
separate workstream items.

## Versioned demo preferences — 2026-10-27

P7.3 now has a shared per-family storage adapter for durable locale, layout,
mode, theme and design-system preferences. It reads existing raw values and
migrates valid ones to `{ version: 1, value }`; an invalid value, corrupt JSON,
unknown version or denied storage access uses the in-memory default without
breaking the demo. The four focused codec cases pass, all three demo package
checks/builds pass, and the rebuilt shell-localization matrix passes **12/12**
across family, locale and native/Web Component hosts. Flowbite's shell case
requires a 20-second browser-test timeout on this machine; its slow case passed
in 7 seconds when run alone. Configuration precedence, complete settings
coverage remain open under P7.3.

The same rebuilt demos also pass a **3/3** real two-tab matrix: a versioned
theme change from the first tab updates the second without navigation, while
an unsupported version or removed key restores that family's default. The
shared adapter listens only to its own local-storage area and key. P7.3 still
needs the remaining precedence scenarios and the complete settings inventory.

The three demo pages now use the shared defaults < example < explicit session
override merge for both rendered form config and the Ajv dynamic-default
permission provider. Each initial validator reads its own example state, so
navigating between examples cannot give it the previous example's config.
A focused test switches script permission off and back on through the session
override against one compiled validator; the demo-config tests pass.
The rebuilt config-presentation matrix passes **12/12** across the three
families and native/Web Component hosts. Broader precedence and settings
coverage remain open under P7.3.

The Collapse arrays initially session control now stores only its
`jsonformsExtended.array.collapsed` choice. Demo config merging combines that
choice with each selected example's namespaced settings recursively, replacing
arrays while preserving explicit `false`. A focused cross-example case proves
group and pagination defaults from the first example do not mask those of the
second; source config stays unchanged. The shared demo-config suite passes
**6/6** cases. The rebuilt family × native/Web Component browser regression
passes **6/6**, and the adjacent config-presentation and validator-profile
suites pass **24/24**. All three demo checks and builds pass.

## Demo settings and layout preference contract — 2026-10-27

P7.3's required settings inventory in renderer-and-demo §8.1 is present in
Flowbite, shadcn and Skeleton: system/light/dark mode; LTR/RTL direction;
English/German/Bulgarian/browser locale; all three validation modes; default
and Demo and Data layouts; Restrict and read-only; plus all nine listed common
options, including editable pre-touch error keywords. Each family reads the
same message catalog. Renderer theme/design-system controls use family-scoped
versioned preferences, and the host-transition checks verify provider values
and form settings reach native and Web Component views.

The rebuilt `demo-settings-precedence` matrix passes **9/9**: six family ×
EN/BG cases set the common config options through each native settings UI,
confirm authored `showUnfocusedDescription: true` can be overridden with
explicit `false`, and inspect the effective Web Component config, including
preserved authored `jsonformsExtended` indicator options. Reload restores
direction, validation mode, and generic config while retaining durable mode
and layout. Three additional family cases select German then browser locale
without losing an edited value. Mode and layout write versioned values; the
default layout now stores `default`, matching the spec and React demo. Both
legacy raw and versioned empty-string layout values migrate to `default`;
the preference suite passes **5/5**. All three demo checks/builds pass after
the change. The existing 3/3 two-tab, 12/12 shell-localization, 6/6
cross-example config, 24/24 config/validator, and host color-scheme suites
provide the adjacent persistence, precedence and system-mode evidence.

The spec recommends an asynchronous native preference adapter as a SHOULD,
not a web-demo requirement. The renderer components remain independent of
the web storage API; the demo's small storage abstraction owns browser
persistence.

## Flowbite inactive tab validation — 2026-10-27

Flowbite's native Tabs mounts only the selected TabItem snippet. Its
categorization renderer now keeps every other category's renderer mounted in
a hidden, inert container. This lets a Monaco editor publish its owned
diagnostic before that category is selected, matching shadcn and Skeleton's
form-wide additional-error count without replacing Flowbite's native tab
buttons. The Flowbite library, Web Component and demo builds pass. The rebuilt
additional-errors matrix passes **12/12** with three initial additional errors
in every family/host/locale case; the adjacent categorization matrix passes
**12/12** for tab behavior. P7.6 remains open for its wider native-adapter and
capability acceptance audit.

## Remaining demo editor surfaces — 2026-10-27

The production `demo-remaining-editors` matrix passes **6/6** across
Flowbite, shadcn and Skeleton in EN/BG. It applies Internationalization,
UI Schema, UI Schemas and Config edits through their JSON-aware editors,
checks visible translated/category and UI-schema changes, then submits
malformed JSON and confirms the draft remains until Reload. Reload restores
the example's source text without reverting the active form property. The
live Web Component receives the four applied properties after the
native-to-host transition. A focused rerun passes **6/6** with navigation to
another example: applied UI Schema, translations and Config do not leak to the
next Web Component, and its absent UI Schemas registry displays a blank editor.
The separate `demo-uischemas-registry` matrix passes **6/6** across families
and EN/BG. It applies a nonempty string-tester registry with explicit script
permission, verifies that the registered choice-card detail appears, then
switches to each Web Component and verifies the same detail remains rendered.
No browser page errors occurred. The existing
inference matrix was rerun against the current production demos and passes
**12/12** across three families, EN/BG and native/Web Component hosts. It
distinguishes absent schema from explicit `{}` and boolean schemas, exercises
every JSON root type and keeps inferred schemas out of the authored editor.
The UI Schemas editor previously serialized trusted function testers out of
the source JSON; applying the unchanged text then silently discarded the
registration. Its shared conversion now displays the tester source and restores
the original trusted callback when that source is unchanged. Edited tester
source still requires the existing script-evaluation permission. The rebuilt
three-demo registry matrix passes **12/12**, with six native-to-Web Component
string-tester scenarios and six unchanged-trusted-tester scenarios; the focused
helper passes **2/2**. The rebuilt remaining-editor navigation matrix passes
**6/6**, including an abandoned invalid UI Schema draft and fresh source models
after navigating away and back. All three affected demo builds and Svelte checks
pass. P7.2 is complete; host-owned submission gates were already accepted under
P1.5, and catalog translations/registries under P2.4.

## File rejection and count feedback — 2026-10-27

Restricted file-size rejection now names the declined file before its localized
reason, leaving a previously committed attachment intact. Overfull non-unique
arrays stop before a FileReader is constructed; unique arrays still decide the
count after encoding and deduplication. Count-limit warnings state the maximum
and that existing attachments were kept, matching the React shared file
control's English and Bulgarian copy.

The shared localization suite passes **17/17** and native file-control component
suites pass **41/41 Flowbite**, **40/40 shadcn** and **40/40 Skeleton**. The
specific two-file preflight regression also passes in each family. After all
three production demo and Web Component builds passed, the rebuilt
`file-control` and `webcomponent-file-feedback-overlays` browser suites passed
**18/18** across three families, EN/BG and their applicable hosts. This verifies
the longer feedback in compact Shadow DOM popups as well as ordinary file
fields. P6.3 remains open for its broader semantic acceptance audit.

## Unique file-array metadata ownership — 2026-10-27

The P6.3 audit found that a `uniqueItems` array skipped an encoded duplicate
when appending values but still remembered the skipped file's byte size. An
imported attachment with no size metadata could therefore acquire a new owned
size error without any attachment being added. All three Svelte file renderers
now remember sizes and local names only for appended entries and avoid
dispatching an unchanged array when every selection is a duplicate. The
regression selects a duplicate one-byte file beside a new two-byte file under
an unrestricted two-byte minimum, then selects the duplicate again alone; the
imported value remains valid and only the new file is committed.

Focused native file-control suites pass **42/42 Flowbite**, **41/41 shadcn** and
**41/41 Skeleton**. All three affected Svelte checks pass with zero errors and
warnings. The broad shadcn package suite initially exposed a stale null-cell
test selector that selected the table's new select-all checkbox. Scoping that
test to data cells restores its intent; the focused null suite passes **5/5**
and the entire shadcn extended package passes **306/306** in a fresh run.
Production demo assets were not rebuilt for this internal metadata correction;
P6.3 remains open for the remaining semantic acceptance audit.

The next array lifecycle batch adds host replacement during the second file
read and native chooser cancellation between reads in each family. The pending
reader aborts, the externally replaced array stays intact, cancellation clears
the prior array, and neither late load callback dispatches another change.
Focused file-control suites pass **44/44 Flowbite**, **43/43 shadcn** and
**43/43 Skeleton**; shared file helpers pass **30/30** from their package
context. The requirement-by-requirement status and the contradictory file
operation validity wording in the canonical spec are recorded in
`docs/file-semantic-audit.md`.

## File semantic acceptance — 2026-10-27

The canonical spec's conflicting file-validity paragraphs were reconciled in
the sibling specification checkout: refused selections and failed reads that
preserve committed data show local operation feedback; an accepted stored file
with known invalid original byte size contributes an owned error. The file
example and implementation pitfalls now carry the same acceptance rule, and
the spec validator passes for 47 examples, 169 documents and six schemas.

The final native file-control suites pass **45/45 Flowbite**, **44/44 shadcn**
and **44/44 Skeleton**, including the `contentEncoding: base64` plus `format:
uri` data-URL case. The full Flowbite, shadcn and Skeleton production build
chains passed sequentially with generated demo outputs cleared between
families to fit available disk. Their rebuilt file-control and compact
Web Component feedback cases pass **18/18** across family, locale and host
combinations. After restoring the generated demo outputs, all four rebuilt
file-specific production suites passed together at **30/30**, including the
permission and size-bound Web Component matrices. The requirement audit in
`docs/file-semantic-audit.md` closes P6.3.

## Label interpolation and markup production acceptance — 2026-10-27

The canonical Label interpolation and Markdown examples pass **24/24**
production cases across Flowbite, shadcn and Skeleton, EN/BG locale and
native/Web Component hosts. The matrix verifies resolved static and data
parameters, locale translation and date formatting, escaped substituted
Markdown beside authored bold markup, literal text with interpolation off,
legal `constructor` data, five visible authoring diagnostics, allowed HTTPS
links, refusal of a disallowed HTTP link and readable fallback for unsupported
markup. Some renderer tabs keep inactive panes mounted, so diagnostics are
counted only in the visible pane. P6.7 stays open for the remaining defined
text-bearing fields and broader policy acceptance.

The dynamic-value and markup-config production matrices pass **72/72** across
the same families, locales and hosts. Each extended family now has a focused
normal-table test for a Markdown Label summary: row-bound parameters resolve,
the summary remains noninteractive without an explicit detail layout, closing
the dynamic-value gate removes row values and reports authoring feedback, and
reopening it with a changed row and translated text refreshes the display.
All three tests pass. Typography production and visual results are recorded below.

The shared Markdown renderer now keeps structural list markers, link
underlines, heading weights and table styling when `typography: false` removes
its theme-spacing wrapper. Its focused Label browser suite passes **7/7**,
including computed list/link/heading styles with that option disabled.

The extended Flowbite, shadcn and Skeleton registries now select family-owned
markup Label adapters. With typography enabled, plain interpolated text uses
the family's text treatment (Flowbite's native `P` for plain text), while
Markdown uses a block-safe themed `div` around semantic content. Disabling
typography skips the family wrapper without disabling Markdown parsing or
structural list/link/heading styles. Focused typography and renderer-registry
browser tests pass **2/2 in each family**; Svelte checks pass with zero
diagnostics in the shared and three extended packages. The family visual review
is recorded below; the remaining text-bearing policy surfaces still need acceptance.

The focused family suites now compare each markup wrapper's computed text
color, font size and weight with the corresponding ordinary Label. Flowbite's
native paragraph uses the same gray palette as its base Label. All three
typography suites pass **3/3**, including the same native color comparison in
dark mode. Fresh production builds for all three families passed with zero
Svelte diagnostics. The EN/BG × native/Web Component typography matrix passes
**12/12** in the production demos: rendered Markdown has the same computed
color, size and weight as an ordinary Label in light and dark modes, and
`typography: false` keeps link underlines without a family wrapper. Six
light/dark native screenshots were captured and reviewed across the families;
the Markdown remains readable without clipping or layout overflow. Capture
can be repeated with `JSONFORMS_LABEL_VISUAL_CAPTURE=1` on the focused test.
The remaining text-bearing policy acceptance keeps P6.7 open.

The screenshot review also found the Flowbite demo's specification-source
link was nearly black against its dark card. The demo now gives that link a
dark-mode text color. A focused production contrast check converts computed
CSS colors (including `oklch()`) and passes **12/12** across all three families,
EN/BG and native/Web Component hosts in both light and dark modes at a 4.5:1
minimum. The Flowbite demo was rebuilt after the change with zero diagnostics.

The shared Label summary test also confirms that a URL refused by Markdown
policy indexes only its visible link text, with no destination in the
searchable value. The focused summary suite passes **5/5**; the shared Label
browser suite separately verifies that the same refused link renders as
readable text with a diagnostic.

Family-native normal-table Label summary tests now also switch the host Markdown
profile off after rendering and confirm that raw authored text remains visible
with a `markdownDisabled` diagnostic. Restoring the profile with a refused
URL retains the link label, omits the anchor and reports `urlRefused`. The
focused summary suite passes **1/1 in each family**. Family-native choice-card
tests likewise retain refused-link text without an interactive descendant and
show a denial diagnostic; switching Markdown off preserves literal card text
with its diagnostic. The focused card suites pass **3/3 in each family**.
Together with the parser/profile unit tests, the existing 48-case markup-config
production matrix and the 12-case typography production review above, this
accepts audit row R56. P6.7 remains open for its other text-bearing behavior.

The existing literal-key Label document test dispatches an isolated array
root, so its visible Label path is `0`. A second mounted case now uses the
full form root with both a literal `a.b` array and a nested `a.b` array. Its
rendered row provider supplies the literal source item to the Label, and a
live data replacement updates the text without reading the nested lookalike.
The focused Label suite passes **2/2** after rebuilding the linked shared
package. CollectionItem now carries source items through array, tuple-tail,
list/detail, ordinary-table, AG Grid and row-detail descendants in all three
families. Their focused array/row-detail suites pass **38/38** and AG Grid
row-detail suites pass **6/6**. A shared browser regression verifies the
selected source item follows its row key through reorder and replacement, then
clears on removal (**1/1**). All seven affected Svelte package checks have
zero diagnostics. This resolves row-bound Labels in the provider paths; other
arbitrary dotted instance-path consumers remain in P1.3.

Shadcn free unique-string chips now use the pinned extras Tags Input in both
native and Web Component builds. Its mounted adapter suite passes **10/10**,
including guarded add/remove and localized removal labels; the rebuilt
Shadcn array-choices production cases pass **4/4** in EN/BG and both hosts.
The Stepper and Tags Input source audits both match their pinned commit with
zero differences. For the reported normal-table bulk-delete case, the exact
three-row mounted confirmation passes **1/1**; the rebuilt demo deletes the
three visible last-page applicants in **4/4** EN/BG native/Web Component
cases, while cross-page selection/delete also passes **4/4**. No deletion
implementation change was needed for these reproduced states. Shadcn renderer,
Web Component and demo checks/builds pass; the Web Component check retains its
existing custom-element compile-option warning.

Shadcn section-error popups now use an edge anchor when they open above a
stepper header icon. The previous top calculation subtracted the 280px maximum
height even for a short one-error popup, leaving a large gap. The focused
stepper-header geometry test passes **4/4** in EN/BG and native/Web Component
hosts after rebuilding the Shadcn package, Web Component, and demo.

Shadcn finite multi-selects now open from the whole field and use the same
Popover/Command search-and-choice presentation as searchable single-selects.
Choice rows show selection checkmarks without nested checkboxes; chips remain
removable without opening the popup, including with Enter on a focused remove
button. The mounted renderer suite passes **12/12** and the updated small/large
viewport bounds suite passes **8/8**. The `spec-array-choices` demo passes
**30/30** across families, EN/BG and native/Web Component hosts; its focused
Shadcn cases cover Alert channels, Notified teams, and Imported preferences.
The additional twelve-case finite-choice matrix verifies the automatic checkbox
group and both multi-selects, including stored `ops` and `fin` constants.
The Shadcn renderer check has zero diagnostics, and the renderer, Web Component,
and demo builds pass.

### Choice-card rich presentation — 2026-10-27

The canonical `spec-choice-controls` selected image card now has an EN/BG
browser regression in each extended Svelte family. All **6/6** focused cases
pass: its translated label, rendered Markdown, and selected radio survive
disabling image-data URLs while the image disappears. The production
rich-content matrix passes **12/12** across families, EN/BG and native/Web
Component hosts; together with the pending-branch matrix it passes **24/24**.
The production test exposed a Flowbite card whose selected border was visible
while its radio remained unchecked after hydration. Flowbite now synchronizes
the radio's checked state after rendering and pending decisions; its
mounted card suite passes **14/14**. This covers the selected-card policy
fallback and production identity, not the remaining P3.9 context matrix.
Checks and formatting pass in all three extended packages; the scoped Flowbite
renderer, Web Component, and demo builds pass.

The shared selectable-card guard now rejects Labels with
`options.interpolate: true`, including nested layouts, so executable text
templates cannot run inside radio labels. Supported Markdown remains allowed;
rejected content falls back to the visible and accessible choice label. The
shared card contract passes **12/12** and the focused extended-family
rich-card suites pass **3/3 in each family**. Core and extended-family checks
pass. Broader P3.9 acceptance remains open.

The focused temporal controls, time controls, and date-time Apply suites pass
**56 Shadcn and 54 each in Flowbite/Skeleton** after fixing seconds-column
parsing and saving for minute-only display formats, discarding staged date-time
drafts on host replacement, and keeping incomplete date, time and date-time text
local with host value/path/schema ownership. Nested collection pending scopes
now block Add while a sibling date, time or date-time input has incomplete text
and resume once the text is complete; the adjacent Shadcn collection pending
and pagination suites pass **43/43**. Immediate picker edits remain live. These
checks cover the changed P3.10 behavior; the full production temporal matrix
remains pending.

The core temporal-options suite passes **8/8** after adding root-absolute
`$data` resolution and an exact literal-dotted sibling lookup. Focused native
temporal-bound suites pass **30/30 per family** in Flowbite, Shadcn and Skeleton:
dates below `/from` or `1/from.date` are blocked in the calendar, a host
replacement moves that lower bound, and the new boundary date is accepted.
Direct date values at literal dotted keys also resolve relative `1/from` and
absolute `/from` against parent data before isolated validation. A second
literal dotted key beneath a dotted object preserves the original root for
both `1/from` and `/group.parent/from`. Ordinary date children of the dotted
object use the same root and exact path for both pointers; mounted pickers
reject old and new out-of-range dates and accept the moved boundary.
Typed out-of-range dates in those ordinary children and direct dotted date
values remain in form data, publish `formatMinimum`, and show invalid control
feedback. Direct and nested dotted dates backed by `$defs` references also
preserve both bound forms. A direct dotted date behind `$ref` and `allOf`
resolves relative and absolute bounds for picker selection and typed validation.
The same relative and absolute bounds work for a nested dotted date behind a
`$defs` reference with compatible temporal `allOf` branches. A presentation-only
projection renders one scalar editor while retaining the composed validation
schema; all three suites verify that host replacement moves the calendar bound.
Other composition shapes and the broader bound/view and production matrices
remain open.

The native date, time and date-time inputs now show an accessible, translated
format hint while nonempty text remains unparseable. The hint does not publish a
form error or change the stored value and disappears after completion. The
affected ConfigTemporal suites pass **51/51 Shadcn and 49/49 each in
Flowbite/Skeleton**. Coarse month/year Date pickers and time/date-time step controls
now show translated EN/BG range feedback near the picker for rejected choices.
The message is associated with the input; the committed value is unchanged,
Apply is disabled and guarded, and correcting the choice clears the message
before commit. Rejected selections in other picker modes remain pending.

### Temporal popup short-viewport placement — 2026-10-28

Date, time and date-time popups now cap their scrollable content to the space
available from their native positioning components. Shadcn uses Bits UI's
popover available-height value; Skeleton uses its positioner's available-height
value. Flowbite's floating popover uses a half-viewport cap so it can fit on
either side of its trigger. The three affected demo families were rebuilt.
`pnpm exec vp test --run tests/demos/temporal-popup-bounds.spec.ts` passes
**36/36** for the three picker kinds across Flowbite, Shadcn and Skeleton,
English and Bulgarian, and native and Web Component hosts at 900×360. The
matrix checks settled viewport bounds, ShadowRoot placement, internal scrolling
when content overflows, and reachability of the last visible control. This
closes the bounded temporal-popup placement check; the other temporal and popup
inventory requirements remain open.

### Finite multi-select short-viewport and Shadow DOM behavior — 2026-10-28

Flowbite's native MultiSelect placed its dropdown below the trigger at a fixed
256px maximum, so a lower trigger could push the list out of a short viewport.
It now chooses the roomier side and caps the list to a height that fits either
side. Arrow-key navigation also scrolls the active option into view. The native component also closed immediately inside the Flowbite Web
Component: its document-level outside-click listener saw a Shadow DOM click as
one on the host. The renderer contains that click at the MultiSelect boundary
inside Shadow DOM, while outside clicks still dismiss the dropdown. The
focused mounted array-choice suite passes **13/13**. After rebuilding the
Flowbite package, Web Component and demo, the 100-choice production popup and
adjacent array-choice suites pass **8/8** across EN/BG and native/Web Component
hosts. The popup cases verify viewport bounds, internal scrolling, selection of
the last option, keyboard selection of another final option, and outside-click dismissal. Skeleton's existing 100-choice
enum suite now also includes a low-trigger short-viewport case; it passes
**5/5** without a renderer change. The full dropdown inventory remains open.

The Flowbite and Skeleton searchable single-choice popups pass a shared
100-option production matrix at 390×450: **8/8** across EN/BG and native/Web
Component hosts. A second control lowers the trigger enough to expose upward
placement overflow: Skeleton now caps content with the positioner's
`--available-height`, while Flowbite chooses the roomier side and limits its
menu to that space. Both lists scroll internally. Wheel and native touch
scrolling bring the final option into view; pointer selection and keyboard
End/Enter work in both host modes. The same four Skeleton cases also open a
finite multi-select by clicking its input area, keep its 100-option popup inside
the viewport, and select the last option. Skeleton's enum and oneOf inputs now
open on click as well, overriding Zag's false `openOnClick` default. Adjacent
mounted suites pass **11/11 Flowbite** and **24/24 Skeleton**.
The same Skeleton Combobox policy now applies to oneOf-branch and mixed-type
selectors. Their focused mounted suites pass **43/43**, including input-area
click opening and short-viewport bounds for each. A rebuilt 390×300 production
matrix passes **4/4** across EN/BG native and Web Component hosts: both popup
types remain inside the viewport and ShadowRoot where applicable, scroll
internally, and the last branch in a 40-option list can be reached and chosen
by wheel/pointer, touch gesture/tap, and End/Enter. The initial branch change
also completes its form-clear confirmation before the popup is reopened.
The remaining popup inventory stays open.

### Shadcn demo theme picker bounds — 2026-10-28

The theme picker's per-field height classes overrode the shared Select content's
viewport-aware cap. The Icon Library picker now keeps that cap while retaining
its wider preview layout. The Shadcn demo check and build pass, and the rebuilt
900×360 English/Bulgarian native test passes **2/2**. It checks viewport bounds
and last-item reachability for Icon Library, font, menu color, and the settings
validation, locale and layout selectors.
The broader settings and renderer popup inventory remains open.

The matching 900×360 Flowbite and Skeleton theme overlay suite passes **4/4**
across English and Bulgarian native demos. Flowbite's four-choice menu stays
inside the viewport and its final choice can be selected. Skeleton's scrollable
theme panel stays inside the viewport and its last theme is reachable and
selectable. This is bounded demo-level evidence, not the complete popup audit.

### Temporal draft host replacement — 2026-10-28

A production Web Component matrix passes **6/6** across Flowbite, shadcn and
Skeleton in English and Bulgarian. For date, time and date-time controls with
masking disabled, incomplete typed text remains local and emits no change. A
host property replacement then restores the formatted value without publishing
the abandoned draft. The host may publish a change for the replacement itself;
the matrix confirms every such event carries the replacement value. The test
allows the browser's local time-zone conversion while checking the replacement's
date and minutes.

The matching native demo matrix passes **6/6** across the same families and
locales. It types incomplete date, time and date-time text into the canonical
masked example, confirms the Data editor still contains the unchanged JSON,
then saves replacement JSON and verifies all three controls display the new
values in the demo's configured format. This closes the bounded native and Web
Component draft-replacement check; other P3.10 views, bounds and actions remain.

### Staged temporal Cancel and Apply — 2026-10-29

The rebuilt `temporal-config-views` production matrix passes **12/12** across
Flowbite, shadcn and Skeleton, English/Bulgarian, and native/Web Component
hosts. It configures month/year Date and DateTime controls plus a time-only
control with staged actions. Each month or hour change leaves the displayed
value unchanged until Apply; Cancel followed by reopen restores the committed
selection, and Apply stores the new selection. The final Data JSON matches the
expected document exactly, and the date-time popup closes before the Date
popup opens.

Flowbite's date-time popup retained a native month selector through its close
transition after Cancel, so selecting the same new month after reopening did
not dispatch a change. Keying the coarse selector by the popup open cycle
restores the committed month on reopen. The focused Flowbite ConfigTemporal
suite passes **50/50**, including a mounted coarse Date Cancel/reopen/Apply
regression. Broader P3.10 views, bounds and action acceptance remains open.

The added time-only step exposed stale canceled hour drafts in shadcn and
Skeleton. Their TimePicker components now remount for each popup open cycle,
restoring the committed hour before a new edit. The focused TimeControl suites
pass **4/4 in each family**, the two renderer checks report zero errors and
warnings, and their package, Web Component and demo builds pass. The expanded
12/12 production matrix passes across all family/locale/host combinations.

The same production matrix now switches the authored Config to
`showActions: false` after the staged checks. Date, DateTime and time-only
pickers expose no Cancel action, publish a changed month or hour immediately,
and produce the exact expected Data JSON. It passes **12/12** after closing
each immediate popup before opening the next, so controls with the same
month/hour roles are not confused. This checks both action modes on the
canonical coarse-view fixture; other formats, bounds and selection conflicts
remain under P3.10.

The same **12/12** run also checks display and storage independently for the
coarse Date and DateTime fields. The initial Date field shows `2027.01` while
the document stores `2027-01`; the initial DateTime field shows
`02-11-26 03:05 pm` while the document stores `2026/11/02 3:05 pm`.
The visible strings and exact final Data JSON are checked again after staged
and immediate month changes. This covers the authored display/save formats in
this fixture, not every temporal format variant.

### Local temporal restrict precedence — 2026-10-29

The focused `local-restrict-temporal` production check passes **6/6** across
Flowbite, shadcn and Skeleton in native and Web Component hosts. With the
canonical date field's local `options.restrict: false` and October 2026 schema
bounds, each picker accepts December 25 and stores `2026-12-25`. The field
still displays the `must be <= 2026-10-31` validation error. The adjacent
global `config.restrict: false` production matrix passed **12/12** in the same
test file. This verifies the local override and continuing schema validation
for this date example; broader temporal bounds remain open under P3.10.

### Compact temporal-cell validation and focus — 2026-10-29

The focused `NumericCellEditing.svelte.spec.ts` suites pass **4/4 per family**
in Flowbite, shadcn and Skeleton. In normal tables with two rows and
`restrict: false`, typing a date, time or date-time beyond `formatMaximum`
updates only the first row, marks only its cell invalid, and keeps its input
connected and focused without a duplicate label. Correcting the value clears
that feedback while the neighboring row's stored value and display remain
unchanged. Time and date-time controls retain their localized display and
offset-bearing stored strings. This adds mounted compact temporal-cell
acceptance to P3.11; other specialized cell and sorted-row cases remain open.

The focused `AgGridTemporalValues.svelte.spec.ts` suites pass **2/2 per extended
family** in Flowbite, shadcn and Skeleton. Date and date-time cells are sorted
with a source order different from the displayed order. An out-of-range edit
updates the original source item, marks only that displayed row invalid, and
keeps its input focused. A corrected value clears the feedback and moves that
same source item to its new sorted position; the original input data remains
unchanged. This covers AG Grid date/date-time source identity and range
feedback after sorting, not all temporal cell modes or filters.

### Choice-card border and error states — 2026-10-29

The focused `ChoiceCardsRenderer.svelte.spec.ts` suites pass **15/15 per family**
in Flowbite, shadcn and Skeleton. Mounted card assertions cover the 2px border,
inset selected outline and error border on every choice, while existing cases
continue to cover selection and rich content. The three package checks report
zero errors and warnings. Light/dark and narrow visual review remains open
under P3.9.

### Choice-card failed images and host content replacement — 2026-10-29

The focused `ChoiceCardRichPresentation.svelte.spec.ts` suites pass **4/4 per
extended family** in Flowbite, shadcn and Skeleton. A selected card whose image
load fails retains its visible label and content and stays checked. Replacing
the selected card's rich layout through a host UI-schema update removes the
old image, shows the replacement text and preserves the choice. The three
extended package checks report zero errors and warnings; scoped lint and
format checks pass. Light/dark and narrow visual acceptance remains open under
P3.9.

### Referenced time minimum after host replacement — 2026-10-29

The two focused `TemporalBounds.svelte.spec.ts` cases pass **2/2 per base family**
in Flowbite, shadcn and Skeleton. With a zone-free `formatMinimum: { $data:
'1/limit' }`, the time picker permits a downward hour step when the host limit
is 09:00, then rejects the same step after host replacement raises the limit to
12:00. The rejection displays the translated range message and does not commit
the invalid draft. The three package checks report zero errors and warnings; scoped lint
and format checks pass. This mirrors the React Antd time-bound replacement
case. A second focused regression uses valid offset-bearing times: the picker
opens at the hour shown by the localized input, and after a `$data` minimum
replacement rejects a backward step with translated feedback and no commit. A
valid forward step applies, saves an offset-bearing RFC 3339 time, updates the
displayed local hour, and leaves no `/time` validation error. That case passes
in New York for all three families and in UTC and Honolulu for shadcn when the
bound and value do not straddle local midnight.
The affected bounds and configuration suites pass **83/83 shadcn**, **82/82
Flowbite** and **81/81 Skeleton**. Skeleton's two slow nested-date cases timed
out in a concurrent run, passed in isolation, and passed in the sequential
full scoped run with a 30-second case timeout. Broader time-only offset
save/validation policy and production acceptance remain open. The
cross-midnight offset case now uses the validator's fixed-date time ordering:
in Honolulu, a 09:00Z lower bound converts to 23:00 on the previous local day
while a valid 11:00Z value displays as 01:00. All three pickers allow stepping
to 00:00 local (10:00Z), reject the next backward step, reject the exclusive
13:00Z upper boundary, and apply the valid step without a `/time` error.
The focused Honolulu case passes 1/1 per family. Shadcn and Flowbite
temporal-bound suites pass 33/33 each; Skeleton's
full run stalled without output and was stopped, while its focused offset and
reference cases pass 3/3. The complementary exclusive-lower/inclusive-upper
mounted case passes in UTC and Honolulu for all three families: it offers the
inclusive upper hour, rejects the next hour and the exclusive lower hour, then
saves a valid edit with the RFC 3339 fractional-second `HH:mm:ss.SSSZ` format
and no `/time` error. The four affected offset/reference cases pass 4/4 per
family, and the core temporal-options suite passes 10/10 in each zone; its
comparisons agree with Ajv for mixed offset/zone-free bounds as well as
inclusive and exclusive offset bounds. Mixed zone-free minimum/offset maximum
picker interaction passes the focused mounted case in UTC and Honolulu for all
three families. After rebuilding the three affected renderers, Web Components
and demos, the bounded production offset case passes **24/24** across families,
EN/BG, native/Web Component hosts and New York/Honolulu. It rejects the
exclusive upper hour, applies the valid backward step as 10:00Z, and keeps
the Web Component popup inside its ShadowRoot. The test-project TypeScript check, scoped lint, formatting
and diff checks pass. Its geometry test now types the ancestor walk as `Element`,
which covers both HTML and SVG nodes returned by the locator callback.

The next production time-only offset mode matrix passes **24/24** across three
families, EN/BG, native/Web Component hosts and New York/Honolulu after the
same affected builds. Immediate picker selection saves a valid
`HH:mm:ss.SSSZ` value. Raising a live `$data` minimum rejects the backward
step without changing stored data; turning off restriction permits the edit
and retains the schema error. In Honolulu the referenced minimum is zone-free
while the maximum is offset-bearing, so this also covers dynamic mixed-bound
replacement in both hosts. The earlier staged production matrix remains
24/24. Other P3.10 temporal views, drafts, parsing and action combinations
remain open.

The 12-hour time picker now validates a prospective AM/PM switch before changing
its period state and steps hours on the underlying 24-hour clock, matching React
Shadcn's noon/midnight behavior. An invalid PM switch leaves the AM draft
intact, so the next valid hour decrement can apply. Time-only controls save
13:00 after stepping twice from 11 AM and 01:00 after stepping twice from
11 PM. Bounded date-time controls step through noon, reject a 2 PM candidate
above their 1 PM maximum without committing, and enable Apply after a valid
correction. Focused mounted time-only and date-time tests pass in Shadcn,
Flowbite and Skeleton under New York and Honolulu (30/30 family × timezone ×
interaction cases). This covers native mounted controls; broader P3.10
acceptance remains open.

After the dependency-ordered library, Web Component and demo rebuild passed,
the production temporal example's 12-hour picker passed 24/24 cases across
three families, EN/BG, native/Web Component hosts and New York/Honolulu.
Starting from 11 AM, two hour steps displayed noon then 1 PM and Apply stored
exactly `13:00`; no browser page errors were observed. The production case
covers the time-only interaction.

The same rebuilt demos pass a separate bounded date-time AM/PM matrix, 24/24
across three families, EN/BG, native/Web Component hosts and New York/Honolulu.
The picker starts at 11 AM, rejects a switch to PM without changing its draft,
steps through noon to 1 PM, rejects 2 PM with translated range feedback and
disabled Apply, then clears the feedback after a valid correction. Apply stores
the exact expected 1 PM instant. No page errors were observed. The first
aggregate run failed in Flowbite and Skeleton because a global PM locator
targeted another or hidden picker; scoping the click to the active hour input
passed the affected cases and both complete timezone matrices.

P7.8 package-boundary checkpoint: `pnpm --config.ignore-scripts=true pack`
produced base and Shadcn renderer tarballs from the existing `dist` output.
Both include `dist/index.js`, `dist/index.d.ts` and manifests with resolved
`@jsonforms/core` peer ranges (`^3.9.0-alpha.1`); the Shadcn manifest resolves
its base-renderer workspace dependency to version `1.0.2`. The Shadcn tarball
retains the stable `@jsonforms-svelte-shadcn-ui/*` import prefix in 56 Svelte
files by design: its README requires an external app to map that prefix to its
own generated Shadcn components. This is a consumer-owned alias, not a path into
the monorepo. Packing and manifest inspection alone do not prove native
consumption. A separate Vite/Svelte app under `/tmp`, outside the workspace,
installed these two tarballs with JSON Forms core 3.9.0-alpha.1 and Svelte
5.50.1. It copied the demo's generated Shadcn UI source into the temporary app
and mapped the stable UI prefix to that local copy; it used no alias into this
repository. The app enabled `vitePreprocess({ script: true })` so TypeScript
syntax in packaged Svelte sources was compiled. After making the copied UI's
own dependencies available in its isolated `node_modules`, the production
build passed. A browser loaded the built app, showed the packed form's `Ada`
value, edited it to `Grace`, and reported no page errors. This first manual
run established the Shadcn base-renderer native build/edit path.

The reusable check is now
`node scripts/verify-packed-native-family.mjs <family> <base.tgz> <renderer.tgz>`.
It creates a fresh Vite/Svelte app outside the workspace, declares the family's
UI dependencies, installs both tarballs, compiles with the app's installed Vite
toolchain, and checks an exact host-data update in Chromium. The focused
Shadcn run passed from an offline pnpm store without manual links. Flowbite's
first offline attempt stopped during dependency resolution because its cached
`es-errors` metadata used an older pnpm layout; a normal isolated install
passed. Skeleton's normal isolated install also passed. The resulting **3/3**
native-family builds and browser edits all changed host data from
`{"name":"Ada"}` to `{"name":"Grace"}` without page errors. P7.8 remains open
for external declaration checks, runtime CSS/assets behavior and broader
consumer scenarios.

The external-app TypeScript probe now imports the packed root exports before
the production build. Its initial strict run found a package-owned declaration
collision: each recursive-tree wrapper imported `RecursiveTreeRenderer` and
also declared its own Svelte component with that name. Flowbite's `Pane`
wrapper had the same issue. The source imports now use distinct aliases;
after each package's `prepack`, the generated declarations omit the colliding
imports and `publint` passes. The common extended package also now publishes
`@types/lodash`, required by its exported `template.d.ts`. Fresh packed
Shadcn, Flowbite and Skeleton extended consumers pass the root-export audit,
production build, color-renderer selection and browser host-data edit (3/3);
all three repaired base profiles also pass without either extended package.
The strict TypeScript probe still reports diagnostics confined to existing
external declarations in JSON Forms core and Ractive, plus Flowbite Svelte
and ApexCharts in the Flowbite profile. The verifier rejects any diagnostic
outside those upstream paths rather than treating an unrestricted
`skipLibCheck` run as proof. This root-export probe does not cover every
subpath/type or runtime CSS and asset behavior, so P7.8 stays open. Focused
recursive-tree tests pass 6/6 in Shadcn and 19/19 across Flowbite's recursive
tree and split panes. Skeleton's indicator click initially exposed a
hover-then-click close race; its container and validation-badge triggers now
keep a click-open popup visible and close on Escape. Skeleton's affected
recursive-tree and structured-error suites pass 10/10.

The same reusable script now accepts two additional tarballs for the common
and family extended packages. Fresh packed consumer profiles for Flowbite,
Shadcn and Skeleton each installed the extended pair and built successfully
(3/3). The app registered the base plus extended renderers and cells, rendered
a `format: color` property with the extended color picker in each family,
then changed host data from `{"name":"Ada","swatch":"#ff0000"}` to
`{"name":"Grace","swatch":"#ff0000"}` without page errors (3/3). Their
production builds emitted Monaco worker and editor assets. The separate base
profiles had no extended packages installed, so the tested base path does not
require the optional registries. The subsequent runtime asset profile below
extends this evidence beyond build-time resolution.

P7.8 runtime asset profile: the packed native consumer script's optional
`--assets` mode adds a Monaco code control and an AG Grid array control to
the base-plus-extended form. Fresh Flowbite, Shadcn and Skeleton tarball apps
all pass installation, strict root-export audit (with only the classified
upstream diagnostics above), production build and Chromium checks (3/3).
Each browser run sees Monaco and AG Grid mount, a Monaco `editor.worker`
start, `jsonforms-monaco-editor-styles` and the family AG Grid runtime style
in the document, and a computed `display: flex` on the grid toolbar. The
host-data name edit still preserves the code, grid row and color value, with
no page errors. This verifies the tested packaged CSS and worker path at
runtime without workspace aliases.

The current `pnpm run release:pack` rehearsal passed for all eleven public
packages. Its fresh versioned tarballs then passed the isolated native
consumer against all three base-only families (3/3) and all three extended
asset profiles (3/3). The declaration probe now namespace-imports each public
root export in the external app. The extended browser profile edits an AG Grid
name cell from `One` to `Two`, replaces Monaco code `const x = 1;` with
`const x = 2;`, then changes `Ada` to `Grace`; the final host JSON matches
exactly and no page errors occur. The strict declaration check still excludes
only the previously classified external dependency diagnostics. Shadcn uses
the consuming app's own UI copy rather than a workspace alias.

The packed Web Component test passed its three-family browser matrix against
the same release output, including registration, rendering, host data edits,
readonly, root inference, locale fallback, OTP, file validity and assets.
An archive audit found each advertised root JS and type path, `./dist/*` and
`./package.json` export, and packed CSS/JS dist assets in every Web Component
tarball. This closes the bounded P7.8 packed-consumer gate; P8.6 still requires
the final broad release verification after the remaining implementation work.

### Exact Svelte peer-floor runtime checkpoint — 2026-10-29

The packed native consumer now accepts `--svelte-floor` and checks the exact
installed Svelte version. Its base-plus-extended Monaco/AG Grid browser profile
passes with Flowbite at **5.40.0**, shadcn at **5.33.0**, and Skeleton at
**5.32.0**. Each installs the release tarballs into an isolated app, builds,
edits the grid and Monaco fields and then the host name, and checks exact final
JSON without page errors. The Skeleton profile uses its normal `^4.12.1`
Skeleton dependency range; the install selected 4.15.2 and passed.

The first Skeleton run at the previously advertised Svelte 5.29.0 failed to
bundle because both Skeleton Svelte 4.15.2 and the pinned 4.12.1 import
`fromAction` from `svelte/attachments`. The published Svelte 5.31.0 archive
also lacks that export; the 5.32.0 consumer passes. Skeleton's base and
extended peer declarations and the compiler-floor inventory now use 5.32.0.
The [Svelte attachment reference](https://svelte.dev/docs/svelte/svelte-attachments)
describes the API, while the archived release exports and consumer builds
establish the version boundary used here.

The exact-floor compiler check then found an unrelated core source using a
writable `$derived` transition flag in `splitPane.svelte.ts`, which Svelte
5.20.0 rejects. The flag is now `$state`; its existing option-sync effect
still restores the configured transition after dragging. All **439** current
library/demo-common Svelte sources compile for client and server at their
declared floors, and the three focused split-layout browser suites pass
**14 Flowbite / 13 shadcn / 14 Skeleton** cases. Core-only 5.20.0 runtime and
the broader P0.1 peer/export/provenance acceptance remain open.

The core-only runtime is now verified separately. A fresh `pnpm pack` from
`packages/jsonforms-svelte` passed its prepack/publint gate, and
`node scripts/verify-packed-core-floor.mjs <core.tgz>` installed that archive
in an isolated Vite/Svelte app with exactly **Svelte 5.20.0**. An app-owned
minimal renderer imported the packed core hooks, edited `Ada` to `Grace` via
JSON Forms dispatch, and the host received exact `{"name":"Grace"}` data
without browser page errors. The isolated production build passed. This checks
the current core package after the split-pane fix; installed JSON Forms
export/peer compatibility and the full provenance audit remain under P0.1.

The 2026-10-29 reference refresh pins 47 imported example fixtures and the
conformance snapshot to spec `1c6e2a046fb5bafa966682735ddcba1b901e21d0`.
The imported temporal UI schema again matches the source; the corrected
date-time `views` explanation stays in the English/Bulgarian translation
supplement. Source provenance verification passes, and the focused conformance
and config-consumption suites pass **20/20** tests. The conformance snapshot
now includes two proposed `$dynamic` vectors as open behavior work, while its
layout-gap description reflects the existing 16px row/column helper default.

`pnpm run audit:jsonforms-core` passes against the installed
`@jsonforms/core@3.9.0-alpha.1`. The audit checks the workspace catalog and
lockfile snapshot, all 12 Svelte package declarations/resolutions, and all
112 distinct runtime names imported from the package root. This closes the
installed JSON Forms package-root import check; P0.1 remains open for the
copied/upstream source provenance review.

The workspace peer-resolution audit also found all **107** declared peer
resolutions across 12 Svelte packages present and within their declared
SemVer ranges. This complements the isolated packed native/Web Component
consumer gates; it does not replace P0.8's component-source classification.

The packed core-floor and native-family consumer fixtures now resolve their
exact `@jsonforms/core` version from the installed `jsonforms-svelte` workspace
package instead of repeating `3.9.0-alpha.1` in each script. The lockfile
continues to provide a reproducible install and `audit:jsonforms-core` checks
the catalog, resolved version, and package-root imports. This removes two
manual script edits from a core upgrade; packed-consumer browser acceptance
must still be rerun after an actual dependency change.

P0.1 current-source acceptance checkpoint, 2026-10-29: the installed-core
audit passes for 12 packages and 112 runtime imports; the adapted-source
provenance script verifies all 18 pinned paths; and the spec-source audit
matches all 47 imported fixtures. `pnpm run check:svelte-minimums` compiles
the current 439 library/demo-common sources for client and server at their
declared floors. Existing local tarballs pass isolated production builds and
exact host-data browser edits with core at Svelte 5.20.0, Flowbite at 5.40.0,
shadcn at 5.33.0, and Skeleton at 5.32.0. These tarballs were built before
some current source changes, so a fresh-current-tarball floor matrix remains
the P0.1 acceptance gate. No full repository rebuild was run for this focused
checkpoint.

P1.3 dynamic literal clear checkpoint, 2026-10-29: the isolated value editor
now distinguishes a dynamic additional-property key from an ordinary declared
literal control when a custom renderer dispatches `undefined` at its root.
Dynamic Add/Rename/Delete ownership stays with the additional-property
renderer; Clear stores `createDefaultValue` for the property's actual schema
and leaves the exact key and siblings intact. `existingOnly` rejects a late
custom edit after the dynamic key has been removed. The mounted
`LiteralProperties.svelte.spec.ts` suites pass **31/31 Flowbite, 35/35 shadcn,
31/31 Skeleton**, including a new custom-renderer clear regression in each
family. The shared declared-literal control's five clear-to-absent cases pass;
all four affected package Svelte checks pass. This is native mounted
acceptance; broader arbitrary dotted instance-path and production-host
coverage remains under P1.3.

P0.1 final acceptance, 2026-10-29: the current core and Flowbite, shadcn and
Skeleton native renderer packages passed their own `build` scripts (including
Svelte checks and `publint`) and were freshly packed with resolved workspace
and catalog ranges. The core archive includes the current isolated literal
clear code; the shadcn archive includes its new dynamic-key props. The four
fresh tarballs passed isolated Vite production builds and exact `Ada` →
`Grace` browser host-data edits at **Svelte 5.20.0 core, 5.40.0 Flowbite,
5.33.0 shadcn and 5.32.0 Skeleton**, without page errors. The current-source
439-file exact-floor compiler check, 12-package/112-import installed-core
audit, 18-path adapted-source pin check and 47-fixture spec-source audit also
pass. The broader extended/Web Component packed matrix remains accepted under
P7.8; a final full release rerun remains P8.6.

P1.14 unhandled-action diagnostic checkpoint, 2026-10-29: the shared
extended `JsonForms` host now warns with stable code `action.unhandled` when
an action is fired without an `onhandleaction` host handler. It logs the
action identifier and element type once per mounted form/action; it does not
include params or data, change form errors, or block a handler attached later.
The affected mounted `JsonForms.svelte.spec.ts` file passes **6/6**, including
the unhandled-to-handled transition; the shared extended Svelte check passes
with zero diagnostics. This closes that diagnostic only. Unsupported-option,
capability, cycle and focus-conflict inventory remains under P1.14.

The shared image URL policy now special-cases the `data:` scheme before the
general allowed-scheme fallback. With `allowedSchemes: ['https', 'data']`, an
image source still needs `allowImageDataUrls: true` and an `image/*` MIME
type, as spec §12 requires. Direct and scope-resolved ImageView sources share
that guard. Focused core URL-policy and ImageView tests pass **54/54**;
the extended template-URL suite passes **5/5**, including SVG image/filter
`href` attributes and a broad `data` scheme. The pinned React URL helper
has the same fallback gap, so the Svelte guard follows the spec.

After a dependency-ordered `pnpm run build:demo`, the production
`image-context` matrix passes **12/12** across Flowbite, Shadcn and Skeleton,
English/Bulgarian, and native/Web Component hosts. It checks direct and scoped
ImageView sources: `allowedSchemes: ['https', 'data']` alone still refuses
image data URLs; explicit image opt-in permits `data:image/*` but refuses
`data:text/html`. The test now uses a focused Monaco paste event and an
explicit 120-second per-case timeout; the previous 5-second default expired
during its setup. Broader P1.9 markup/expression and template production
acceptance remains open.

The rebuilt production `template-image-url-policy` scenario passes **12/12**
across Flowbite, Shadcn and Skeleton, English/Bulgarian, and native/Web
Component hosts. With a broad `data` scheme, template `img`, SVG `image`, and
SVG `feImage` sources remain stripped until `allowImageDataUrls` is enabled;
`data:text/html` remains stripped after opt-in. The test changes host config
while the same Ractive template remains mounted. Its editor setup shares the
focused paste/apply helper with `image-context`; one image-context case was
rerun after extraction and passes. Template lifecycle and broader P1.9
markup/expression acceptance remain open.

The same rebuilt template matrix now revokes `allowScriptEvaluation` while
Ractive content is mounted. In all **12/12** family/locale/host cases the
template disappears, the localized permission alert appears, and restoring
permission remounts the permitted image source. This verifies the runtime
gate through both native and Web Component demos; other engine and lifecycle
acceptance remains under P1.8/P6.11.

The existing production `template-layout` matrix passes **12/12** against the
rebuilt demos for Ractive and compiled native slot edits. A new
`template-repeated-slot-lifecycle` matrix passes **12/12** across the same
three families, EN/BG, and native/Web Component hosts. It renders the same
named child twice, removes one through a live data change, verifies that the
surviving input retains its DOM identity, edits it, and restores the other
branch with both inputs showing the stored value. Further template engine and
teardown acceptance remains open under P6.11.

## Sibling collection pending scopes, 2026-10-29

Two sibling collection pagers exposed a shared pending-edit cycle: each child
scope registered with its parent and also consulted the parent's other changes,
so checking or flushing one pager could walk A → parent → B → parent → A.
The focused mounted regression first failed with `RangeError: Maximum call
stack size exceeded`. Pending-change traversal now visits each change once per
operation. A second mounted case verifies that a blocked edit in the sibling
still prevents navigation; the focused shared suite passes **3/3**.

After rebuilding the shared library, shadcn Web Component and native demo, the
`shadcn-normal-table-parity` and `table-row-details` production suites pass
**16/16** across English/Bulgarian and native/Web Component hosts. The same
matrix had failed on pagination and row-detail actions before the shared fix.
This restores the covered table paths. Subsequent focused AG Grid pagination
cases pass 8/8 per extended family, proving full-collection sort/filter before
paging and source-index edits from page two. Base table and tuple-tail suites
pass 9/9 per family with table/property/tail pager containment; the existing
production collection-pagination matrix passes 12/12 across families, EN/BG
and native/Web Component hosts with those containment checks. Shadcn table
selection also survives page navigation without a data edit (8/8 focused table
cases). Mounted page-size changes retain the first visible source row in all
three families without data edits. New table-row and dynamic-property cases
also prevent composing drafts from redirecting after external replacement,
with the focused pagination suites at 11/11 shadcn and 10/10 Flowbite/Skeleton.
A following tuple-tail replacement case passes 4/4 per family and prevents a
composing draft from following a shifted array position. Off-page schema errors
remain reachable in table, dynamic-property and tuple-tail views across all
three families; focused table/property suites pass 13/13 shadcn and 12/12
Flowbite/Skeleton. P4.10 pagination and portable-column acceptance is complete;
other collection contracts retain their own open TODO items.

## Shadcn source-path and border review, 2026-10-29

The pinned shadcn registry uses `border-input` on unchecked Checkbox and Radio
items and includes three Field-label focus selectors that both local copies
omitted. The native demo and Web Component now carry those tokens while keeping
the installed Lucide icon substitutions. [Tailwind documents `@source` paths](https://tailwindcss.com/docs/detecting-classes-in-source-files#explicitly-registering-sources) as
relative to the stylesheet: the three demo `src/app.css` files had pointed at
nonexistent `src/src` directories, so their explicit source now points at
`./`. The two shadcn host aliases still resolve to their own UI component
copies, and both rebuilt bundles include the reviewed Field, row-state and RTL
selectors. Both shadcn builds pass; the focused normal-table matrix passes
**4/4** in EN/BG native and Web Component hosts, checking the settled Checkbox
border against its local `--input` token and continuing through selection,
pagination and deletion. Flowbite and Skeleton demo builds also pass after
their source-path corrections. A source comparison of the pinned registry's
17 `IconPlaceholder` files finds the matching Lucide icon import in both local
host copies, with no unresolved placeholders. The select-item SVG pointer
policy and Calendar button RTL rotation remain intact. At this checkpoint,
P0.8 still needed adapter visual acceptance beyond source-name matching.

The P0.8 upstream-component audit is now accepted at its bounded scope. After
the Select GroupHeading and selected-indicator style alignment, rebuilt shadcn
demo and Web Component bundles pass. The existing choice-selects and theme
popup suites pass **6/6** EN/BG native/Web Component cases. New unchecked Radio
border checks pass **4/4**, alongside the earlier **4/4** Checkbox border and
table-interaction checks. Focused popup, tabs and accordion production suites
pass **14/14**, and mounted slider/split-pane adapters pass **20/20**. The
33-family pinned source decisions, 17 Lucide placeholder substitutions, host
aliases and generated CSS checks are recorded in the upstream review. The
broader renderer visual matrix remains under P8.2.

### Monaco scoped-schema ownership checkpoint — 2026-10-29

The existing live `Monaco schema ownership` browser case was rerun and passes
**1/1**; the focused `monacoSchema` helper suite also passes **1/1**. Two JSON
models use distinct schema registrations. A local section reference resolves
against each editor's root schema; changing the first root replaces only its
model and markers. Unmounting the first editor removes its registrations and
model while the second editor and a host-owned schema/model remain. The helper
case also preserves host `diagnosticsOptions` and does not rewrite literal
`const` or `default` data. This accepts the ordinary local-reference and
independent-model ownership slice of P6.5. External/nested `$id` reference
profiles, per-editor options, and the remaining P6.5 lifecycle/presentation
work are not established by these two tests.

### Monaco host and nested schema references — 2026-10-29

The shared Monaco component browser suite and schema helper suite pass **28/28**
after the reference update; the extended package Svelte check reports zero
errors and warnings. A real JSON worker validates a relative reference from an
absolute root `$id` to a host-registered schema, a local `#/$defs/...`
reference inside a nested `$id` resource, and an absolute reference to that
embedded resource. A second editor with valid values has no markers; removing
the first leaves the host registration and second model intact. The helper
case checks escaped JSON Pointer segments, relative nested and external URIs,
and unchanged literal `$ref` data. References to document-local resources are
rebased to their locations in each editor-owned schema snapshot because Monaco
does not register nested `$id` resources separately. Relative external
references use their authored base URI; unrelated host registrations remain
untouched. A later real-worker case validates root and nested `$anchor`
references, while the helper checks escaped anchor pointers, unknown anchors
and literal data. Dynamic references and remaining editor profiles are open.

### Monaco live option removal — 2026-10-29

Monaco merges `updateOptions` into each live editor. The shared wrapper now passes
explicit `undefined` for removed option keys, including nested keys such as
`scrollbar.vertical`, so an editor returns to Monaco defaults while another
editor and both models remain unchanged. A focused two-editor regression covers
initial, changed and removed `wordWrap` plus nested scrollbar removal. The full
Monaco component browser suite passes **21/21**, and the extended package Svelte
check passes with zero errors or warnings. This accepts the independent live
options slice of P6.5; the remaining profiles listed in TODO remain open.

### Monaco live sizing and maximize — 2026-10-29

The shared component browser suite now passes **22/22**. A mounted Monaco model
edit grows and shrinks an auto-grow editor between its five- and twelve-row
limits. A two-editor case verifies maximize fills the viewport, button restore
and Escape restore return to the explicit 320 × 180px geometry, the sibling
remains 240 × 120px, and neither editor model is replaced. The extended package
Svelte check passes with zero errors or warnings. This accepts the component
behavior slice of P6.5; production-host and Shadow DOM geometry remain open.

### Monaco options through all native renderer families — 2026-10-29

After rebuilding the shared extended package, the mounted Monaco renderer
suites pass **10/10 per Shadcn, Flowbite and Skeleton**. Each family changes a
Control-local `monaco.options.wordWrap` from `on` to `wordWrapColumn`, removes
it, and observes Monaco’s default `off` in the same model without a form-data
event. The first Shadcn run against stale shared `dist` retained the old value;
the targeted shared-package build completed with `publint` and the rerun
passed. This extends the P6.5 live-option acceptance through native renderers;
production Web Component behavior remains to be checked.

### Monaco ShadowRoot style and host mode — 2026-10-29

A mounted ShadowRoot case starts two Monaco editors in one host, waits for both
to load, and verifies exactly one injected Monaco stylesheet in that root.
Computed editor height uses the stylesheet, both editors react when the custom
element host changes `data-mode` from dark to light, and the stylesheet remains
while a sibling editor is still mounted. The full shared Monaco component
browser suite passes **23/23** and the extended package Svelte check passes.
Production Web Component CSS/worker acceptance and broader resource teardown
remain open under P6.5.

### Monaco production maximize geometry — 2026-10-29

The code-editor production matrix now asserts that Monaco fills the browser
viewport when maximized, then returns to its original width and height by
button and by Escape. In Web Component mode it also confirms the editor lives
in a ShadowRoot with one injected Monaco stylesheet. The first rebuilt run
passed Flowbite and Shadcn **8/8** but failed Skeleton **4/4**: its control
styling gave the fixed editor a 4px top margin. The shared maximized style now
sets `margin: 0`; after rebuilding the shared package, all three Web Components
and all three demos, the complete EN/BG × family × native/Web Component matrix
passes **12/12**, including its existing JSON draft, diagnostic, data and
page-error assertions. This accepts the ordinary production maximize/restore
and ShadowRoot stylesheet slice of P6.5; other profiles and teardown remain
open.

### Monaco schema-invalid JSON draft validity — 2026-10-29

The shared mounted draft suite passes **10/10**. With JSON conversion and
editor publication enabled, syntactically valid `replicas: 0` commits to form
data and produces only the core minimum error; it does not add a duplicate
editor error. A later malformed draft stays in the editor, preserves the last
committed object and publishes its own invalid-JSON error. Corrected JSON
clears both. The code-editor production matrix passes **12/12** across all
families, EN/BG and native/Web Component hosts: `replicas: 0` appears in the
data pane with one validation error, then `replicas: 2` clears it. The shared
extended package check, scoped format and lint checks pass. This accepts the
schema-invalid converted-draft boundary under P6.5; other editor profiles
remain open.

### Monaco per-root stylesheet cleanup — 2026-10-29

The shared Monaco component and load-failure browser suites pass **26/26**.
Two editors in one ShadowRoot share one injected stylesheet; removing one
keeps it, removing the last deletes it, and remounting installs one fresh
copy. A stylesheet supplied by the host under the same id remains after the
editor unmounts. A failed Monaco initialization also releases its injected
document stylesheet. The shared extended package build, including `publint`,
passes. The mounted Shadcn, Flowbite and Skeleton Monaco renderer suites each
pass **10/10** against that build; scoped lint and format checks pass. This
accepts the per-root stylesheet ownership and
load-failure cleanup slice of P6.5; worker and broader resource lifecycle
acceptance remain open.

### Composite detail-dialog draft deletion confirmation, 2026-10-30

Optional Clear and Remove in a composite detail dialog now consult the same `compositeCell` deletion confirmation policy as the external remove action. The confirmed operation changes only the isolated dialog draft; Apply commits it. A pending prompt disables Apply, and Cancel, readonly changes or replacement of the committed target revoke the prompt. A local `confirmation.delete: never` setting overrides a global `always` setting without writing before Apply. Focused `CompositeSummary`, `DetailDialogGeometry` and `TupleControlRenderer` suites pass 69/69 Shadcn, 68/68 Flowbite and 68/68 Skeleton. The Skeleton assertion checks the disabled background Apply button through the DOM because its modal correctly removes that button from the accessibility tree while confirmation is open. The rebuilt `tests/demos/composite-dialog-draft-confirmation.spec.ts` production matrix passes 12/12 across all three families, EN/BG and native/Web Component hosts. It verifies decline, confirmed Clear and Remove, unchanged cell presentation before Apply, and the exact final JSON data. This closes the draft-action host gap; other P4.11 search/editor profiles remain open.

### Composite cell registry eligibility, 2026-10-30

The public Shadcn, Flowbite and Skeleton cell registries now have a focused inline/referenced matrix for plain string and number fallbacks, object/array, mixed union and composed values, plus explicit scalar Label summaries versus ordinary Control summaries. A mounted normal table in each family selects composite cells for mixed and scalar Label columns beside a live text input. The paired `cellEntries` and `CompositeSummary` files pass 84/84 in each family. The registry test passes the resolved property schema separately from the full root, matching `DispatchCell`; passing the root as the property schema had produced a false selection failure during test construction. Flowbite and Skeleton inventory assertions were updated from 18 to the current 19 registered cells. Extended-cell eligibility and other P4.11 editor identity profiles remain open.

### Array Add initialization and item-shape selection, 2026-10-30

The three native families now select an array renderer for null-item arrays and
an expandable renderer for nested-array items, including local `$ref` item
schemas. Arrays whose item schema uses `oneOf`, `anyOf`, or `allOf` now also
select an ordinary array presenter, with expandable presentation by default
and table presentation when requested. Explicit Add yields `null` and `[]` for
the null and nested-array shapes respectively. Mounted table Add
cases also verify explicit false, zero and
null defaults; plain string, number and boolean values; object-property
defaults; an initially invalid number; and independent deep copies of nested
object defaults. Date, time and date-time schema formats initialize from the
current UTC value in the table, and expandable Add verifies date-time. An
existing item keeps its stored value through panel rerenders rather than
receiving its schema's Add default. The focused table and expandable suites pass
**18/18 and 42/42** Shadcn, **17/17 and 42/42** Flowbite, and **17/17 and 42/42**
Skeleton. All three native package type checks report zero errors and warnings.
A rebuilt demo matrix passes **12/12** across the three families, EN/BG and
native/Web Component hosts: both inline and locally referenced null-item arrays
store `[null]` after Add, and both inline and locally referenced arrays of
arrays store `[[]]`. Inline and locally referenced `oneOf` object items also
store `[{ "flag": true }]` through their first branch's declared property
default, with no page errors. The mounted expandable-array matrix additionally
covers `anyOf`, `allOf`, and explicit-table `oneOf` Add, while the focused
choice-renderer suites still pass **22/22** Shadcn and **19/19** Flowbite/Skeleton.
This accepts those P4.7 initialization and renderer-selection paths; broader
combinator/default edge cases and other collection-owner acceptance remain open.

### Ordinary array minimum-length deletion, 2026-10-30

At one stored item with `minItems: 1`, table and expandable-array Delete is
disabled under `restrict: true`. With `restrict: false`, the same action removes
the item and stores `[]`, leaving schema validity to validation. The focused
table action suites pass **8/8** in each family and the expandable suites pass
**47/47** in each family. Shadcn's table uses a selected-row toolbar action, so
its test selects the row before checking Delete; Flowbite and Skeleton expose
row Delete actions. The refreshed built-demo array matrix passes **12/12**
across the three families, EN/BG and native/Web Component hosts for the
expandable `minItems` transition, exact data and absence of page errors. This
accepts the ordinary array `minItems`/`restrict` deletion path; other
collection owners and action lifecycle cases remain under P4.7.

### AG Grid minimum-length selected-row deletion, 2026-10-30

The real-grid command suites now select an original row at `minItems: 3` and
verify that `restrict: true` blocks Delete without a data write, while
`restrict: false` removes that source row and preserves the other two rows and
unrelated data. Each extended family command suite passes **30/30**. The
refreshed built-demo AG Grid matrix passes **12/12** across families, EN/BG and
native/Web Component hosts: after a live `minItems` schema update, a populated
selected row cannot be deleted; after a live flat `config.restrict: false`
update, Delete is enabled, the complex confirmation appears, and accepting it
leaves exactly the new empty row. This accepts this selected-row bounds path;
other AG Grid options, cells and lifecycle profiles remain open under P6.6.

### Closed array-item error hover, 2026-10-30

The mounted expandable-array matrix now verifies an invalid item at index 10
is the only row with an error indicator, even while its disclosure is closed.
Hovering that indicator reveals the actual child minimum-length, missing
required-property, or item-level minimum-properties message without opening the
item. The focused matrix passes **3/3** in Shadcn, Flowbite and Skeleton.
Flowbite exposes indicator attributes on a wrapper and handles hover on its
nested button; the native test targets that trigger. A rebuilt production
matrix using the canonical Array controls example passes **12/12** across the
three families, EN/BG and native/Web Component hosts: an invalid second speaker
shows its closed-row indicator, hover opens the summary without expanding the
row, correcting the stored name clears the indicator, and no page errors occur.
This accepts the closed-row hover and path-isolation cases under P4.7 across
those hosts; other error shapes and collection-owner acceptance remain open.

### Expandable array identity after deletion, 2026-10-30

Expandable arrays previously tracked their open item by its numeric position.
When an earlier item was removed, the next item at that position could open
instead. Shadcn and Skeleton now remap each open accordion position after a
confirmed deletion; Flowbite remaps its single open position. Removing the
open item closes it. Declining a confirmation leaves the state unchanged.
The focused interaction test first opens the second of three named items,
deletes the first and verifies both the exact surviving data and expansion of
the same named item. Full array-layout suites pass **48/48** in each family,
and all three package checks report zero errors and warnings. This accepts
the ordinary expandable-array deletion identity case under P4.7; remaining
collection-owner and compatibility work stays open.

### Expandable array header error ownership, 2026-10-30

React Antd's `hideArraySummaryValidation` hides descendant summaries without
removing an array-level error from the header. The three Svelte expandable
layouts now filter the header indicator to the array's exact structured path
when that option is true; a child row keeps its own indicator. A mounted case
with an invalid child and `minItems: 2` verifies that the header shows only
the one array-level error. ListWithDetail now applies the same path-exact
filter: with an invalid item and `minItems: 2`, hiding child summaries leaves
the single array-level header error while retaining the item's own indicator.
The complete affected array-layout suites pass **50/50** in each family; the
ListWithDetail suites pass **23/23** Shadcn, **24/24** Flowbite and **23/23**
Skeleton. All three package checks report zero errors and warnings. This
accepts the outer hide-summary override under R32/R33/P4.7; other array
detail and host scenarios remain open.

The existing config/collection presentation matrix now edits the canonical
array-controls schema to introduce array-level `minItems` errors alongside
invalid children. After a fresh library and demo rebuild, all **12/12**
family × EN/BG × native/Web Component cases show exactly one header error
for both expandable arrays and ListWithDetail while retaining the child
indicator. That matrix also exposed a hardcoded English screen-reader index
in expandable arrays. All three native layouts now use the localized
`collection.index` message, and their focused live-locale mounted tests pass
**1/1 per family**; the rebuilt production matrix confirms both English and
Bulgarian announcements. The source change is limited to this hidden label.

### P4.7 ordinary array acceptance audit, 2026-10-30

The current rebuilt demo output passes **84/84** bounded production scenarios
across `array-add-item-shapes`, `array-sort-aliases`, `array-panel-collapse`,
`collection-actions`, `array-closed-item-errors`, `shadcn-normal-table-parity`
and `destructive-confirmation`. The refreshed config/collection presentation
matrix adds **12/12** family × EN/BG × native/Web Component scenarios for
array-level errors and hidden index labels. The three mounted expandable-array
suites pass **52/52** each, including React-comparable first-item initialization,
manual opening after an initial collapsed setting, open-item deletion, earlier
item deletion, and current locale. Table and ListWithDetail action, default,
restriction, deletion and confirmation cases are recorded in the earlier
checkpoints above. Together these accept the named P4.7 ordinary collection
action, closed-item validation and collapse contract. AG Grid commands, tuple
tails, composite details and remaining visual/detail profiles retain their
separate open checklist owners; this acceptance does not close R31–R33 as whole
renderer rows.

### P4.5 stepper draft preservation, 2026-10-30

The React shadcn stepper keeps inactive category panels mounted. A new mounted
regression demonstrated that direct step navigation after a debounced text input
discarded the pending edit in the Svelte shadcn and Flowbite steppers; Skeleton
already retained it. Shadcn and Flowbite now retain visited panels with `hidden`
and `inert`, while still deferring unvisited panel mounting. The regression
verifies that the pending value commits to form data and remains visible on
return. A named-category reorder regression exposed an outer shadcn stepper
remount that discarded the active panel draft; removing that remount preserves
selection and the pending edit. All three families pass the same reorder case
and a rule-hidden active-step fallback without an extra form-data write. Focused
stepper and inactive-category initial-focus suites pass **30/30** across the
three families. The full library/demo build passes, followed by **12/12** EN/BG
× family × native/Web Component categorization cases: after an input event,
step navigation and return show the edited contact name without a page error.
Adjacent Group validation, stepper tooltip and stepper geometry suites pass
**20/20** on the same build. The geometry test now targets the visible active
panel, since earlier visited panels remain mounted but hidden. All three
packages pass Svelte checks with zero errors/warnings; touched format, lint
and diff checks pass. This is a bounded R53 outcome. Other P4.5 category focus,
visibility and runtime-state acceptance remains open.

### P4.5 invalid section collapse diagnostics, 2026-10-30

Extended spec §8.5 requires an author diagnostic for a non-boolean effective
`collapsed` value, including `null`. The shared section-state hook now reports
`section.invalidCollapsed` with component, source and value type once per mounted
source. Collapse resolution still skips an invalid value and uses the next valid
boolean default; a valid local value shadows an invalid global default without
warning. Group and accordion mounted suites pass **46/46** across shadcn,
Flowbite and Skeleton. The shared library builds and publishes locally; shared
and all three family package checks have zero errors/warnings, and scoped lint
passes. Mixed/array host behavior and the broader P4.5 acceptance remain open.

### P4.5 Group accessible naming, 2026-10-30

React shadcn exposes the Group frame with `role="group"` and its visible title
as the accessible name. Shadcn, Flowbite and Skeleton Group frames now do the
same. An untitled Group keeps its frame and child control without an empty
`aria-label`. The focused mounted Group suites pass **37/37** across the three
families. This closes the bounded Group naming gap; other P4.5 category focus,
visibility and runtime-state acceptance remains open.

### P4.5 hidden-child and all-hidden visibility, 2026-10-30

Extended spec §8.7 keeps a visible Group or Category present when its bound
children are hidden, but removes a Category when its own rule hides it. The
mounted Group suites pass **40/40** across the three families: hiding the only
child removes its input while retaining the titled, accessible Group frame.
The ordinary categorization tab suites pass **18/18**: a selected Category
remains selectable after its only child is hidden; hiding that Category selects
a remaining visible Category; hiding both leaves no tab or stale panel.

A fresh full demo build passes. The rebuilt categorization production matrix
passes **24/24** across family, EN/BG and native/Web Component hosts, including
showing a rule-controlled Business tab, selecting it, hiding it and falling
back to Contact. The rebuilt Group validation/accessibility matrix passes
**12/12**, including its named `role="group"` frame. This is a bounded R51/R52
visibility result. Other category focus, identity, indicator and runtime-state
acceptance remains open.

### P4.5 category keyboard navigation, 2026-10-30

Accordion headers in all three native families open on Enter, switch on Space,
and close the active category on Enter while retaining header focus. The
focused accordion suites pass **15/15**. Stepper headers and Previous/Next
buttons also change visible panels through keyboard activation without moving
focus into an inert or hidden panel; the focused stepper suites pass **30/30**.
The rebuilt categorization production matrix passes **24/24** across family,
EN/BG and native/Web Component hosts with keyboard accordion closing and
opening. Its stepper path still uses immediate programmatic Next activation
after text input to preserve the pending-draft regression. Remaining P4.5
focus and identity acceptance is not inferred from these bounded cases.

### P4.5 named category reorder, 2026-10-30

Tabs and accordions in all three families retain the selected direct Category
by its authored `name` when siblings reorder, show the same bound value, and
make no form-data write. The focused tab and accordion suites pass **39/39**
combined across shadcn, Flowbite and Skeleton. The adjacent stepper reorder
and pending-draft coverage is recorded above. Unnamed categories retain the
reference's positional identity; full category identity and focus acceptance
remains open.

### P4.5 section-error presence index, 2026-10-30

Extended spec §8.4 requires one ancestor index per validation result for
container error presence, rather than filtering every error for every Group or
Category. The shared section validation helper now reuses the existing
`containerErrorIndex` cache, keyed by the eligible schema-error and
additional-error arrays. Validation mode selects which schema errors are
eligible. Presence lookups use complete pointer segments; explicit counts and
opened structured summaries still collect eligible errors. The pure regression checks
`employees/1` versus `employees/10`, normalized required-property targets,
new validation results, ValidateAndHide, host errors and overlap de-duplication.
A 242-container/200-error case reads error paths fewer than 600 times, instead
of once per container. The shared mounted/pure suites pass **3/3**; the rebuilt
shared package passes Svelte check and publint. Focused indicator and stepper
mounts against that package pass **42/42** across shadcn, Flowbite and Skeleton.
After the shared change, `pnpm run build:demo` succeeded and the affected
categorization and container-validation production files passed **36/36**
across the three families, EN/BG and native/Web Component hosts.
This closes the section presence-scan gap, not the remaining P4.5 indicator or
P8.3 performance contracts.

### P4.5 Flowbite vertical step feedback, 2026-10-30

Flowbite's native VerticalStepper renders each step label but omits its
description. The renderer now includes localized validation and data-presence
feedback in the vertical header label, so the feedback is visible and part of
the step button's accessible name. Horizontal DetailedStepper keeps its
description presentation. The visible data marker remains a dot with localized
text. The focused stepper suite passes **13/13**, including
EN/BG vertical cases where correcting the value clears validation feedback
while preserving the data indicator. Flowbite Svelte check reports zero
diagnostics. Remaining P4.5 category focus and indicator acceptance stays open.

### P4.5 selected-tab visibility focus, 2026-10-30

When a focused selected Category becomes hidden by its own rule, Shadcn,
Flowbite and Skeleton move keyboard focus to the visible fallback tab. Focus
outside the categorization is not taken. Skeleton's native Tabs failed during
focused-trigger teardown; its adapter retains hidden, disabled triggers with
stable category keys and hides the root when every category is invisible, so
there is no stale active panel. The shared selection helper exposes those
unfiltered keys without duplicating identity rules. Focused tab suites pass
**21/21** across the three families, and the shared build and all three family
Svelte checks pass. A fresh `pnpm run build:demo` and the canonical
categorization production matrix pass **24/24** across the three families,
EN/BG and native/Web Component hosts. The matrix hides the selected Business
tab while it holds focus and checks the fallback tab's active element in its
document or ShadowRoot. Remaining stepper/accordion focus and broader P4.5
acceptance stay open.

### P4.5 focused category visibility across variants, 2026-10-30

The selected-tab focus behavior now covers stepper and accordion headers as
well. All three family adapters move focus to the visible fallback header when
the focused Business category disappears, without taking focus that moved
elsewhere. Flowbite's native stepper can reuse a focused button for a different
step, so its adapter also checks the former category identity. Skeleton's native
accordion needs hidden, disabled entries retained during focused-trigger
teardown. Shadcn's copied stepper state now removes destroyed steps and sorts
registered triggers by DOM order; a newly shown Business step otherwise
registered after Notes and selected the wrong category.

The focused mounted tab, stepper and accordion suites pass **74/74** across
the three families after the final shadcn registration correction. The rebuilt
canonical production categorization file now passes **24/24** across families,
EN/BG and native/Web Component hosts, checking focused tab, stepper and
accordion fallback as well as the existing navigation behavior. The affected
Shadcn demo and Web Component checks have zero errors; the Web Component check
retains its existing custom-element compile-option warning. Broader P4.5
identity/indicator acceptance remains open.

### P4.5 unnamed and duplicate category identity, 2026-10-30

The shared category selection helper formerly keyed unnamed categories by
position. Reordering the same Category objects could therefore make an active
tab, step or accordion header point to a different section. Two siblings with
the same authored `name` also produced duplicate Svelte keys. Unique names
continue to provide stable authored identity; unnamed and duplicate-named
siblings now use their UI-schema object identity. An initial name referring to
duplicate siblings selects the first visible match rather than crashing.

Focused browser-mounted tab, stepper and accordion suites now pass **31/31**
shadcn, **32/32** Flowbite and **29/29** Skeleton cases. They cover unnamed
and duplicate-named sibling reorder, selected content and pending step drafts
without a form-data write. The shared package builds and publint passes.
Recreated unnamed Category objects still need authored names for identity
across replacement. Broader P4.5 indicator acceptance remains open.

### P4.5 Group data-presence boundary, 2026-10-30

The mounted Group suites now check that `false` in a hidden bound Control and
`0` in a visible bound Control both retain the data marker; clearing both
removes it even when unrelated form data remains. The marker's accessible name
and title change from English to Bulgarian without a data edit. The focused
Group suites pass **15/15** shadcn, **14/14** Flowbite and **14/14** Skeleton
cases. This covers data presence, not the full validation-indicator contract.

### P4.5 section pre-touch filtering, 2026-10-30

Group and Category indicators now apply each bound Control's effective
pre-touch keyword policy to the structured errors they represent. A form-scoped
touch store changes the badge and explicit count on blur; it follows collection
occurrence identity rather than a row index. Host errors with unsuppressed
keywords stay visible. The mounted section-indicator suites pass **5/5** in
each family, including the initial hidden schema error, host-only count and
post-blur combined count. Shared section, pre-touch and row-identity tests pass
**17/17**; all four affected package checks pass with zero diagnostics.

This is Svelte summary participation, not a React implementation transplant.
React keeps touched state inside each Control's `usePreTouchErrors` hook, while
its container indicator reads displayable structured errors without consulting
Control touch state. The spec allows a family to leave summaries independent;
when a summary does participate, it must reveal the child's error after blur.

This checkpoint alone did not close P4.5; the later production matrix and
nested collection interaction paths needed separate acceptance.
The group-layout example's `$dynamic.options.collapsed` binding is explicitly
marked FUTURE in the current spec and excluded from published schemas and
conformance vectors. P4.5 runtime acceptance covers the approved static and
host-replaced effective boolean, without implementing that proposal. The
current focused Group suites pass **43/43** across the three families, including
equivalent UI-schema replacement and changed effective collapse values.

### P4.5 equivalent unnamed category replacement and production indicators, 2026-10-30

An unnamed Category could receive a new UI-schema object when form data changed.
Its generated key then changed even though the category was equivalent, remounting
an inner categorization and losing the focused fallback tab. The shared category
selector now reconciles equivalent unnamed categories by their structure while
retaining object identity for direct sibling reorders. Authored names remain the
stable identity for arbitrary replacement or ambiguous identical categories.

Mounted tab suites pass **11/11** Shadcn, **9/9** Flowbite and **10/10** Skeleton,
including equivalent object replacement followed by reorder without a form-data
write. After a fresh demo build, the categorization production matrix passes
**24/24** across all three families, EN/BG and native/Web Component hosts. The
new Group/Category pre-touch production matrix passes **12/12** in the same host
matrix, checking hidden-before-touch and localized counts after blur. The
adjacent structured section summary matrix passes **12/12**. Nested collection
interaction paths and the remaining P4.5 acceptance are still open.

### P4.5 nested row Group indicator occurrence, 2026-10-30

A Group rendered for an array item now has a mounted regression in each native
family. A `minLength` error is hidden before its Control is touched, appears
after blur, and follows the same row occurrence through the Move Down action.
The other row stays unmarked. Removing the touched row clears its badge, and a
new item does not inherit it. Flowbite's expandable array presents one Group at
a time and keeps the moved row expanded; its test switches between rows before
removing and re-adding an item.
The focused section-indicator suites now pass **7/7** in each of shadcn,
Flowbite and Skeleton. A row Group disclosure test verifies that a local
collapsed state follows the moved row while the other row stays expanded;
Flowbite exercises this through its one-at-a-time expandable detail. A shared test also passes a
two-level array sequence of outer move, inner move, removal and equal-value add.
This proves row-occurrence reassociation for these commands, not every nested
collection command or P4.5's remaining category/Group contract.

### P4.5 tab overflow and pending draft, 2026-10-30

In a 320px container, keyboard End now selects the last of twelve category tabs
and keeps both its trigger and the form input inside the visible bounds in all
three families. Flowbite's native Tabs previously unmounted the active snippet
before its pending text edit committed. Its categorization renderer now flushes
pending controls before selecting a new tab and rejects the transition during
active composition. A mounted regression covers the pending draft and the
composition guard; comparable pending-draft tests pass in shadcn and Skeleton.
The focused named-category reorder regression now also passes **3/3** across
the families: the selected tab remains selected and its pending text edit
commits to the same field after a host UI-schema reorder.
The five adjacent Flowbite categorization suites pass **41/41**, and its package
check reports zero diagnostics. After a fresh full demo build, the new tab-draft
production case passes **12/12** across the three families, EN/BG and native/Web
Component hosts; the full categorization matrix passes **36/36**. Other P4.5
acceptance remains open.

### P4.5 explicit accordion closure across reorder, 2026-10-30

An accordion opened through `options.initial` can be explicitly closed by its
header. Reordering the same Category siblings afterward now has comparable
mounted acceptance in shadcn, Flowbite and Skeleton: both headers remain
closed and no form-data update occurs. The full focused accordion suite passes
**9/9** in each family. This closes that runtime-state edge, while the rest of
P4.5 remains open.

### P4.5 accordion fallback after category removal, 2026-10-30

Removing the focused open Category now opens the first remaining category,
hands focus to its header and leaves form data unchanged in all three native
families. The focused case exposed a Skeleton native accordion teardown error:
removing a focused item in the same update as the selection change destroyed
its item context while an effect still read it. The Skeleton adapter retains
the retired item hidden and disabled for one update, moves focus to the
fallback, then removes it. The complete accordion suites pass **10/10** per
family, and all three package checks report zero diagnostics. Production host
acceptance for this removal path remains to be run after the next affected
demo rebuild; the rest of P4.5 remains open.

### P4.5 tab fallback after category removal, 2026-10-30

Removing a focused selected Category falls back to the first remaining tab,
transfers focus and preserves data in shadcn, Flowbite and Skeleton mounted
tests. Skeleton's native tab trigger hit the same teardown error as its
accordion item, so the adapter now retains the removed trigger hidden and
disabled for one update before unmounting it. The complete tab suites pass
**16/16** shadcn, **15/15** Flowbite and **15/15** Skeleton; Skeleton's adjacent
accordion suite passes **10/10**. Removing the focused _last_ Category now
passes in all three families without a data write. A normal Svelte host update
also removes and restores the final Skeleton category without losing its value.
Skeleton keeps its Categorization renderer selected during the empty-category
update and retains the final native trigger until focus leaves, avoiding a
native/Svelte teardown error. The same host test exposed a final-item teardown
error in Skeleton accordion; its variant renderer now stays selected through
the empty state and releases focus before unmounting. Tabs, accordion and
stepper final-category host cases pass **3/3**, and their adjacent Skeleton
suites pass **40/40** combined. Skeleton package check reports zero diagnostics
and focused lint passes. The dependency-ordered Skeleton build passes. A
rebuilt Web Component host test removes and restores the focused final category
through its `uischema` attribute in all three variants and passes **2/2** in
English and Bulgarian. The adjacent rebuilt Skeleton native/Web Component
categorization matrix passes **12/12**. The native dynamic-schema removal path
is covered by the mounted host test; P4.5 remains open for broader runtime-state
acceptance.

### P4.5 nested row Group indicator ownership, 2026-10-30

A mounted two-level array case now checks that a Group's pre-touch validation
indicator stays with the touched child after moving that child within its inner
array and moving the parent row. Shadcn and Skeleton show all three child
Groups; Flowbite's native array accordion shows only the expanded child, so its
case also verifies the actual nested data moves and switches to an untouched
sibling before returning to the touched child. The touched child can then be
removed and replaced with an equal invalid value without transferring its
touched marker; the new child acquires its own marker only after blur. The
complete focused SectionIndicators suites pass **8/8** in each family. Broader
P4.5 runtime acceptance remains open.

### P4.5 restored Category pre-touch feedback, 2026-10-30

Removing and restoring a touched Category previously left its section error
indicator visible while the remounted Control hid its inline error. Controls
still mark local touch on blur, but now also read the form-scoped,
occurrence-aware section touch record when filtering errors. A mounted tab case
checks the control and indicator before touch, after blur, after tab switching,
and after host removal/restoration of the same Category in all three families.
The focused SectionIndicators and PreTouchErrors suites pass **14/14** per
family; all three package checks report zero errors and warnings. Skeleton's
native tab still needs separate acceptance for removing a _focused_ trigger
that carries a validation indicator; the remount case releases trigger focus
before removal. P4.5 remains open.

### P4.5 section indicator touch policy simplified, 2026-10-30

The user clarified that pre-touch filtering prevents a newly opened form from
showing many red required-field messages. Group and Category error cues instead
serve as navigation summaries and now show current displayable structured errors
immediately, including errors for untouched fields. Each Control still keeps its
own blur state for inline filtering. The form-scoped SectionTouchStore was removed.
The earlier touch-filtered section checkpoints above are historical and superseded.
Focused SectionIndicators suites pass **7/7** in each renderer family. After a
fresh demo build, the EN/BG native/Web Component section-indicator matrix passes
**12/12**, checking immediate Group and Category cues with unchanged data and
no page errors.

### P1.14 splitter pane diagnostic details, 2026-10-30

Repeated invalid splitter hints on separate panes now produce separate coded
author warnings with `details.itemIndex` and `details.option`. Two panes with
invalid `span`, `weight` and `minHeight` yield six warnings and no form
validation alert. Focused SplitLayoutRenderer suites pass **15/15** in each
extended family, and all three extended package checks have zero diagnostics.
The broader structured `UIDiagnostic` API and remaining option audit stay open.

### P1.14 portable layout item diagnostic codes, 2026-10-30

The shared sizing helper now produces typed code/message pairs for invalid
dimensions and weights, clamped or unsupported spans, conflicting sizing modes,
and legacy `columns`/`trim` hints. The layout adapter reports those codes
directly while retaining the existing plain-text item inspection attributes.
The shared package build and 17 pure sizing tests pass. A focused Shadcn
mounted test confirms the emitted `layout.spanClamped`, `layout.invalidOption`,
and `layout.unsupportedOption` codes. The broader author-diagnostic API and
remaining option audit stay open.

### Focus contract and Skeleton badged-tab removal, 2026-10-30

The sibling specification's general initial-focus paragraph now agrees with
its detailed §18.28 rule and the React references: multiple active focus
requests do not have a portable winner; a conflict diagnostic remains
recommended. The author-diagnostic inventory leaves that diagnostic open
without prescribing arbitration.

The mounted initial-focus suites now pass **2/2 per family** (six cases total).
Two active text controls retain their native `autofocus` requests without a
form-data change; a request in an inactive Category neither reveals the panel
nor takes focus. The spec's recommended author diagnostic for multiple active
requests remains open, and must count the active rendered view without changing
the native winner.

A focused Skeleton host-update repro used two Categories, an invalid first
Category with a visible validation indicator, and focus on its tab trigger.
Removing that Category produced an unhandled Svelte/Skeleton
`flush_queued_effects` null access. The same removal without focus passed.
Replacing the badge with a plain span still failed, identifying the focused
native Tabs retirement transition rather than the badge. Retaining the
trigger, deferring focus, and delaying the native focus callback did not
resolve the fault, so those trial changes and the red test were removed. P4.5 remains open for a verified fix.

An ordinary host-state update reproduces the same unhandled error when the
focused, invalid first Category is removed while a second Category remains.
This rules out the test helper's synchronous `rerender` as the sole cause. The
runtime stack reaches Zag's synchronous `TAB_FOCUS` state update; deferring or
omitting renderer fallback focus and retiring the validation component
separately did not prevent it. Those trials and the failing host test were
reverted. The remaining fix must address the native Tabs focus transition.

A three-case host-update isolation repeated the focused first-Category removal
with valid data and no indicator, invalid data and no indicator, and invalid
data with an indicator. Each rendered the fallback tab but produced the same
unhandled Svelte/Zag flush error. The error therefore does not depend on the
section-indicator policy or validation state. Keyed remounting of the native
Tabs root changed the failing null access but did not prevent it; that trial
and its red isolation test were removed. Group and Category indicators remain
immediate, while inline Control feedback remains filtered until blur.

Keeping the focused retiring trigger visible and enabled until fallback focus
also failed with the same Zag flush error. Moving fallback focus to a timer
after the Svelte tick likewise left the error intact, even though the fallback
trigger received focus. Both trials were reverted. A fix needs to address the
Zag/Svelte synchronous focus-state update itself, rather than indicator
rendering, trigger visibility, or the timing of renderer fallback focus.

A standalone Skeleton Tabs host passed focused first-tab removal, including a
variant with the renderer's retained trigger, derived selection and two focus
effects. Conversely, replacing both `DispatchRenderer` content and
`SectionIndicators` with plain text inside JsonForms still produced the
unhandled flush error on an ordinary host update. Those isolation fixtures
were removed after verification. The remaining investigation must compare the
JsonForms host update and Categorization binding lifecycle with the standalone
Tabs case; native Tabs markup alone is insufficient to reproduce it.

The standalone case also passed when it used the actual shared
`useCategorySelection` helper for named Category identity, fallback selection
and its persistence effect. The helper alone therefore does not reproduce the
failure. The next isolation should control when the JsonForms core/UISchema
host update becomes visible to the Categorization renderer and native Tabs.

### P4.5 Skeleton focused Category host update, 2026-10-30

The JsonForms host update and the native Tabs update now occur in separate
frames only when a focused Category is removed and another remains. Ordinary
selection, rule visibility, and final-Category updates stay immediate. The
retiring native trigger remains available long enough for focus to reach the
selected fallback; hidden Category header text clears immediately. All eight
focused Skeleton Category/Categorization browser files pass **50/50**,
including the new ordinary host-state removal regression with and without a
validation indicator. The Skeleton package check has zero errors and warnings.
The affected Skeleton package, Web Component and demo builds pass. A rebuilt
EN/BG Web Component host case removes the focused first Category, verifies
fallback selection and focus, preserves the City value, and reports no page
errors (**2/2**). Broader P4.5 runtime acceptance remains open.

### P1.14 catalog parameter diagnostics, 2026-10-30

The shared catalog translator now emits `i18n.missingParameter` once per
translator, key and parameter when a selected catalog message contains a
placeholder absent from the supplied values and nested AJV error parameters,
including when the caller supplies no values object at all.
The placeholder remains literal so the message is inspectable. Ordinary
fallback text is not diagnosed, avoiding warnings for intentional fallback
lookups. A lookup without a catalog entry or fallback now emits
`i18n.missingKey` once per translator/key when an explicit catalog is present;
ordinary fallback lookups and translators without a catalog remain silent.
The focused translator suite passes **10/10**. Catalog completeness and the
structured diagnostic channel remain open.

### P1.14 template URL refusal details, 2026-10-30

The shared template URL sanitizer now reports `template.urlRefused` with the
element tag and refused attribute name. It does not log the URL value, which
may contain private text or a large encoded payload. The attribute remains
removed as before, and host policy changes still restore newly permitted
bindings. The focused sanitizer and mounted TemplateLayout suites pass
**16/16**; the shared extended package check has zero diagnostics. Broader
template policy and author-diagnostic API acceptance remain open.

### P1.14 template language diagnostic details, 2026-10-30

`TemplateLayout` now emits `template.unsupportedLanguage` with the requested
language and layout path when a visible template cannot run. Its localized
in-form explanation remains. An active deprecated `config.defaultTemplateLang`
fallback emits `template.legacyDefaultLanguage` with the option name as detail.
The mounted TemplateLayout suite passes **12/12**, including repeated data
updates without duplicate warnings, and the shared extended package check has
zero errors and warnings. Other template policy diagnostics remain open.

### P1.14 template script-permission diagnostic, 2026-10-30

A visible supported `TemplateLayout` denied host script permission now emits
`script.evaluationDisabled` once per mounted path, with template capability and
layout path details. The existing translated in-form explanation remains;
granting permission renders the template and revoking it tears the content down.
The focused mounted TemplateLayout suite passes **12/12** and the shared
extended package check has zero errors and warnings. Other callable surfaces
and broader template-policy acceptance remain open.

### P1.14 dynamic-default permission diagnostic, 2026-10-30

The dynamic-default execution gate now emits the shared
`script.evaluationDisabled` author diagnostic with `dynamicDefaults`
capability details. Cached validators still recheck host permission; each
denial interval warns once, and denied malformed source is never compiled.
The same provider reports `dynamicDefaults.evaluationFailed` once per
repeated permitted failure without logging the expression, and the server-only
query provider reports `dynamicDefaults.searchParamsUnavailable` with provider
details. The expanded focused suite passes **7/7**; the shared extended package
check has zero errors and warnings. Broader callable-surface acceptance remains
open.

### P1.14 UI-schema script diagnostics, 2026-10-30

String UI-schema testers and rule predicates now emit structured
`script.evaluationDisabled` warnings with capability details when denied.
Permitted exceptions and wrong result types emit `script.evaluationFailed`
with capability, reason and result type details, without logging source text.
Repeated failures are deduplicated per callback and successful evaluations
clear that failure state. The focused UI-schema suite passes **13/13**.
Broader script-policy acceptance remains open.

### P1.14 Button script-denial diagnostics, 2026-10-30

Visible denied string-script Buttons now emit `script.evaluationDisabled` with
button capability and path details in Shadcn, Flowbite and Skeleton. The
translated visible status remains, and warnings are deduplicated until the
denial interval ends. Focused Button suites pass **16/16**, **15/15** and
**15/15**, respectively; all three extended package checks report zero errors
and warnings. The core executor still propagates execution errors to callers,
so Button failure presentation remains under the broader script-policy audit.

### P1.14 Button script-failure diagnostics, 2026-10-30

The shared Button executor now reports permitted string-script compile and
execution errors as `script.evaluationFailed` with button capability and phase
details. The diagnostic omits supplied source and error text; the original
error still rejects to the caller, as required by the Button contract. Trusted
callback rejection behavior is unchanged. A simulated CSP `EvalError` at
compilation emits `script.evaluationUnavailable` with safe button/compile details and returns the
existing `unavailable` result for translated renderer feedback. The focused
core suite passes **6/6** with no expression or error text in the warning;
the shared extended check has zero errors and warnings. In-form failure
presentation remains open.

### P3.1 string-control helper association, 2026-10-30

Shadcn, Flowbite and Skeleton default control wrappers now give their helper
element a stable ID. Each native String input adds that ID to
`aria-describedby` only while the description or error is shown, preserves
author-supplied description IDs, and avoids a dangling reference when
`hideControlWrapper` is active. Focused String suites pass **8/8** in each
family. This covers the primary String input, not every specialized control in
the P3.1 field-frame audit.

The same association now covers multiline String textareas, including focus
transitions, authored description IDs and hidden-wrapper containment. Focused
multiline suites pass **5/5** Shadcn, **7/7** Flowbite and **5/5** Skeleton.
Other specialized controls remain in the P3.1 audit.

### P3.1 numeric-control helper association, 2026-10-30

Native Number and Integer inputs in Shadcn, Flowbite and Skeleton now include
visible default-wrapper help/error text in `aria-describedby`. Existing authored
description IDs and incompatible-value hint IDs remain; hiding the wrapper
omits only its absent helper reference. Focused Number/Integer suites pass
**10/10** per family, and all three package checks report zero errors and
warnings. Other specialized controls remain in the field-frame audit.

### P3.1 Password helper association, 2026-10-30

The standard native Password input now references visible wrapper help/errors
through `aria-describedby` in Shadcn, Flowbite and Skeleton, preserving
author-supplied description IDs. Segmented OTP inputs in all three families
also reference visible help from the focusable input. Reveal controls retain
their own accessible names. Focused Password suites pass **8/8** per family;
the shared and all three family package checks report zero errors and warnings.
Other segmented OTP field-frame details remain in the broader audit.

### P3.1 masked String helper association, 2026-10-30

Masked String inputs in Shadcn, Flowbite and Skeleton now reference visible
wrapper help and mask-definition errors through `aria-describedby`, preserving
author-provided description IDs. The reference appears while help is visible
and is removed when focus-only help hides. Focused StringMask suites pass
**23/23** per family, including invalid mask tokens and live locale changes;
all three package checks report zero errors and warnings. Other specialized
field frames remain in the audit.

### P3.1 Slider helper association, 2026-10-30

The three Slider renderers now combine authored `aria-describedby` IDs, slider
value text and visible wrapper help on the focusable control. Shadcn now
observes thumb focus within its field frame, so focus-only help appears for
keyboard users. Focused Slider suites pass **4/4** per family; all three
package checks report zero errors and warnings. Other field-frame and compact
cell behaviors remain open.

### P3.1 Boolean checkbox and toggle helper association, 2026-10-30

Boolean checkbox and toggle controls in Shadcn, Flowbite and Skeleton now
include visible wrapper help in the focusable element's `aria-describedby`.
Existing authored description IDs and the missing/incompatible-value state
hint remain. Focused Checkbox and Toggle suites each pass **4/4** per family;
all three family package checks report zero errors and warnings. Other field
frames and cell presentations remain in the audit.

### P3.1 radio option helper association, 2026-10-30

Enum and oneOf radio controls in Shadcn, Flowbite and Skeleton now associate
visible wrapper help with every focusable option, preserving author-provided
description IDs. Flowbite tracks focus entering and leaving the entire radio
group so moving between options does not hide focus-only help. Focused
RadioGroup suites pass **6/6** per family and OneOfRadioGroup suites pass
**4/4** per family; all three family package checks report zero errors and
warnings. Both variants now expose a named `radiogroup` in every family; the
focused suites pass **10/10** per family after that change. Remaining choice
field frames stay in audit.

### P3.1 finite-select helper association, 2026-10-30

Enum and oneOf finite selects now associate visible wrapper help/errors with
the focusable trigger in Shadcn and Flowbite, including searchable-choice
buttons. Skeleton does the same for native selects and combobox inputs.
Authored `aria-describedby` IDs remain. Focused Enum/OneOfEnum suites pass
**10/10** in Shadcn, **10/10** in Flowbite and **12/12** in Skeleton; all
three family package checks report zero errors and warnings. Other choice
field-frame behaviors remain open.

### P3.1 mixed-choice input helper association, 2026-10-30

The mixed string-or-enum control now associates visible wrapper help/errors
with its free-text input in Shadcn, Flowbite and Skeleton while preserving
authored `aria-describedby` IDs. Focused AnyOfStringOrEnum suites pass
**4/4** Shadcn, **6/6** Flowbite and **4/4** Skeleton; all three family package
checks report zero errors and warnings. Applicability and suggestion semantics
remain in the R15 audit.

### P3.1 temporal input helper association, 2026-10-30

Date, Time and DateTime inputs in Shadcn, Flowbite and Skeleton now include
visible wrapper help or errors in `aria-describedby`. Authored description IDs
and existing incomplete-draft and picker-range hint IDs remain. Focused suites
pass **18/18** Shadcn and **14/14** each in Flowbite and Skeleton; all three
family package checks report zero errors and warnings. The Flowbite DateTime
popup height assertion now follows its viewport-relative CSS limit. Other
temporal behavior and specialized field frames remain open.

### P3.1 Color field help association, 2026-10-30

The extended Color text input and swatch trigger in Shadcn, Flowbite and
Skeleton now reference visible wrapper help and local invalid-color feedback.
Authored description IDs remain, and the swatch tracks focus when text entry
is disabled. Focused Color suites pass **16/16** per family. All three extended
package checks report zero errors and warnings; the three base packages were
rebuilt to supply the current wrapper help IDs for these integrated suites.
Other extended controls and compact cell frames remain open.

### P3.1 Cron field help association, 2026-10-30

The extended Cron text input and picker trigger in Shadcn, Flowbite and
Skeleton now reference visible wrapper help and local cron errors through
`aria-describedby`, while retaining authored description IDs. The trigger
tracks focus for focus-only help. Focused Cron suites pass **19/19** Shadcn,
**20/20** Flowbite and **17/17** Skeleton; all three extended package checks
report zero errors and warnings. Other extended field and cell frames remain
open.

### P3.1 Duration field help association, 2026-10-30

The extended Duration text input and picker trigger in all three families now
reference visible wrapper help. Authored description IDs and the existing
incomplete-draft hint remain associated with the text input. The trigger tracks
focus for focus-only help. Focused Duration suites pass **23/23** per family;
all three extended package checks report zero errors and warnings. Flowbite's
popover suites now dispatch the `mousedown` event used by its trigger instead
of a synthetic `click()` that left the popup hidden. Other extended field and
cell frames remain open.

### P3.1 File picker help association, 2026-10-30

The visible File picker button in Shadcn, Flowbite and Skeleton now references
visible wrapper help and rejected-file feedback through `aria-describedby`,
preserving authored description IDs. The hidden native file input retains its
required and invalid state. Compact cells expose a hidden text description for
the local feedback indicator and omit the absent wrapper-help reference.
Focused control and compact-cell browser cases pass **3/3** per family; all
three extended package checks report zero errors and warnings. Other extended
field and cell frames remain open.

### P3.1 Null checkbox help association, 2026-10-30

The extended Null checkbox in Shadcn, Flowbite and Skeleton now references
visible wrapper help through `aria-describedby` while preserving authored
description IDs. The reference is omitted when the wrapper is hidden or its
focus-only help is absent. Focused Null suites pass **6/6** per family; all
three extended package checks report zero errors and warnings. Monaco and
other extended field and cell frames remain open.

### P3.1 Monaco focus-target help association, 2026-10-30

The shared Monaco component now forwards live `aria-describedby` and invalid
state to Monaco 0.55's focusable editor textbox rather than only to the outer
surface. The Shadcn, Flowbite and Skeleton extended controls associate visible
wrapper description or error text with that textbox and omit absent helper
references when the wrapper is hidden. The shared Monaco component suite passes
**26/26**, and each mounted extended renderer suite passes **12/12**. The shared
and all three extended package checks report zero errors and warnings. Other
field and compact-cell frames remain open.

### P3.1 Compact-cell help targets, 2026-10-30

The Shadcn, Flowbite and Skeleton compact cell wrappers now render a
screen-reader-only help target when a focused description or error is present.
Specialized renderer inputs can therefore reference an actual `-help` element
without displaying a repeated field description in the table. The mounted Null
cell suites pass **7/7** per extended family, including a focused description
association; the mounted Cron cell case passes **1/1** per family with its
renderer-local error replacing the description in that target. All three base
package checks report zero errors and warnings. Broader compact-cell
acceptance remains open.

### P3.9 Choice-card group help and focus states, 2026-10-30

The Shadcn, Flowbite and Skeleton card radio groups now reference the visible
wrapper description or validation message with `aria-describedby`; absent
focus-only help and hidden wrappers leave no dangling reference. Mounted tests
verify guidance and host-updated error association, keyboard focus styling
distinct from selection, disabled-choice refusal, and a nested Group card that
updates its own property while retaining a sibling. The focused choice-card
suites pass **18/18** per family. Shadcn, Flowbite and Skeleton package checks
report zero diagnostics after moving an untracked generated declaration that
shadowed the new stepper component out of the source tree.
Rich presentation and broader context acceptance remain open.

### P3.9 Cyclic card presentation guard, 2026-10-30

The shared choice-card presentation predicate now tracks only ancestors while
walking nested layouts. A JavaScript host can therefore reuse one presentation
node without losing valid content, while cyclic layout content is rejected and
falls back to the visible choice label. The focused shared contract passes
**12/12**, and the mounted choice-card suites pass **19/19** in each of Shadcn,
Flowbite and Skeleton after rebuilding the shared package. The shared package
check reports zero errors and warnings. Broader rich-content acceptance remains
open.

### P8.6 Shared split-pane initial transition warning, 2026-10-30

The shared split-pane hook now reads its initial transition option without a
Svelte reactive-capture warning; its existing effect still follows live option
changes. The shared check reports zero errors and warnings, `svelte-package`
and `publint` pass, and the focused Shadcn split-pane browser suite passes
**15/15** without the prior imported shared-package warning. The final broad
release gate remains open.

### P1.14 Conditional-field projection diagnostics, 2026-10-30

The shared conditional-field hook now emits `conditional.referenceFailed` and
`conditional.evaluationFailed` as deduplicated author warnings with the object
path. The existing localized in-form status remains, and projection failure
does not write form data. The shared projection suite passes **8/8**; mounted
ObjectRenderer suites pass **14/14** in Shadcn, Flowbite and Skeleton. The shared
check and package/publint pass. Other P1.14 diagnostics remain open.

### P3.1 Formatted-number compact-cell help, 2026-10-30

Formatted integer table cells in Shadcn, Flowbite and Skeleton now associate
their focusable input or textarea with a stable screen-reader helper. It shows
the schema description on focus, switches to a local parse error for an invalid
draft, then restores the description after correction. Focused
NumberFormatCell suites pass **4/4** per family; no full rebuild was run.

### P1.3 Nested literal dotted-member isolation, 2026-10-30

The shared literal-control mounted suite now covers a dotted parent and dotted
child alongside a nested lookalike. It verifies the literal child receives the
edit and host error while the lookalike and original input stay unchanged.
The focused browser suite passes **10/10**. Arbitrary dotted instance-path
contexts and wider rule/error acceptance remain open.

### P1.3 Dotted array and table-cell path isolation, 2026-10-30

Shadcn, Flowbite and Skeleton normal tables now have mounted regressions for a
dotted array property containing a dotted column. Each checks an edit preserves
the nested lookalike, a host error at the literal JSON Pointer marks the cell,
and a host error at the lookalike path does not. The focused case passes **1/1**
per family; the complete adjacent Shadcn array suite passes **19/19**. This
accepts the normal-table case, while arbitrary external dotted instance paths
remain open.

### P5.3 Own-property discriminator hints, 2026-10-30

The shared oneOf/anyOf discriminator helper now requires own composition arrays,
branch references and required lists, and constant discriminator properties.
Regressions first reproduced wrong branch selection from inherited schema
properties; after the fix the shared suite passes **7/7**. The mounted
OneOfRenderer suites pass **15/15** in each
Shadcn, Flowbite and Skeleton family after rebuilding the shared package. The
shared check and packaging/publint pass. Broader recursive-reference and
branch-context acceptance remains open.

### P5.3 Nested resource branch selection, 2026-10-30

A mounted `oneOf` case now resolves `./branches#file` from a nested `$id`
resource and displays the File editor while the required name fails `minLength`.
It preserves the exact incoming data and error path and does not expose Folder
actions. A host replacement then selects Folder with an invalid nested File,
retaining the replacement data and the nested `/node/children/0/name` error.
The focused OneOfRenderer suites pass **16/16** in Shadcn, Flowbite and Skeleton.
This covers one anchored nested-resource context; other recursive reference and
production combinations remain open.

### P1.14 Active-view initial-focus diagnostic, 2026-10-31

A form-scoped `focus.conflict` warning reports the paths of simultaneous active
`options.focus` requests once per request set. It does not select a winner or
change native `autofocus`. Inactive Tabs, stepper and accordion categories and
collapsed Groups do not count, including mounted hidden panels; a dialog has
its own warning scope. The shared diagnostic suite passes **2/2**. Focused
active-view tests pass **5/5** per family, and adjacent Group/Categorization
suites pass **59/59** Shadcn, **60/60** Flowbite and **56/56** Skeleton. Shared
packaging/publint and all three family checks pass with zero diagnostics.
Broader focusability and the unified structured author-diagnostic API remain
open.

Formatted integer table cells own their input rather than using the normal
control adapter, so they now register their mount-time focus request in the
same form diagnostic. A focused case pairs one formatted cell and one ordinary
String control, confirms both native `autofocus` attributes and exactly one
`focus.conflict` warning with the two data paths. The NumberFormatCell suites
pass **5/5** in each family, and all three family checks are clean.

### P1.3 Literal dotted OneOf member isolation, 2026-10-31

Mounted Shadcn, Flowbite and Skeleton cases distinguish a literal `a.b` OneOf
member from a nested `a.b` lookalike with its own discriminator. An empty
literal member shows missing-kind feedback; a host replacement selects Post;
editing its address changes only the literal member, and clearing the branch
removes only that member. A host error at `/a.b/address` reaches the literal
editor; one at `/a/b/kind` does not leak into it. The focused
OneOfRenderer suites pass **17/17** per family. Other literal-key contexts
remain open.

### P4.3 Intersecting additional-property patterns, 2026-10-31

React's shared additional-property selector collects every matching
`patternProperties` schema. A mounted case in each Svelte family now exercises
that contract: `price_total` matches two patterns, gets a numeric editor instead
of the unrelated string fallback, reports the stricter minimum at the exact
property path, and accepts a valid numeric edit. The focused
AdditionalPropertiesSpec suites pass **5/5** in Shadcn, Flowbite and Skeleton.
The added conjunctive string-pattern case keeps a usable text editor when two
different pattern assertions match the same key and clears both validation
errors after a valid edit; the unrelated numeric fallback is not selected.
Flowbite's existing literal empty-key case also now waits for the tab switch
before obtaining its input; the previous test held a detached node. Broader
additional-property constraint and command acceptance remains open.

The shared additional-property name preview now catches Ajv compilation
exceptions from a malformed `propertyNames` pattern or host validator. It
continues to reject ordinary invalid names when validation runs, while leaving
schema-error reporting to the form validator when preview compilation fails.
This follows the React common helper's fallback behavior. The focused name
suite passes **28/28**; shared `svelte-check`, packaging and publint pass.

### P1.3 Prototype-looking dynamic rename, 2026-10-31

The native literal-property rename matrix now includes `__proto__` and
`constructor`. Shadcn, Flowbite and Skeleton each preserve the renamed value
as an own key while retaining `Object.prototype`, alongside their existing
dotted, empty and spaced-key cases. Focused LiteralProperties suites pass
**37/37** Shadcn and **33/33** each in Flowbite and Skeleton. Other literal-key
contexts remain open.

### P1.12 production Label-summary locale search, 2026-10-31

The table-row-details demo localizes its AG Grid applicant-summary Label text
through the example catalog adapter while preserving the pinned specification
JSON. English displays `Applicant 12 — applicant12@example.com`; Bulgarian
displays `applicant12@example.com — Applicant 12`. A browser case in each
renderer family and both host modes filters the English text, changes the
locale without a data edit, confirms the old filter no longer matches, then
finds the row using the Bulgarian text. The focused row-summary-search suite
passes **18/18** across its existing EN/BG matrix and six live locale
transitions. All three demo builds, demo-common check/packaging, and the 47
fixture provenance check pass. Broader P1.12 error-precedence and translation
acceptance remains open.

### P1.12 live additional-error translation, 2026-10-31

The additional-errors demo now keeps a server response published if Submit
arrives before the store's initial example-reset effect flushes. Its focused
store suite passes **3/3**, including that ordering and existing field-change,
translation and example-switch behavior. A browser case in each family and both
host modes publishes the two server errors in English, switches to Bulgarian
without editing form data, and checks translated field messages, the unchanged
additional-error count and the unchanged email value. The focused
additional-errors file passes **18/18** in two successive runs against fresh
demo builds using a single Submit click. Other P1.12 precedence and translation
cases remain open.

### P1.13 pending Button action delivery, 2026-10-31

An action clicked during form-owned editor validation now waits for that
validation to settle and dispatches once. The shared coordinator retains its
immediate hard block for unfinished IME composition and invalid drafts, and
cancels a queued action when its renderer unmounts. Monaco reconciliation and
published diagnostics no longer masquerade as hard draft blocks; the owned
pending state guards them. The core pending-action suite passes **10/10**,
Monaco draft passes **10/10**, and the native Button suites pass **16/16**
Shadcn and **15/15** each Flowbite and Skeleton. After rebuilding shared,
extended, Web Component and demo packages, the additional-errors browser
matrix passes **18/18 twice** with one Submit click per case. The added
collection cases prove that two clicks while validation is pending perform one
command and a target replacement cancels the queued command. The deletion
cases prove that a request waits before opening confirmation, drops a host data
replacement while waiting, and captures an edited value after flushing a
pending field write. If the flush starts another validation pass, confirmation
waits for it; unchanged data opens the prompt and a host replacement cancels
the request. Focused array-control/confirmation suites pass **43/43**
Shadcn and **40/40** each Flowbite and Skeleton against the rebuilt shared
package. After rebuilding all three Web Component bundles and demos, the
destructive-confirmation and collection-actions production matrices pass
**24/24** across families, EN/BG and native/Web Component hosts. The production
matrix covers ordinary delete confirmation and collection commands. A second
Web Component host case replaces collection data while its delete prompt is
open; the stale prompt closes and preserves the replacement in all six
family/locale cases. The destructive-confirmation file passes **18/18**.
A new production test mounts a Web Component with a real Monaco code editor
and additional-property Delete. It clicks Delete synchronously from a
`validity-change` event reporting `pending: true`, then replaces host data;
the stale request opens no prompt and preserves the replacement. Repeating
the same pending click without replacement opens confirmation. All **6/6**
family × locale Web Component cases pass. Other non-Button consumers remain
open.

### P4.5 focused accordion host removal, 2026-10-31

When a host removes the focused open Category from an accordion, Skeleton now
defers replacing the native item list and selected value for one frame. The
remaining Category takes focus and opens without a form-data write or a Svelte
runtime error. Shadcn and Flowbite retain their existing behavior. The focused
Skeleton component suites pass **15/15**; the rebuilt Skeleton package, Web
Component and demo pass their checks and builds; and the EN/BG Web Component
matrix passes **6/6** across all three families. Wider P4.5 runtime
acceptance remains open.

### P3.9 pending choice-card selection, 2026-10-31

The shared choice-card controller now captures its path, schemas and data on
selection, checks them before pending edits flush, and captures the flushed
data again before awaiting any subsequent owned validation. A host replacement
while validation is pending no longer switches the stale card; unchanged data
still switches, and a pending field edit can flush before selection. The new
shared suite passes **3/3**. After rebuilding the shared package, mounted
choice-card suites pass **19/19** in Shadcn, Flowbite and Skeleton. Rebuilt
Web Components and demos pass their builds, and
`pending-choice-card-host-replacement.spec.ts` passes **6/6** family × EN/BG
production cases: a host replacement cancels the pending card switch, while
an unchanged host still switches after pending validation settles. Wider
rich-card acceptance remains open.

### P3.9 referenced branch replacement during card confirmation, 2026-10-31

The choice-card confirmation snapshot now includes the root schema, so replacing
a referenced branch definition closes an open confirmation even when the local
`oneOf` schema and data are unchanged. A new mounted regression first failed
with the stale dialog and passes after the guard; the full mounted choice-card
suites pass **20/20 per family**. All three Web Components and demos rebuild,
and `choice-card-referenced-schema-replacement.spec.ts` passes **6/6** family ×
EN/BG production cases. Each case also opens a fresh confirmation and commits
using the replacement branch default. Broader P3.9 rich presentation and visual
acceptance remain open.

### P3.9 rich-card presentation order, 2026-10-31

React renders inert card presentation before the visible choice label. Shadcn,
Flowbite and Skeleton now use the same order for active content and the hidden
alternate that holds card dimensions steady during selection. The three family
packages, Web Components and demos rebuild with clean checks. Mounted
choice-card suites pass **20/20 per family** after correcting the referenced
schema fixture to JSON Schema `definitions`; the focused production rich-card
and referenced-schema suites pass **18/18** across families, locales and hosts.
The rich-card cases assert presentation-before-label DOM order and retain their
image, Markdown and selection checks. The narrow light/dark follow-up is
recorded below; focus, error-state and `showRadio` review remains open.

### P3.9 narrow card themes and Skeleton contrast, 2026-10-31

`choice-card-narrow-theme.spec.ts` passes **12/12** across Shadcn, Flowbite and
Skeleton, EN/BG, and native/Web Component hosts. Each case checks both light
and dark at a 390px viewport, including card containment, selected-border
distinction, composited selected-label contrast of at least 4.5:1, and no rich
content overflow. It records 24 review screenshots under
`test-results/choice-card-visual-review/`. Screenshot inspection exposed a
Skeleton selected label that was white on a pale blue card in light mode and
dark on navy in dark mode, plus clipped Bulgarian text. The Skeleton adapter
now supplies themed label text and normal card wrapping. The updated screenshots
show the Bulgarian text inside the card in both native and Web Component modes.
Skeleton package, Web Component and demo builds pass; its mounted card suite
passes **20/20**, and the rebuilt rich-card production suite passes **12/12**.
The Web Component focus/error/`showRadio` follow-up is recorded below; native
focus/error visual review remains open.

### P3.9 showRadio and invalid-card Web Component review, 2026-10-31

`choice-card-show-radio-error.spec.ts` passes **6/6** across Shadcn, Flowbite
and Skeleton Web Components in EN/BG. At 390px, each case verifies both light
and dark: a visible radio marker, keyboard focus outline, equal 2px error
borders on invalid choices, radiogroup `aria-invalid`, and screenshots under
`test-results/choice-card-visual-review/`. Replacing the schema with a valid
one clears the group error and restores distinct selected/unselected borders;
selecting the other card still succeeds. The first run exposed Skeleton's
missing group-level `aria-invalid` (its radios already had it). The adapter now
forwards the state; Skeleton package, Web Component and demo builds pass, its
mounted choice-card suite passes **20/20**, and the rebuilt production matrix
passes **6/6**. Native focus/error visual screenshots and broader card contexts
remain open.

### P1.3 literal rule contexts, 2026-10-31

`literal-rule-context.spec.ts` passes **12/12** across Shadcn, Flowbite and
Skeleton, EN/BG, and native/Web Component hosts. A root form contains literal
`a.b`, empty and repeatedly escaped `a~b~c` keys alongside a nested `a.b`
lookalike and an escaped-key decoy. Rule targets respond only to their own
literal key: live edits hide and restore each target, while editing a lookalike
does not. A second fixture in the same matrix places literal `a.b` and a nested
lookalike inside two array items. The first target survives editing its nested
lookalike, hides when its literal key changes, and stays separate from the
second item's target after switching expanded rows. A host data replacement
swaps the rows; each expanded item still uses its current literal key and
shows only its own matching target. The host data stays editable and no page
errors occur. Root-level and this array-item rule context
are accepted in production; other nested instance-path contexts and P1.3
consumers remain open.

### P1.14 array-panel collapsed-option diagnostic, 2026-10-31

`array-panel-collapse.spec.ts` passes **12/12** across Shadcn, Flowbite and
Skeleton, EN/BG, and native/Web Component hosts. An invalid local
`options.collapsed` emits `section.invalidCollapsed`; subsequent live changes
to valid `config.jsonformsExtended.array.collapsed` values open and close the
panel without page errors. Renderers may preserve or reset the user's expanded
state when the UI schema changes, so the assertion begins with explicit config
updates. Mixed-control production diagnostics and the structured author
diagnostic channel remain open.

### P1.14 mixed-frame collapsed-option diagnostic, 2026-10-31

`mixed-collapsed-option-diagnostic.spec.ts` passes **12/12** across Shadcn,
Flowbite and Skeleton, EN/BG, and native/Web Component hosts. Replacing the
canonical mixed-control UI schema with an invalid local `options.collapsed`
emits `section.invalidCollapsed` for the mixed frame. Explicit live changes to
valid `config.jsonformsExtended.mixed.collapsed` values then open and close the
frame without page errors. This completes production diagnostic acceptance for
the array-panel and mixed-frame collapse consumers. The structured
author-diagnostic channel remains open.

### P1.14 Group and accordion collapsed-option diagnostics, 2026-10-31

`section-collapsed-option-diagnostic.spec.ts` passes **24/24** across Shadcn,
Flowbite and Skeleton, EN/BG, and native/Web Component hosts. An invalid local
`options.collapsed` emits `section.invalidCollapsed` for Group and accordion,
and valid component config changes still control their expansion without page
errors. The accordion's edited production fixture removes its explicit
`options.initial`: Flowbite demo Tabs unmount inactive content, so returning
from the Config editor remounts and reopens an explicitly initial category.
The Flowbite mounted accordion suite separately verifies live config changes
with `options.initial` retained. These results cover all four collapse
consumers in production; the structured author-diagnostic channel remains open.

### P5.5 finite tree depth with imported data, 2026-10-31

The expanded `tree-max-depth.spec.ts` passes **12/12** across Shadcn, Flowbite
and Skeleton, EN/BG, and native/Web Component hosts. The canonical five-level
tree still disables Add at level five and permits editing its existing name.
Replacing host data with a sixth child keeps the five valid editors and shows
the level-five `maxItems: 0` error; restoring the canonical data clears that
error without a page exception. React's shared `treeDepthExample.test.ts`
checks the same five-versus-six schema boundary. Other P5.5 mixed/tree
contexts remain open.

### P5.5 recursive-tree navigation indicators, 2026-10-31

`recursive-tree-indicators.spec.ts` passes **12/12** across Shadcn, Flowbite
and Skeleton, EN/BG, and native/Web Component hosts. An invalid imported child
in the Tree editor displays navigation indicators on that child and its
ancestor. Changing `config.jsonformsExtended.showValidationIndicator` to false
removes those indicators while both tree nodes remain navigable and no page
error occurs. This matches the React Shadcn recursive-tree presentation test's
indicator/visibility contract. Scoped detail modes and readonly production
acceptance remain open.

### P5.5 recursive-tree selected-node detail modes, 2026-10-31

Each of the Shadcn, Flowbite and Skeleton mounted recursive-tree suites passes
the focused `GENERATE` and `REGISTERED` cases (**2/2 per family**). With a
matching registry layout, `GENERATE` renders the selected node's generated
name field, while `REGISTERED` renders the registered layout. Neither mode
falls into an inapplicable renderer. The cases mirror React Shadcn's detail-mode
test. Production registered-detail and readonly acceptance is recorded below.

### P5.5 registered recursive-tree detail in production, 2026-10-31

`recursive-tree-detail.spec.ts` passes **12/12** across Shadcn, Flowbite and
Skeleton, EN/BG, and native/Web Component hosts. After replacing the demo UI
schema with `recursiveTree.detail: "REGISTERED"`, the selected Documents folder
renders its registered child collection, readme.txt renders the registered file
layout with its own `Welcome` content, and selecting Archive returns to the
folder layout without a file-content field. No inapplicable renderer or page
exception appears. The integration TypeScript check also passes after tightening
fixture access in this and the recent collapsed-option diagnostic tests.

The same production file also covers read-only navigation (**12/12** across the
same family, locale and host matrix). The root folder and selected file remain
visible, the selected-node name is not editable, the folder Add action is absent
or disabled, and child Rename/Delete actions are absent. The combined focused
file passes **24/24**. Broader mixed/tree presentation remains open; the
root-reference acceptance is recorded below.

### P5.5 mixed-tree root reference with registered detail, 2026-10-31

`MixedRecursiveRootDetail.svelte.spec.ts` passes **1/1 in each of Shadcn,
Flowbite and Skeleton**. It mirrors React Antd's recursive meta-schema case:
the form root has `type: ["object", "boolean"]`, an additional-property value
references the root with `$ref: "#"`, and the registry tester selects the
`properties.name` object path. Selecting that nested tree node renders the
registered detail label without changing data. The three family checks report
zero errors and warnings. The production `mixed-recursive-root-detail.spec.ts`
passes **12/12** across the three families, EN/BG and native/Web Component
hosts. It selects the nested node, edits its registered name field, and confirms
in the Data view that the nested name changed while the root name stayed intact.
No page errors occur. Broader mixed presentation remains open.

### P5.5 mixed-tree workspace in production, 2026-10-31

`mixed-tree-workspace.spec.ts` passes **12/12** across Shadcn, Flowbite and
Skeleton, EN/BG, and native/Web Component hosts. In the canonical mixed-control
example, the Tree navigation frame reveals primitive nodes, search filters to
the supplier node, selecting it updates the breadcrumb and shows its current
value, and collapsing/reopening the outer frame retains the search input node,
query and selection. The Data editor still equals the original fixture; no
page errors occur. This matches the React Shadcn mixed-workspace expectations
for navigation and persistent collapse state. Other mixed presentation and
interaction contexts remain open.

### P5.4 compact mixed-cell dialog labels, 2026-10-31

React Antd's `mixedCellsExample.test.tsx` expects the canonical mixed-value
table to render eight rows and a value-cell detail dialog without an extra
field label. The new `mixed-table-cells.spec.ts` initially found two visible
Value labels in Shadcn's first value dialog. All three Svelte control bindings
now respect `uischema.label === false` for wrapper labels; Flowbite also avoids
emitting empty `<label>` elements. The three mounted MixedRenderer suites pass
**23/23 Shadcn, 23/23 Flowbite and 25/25 Skeleton**. All affected renderer,
Web Component and demo builds pass. The rebuilt EN/BG × family × native/Web
Component production matrix passes **12/12**: eight table rows render, the
first value dialog contains its Portland input without duplicate Value labels
or renderer fallbacks, Escape closes it, and the full Data document remains
unchanged. A second matrix selects the existing whole-number row, switches its
dialog type to number, preserves the value `2` in the numeric input, and applies
`2.5`. The Data document differs only at that row's value. Both production
cases pass **24/24** across families, EN/BG and native/Web Component hosts,
without page errors. Other mixed-cell production interactions remain open.

### P5.4 missing compact mixed-cell value and Skeleton popup, 2026-10-31

The final row in the spec mixed-value table has no `value` property. Selecting
`string` in its detail dialog and entering text now creates that property while
leaving every sibling unchanged in the Data document. The initial matrix found
that Skeleton portaled the type options behind its modal detail dialog for this
bottom row; the dialog body intercepted pointer clicks. Skeleton now targets
the owning detail dialog for that popup, retaining the existing host portal
target outside a dialog. The focused Skeleton MixedRenderer suite passes
**25/25**. The rebuilt compact-cell production file passes **36/36** across
three renderer families, EN/BG and native/Web Component hosts, including the
earlier label and numeric-type cases. Skeleton, Web Component and demo builds,
type checking and touched formatting/lint pass.

### P5.4 structured compact mixed-cell edits, 2026-10-31

The Object and Array rows in the same canonical table retain their structured
values behind a collapsed mixed-tree workspace. For each row, the production
test expands the frame and tree root, reveals primitive nodes, selects `city`
or the first array item, edits `Portland` to `Salem`, and applies the dialog.
The Data document then differs only at that nested path; the object's
`active` flag, the array's other elements, and all sibling rows remain intact.
The focused EN/BG × family × native/Web Component matrix passes **24/24**.
Integration TypeScript, touched lint and formatting pass. Other compact-cell
interactions remain open.

### P5.4 imported invalid mixed value, 2026-10-31

The canonical mixed-control fixture imports `priority: true` against a
`string | number` schema. All three renderers show invalid type selection
without replacing the value on load. Explicitly choosing `string` clears the
invalid state and replaces only `priority` with its string default, preserving
all sibling data. The EN/BG × family × native/Web Component production matrix
passes **12/12**. Other mixed production acceptance remains open.

### P5.4 absent required mixed-cell feedback, 2026-10-31

The final table row initially has a local cell-invalid cue for its missing
required `value`. Its detail dialog offers type selection without a delegated
text editor. Selecting `string`, entering `New value` and applying clears the
cell cue while changing only that row. The focused EN/BG × family ×
native/Web Component matrix passes **12/12**. This strengthens the earlier
missing-value acceptance with the validation transition; other compact-cell
interactions remain open.

### P5.4 compact structured-cell type changes, 2026-10-31

Populated Object and Array values in the canonical eight-row mixed table now
have production acceptance for destructive type selection. Changing either to
String prompts; declining keeps the structured value so a second attempt still
prompts. Accepting and applying replaces only that row's `value` with the
string default, leaving all other rows and form data intact. The focused EN/BG
× family × native/Web Component matrix passes **24/24**; integration TypeScript,
lint and formatting pass. Other compact-cell interactions remain open.

### P5.4 compact null and missing value distinction, 2026-10-31

The canonical table's explicit JSON `null` row selects the Null type in its
detail dialog, while the row with no `value` property starts with no selected
type and shows the selector placeholder. Closing both dialogs leaves the Data
document exactly unchanged. The focused EN/BG × family × native/Web Component
matrix passes **12/12**. Other compact-cell interactions remain open.

### P5.7 readonly conditional projection under NoValidation, 2026-10-31

The React Shadcn conditional-fields suite requires an active `allOf`
`if`/`then` field to remain read-only even with validation disabled. Each
Svelte ObjectRenderer now has a comparable mounted case: the projected VAT
input remains visible and disabled or read-only after switching to
`NoValidation` and `readonly`, and the form data remains unchanged. The full
touched ObjectRenderer suites pass **15/15** in Shadcn, Flowbite and Skeleton.
Broader generated/authored conditional acceptance remains open.

### P5.7 generated and authored conditional switching, 2026-10-31

The canonical conditional-fields demo now has an interaction matrix for both
generated and authored layouts. Switching Customer type from Business to
Personal removes the visible VAT editor and reveals Nickname. After editing
Nickname, switching back to Business restores the original VAT editor;
returning to Personal restores the edited Nickname. The imported VAT, purchase
order and billing address remain in the Data document throughout, and the final
document differs only in `customerType` and `nickname`.
All **24/24** EN/BG × family × native/Web Component cases pass without page
errors. Broader recursive-reference and visual acceptance remains open.

### P3.11 formatted-number cell host replacement, 2026-10-31

A mounted table-cell regression now covers an invalid formatted integer draft
followed by a host data replacement. The invalid draft produces no data write;
replacement data takes over the visible editor, clears its invalid state and
becomes the latest form data. The focused NumberFormatCell suites pass **6/6**
in each native family. Other compact-cell acceptance remains open.

### P3.11 referenced formatted integer cells, 2026-10-31

A table item property using a local `$ref` to an integer schema still selects
the formatted-number cell. Its callback-formatted text edits back to a numeric
value, without changing the array shape. The expanded NumberFormatCell suites
pass **7/7** in Shadcn, Flowbite and Skeleton. Other referenced and conflicting
specialized-cell dispatch cases remain open.

### P3.11 formatted AG Grid cell error and sort focus, 2026-10-31

The callback-formatted integer cell now has a sorted-row acceptance check in
each extended family. An invalid draft remains local to the focused row and
does not emit a data write; a valid correction clears its error, updates only
the source item and moves under the active sort while retaining input focus.
The focused AG Grid numeric suites pass **2/2** in Shadcn, Flowbite and
Skeleton. Other specialized-cell and grid cases remain open.

### P5.7 dependency-trigger host replacement, 2026-10-31

A mounted ObjectRenderer case now removes `purchaseOrder` through a host data
replacement while keeping the imported `billingAddress` value. The dependent
Billing address editor hides, then reappears with its original value when the
trigger property returns; neither projection changes the host document. The
complete focused ObjectRenderer suites pass **16/16** in Shadcn, Flowbite and
Skeleton. Broader conditional-field acceptance remains open.

### P3.11 formatted-number maxLength parity, 2026-10-31

React Antd and Shadcn pass the integer schema's `maxLength` to formatted cell
inputs and textareas. The three Svelte families now forward it in both modes.
Their focused NumberFormatCell suites pass **7/7** each, including DOM limit
checks for a single-line input and multiline textarea. Other specialized-cell
dispatch and portability work remains open.

### P3.11 incompatible formatted-number cell dispatch, 2026-10-31

A mounted table with string and decimal-number columns now supplies the same
`format: true` integer callbacks to both. Neither column invokes the formatter:
the string keeps its text editor, the decimal keeps its number editor and a
decimal edit remains numeric. The focused NumberFormatCell suites pass **8/8**
in Shadcn, Flowbite and Skeleton. Other specialized-cell registry conflicts
remain open.

### P3.9 native choice-card focus and error visual review, 2026-10-31

The canonical choice-card demo now has a 390px native-only matrix across
Shadcn, Flowbite and Skeleton in EN/BG. In light and dark themes it verifies
the selected visible radio marker, keyboard-focus outline, complete 2px
invalid-card borders and card containment. All **6/6** cases pass without page
errors and capture 24 focus/error screenshots. The Shadcn English and Skeleton
Bulgarian dark focus/error captures were visually inspected. Broader rich-card
contexts remain open.

### P4.3 Add-property constraint feedback, 2026-10-31

When a nonempty Add-property draft violates `propertyNames`, the nested name
control now owns the constraint-specific message. The additional-error path
only supplies errors for cases without a schema validation message, such as a
name collision. This prevents duplicate messages while retaining the Add gate.
Adding a first key to an absent dynamic object now creates that object, as in
React. The canonical `sensor-z` minimum-length and missing-parent regressions
plus the full AdditionalPropertiesSpec suite pass **17/17** in each Svelte family.
A root-referenced `propertyNames` constraint blocks a short Add draft and
accepts a valid key in all three families. The added mounted cases verify that
`additionalProperties: false` blocks nonmatching keys while accepting a matching
`patternProperties` key, and that
opt-in empty and whitespace-only names remain distinct stored keys. A newly
added key matching two numeric patterns gets a numeric editor and clears both
pattern constraints after a valid edit. All three package checks have zero
diagnostics. Broader P4.3 acceptance remains open.

The schema selector normalizes direct and locally referenced boolean
additional/pattern schemas before Add:
`true` becomes an open object schema and `false` becomes an always-failing
object schema. The Add command now treats its returned schema as present
instead of relying on truthiness. A mounted boolean-`true` pattern case with
an absent parent object passes in all three families, and the focused shared
schema-selection suite passes **9/9**. A local `$ref` to either boolean schema
resolves to the same object-shaped editor schema; a `$ref` to `false` is not
mistaken for a missing target. The referenced `true` case is mounted in all
three families. The focused property-name suite passes **29/29**, including
local references to `true` and `false` `propertyNames` schemas. Direct and referenced boolean-`false` value schemas
also preserves the added key and reports an exact-path value validation error
in each family, following the React Add contract: a valid name does not imply
a valid value.

Invalid incoming primitive or array data for an object control previously
rendered character or item indices as dynamic property names. The three Svelte adapters
now enumerate only actual object keys, matching the React guard, and Add can
replace the invalid value with a new object. `maxProperties: 1` now counts only
actual object keys, so it does not block that repair. A mounted case failed before
the change and passes for both incoming shapes in each family; the focused
suites pass **17/17** per family.

### P2.3 trusted demo hooks and host errors, 2026-10-31

The demo-common registry editor retains unchanged trusted tester functions
without evaluating edited JSON. The Button example supplies native callbacks,
the Template example registers a native Svelte component, and the
additional-errors example handles server report/clear actions in host state.
The focused registry, Button and server-error suites pass **7/7**. The
existing additional-errors matrix passes **18/18** across family, locale and
host combinations and exercises Monaco editor-error publication with server
and schema feedback. The catalog suite passes **110/110** and checks the
canonical tester modules, choice-card tester, native Button callbacks and
Svelte template descriptor across all three families. Explicit host capability
diagnostics stay open under P2.3.

### P2.6 catalog host-requirement display, 2026-10-31

The shared demo source component now exposes nonempty catalog host requirements
in a disclosure next to the source link. The label follows EN/BG locale changes,
the exact catalog text is available on expansion, and examples without host
requirements have no empty disclosure. Focused browser tests pass **2/2** and
demo-common Svelte checking reports zero errors and warnings. This covers the
matrix's metadata display requirement; capability status and feature acceptance
for each example remain open.

### P5.8 Boolean false local conditional reference, 2026-10-31

A document-local `$ref` resolving to the boolean schema `false` previously
entered conditional-field projection as though the target were missing. The
new shared regression failed before the fix. Discovery now leaves that
non-conditional branch alone, and projection does not emit
`conditional.referenceFailed`; a genuinely missing target retains the
diagnostic. The focused shared conditional suite passes **9/9**. The adjacent
ObjectRenderer and conditional-reference suites pass **18/18** in each of
Shadcn, Flowbite and Skeleton, and the shared package check has zero
diagnostics. This does not close the remaining P5.8 reference profiles.

### P4.9 Forbidden tuple-tail Add parity, 2026-10-31

When imported data contains an extra item beyond a tuple with
`additionalItems: false`, React shows Add disabled beside the corrective
Delete action. All three Svelte families previously hid Add in that state.
The adapters now render the disabled action while leaving the empty forbidden
tail section absent after repair. Focused TupleControlRenderer suites pass
**39/39 Flowbite, 40/40 Shadcn, 39/39 Skeleton**. After rebuilding the
shared, family, Web Component and demo packages, the source tuple fixture
passes **12/12** family × EN/BG × native/Web Component cases with an explicit
disabled-Add assertion before corrective deletion. This does not close the
remaining tuple summary and validation acceptance work.

The forbidden imported tail now also shows its owning `additionalItems`
validation error beside the Additional Items heading, where the corrective
Delete action appears. The focused mounted tuple suites pass **39/39
Flowbite, 40/40 Shadcn, 39/39 Skeleton** after this change. After rebuilding
the affected native, Web Component and demo packages, the source tuple
fixture passes **12/12** family × EN/BG × native/Web Component cases,
checking that the heading indicator appears before corrective deletion and
disappears afterward.

The Additional Items section now also shows a localized child-error notice
for invalid trailing items, including those on another page. The notice
excludes fixed-position errors, includes a count only when requested, and
offers navigation to the first invalid trailing item. The focused mounted
tuple suites pass **40/40 Flowbite, 41/41 Shadcn, 40/40 Skeleton** with an
off-page error and a fixed-position error in the same tuple. The rebuilt
source-fixture production matrix passes **12/12** regression cases. A
supplemental production matrix applies an invalid off-page tail and an
invalid fixed position through the demo editors, then verifies the one-error
notice and first-error navigation in all **12/12** family × EN/BG ×
native/Web Component cases.

An authored tuple detail layout that omits an invalid fixed position retains
that position's translated error in the tuple-boundary omitted-position list.
The focused tuple suites pass **41/41 Flowbite, 42/42 Shadcn, 41/41
Skeleton**. A supplemental source-fixture production matrix passes **12/12**
family × EN/BG × native/Web Component cases after applying an authored
layout and invalid fixed-position data through the demo editors. The
omitted-position list remains visible even when the omitted editor is not.

Tuple-wide `minItems`, `maxItems` and `uniqueItems` messages remain at the
tuple boundary without marking valid position inputs invalid. The expanded
focused tuple suites pass **44/44 Flowbite, 45/45 Shadcn, 44/44 Skeleton**.
A supplemental production matrix passes **36/36** keyword × family × EN/BG
× native/Web Component cases using the demo editors. This accepts those
three array-level validation profiles; other P4.9 summary/detail profiles
remain open.

A Draft 2020-12 `prefixItems` tuple with `items: false` emits an `items`
keyword error for imported extra data, rather than draft-07's
`additionalItems` keyword. The shared Additional Items heading now recognizes
that exact forbidden-tail shape and clears its icon after corrective deletion.
The new regression failed before the fix; the focused mounted tuple suites
pass **45/45 Flowbite, 46/46 Shadcn, 45/45 Skeleton** afterward. This
validator-specific profile has not yet been exercised in the demo hosts,
which use the source example's ordinary validator. After the targeted
native/Web Component/demo rebuild, the draft-07 source tuple and off-page
summary production regressions still pass **24/24** combined cases.

Tuple-tail actions now have a production restriction matrix using the
source demo host. With `restrict: true`, Add at `maxItems` and Delete at
`minItems` are disabled. Replacing the flat config with `restrict: false`
enables those actions, writes the expected four- or two-item array, and
shows the resulting tuple-wide bound error. The supplemental matrix passes
**24/24** min/max × family × EN/BG × native/Web Component cases, including
exact Data-editor reads after each action.

The current Additional Items pagination implementation passes the shared
option-resolution suite **6/6**, the canonical mounted pagination fixture
**4/4 in each native family**, and the rebuilt source-fixture production
matrix **12/12** across family, EN/BG and native/Web Component hosts. These
checks cover local pagination enablement over a disabled config default,
absolute tuple indices, off-page error navigation, edit identity after
external replacement, and preservation of the data array across pages.

### P4.9 Tuple object summary fallback, 2026-10-31

The source tuple fixture includes four complex Handoff contacts positions: a
registry Control with summary and detail, a detail-only Control, a layout
entry, and no matching entry. A generated object preview previously showed
the schema title for the latter positions. `TupleField` now uses the localized
“View details” fallback whenever an object position lacks a usable scalar
summary, retaining literal Control-scope previews and the separate array and
missing-value fallbacks. Only the Edit action opens the detail dialog.

The focused mounted tuple suites pass **47/47 Flowbite, 48/48 Shadcn and
47/47 Skeleton**. After rebuilding the native, Web Component and demo
packages, the source-fixture production matrix passes **12/12** family ×
EN/BG × native/Web Component cases. It checks all four summary/detail
variants, reads values from dialog inputs, and closes each without an edit.
The expanded matrix also replaces the phone-list position through the Data
editor and confirms two previews plus a localized remaining count, an empty
array item count, and localized Not set when the position is absent. Mounted
cases check the same array fallbacks across all three families.
The shared dynamic-property schema selector suite passes **9/9**, including
normalization of direct and referenced boolean subschemas before Add uses
them. This closes these bounded summary profiles only; wider P4.9 profiles
remain open.

### P4.9 Additional Items absolute action labels, 2026-10-31

The canonical Additional Items pagination fixture now tests deletion of an
early trailing item in EN/BG. The next occurrence shifts into the same
absolute position, and its field label and Delete action both use that
one-based position; page-two labels still use source-array indices rather
than page-relative indices. Focused mounted suites pass **6/6 per family**.
The existing family × EN/BG × native/Web Component production pagination
matrix adds a page-two delete after Add and passes **12/12**, including the
shifted value and localized action label. React Antd and Shadcn use the
same absolute position in their tail action names. Wider P4.9 tail
presentation and Draft 2020-12 validator-host acceptance remain open.

### Web Component host-supplied validator, 2026-10-31

The default demo and Web Component validator is Draft-07. A direct probe of
JSON Forms core Ajv showed why a Draft 2020-12 `prefixItems` plus `items:false`
schema cannot use that validator: without a `$schema` it rejects every array
item under `items:false`; with the Draft 2020-12 `$schema` it cannot compile
the unregistered metaschema. This is a validator dialect difference, not a
renderer error-placement regression.

Each Svelte Web Component now accepts a JavaScript-only `ajv` property. A
host-supplied instance is passed through unchanged; omission retains the
existing generated validator. Focused browser tests pass **2/2 per family**
with Ajv2020, an explicit Draft 2020-12 metaschema, an imported extra tuple
item, the `items` error at `/value`, the Additional Items error icon, and
corrective deletion clearing the error, plus revalidation after a host replaces
the Ajv instance with one that rejects a custom format. All three Web Component
package builds/checks pass. The three demo wrappers now pass the same Ajv
instance used by their native forms to the custom element and update it when
the form props change; focused wrapper suites pass **4/4 per family** and all
three demo checks are clean. Ordinary demo examples still construct a Draft-07
validator. The separate `tuple-draft-2020` example explicitly requests the
Draft 2020-12 profile from the extended Ajv helper. Its imported forbidden
tail, disabled Add, corrective Delete, reversed authored `#/prefixItems/N`
layout, and exact `[1, 9]` data after editing the second position pass **12/12**
built production cases across three families, EN/BG, and native/Web Component hosts. The same
matrix verifies that an invalid Longitude position omitted from authored detail
remains visible at the tuple boundary, then clears after host data replacement.
The adjacent
Draft-07 tuple example passes **12/12** in the same run; the focused helper
test confirms the dialect switch changes `items:false` validation at the
correct array path. The canonical source tuple fixture remains Draft-07.

The additional-property Add path treats the selected value schema separately
from the parent object data. Boolean `true` and `false` schemas are normalized
before rendering/default creation; only non-object parent data is replaced with
`{}`. The focused AdditionalProperties browser files pass **18/18 per Svelte
family**, including `additionalProperties: true` with null parent data: Add
retains the new key and its empty string default without confusing the boolean
schema with the parent value.

### P4.9 Boolean fixed positions and blocked tail Add feedback, 2026-10-31

A tuple position with the boolean schema `false` remains visible as a
forbidden position. Editing the following string position preserves the
imported invalid value and its exact `/value/0` validation error. The focused
tuple component files pass **48/48 Flowbite, 49/49 Shadcn, 48/48 Skeleton**.
When tail Add cannot initialize an earlier ambiguous position, its existing
message now uses the renderer's error color and `data-tuple-draft`, matching
the React warning/error presentation. Focused tuple-density suites pass **5/5
per family**. Wider P4.9 tail and dialect profiles remain open.

### R30 Additional-property audit reconciliation, 2026-10-31

The audit row now distinguishes accepted P4.3 behavior from remaining
production contexts. The current mounted AdditionalProperties files pass
**18/18 per family**; the focused MixedSchema files pass **8/8 per family**,
including declared-property and matching-pattern intersection. These checks
support the row's existing literal-key, boolean-schema, pattern and command
evidence without closing the broader P4.3 acceptance item.

### P4.3 Host property-name error feedback, 2026-10-31

Additional-property Add and Rename now use the errors from the validator
that rejected a name. This preserves host-only format or keyword messages
that the shared fallback Ajv cannot reproduce. A validator hook exposing
only a false result still gets ordinary keyword details from the fallback.
The shared name suite passes **31/31**; the shared package check, build and
publint pass. Mounted custom-format feedback and Add/Rename blocking pass in
the complete AdditionalProperties suites, **20/20 per Svelte family**. The
custom-format Add field retains a visible, associated EN/BG Property Name
label when its draft schema contains `allOf`. The same suites cover boolean
true/false value schemas and null parent data. All three family checks report
zero errors and warnings. Before the EN/BG host-format expansion, the bounded
AdditionalProperties and TupleControlRenderer files passed **68/68 Shadcn,
67/67 Flowbite, 67/67 Skeleton**; the complete AdditionalProperties files now
pass **20/20 per family**. Broader production-host name profiles remain open
under P4.3.

### P4.3 Production property-name drafts, 2026-10-31

The canonical telemetry example now checks its composed `propertyNames`
constraints in the production hosts. `sensor-z` shows the nine-character
feedback and disables Add; `senso` shows both the length and `^sensor-`
pattern feedback; `sensor-deck-b` enables Add. The Property Name input keeps
its translated accessible label in EN/BG. A fresh `pnpm run build:demo` passes,
the new family × locale × native/Web Component matrix passes **12/12** without
page errors. A second matrix uses test-local Schema, UI Schema and Data editor
changes to exercise the host's `cron` format for property names. Invalid Add
and Rename drafts show the host format error and disable their actions; a
valid Add draft enables its action. It passes **12/12** across the same hosts
and locales, including the Flowbite dialog-close transition. The complete
additional-properties production file passes **40/40**. The source-example
integrity check still matches all **47** imported fixtures. Broader
external-validator contexts remain open under P4.3.

### P4.3 Overlapping property value patterns in production, 2026-10-31

A test-local schema closes an object except for two matching numeric
`patternProperties` branches, with minimums of one and five. In the production
UI, unrelated and duplicate Add names stay disabled, a matching new name
enables Add and renders a numeric editor, and the imported value below five
becomes invalid on blur and clears after correction. The family × EN/BG ×
native/Web Component matrix passes **12/12** without page errors. This is a
focused addition to the earlier **40/40** complete additional-properties
production checkpoint; the full file was not rerun after adding this case.
The imported spec example remains unchanged.

### P4.3 Literal-key Rename/Delete in production, 2026-10-31

A test-local object has a dynamic literal `nested.key` alongside a declared
`nested.key` path inside an object. Rename changes only the literal key to
`renamed.key`; Delete then removes only that renamed key. The nested `Key`
editor retains its original value throughout. The EN/BG native/Web Component
matrix passes **12/12** across all three renderer families without page
errors. The imported source example is unchanged.

### P4.3 Boolean additional-property value schemas, 2026-10-31

The focused `additional-property-boolean-value-schemas` production matrix passes 12/12
across Shadcn, Flowbite and Skeleton, EN/BG, and native/Web Component hosts.
It adds a key where `additionalProperties: true` and parent data is null, then
checks that an imported key matching a `false` pattern schema remains visible
with `aria-invalid` feedback. The shared schema-normalization suite passes 9/9.
The other P4.3 acceptance contexts remain open.

### P3.9 Choice-card acceptance, 2026-10-31

I compared the current shared guard and three native adapters against the spec's
Choice cards section. The shared choice-card suite passes 12/12, the mounted
ChoiceCardsRenderer suite passes 20/20 in each family, the rich-content and
card-detail production files pass 24/24 together, and the narrow-theme and
show-radio/error files pass 18/18 together. The production checks exercise EN/BG
and native/Web Component hosts. Exact translated radio names, restricted inert
content, visible selected/focus/error states and branch detail behavior are
covered, so P3.9/R16 are accepted. The initial workspace-root mounted run could
not resolve the Svelte package export; rerunning each family in its package
configuration passed all 60 mounted cases.

### Flowbite searchable-choice popup focus, 2026-10-31

A production choice-select rerun exposed a Flowbite Web Component popup that
remained visible after selection while its trigger reported `aria-expanded=false`.
The old option panel intercepted a later narrow-viewport click on Office
location. Flowbite Popper also schedules an open on `focusin`; the adapter now
suppresses the synthetic `focusin` used solely to restore trigger focus after
selection or Escape. The mounted SearchableChoices suite passes 12/12, including
a delayed-reopen regression. After rebuilding the Flowbite base package, Web
Component and demo, the previously failing narrow case and the full canonical
choice-select production file pass 1/1 and 12/12. The array-choice production
file passed 18/18 in the adjacent acceptance run. The example matrix now records
these bounded interactions while leaving other example tabs open.

### P2.6 List with detail array-panel collapse, 2026-10-31

All three Svelte List with detail renderers now apply the shared array-panel
collapse state, including local/config defaults and an accessible toolbar toggle.
The detail subtree stays mounted while the panel is hidden, preserving its
selected item and editor state. The focused `array-panel-collapse` and
`list-detail-identity` production matrices pass **12/12 each** across all three
families, EN/BG and native/Web Component hosts. The shared dynamic-property
schema-normalization suite passes **9/9**, and focused Flowbite mounted cases
for boolean `true`/`false` schemas pass **5/5**; the control-data object guard is
independent of boolean-schema normalization. Other array-control presentations
and full example acceptance remain open.

### P2.6 AG Grid array-panel collapse, 2026-10-31

The Shadcn, Flowbite and Skeleton AG Grid array renderers now use the shared
array-panel state for the authored `collapsible` and `collapsed` options. The
toolbar toggle has translated accessible labels and keeps the grid subtree
mounted while its body is hidden. The focused `array-panel-collapse` production
matrix passes **12/12** across all three families, EN/BG and native/Web
Component hosts. It confirms the authored initial collapse, grid visibility,
DOM identity and active sort after close/reopen. Full array-controls example
acceptance remains open.

### P2.6 Expandable array reorder identity, 2026-10-31

The `array-controls-expandable-reorder` production matrix checks the authored
`showSortButtons` difference: Speakers exposes bounded Move down actions,
Announcements exposes none. Moving the first speaker changes stored order and
the open item follows its stable row identity; the edited name stays with its
record. The focused EN/BG × family × native/Web Component matrix passes
**12/12**. Other example acceptance interactions remain open.

### P2.6 Reviewers contains recovery, 2026-10-31

The `array-controls-reviewers-contains` production matrix passes **12/12**
across the three families, EN/BG and native/Web Component hosts. The initial
translated no-lead error appears at the array level. Checking Lead clears it;
unchecking Lead restores it. No row summary is shown for the array-owned
`contains` failure. The broader array-controls example remains open.

### P2.6 Array bounds action guards, 2026-10-31

The `array-controls-bounds` production matrix now dispatches clicks to
disabled Delete-at-minimum and Add-at-maximum buttons, bypassing ordinary
pointer prevention. Both handlers keep the same row count and stored rounds;
the full Add initialization check still expects two `{ "active": true }`
items. The same matrix dispatches clicks to the checklist's disabled Add and
Delete actions and verifies its stored items do not change, while its field
remains editable. This matches the authoritative `disableAdd`/`disableRemove`
definition and the React renderers' disabled-button behavior; the example
README's phrase "actions gone" is imprecise. The focused EN/BG × family ×
native/Web Component matrix passes **12/12**. Other example acceptance
interactions remain open.

### P4.9 Tuple position drafts in production, 2026-10-31

The focused `tuple-position-drafts` browser matrix passes **12/12** across
Flowbite, shadcn and Skeleton, EN/BG and native/Web Component hosts. From the
canonical empty Order line, entering quantity 4 stores the dense `["", 4]`.
Clearing quantity displays a field error and leaves the stored array unchanged;
entering 5 commits `["", 5]`. Clearing a previously entered product code
restores the empty string at index zero without shifting quantity. This adds
built-demo evidence to the existing mounted numeric-draft checks; remaining
tuple acceptance stays open. The expected dense fill and clear behavior agrees
with the React common tuple helper's position initialization and clear rules.

### P4.3 Additional-property minimum and restrict, 2026-10-31

The `additional-properties-minimum` production matrix passes **12/12** across
Flowbite, shadcn and Skeleton, EN/BG and native/Web Component hosts. In the
canonical Required quota object, the local `allowEmptyPropertyNames: false`
rejects whitespace despite a global `true`. At two keys and `minProperties: 2`,
Delete stays disabled and a programmatic click cannot remove a key. Setting
`restrict: false` enables Delete; afterward the object contains one key and a
Group-owned validation indicator reports the violated minimum. Both React
Antd and shadcn use the same minProperties/restrict gate. Remaining P4.3
acceptance stays open.

### P2.6 Object-control type-less detail fallback, 2026-10-31

Spec §18.6 accepts an inline `options.detail` only when it has a UI-schema
`type`. The shared resolver no longer converts an elements-only object into a
`VerticalLayout`; it proceeds to a matching registered form or the generated
fallback. The canonical Notes fixture now displays both generated fields,
and the focused EN/BG × family × native/Web Component production matrix passes
**12/12**, including editing For office while preserving For coordinator.
The shared resolver suite passes **16/16**; the three mounted Object-control
suites pass **2/2 per family**, and adjacent typed-detail Object-renderer suites
pass **16/16 per family**. Existing `detail-examples` and `object-array`
production matrices each pass **12/12** after updating the latter's outdated
legacy expectation. The dependency-ordered library, Web Component and demo
build passed. React Antd's current fixture test still normalizes the legacy
shape; this Svelte change follows the published spec and example README.
Broader Object-control acceptance remains open.

### P2.6 Object-control frames and nested Groups, 2026-10-31

The focused `object-control-frames` production matrix passes **12/12** across
Flowbite, shadcn and Skeleton, EN/BG and native/Web Component hosts. Titled and
explicitly untitled static, dynamic and mixed objects each have one Group
boundary. Static fields appear only where declared; dynamic sections are
embedded without a second border, including the dynamic-only case with no
empty static section. The authored Compliance detail preserves its outer and
inner Group names without a redundant object frame. Other Object-control
acceptance remains open.

### P4.3 Boolean additional-property schema audit, 2026-10-31

The Add path in each Svelte family obtains an object-shaped value schema from
`additionalPropertySchema`, including when the source schema is boolean `true`
or `false`. Its separate `control.data` guard copies only existing object data;
null, arrays and primitives use a new object. The accepted React-compatible
name/value distinction remains intact: a key matched by a `false` pattern
schema is a valid name, while Ajv rejects its value. A focused shared regression
now asserts both halves of that distinction; the name-validation suite passes
**32/32**, the schema-selection suite **9/9**, and the core Svelte check is clean.
This audit made no renderer implementation change. Broader P4.3 remains open.

### P4.3 Mixed additional-property object boundary, 2026-10-31

The canonical `spec-additional-properties` Inventory details tab passes a
focused **12/12** production matrix across Flowbite, shadcn and Skeleton,
English/Bulgarian and native/Web Component hosts. The object renders one Group
frame, two static inputs and two dynamic keys without duplicating the static
fields in Additional Properties. Editing Reference and Warehouse persists
through tab navigation, with no page errors. No implementation change was
required for this bounded behavior; the rest of P4.3 remains open.

### P4.3 Empty Add-name draft feedback in production, 2026-10-31

The canonical Inventory labels tab passes **12/12** focused production cases
across Flowbite, shadcn and Skeleton, EN/BG and native/Web Component hosts.
An initial or cleared exactly empty Add-name draft has no inline error, yet Add
remains disabled while an empty key already exists. A nonempty duplicate shows
feedback after blur. Removing the empty key enables Add without changing the
draft; Add recreates the key without a page error. React Antd and shadcn use the
same empty-draft feedback rule. No renderer implementation change was needed;
the other P4.3 profiles remain open.

### P4.3 Prototype-key Add and empty-name setting precedence, 2026-10-31

Two focused production matrices pass **12/12 each** across Flowbite, shadcn
and Skeleton, EN/BG and native/Web Component hosts. Adding `__proto__` through
Inventory labels creates an editable dynamic key; the Data editor serializes
that key, its changed value, and the original `destination` sibling. The live
Settings switch for global `allowEmptyPropertyNames` changes the Imported
annotations Add gate; Inventory labels' local `true` and Required quota's local
`false` keep precedence. React Antd's literal-key and local-option tests use
the same semantics. The pinned example README claims the global switch should
disable empty names for Inventory labels, but its UI schema explicitly sets
`options.allowEmptyPropertyNames: true`; normative local-over-global
precedence governs this acceptance. No renderer implementation change was
required. Other P4.3 scenarios remain open.

### P2.6 Canonical additional-properties example acceptance, 2026-10-31

The complete `tests/demos/additional-properties.spec.ts` production feature
file passes **124/124** across the three Svelte families, English/Bulgarian
and native/Web Component hosts. The canonical telemetry `sensor-x` key now has
an exercised successful Rename path: `sensor-deck-b` retains the numeric 9.1
value and clears its property-name error indicator. Supplier headers refuses
`x-other-id` and accepts `x-supplier-new`. The same file covers exact literal
keys, invalid name drafts, localized feedback, live settings precedence,
mixed static/dynamic boundaries, imported-invalid preservation, boolean value
schemas, prototype-looking Add, and rename/delete coordination. The separate
Required quota minimum/restrict matrix passes **12/12**, and the mounted
AdditionalPropertiesSpec suites pass **20/20 per family** at their recorded
checkpoint. This accepts the canonical P2.6 example row. It does not close
the broader P4.3 renderer contract or erase the pinned README's precedence
contradiction documented above.

### P2.6 Canonical array detail modes acceptance, 2026-10-31

The `detail-examples` production file passes **12/12** across Flowbite,
shadcn and Skeleton, EN/BG and native/Web Component hosts after adding
mode-specific assertions. The canonical example shows exactly one DEFAULT
table, four visible Note values (table, forced generation, registry fallback,
inline), two generated/fallback Name and Note fields, and two Registered name
fields (REGISTERED and GENERATED spelling). Inline Note remains editable.
The existing mounted canonical fixture cases pass **2/2 per family** and
preserve stored fields omitted by registered and inline layouts. React Antd
and shadcn reference tests use the same table/field counts and recognize only
GENERATE as forced generation. The canonical example row is accepted; broader
detail-resolution contracts remain tracked separately.

### P2.6 Canonical editor details acceptance, 2026-10-31

The `detail-examples` production file passes **12/12** across Flowbite,
shadcn and Skeleton, EN/BG and native/Web Component hosts. The canonical
`spec-editor-details` example renders the generated object's Note field despite
the matching registry, uses the object-specific Note for the mixed object,
opens a registered cell editor containing only Name, and preserves the mixed
Note through cell Apply/Cancel. Replacing the imported mixed value with a
string selects the authored string-specific editor. The mounted canonical
fixture cases pass **2/2 per family** and confirm that a registered cell edit
retains the stored Note omitted from its editor. This accepts the example row;
broader detail-resolution contracts remain tracked separately.

### P2.6 Canonical Group layout acceptance, 2026-10-31

The new `tests/demos/group-layout.spec.ts` production test passes **12/12**
across Flowbite, shadcn and Skeleton, EN/BG and native/Web Component hosts.
It verifies the published static Identity and Audit groups, Contact open by
default, nested Additional details closed independently of Contact, Insurance
initially closed without a data marker, localized markers on Contact and the
nested group, and the marker for `false` and `0` in the consolidated presence
tab. A keyboard Enter reopens Contact, and an edited nested phone value survives
tab navigation. The focused mounted live-locale test passes **1/1 per family**.
The React Antd example test uses the same static, disclosure and data-marker
expectations. The Group example row is accepted; dynamic collapsed binding and
broader P4.5 runtime acceptance remain open. Across tab re-entry, Flowbite
reinitializes the nested disclosure while shadcn and Skeleton retain it; the
published example specifies only independence while the parent is toggled.

### P2.6 Container validation example checkpoint, 2026-10-31

The `tests/demos/container-validation.spec.ts` production matrix passes
**12/12** across Flowbite, shadcn and Skeleton, EN/BG and native/Web Component
hosts. The collapsed Emergency contact Group shows an immediate error indicator
and a separate localized data marker. Personal details and Compliance category
headers aggregate their descendant errors before navigation. On Compliance,
Certifications' local `showValidationIndicator: false` suppresses its visible
array summary without suppressing the category indicator. Correcting the phone
removes the Group error indicator while retaining its data marker and edited
value through collapse/reopen. Skeleton keeps inactive stepper panels mounted,
so the array assertion targets the visible category. The canonical row remains
open for multi-error summary acceptance.

### P2.6 Composite-cell validation checkpoint, 2026-10-31

All three Svelte families now aggregate errors below each composite cell's
data path, matching the React path-error behavior. The canonical container
validation composite-cell matrix passes **12/12** across families, EN/BG and
native/Web Component hosts: five invalid first-row cells show localized child
errors, the valid second row shows none, and each detail dialog opens without
a renderer fallback. Focused mounted CompositeSummary suites pass **27/27** per
family. Renderer, Web Component and demo builds pass.

### P2.6 Container multi-error summary checkpoint, 2026-10-31

The canonical Certifications control explicitly sets
`showValidationIndicator: false`, although its README later instructs readers
to open that array indicator. The production acceptance test preserves the
suppressed canonical state and then enables the local option on the same UI
schema. The title indicator opens a localized five-error summary with
one-based row paths and expand/collapse; the schema-authored certificate-name
message takes priority over generic length text. The host and Web Component
now share AJV presentation metadata keys, so both show the same authored
message. The enabled-summary matrix passes **12/12** across all three families,
EN/BG and native/Web Component hosts; the focused translator unit test passes
**2/2**. The canonical container-validation row is accepted subject to the
documented source README contradiction.

### P2.6 Canonical validator-profile acceptance, 2026-10-31

The production validator-profile acceptance matrix passes **24/24** across
Flowbite, Shadcn and Skeleton, EN/BG, and native/Web Component hosts. It checks
live locale changes in generic and authored messages, preserved data and
transformed values, computed date offsets, and the script-permission gate.
Applying a new demo config now rebuilds its AJV instance in each family, so
subsequent validation and dynamic defaults use that config. The earlier
validator-profile initial-value matrix passes **12/12**.

### P2.6 Canonical password-control acceptance, 2026-10-31

The existing `tests/demos/password-control.spec.ts` production matrix passes
**12/12** against current builds across all three families, EN/BG, and native
and Web Component hosts. It verifies schema and UI-driven password selection,
masked OTP entry and leading-zero preservation, the unbounded backup fallback,
keyboard reveal and translated tooltips, separate clear behavior, masked table
cells, narrow Web Component geometry, and exact stored edits. The example
matrix now records these checked behaviors instead of a generic review status.

### P2.6 Canonical button-actions acceptance, 2026-10-31

The production `button-actions.spec.ts` matrix passes **24/24** across all
three families, EN/BG and native/Web Component hosts. It checks action data
and params, pending activation guard, discard/reset, string and function
scripts, precedence diagnostics, and live locale changes. A new permission
case removes `allowScriptEvaluation` in the demo Config editor: the string
script button is replaced by `script.evaluationDisabled`, while the
in-memory TypeScript function button still runs. The example matrix records
the bounded acceptance instead of a generic review status. Package-local
Button renderer suites also pass **15/15** Flowbite, **16/16** Shadcn and
**15/15** Skeleton, including empty-action dispatch and rejected-promise
pending recovery.

### P2.6 Canonical presentation-elements acceptance, 2026-10-31

The `presentation.spec.ts` production matrix passes **24/24** across three
families, EN/BG and native/Web Component hosts. It checks bound/static images,
visibility rules, decorative alt text, safe and inert links, spacer defaults
and zero, and vertical separator geometry. The new policy case removes
`allowImageDataUrls` through the demo Config editor and verifies that the
inline banner disappears with `image.urlRefused`. The existing walkthrough
opens a second demo, so its per-case timeout is 20 seconds; a failed 5-second
run was timeout-only and the rerun passed. Package-local presentation suites
pass **21/21** in each family, covering top-level source precedence and
localized image diagnostics.

### P2.6 Canonical split-layout acceptance, 2026-10-31

The production `split-layout.spec.ts` matrix passes **12/12** across all
families, EN/BG and native/Web Component hosts. It checks weighted initial
shares, keyboard/mouse/touch resizing in LTR and RTL, retained dragged shares
after a data edit, inert but visible fixed boundaries, conditional pane and
separator removal, 1:2:1 to 1:1 three-pane rebalancing, and vertical
orientation. Shared split-sizing tests pass **9/9** for span/invalid-weight
fallbacks, fixed sizing and constrained allocation. The production case uses a
30-second timeout to accommodate the full interaction sequence.

### P2.6 Canonical categorization example checkpoint, 2026-10-31

The `categorization.spec.ts` production matrix passes **48/48** across all
three families, EN/BG and native/Web Component hosts. The new accordion case
confirms that closing its initial Planning category remains closed as the
conditional Business category appears and disappears. Existing cases check
section indicators, keyboard headers and step navigation, hidden selected
Category fallback with focus, and pending draft preservation. This verifies
the canonical example; broader P4.5 runtime acceptance stays open. The source
README documents that allowing an all-closed accordion diverges from the
specification's exactly-one-open wording, so the matrix keeps that distinction
visible rather than claiming unconditional conformance.

### P2.6 Canonical destructive-confirmation example checkpoint, 2026-10-31

The new local-override and live-config production matrix passes **12/12**
across Flowbite, Shadcn and Skeleton, EN/BG, and native/Web Component hosts.
It verifies that declining a table deletion preserves the item, that the
`confirmation.delete: "never"` override on Scratch lines deletes without a
dialog, and that changing the demo's global confirmation default to `never`
also removes the Order line without a dialog. Exact stored input values are
checked so an empty-table placeholder row cannot mask a completed deletion.
The existing additional-property/AG Grid and Web Component host-replacement
cases previously passed **18/18**; this file now has **30** cases. Mixed/tree,
oneOf and composite-cell paths still need separate acceptance evidence.

### P2.6 Canonical string-controls example checkpoint, 2026-10-31

The `string-controls.spec.ts` production file passes **24/24** across all
three families, EN/BG and native/Web Component hosts. Its added case checks
the account number's 12- and 8-digit mask shapes, the eager gate separator
while the stored value is incomplete, localized gate and legacy validation
messages after blur, and the imported legacy reference displayed verbatim and
retained in the data pane. The earlier case checks composition, focus after
Clear, unmasked booking storage, masked phone storage, Unicode token entry,
and no browser errors. The rebuilt production matrix also checks a middle-caret
insertion in Booking reference, its retained caret position, the single-mask
placeholder fallback, the authored Contact phone hint, and no fallback hint
for alternative masks. Mounted tests in all three families verify that an
explicit empty placeholder suppresses the fallback, and changing to
alternative masks removes the hint. The three renderer packages, Web
Components and demo builds pass; remaining uncommon mask option combinations
and negative token cases stay open in the example matrix.

### P2.6 Canonical layout-sizing example checkpoint, 2026-10-31

The `control-layout-sizing.spec.ts` production file passes **24/24** across
Flowbite, Shadcn and Skeleton, EN/BG, and native/Web Component hosts. Its
existing case checks first-row 4/8/4 span widths against the 16-column gap
formula, 2/2/1 weights, a fixed 180px child with a bounded neighbour, and
removal of a hidden child from the row. The added case checks that hiding Team
keeps the two surviving span widths fixed while weighted survivors expand,
then verifies a 48px horizontal Spacer, four items wrapping at a 700px
viewport without shrinking below 14rem, and retention of an edited field
after switching tabs. The fixed/Auto demonstration groups, nested presentation,
invalid-option diagnostics and config fallback changes were still pending at
this checkpoint.

The fixed/Auto and nested-presentation extension brings the production file to
**36/36**. It checks a lone quarter-width child, quarter plus one and two Auto
children, two quarter-width children leaving unused space, ordered 12/8/Auto
wrapping, three equal Auto widths, and nested Label/Group spans with localized
text across the same family, locale and host matrix. Shared layout-sizing
diagnostic tests pass **7/7**; mounted sizing/default suites pass **19/19** in
Flowbite and Skeleton and **21/21** in Shadcn. They cover invalid option
diagnostics, legacy hints, local/global defaults and explicit zero. The example
matrix now records this canonical fixture as accepted; broader layout work in
the TODO remains separately tracked.

### P2.6 Canonical cron-control example checkpoint, 2026-10-31

The `cron-control.spec.ts` production file passes **24/24** across Flowbite,
Shadcn and Skeleton, EN/BG, and native/Web Component hosts. The earlier case
checks picker selection, compact dimensions, minute-list scrolling, staged
Cancel/Apply, clear-button visibility and keyboard use. The added case checks
that the UI-schema-selected Archive sweep opens with an empty expression,
choosing Year and applying without editing leaves its property absent, the
authored placeholder is not treated as a value, and both imported five- and
seven-field dialect expressions retain their data and mark their controls
invalid. The extended validator suite passes **5/5**, including a new direct
fixture check that its only two Ajv errors are `format` failures at those exact
paths. Missing-renderer/validator and `clearable`/`showActions` fallback cases
remain open in the example matrix.

### P2.6 Canonical code-editor example checkpoint, 2026-10-31

The `code-editor.spec.ts` production file passes **24/24** across Flowbite,
Shadcn and Skeleton, EN/BG, and native/Web Component hosts. Its earlier case
checks opt-in JSON parse publication, pending and malformed-draft feedback,
committed schema-invalid JSON, dark theme, maximize/restore and Escape. The
added case checks that the JavaScript editor grows as eight script lines are
entered, the HTML editor stays at fixed height, edits to each survive a tab
round trip, and stored script/markup strings remain independent of the
structured deployment object. Initialization-action availability and
additional language-service/schema diagnostics remain open in the matrix.
