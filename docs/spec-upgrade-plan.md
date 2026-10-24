# Extended specification upgrade plan

Status: implementation authorized on 2026-10-03. Progress reconciled on 2026-10-23: 31 of 85 top-level requirements are accepted, with 54 open requirements containing mixed implementation and acceptance work. See the [current progress and execution order](TODO.md#progress-checkpoint--2026-10-23). This plan retains the original planning observations; they are not current failure reports.

## Outcome and scope

Bring the Svelte project to the portable extended specification, with React Ant Design and React shadcn as behavioral references. Give Svelte shadcn particular attention to component composition, spacing, validation placement, and interaction. Preserve each Svelte library's native appearance.

The project includes Flowbite, Skeleton, and shadcn. This plan includes all three base and extended renderer sets, shared Svelte hosts, demos, and Web Components. Shadcn is the first implementation slice; shared changes must keep the other families working, and final parity requires their own tests. It does not propose adding an Ant Design Svelte renderer. React families other than Antd and shadcn are outside the comparison.

Deliverables for this review:

- [Renderer audit](renderer-parity-audit.md): findings, renderer-by-renderer work, reference behavior, and UI decisions.
- [Source inventory](renderer-source-inventory.md): every current Svelte renderer/cell entry and its implementation.
- [Spec example matrix](spec-example-matrix.md): all 47 catalog entries and acceptance scenarios.
- [TODO](TODO.md): ordered implementation tasks and completion gates.

These documents are a source audit and upgrade plan, not a full conformance certificate. No renderer, dependency, demo, or existing test was changed during the planning pass. Subsequent implementation results are tracked in [verification-baseline.md](verification-baseline.md).

## 1. Baseline and authority

| Repository       | Inspected revision                         |
| ---------------- | ------------------------------------------ |
| Svelte           | `44ece2e137d8ed492ba5460cddb45e9ea38b4079` |
| Extended spec    | `9d8a6915bd19972b7ce9fe3b584926fc23e66fb7` |
| React references | `150fd688ae09f0f3b28e989649f3daf1d9f6d91d` |

Authority order: portable [spec](../../jsonforms-extended-spec/docs/spec.md), [renderer/demo acceptance](../../jsonforms-extended-spec/docs/renderer-and-demo.md), [selection guide](../../jsonforms-extended-spec/docs/renderer-selection.md), then reference implementation and tests. The [implementation guide](../../jsonforms-extended-spec/docs/implementation-guide.md), [pitfalls](../../jsonforms-extended-spec/docs/implementation-pitfalls.md), and [conditional-fields guide](../../jsonforms-extended-spec/docs/conditional-fields.md) explain easily missed requirements. Sibling links assume the checkout layout supplied for this review; published docs should also link to the pinned upstream revision.

Read normative amendments even when they occur after the Appendix heading. Resolve ambiguity against schemas, examples, and guidance; do not assume every late section is a future proposal. Conversely, `$dynamic` overlays, remote-choice contracts, and graphical-editor designs remain deferred where the spec explicitly says so.

The spec snapshot contains 154 authoring cases, 21 behavior vectors, an expected-invalid document, and 145 config-consumption entries. The config inventory describes React consumers at its own recorded commit; it is a checklist, not proof of Svelte support or an exhaustive list of newer local options. Validate current schema properties and amendments as well.

### October 3 reference refresh

The latest spec and React commits were compared with the original planning revisions
(`63323d8` and `601abae`). See [reference changes](reference-update-2026-10-03.md)
for added requirements and their TODO owners. The example catalog still has 47 entries;
choice-controls now includes a trusted UI-schema registry and a Card detail modes tab.

### Historical evidence

- Svelte `44ece2e` deliberately deleted the old spec, implementation-gap notes, renderer docs, and shadcn audit. Do not restore the obsolete embedded specification. `git show 72466a8:docs/jsonforms-svelte-implementation-gaps.md` remains useful historical evidence, with each finding rechecked against current code.
- Svelte `72466a8` added substantial existing renderer/test work. Retain scalar-composition helpers, literal-key handling, tuple support, temporal parsing, dialog helpers, and packaging checks rather than replacing them indiscriminately.
- Svelte `bfcaa62` established packed-consumer validation. Preserve it as a release gate.
- React `5c4257a`, `9eb66d2`, `829c8a0`, `e6b03a4`, `b8f7408`, and `89f8fa6` cover choice cards, mixed editors, presentation fixes, spec alignment, detail resolution, and conditional fields. Inspect their focused diffs/changesets while porting each feature.
- In `829c8a0`, changesets explain 16px layout gaps, aligned header indicators, required table headers, measured dialog dragging, filename-only grid search, and deduplicated branch feedback. These are behavioral reasons for the UI, not arbitrary styling to copy.
- React's current [TODO](../../jsonforms-react-renderers/docs/TODO.md) still records gaps: default inline object errors, accessible required state, pre-touch summaries, template diagnostics/cycles, file error publication, and reference coverage. Svelte must satisfy the spec even when a reference is incomplete.

### Checks executed during planning

| Command                                                                               | Result                                                                                                                                  |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @chobantonov/jsonforms-svelte-shadcn exec vitest run --project server` | 60 passed, 1 failed, across 13 files. `complexEntries.spec.ts:139` expects 7 registry entries; current registry has 8, including tuple. |
| `pnpm --filter @chobantonov/jsonforms-svelte-shadcn exec eslint .`                    | 1 error: `AdditionalItems.svelte:26`, `svelte/require-each-key`.                                                                        |

No fresh full-suite, browser, visual, accessibility, or React test run is claimed. Full baseline execution belongs to phase 0; fix failures by preserving behavioral assertions, not suppressing them.

## 2. Architecture and migration

Apply the [renderer porting checklist](renderer-porting-checklist.md) to each family, including visual states, toolbar grouping and batched validation.

### Shared behavior

Keep framework behavior in `jsonforms-svelte` and optional integrations in `jsonforms-svelte-extended`. Share pure value identity, path handling, option resolution, error routing, confirmation, detail resolution, conditional projection, collection indexing, and translation helpers. UI adapters own native components and Svelte lifecycle. Share demo state through `jsonforms-svelte-demo-common`.

Use Svelte 5 runes, context getters, stable component references, and explicit cleanup. React hooks, context providers, Enzyme adapters, and React DOM shims are not portable implementation APIs. Do not introduce a parallel generic UI component library. One renderer and one reusable UI component per file; registries should contain wiring only.

Keep base, extended, AG Grid, Monaco, demos, and Web Component outputs independently consumable. Adding spec examples must not make runtime renderer consumers download demo fixtures. Use a pinned published spec package or reproducible packed artifact; do not ship absolute sibling paths or undocumented local links. Use its `/examples`, `/schemas/*`, and `/typescript` exports where appropriate, respecting actual export/peer versions.

### Options and compatibility

Create a reviewed consumption table with one row per published config property and per local renderer option: origin, type, default, precedence, consumer, selection effect, test, and capability state. Include every entry in `conformance/config-consumption.json`; diff the table against current schemas so newly added properties cannot disappear silently.

- Keep established core names at the top level; portable additions use `config.jsonformsExtended`; local `options` remain flat.
- Resolve explicit local values before global defaults, preserving false, zero, empty text, and intentional empty arrays. Test replacement versus merging for each compound bag. Current `lodash/merge` can merge arrays by index.
- Tester inputs and renderer display options are distinct. Do not let a global display default select an incompatible renderer.
- Define framework-specific vendor namespaces without pretending React component props work in Svelte. Preserve unknown namespaces. Plan compatibility for current `options.shadcn` and other family bags before renaming public contracts.
- Migrate `initCollapsed` to the current `collapsed` contract with documented compatibility/deprecation behavior. Array item initialization, outer disclosure, and tree expansion are different states.
- When moving existing flat keys, prefer namespaced values, support documented legacy fallback, emit a diagnostic, migrate examples, and only remove fallback in an announced release.

### Host correctness

Preserve omitted schema/data, explicit `{}`, `true`/`false` schemas, null, and scalar/array roots. Audit inference against the installed core before adopting/removing the React PR #2478 workaround. Never substitute null for absent data or an inferred schema for an authored schema.

Separate document errors, local active-branch feedback, host additional errors, and renderer draft errors. Add an owner-based additional-error store with atomic replace/clear, path movement handling, cleanup, stale async result rejection, and combined validity. Additional errors must not overwrite other owners. Define submit/Apply gating for invalid drafts and pending analysis.

Rules and conditional discovery must use a nonmutating validator context. AJV defaults/transforms used for form validation must not mutate data while checking visibility, enablement, branch activity, or renderer eligibility. Keep root reference ownership and bound traversal; declare external-reference and nested `$id` limitations explicitly.

## 3. Renderer and UI work

The [audit](renderer-parity-audit.md) defines the feature rows. Every row needs:

1. Schema/UI selection, precedence, generated UI, `$ref`, and incompatible selection cases through public registries.
2. Initial mount, valid edits, missing/null/invalid input, external replacements, and clearing semantics.
3. Read-only/disabled/restrict/rules, local/global overrides, and mutation guards inside delegated editors.
4. English/Bulgarian labels, actions, placeholders, feedback, and locale changes without data loss.
5. Keyboard/focus behavior, required and invalid accessibility, narrow layout, themes, and Web Component portals.
6. A demo example and executed regression evidence, or an explicit capability limitation.

Missing presentations include OTP, chips, multi-select, choice cards, categorization accordion, Link, rich/interpolated labels, cron, formatted numbers, and recursive node trees. Existing mixed/composition, array, object, cell, file, and editor implementations need substantial semantic work; absence of a new filename alone does not establish absence of a role (scalar composition already delegates through shared helpers).

### Native UI decision process

For every renderer, record the native Svelte component, upstream version/revision, composition, wrapper responsibilities, and any exception. Prefer a dedicated official component when the installed UI library provides one; otherwise use its documented primitives and compositions before custom HTML. Document a concrete contract or layout limitation before making an exception. Review the React shadcn counterpart beside Svelte using the same fixture, theme, width, locale, and validation state. Match information ownership, affordances, and behavior; let Svelte APIs provide the implementation.

Preserve the existing shadcn source synchronization workflow. Audit both demo and Web Component component trees, peer requirements, aliases, CSS, and exports. Stage upstream changes at a full SHA and review them before adoption. Historical Nova audit revision `7f5289a709281fb6ac893b8c5ca8a543404dcf0d` is not a current-source certification. CLI version and copied component revision are separate.

File controls are an explicit exception to choosing a large native upload widget. Follow the compact React Antd/shadcn filename/pill, choose/replace, clear/remove and feedback presentation in both forms and cells, using native Svelte primitives where they fit. A hidden browser file input provides platform selection. Retain useful Svelte progress/cancel interaction. Both single and multiple files need the same data encodings, limits, cancellation, stale-read protection and error ownership. Review the same fixtures at narrow cell widths before accepting a visual departure.

## 4. English and Bulgarian

Maintain shared renderer-owned `en` and `bg` catalogs, family-specific text only when genuinely different, plus demo-shell catalogs and authored example catalogs. Preserve existing German/browser-locale choices required by the demo guide; English and Bulgarian are mandatory acceptance locales for this upgrade.

- Replace literal clear/reveal/cancel/loading/group/tree/pagination/dialog/validation strings, including ARIA names and tooltips.
- Respect exact locale, language fallback, English/default fallback, missing-key undefined semantics, and intentional empty translations. Check fallback per message, not merely whether a locale object exists.
- Compile interpolation once but evaluate with current parameters each time. Current demo memoization caches the rendered message by template, risking stale parameters. Replace executable lodash interpolation for portable expressions with the approved bounded expression implementation.
- Use translated choice labels without changing stored values or option identity. Support flat catalog keys as well as documented existing nested catalogs.
- Preserve field `error.custom`, field keyword, global keyword, custom `translateError`, schema `errorMessage`, and localized AJV fallback order. Translate a copy; do not mutate host error state.
- Refresh existing errors, renderer additional errors, summaries, calendar text, and search/sort summaries on locale change without requiring a data edit.
- Test Bulgarian plural/count wording, long labels, locale-aware numbers/dates, and keyboard access. RTL is an independent layout test; Bulgarian itself is LTR.
- Compare catalog key sets automatically. Do not present English fallback as completed Bulgarian coverage. Newer spec examples without translation assets need maintained host supplements or upstream contributions, never silently modified validation data.

## 5. Demo upgrade

Load the spec's generated catalog, not a copied per-example list. Use stable `spec-<id>` identifiers and visible `Spec: ` labels; distinguish official and project examples, preserving old links where possible. At the pinned snapshot there are 47 entries, despite the stale README count of 32.

Retain omitted schema/data and metadata including host requirements. Register trusted `uischemas.mjs` testers separately from editable JSON. Provide Svelte-native button/template hooks and server/additional-error demonstrations. Never deserialize JavaScript from the UI Schemas editor or lose testers through JSON serialization. Unsupported host requirements must be visible with an actionable diagnostic.

For every catalog entry, verify registry selection, initial data preservation, a meaningful edit, known invalid data, English/Bulgarian switching, and native/Web Component modes. Kitchen sink supplements focused examples; it cannot replace them. Provide source navigation to the corresponding spec example.

Audit all three shells against the demo guide:

- Fixed header; independently scrolling/searchable sidebar; brand/home navigation; active example; empty search message; percent-encoded deep links.
- Header order: form-only, native/Web Component, repository, theme/settings; appropriate Web Component logo, pressed state, reduced-motion handling.
- Native resizable 75/25 form/data split; keyboard handle; stacked narrow layout; RTL; no page-level overflow.
- Demo/Data, Schema, UI Schema, UI Schemas, Internationalization, Config tabs and validation count. Each editor has independent Reload/Apply and parse feedback. Reload stages original example content; Apply commits only its model.
- Preserve current data across settings, locale, form-only, and host-mode changes. Keep hidden schema registrations from leaking into schema inference and other Monaco models.
- Settings drawer with focus management and all required controls: validation, locale, direction, layout, restrict, read-only, required marker, descriptions, array collapse/avatar/summary, pre-touch keyword filter, additional-property defaults, and native provider/theme settings.
- Versioned per-family storage adapter for mode/locale/layout/provider preferences, with corrupt/unavailable storage fallback. Session toggles remain session state.
- Query contract for `read-only`, `form-only`, `active-tab`, `use-webcomponent`, `drawer`; hash query wins over normal query; only literal `true` enables; preserve unrelated parameters and back/forward state. Reconcile current route-based URLs with the required deep-link contract using compatibility redirects rather than breaking existing links.
- JSON editor schemas come from the spec artifacts. Validate authored UI/config separately from business data. Graphical authoring remains a separate project, consistent with historical Svelte editor extraction.

## 6. Testing strategy adapted to Svelte

Keep Vitest Node tests for pure helpers and Vitest Browser with Playwright/`vitest-browser-svelte` for components. Existing shadcn Vite config already has client/server projects, assertion requirements, and serialized browser files. Use Svelte rerender/state updates, `tick`/observable waits, and cleanup rather than React `act`, Enzyme, or copied jsdom shims.

### Test layers

| Layer                 | Acceptance                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authoring contracts   | Execute published positive/negative authoring fixtures and schema/type checks; preserve unknown vendor data.                                                                    |
| Behavior adapter      | Give each published vector a Svelte adapter/result: passed, failed, unsupported, or not verified. A JSON file loading successfully is not a passed renderer test.               |
| Pure semantics        | Typed equality, literal paths, option precedence, scope/detail resolution, confirmation decisions, validators, translations, summaries, collection identity.                    |
| Registry integration  | Real base+extended renderer/cell registries; specialized winners and incompatible cases; no renderer-count assertions as parity evidence.                                       |
| Browser interactions  | Native widgets, keyboard, focus/caret, portal lifecycle, data edits, external updates, validation transitions, disabled mutations, dialogs, file selection, Monaco and AG Grid. |
| Demo end-to-end       | Catalog discovery, trusted hooks, editor isolation, settings/URL/persistence, all examples in both hosts, locale switching, narrow view.                                        |
| Visual/accessibility  | Reviewed screenshots and accessible names/states; light/dark, EN/BG, narrow/wide, valid/invalid, LTR/RTL, readonly; measure clipping and focus.                                 |
| Packaging/performance | Packed consumers, Shadow DOM styles/portals/workers, reconnect/unmount, optional bundle loading, compilation reuse, large/recursive forms.                                      |

Port scenarios, not implementation assertions. Start with React `registryContract`, `primitiveArrayDefault`, `enumValueTypes`, `compositeEnumSelection`, `arrayDetailModes`, `editorDetailModes`, `conditionalFields`, `recursiveTreePresentation`, `mixedEmptyString`, `mixedStructuredLayout`, `metaschemaArrays`, `containerValidationRender`, `preTouchErrors`, `tableRequiredHeaders`, `collectionExamples`, `passwordOtp`, and shared template/security/additional-error tests. See the audit for per-feature mapping.

Tests must assert exact JSON types/paths, untouched sibling data, visible feedback, and combined validity. Include intentional invalid fixtures. Use a stable adapter interface shared by family suites; each family still mounts its actual components. Use real browser interactions instead of testing only synthetic callbacks. Avoid fixed sleeps, broad snapshots, copied CSS class assertions, and success defined only as “no exception.” Keep runtime failures, unhandled errors, skips, and timeouts visible in reports.

Performance tests should count compilation/model creation and mounted inactive work, measure representative typing and large-list behavior, and establish baseline budgets before setting thresholds. Recursive tests cover finite creation and editing, not only mount termination.

## 7. Formatting, linting, and CI

Continue the official `eslint-plugin-svelte` flat-config approach with `typescript-eslint`, Svelte recommended rules, and `eslint-config-prettier`. The [official Svelte ESLint add-on](https://svelte.dev/docs/cli/eslint) installs this plugin/configuration; the [plugin documentation](https://sveltejs.github.io/eslint-plugin-svelte/) identifies it as the official plugin. Do not copy React ESLint 8/Hooks rules into this Svelte 5/ESLint 9 workspace.

Use Prettier with the Svelte plugin and Tailwind plugin where applicable, retaining existing two-space, single-quote, 100-column style unless a separate formatting decision is made. The [Svelte Prettier add-on](https://svelte.dev/docs/cli/prettier) documents ESLint integration. Shared extended files currently differ in quote/wrapping style and lack a local ESLint config despite advertising a lint script; establish complete coverage before mass reformatting.

Provide root commands for semantic lint, format check, format write, type-check, unit/component tests, demo E2E, and conformance. Share config through a factory where package-specific `svelte.config.js`, parser project, aliases, and ignores require it. Cover `.svelte`, `.svelte.ts`, `.ts`, `.js`, tests, apps, and scripts. Scope justified permissive JSON-boundary types; do not globally disable accessibility or reactivity rules to clear a baseline.

The [official Vitest add-on](https://svelte.dev/docs/cli/vitest) supports client/server-aware unit and component setup. Keep the existing architecture and validate any toolchain upgrades against peers, lockfile, Node 22, SvelteKit, Vite, packaging, and workers. Do not upgrade majors merely because a newer package exists.

CI currently builds, packs, runs package tests, and checks Pages navigation; it does not explicitly run lint/format, and root `test` excludes demo app tests. Add explicit gates for both. Generated UI copies need upstream drift checks with pinned source; generated output/dependencies/coverage should be excluded from ordinary formatting/linting without hiding handwritten adapters.

## 8. Original dependency outline and exit gates

The table groups architectural dependencies; it is not a strict phase-by-phase
schedule. The [TODO execution order](TODO.md#execution-order-and-stop-conditions)
supersedes it for current work. Use specific prerequisites, and preserve accepted
behavior instead of restarting entire workstreams.

| Phase | Scope                                                                                         | Depends on        | Exit gate                                                                                        |
| ----- | --------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| 0     | Baseline, coverage inventories, toolchain/CI, source provenance                               | Plan review       | Reproducible checks; failures classified; no false support claims.                               |
| 1     | Shared options, paths, i18n, errors, policy, validator/host lifecycle                         | 0                 | EN/BG semantics and owner/error isolation tested.                                                |
| 2     | Spec catalog adapter, example metadata, trusted host hooks, demo test harness                 | 1                 | Every catalog ID loads or reports its exact unsupported capability; no omitted-value corruption. |
| 3     | Native field anatomy, scalar/choice/temporal controls, missing simple presentations and cells | 1–2               | Public-registry interactions and accessible/localized feedback.                                  |
| 4     | Object/dynamic keys, layouts, details, arrays/tuples/collections/dialogs                      | 1–3               | Literal-path, constraint, pagination/index, and detail-mode cases pass.                          |
| 5     | Compositions, mixed tree/nested/code, recursive trees, conditional fields                     | 1–4               | Original validation retained; bounded recursion; branch/draft/focus tests.                       |
| 6     | File, cron, color/duration, Monaco, AG Grid, templates/markup/actions                         | 1–5 as applicable | Native UI review plus policy, async lifecycle, host validity, and cell parity.                   |
| 7     | Complete all three demos and other-family parity; packed Web Components                       | 2–6               | Same examples/data semantics across hosts/families; visual and accessibility review.             |
| 8     | Conformance audit, docs, migration, changesets, release checks                                | All               | Every required capability has evidence or an explicitly reviewed limitation; no silent skips.    |

Implement small vertical slices: shared behavior, shadcn adapter, other-family adaptations, EN/BG text, regression, example, and documentation together. Add no untranslated production surface as an intermediate “completed” task. Some extended features can proceed earlier once their dependencies are stable.

### Completion definition

Each TODO item closes only with relevant test commands/results, source/spec links, and evidence for both locales and applicable hosts. Required unsupported behavior remains open; documenting a limitation alone does not establish full parity. A deliberate library departure records its reason, native alternative, screenshots, behavior tests, and review outcome. Publish a capability table using supported/partial/unsupported/not verified, plus migration notes for any changed authoring or public API.

Release validation includes full workspace checks, all demos, actual packed consumers, optional-registry loading, and clean diffs. Use changesets for runtime/package behavior; planning documents do not need a release changeset. Do not update sibling repositories or publish/deploy as part of this planning task.
