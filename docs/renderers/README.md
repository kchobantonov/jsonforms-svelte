# Renderer family capabilities

This is the current capability declaration for the Flowbite, shadcn and Skeleton Svelte renderer families. The [source inventory](../renderer-source-inventory.md) lists every registered entry and cell; the [parity audit](../renderer-parity-audit.md) and [verification baseline](../verification-baseline.md) distinguish implemented behavior from executed acceptance. A registered entry alone is not a claim of full spec conformance.

## Element types and variants

| Capability                                                                                                              | Flowbite                           | shadcn                             | Skeleton                           |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------- | ---------------------------------- |
| Base `Control` for string, integer, number, boolean, enum and finite choices                                            | Registered                         | Registered                         | Registered                         |
| Base `Control` variants: multiline, mask, password/OTP, radio, slider, toggle, date, time and date-time                 | Registered                         | Registered                         | Registered                         |
| Base complex controls: object, array, tuple, oneOf, anyOf, allOf, mixed, recursive tree, choice cards and array choices | Registered; see partial audit rows | Registered; see partial audit rows | Registered; see partial audit rows |
| Base layouts: horizontal/vertical, group, categorization tabs/accordion/stepper, expandable array and list with detail  | Registered; see partial audit rows | Registered; see partial audit rows | Registered; see partial audit rows |
| Base presentation: label, image, separator and spacer                                                                   | Registered                         | Registered                         | Registered                         |
| Base cells: text, number/integer, boolean, enum/oneOf enum, temporal, formatted number and composite                    | Registered                         | Registered                         | Registered                         |
| Optional extended controls: button, color, cron, duration, file, null and Monaco code/JSON                              | Extended package                   | Extended package                   | Extended package                   |
| Optional extended presentation/layout: link, markup label, slot, template, template layout and split layout             | Extended package                   | Extended package                   | Extended package                   |
| Optional AG Grid array/table                                                                                            | Extended package, lazy             | Extended package, lazy             | Extended package, lazy             |

The three families expose the same base entry filenames, but use different native UI components. The [audit](../renderer-parity-audit.md) records bounded support, partial behavior and remaining verification per role. The optional extended packages must be installed and appended to the renderer and cell registries to enable their entries. A missing applicable renderer or cell displays a localized status and emits `renderer.unsupported` or `cell.unsupported` with path and scope; it preserves form data.

### Current family acceptance status

| Capability group                                                           | Flowbite  | shadcn    | Skeleton  | Boundary                                                                                                                  |
| -------------------------------------------------------------------------- | --------- | --------- | --------- | ------------------------------------------------------------------------------------------------------------------------- |
| Text, mask, password/OTP, numeric, boolean and core finite-choice controls | Supported | Supported | Supported | Bounded P3.2–P3.8 source, mounted and production acceptance; cross-cutting accessibility review is accepted in P3.1/P8.2. |
| Date, time and date-time controls                                          | Supported | Supported | Supported | P3.10 accepts the declared draft/view/format/bounds profiles across families and hosts.                                   |
| Object, array, tuple, list/detail, categories and composition              | Supported | Supported | Supported | P4.3/P4.5/P4.9/P4.11 and P5.1–P5.8 accept the declared composition and collection profiles.                               |
| Optional color, duration, null, file and cron profiles                     | Supported | Supported | Supported | Requires the extended registry; bounded P6.1–P6.4 native and production acceptance.                                       |
| Image, link, separator, spacer, Button and SplitLayout                     | Supported | Supported | Supported | Image/presentation P6.8, Button P6.9 and split P6.10 acceptance; extended entries require registration.                   |
| Optional Monaco editor and AG Grid                                         | Supported | Supported | Supported | P6.5/P6.6 accept the declared option, lifecycle, grid and visual profiles; extended registration is required.             |
| Optional Label interpolation, markup, templates and slots                  | Supported | Supported | Supported | P6.7/P6.11 accept the declared text and template profiles; JSX string templates are supported with lazy Sucrase loading.  |
| JSX `TemplateLayout` language                                              | Supported | Supported | Supported | Lazy JSX compiler and Svelte DOM runtime; host script permission is required.                                             |
| Declared keyboard, visual and host profiles                                | Supported | Supported | Supported | P7.6/P7.7/P8.2 acceptance and the final P8.6 package, production and packed-consumer gates cover the declared profiles.   |

“Supported” here refers to the bounded feature workstream named in the boundary column. It does not override a partial audit row or claim every possible schema, option or host combination. [TODO](../TODO.md) records acceptance and [verification baseline](../verification-baseline.md) records executed counts.

## Selection, formats and options

The [entry files](../renderer-source-inventory.md) are the authoritative tester predicates and ranks. Base generic layout and scalar entries normally use rank 1; specialized schema/format and variant testers rank above them. For example, array choices use rank 6 and the optional split layout uses rank 5. JSON Forms selects the highest applicable tester score; the host's registry order resolves equal scores. Custom hosts may prepend or replace entries and supply cells. A source file's presence does not guarantee it wins a particular schema/UI-schema combination.

Portable UI-schema options and their precedence are documented in the [migration guide](../migration-and-release-notes.md), [layout sizing guide](../layout-sizing-migration.md) and the spec example READMEs in `jsonforms-svelte-demo-common`. Selection uses schema type/format and explicit `options.variant` or `options.format` where the corresponding tester supports them. Canonical variants include tabs/accordion/stepper categorization, chips/multi-select array choices, expandable/list/table arrays, split layout and optional `ag-grid`. Extended schema formats include `color`, `cron`, duration and file profiles; code/JSON editor selection requires its registered tester. Do not assume an arbitrary schema `format` or variant has an editor: inspect the entry tester and use the unsupported fallback when no tester applies.

| Finite-choice search default | Single choice | Multi-select |
| ---------------------------- | ------------- | ------------ |
| Flowbite                     | Off           | On           |
| shadcn                       | Off           | Off          |
| Skeleton                     | On            | On           |

`options.autocomplete: true` requests search and `false` disables it across all families. Portable options live on the UI element and generally under `config.jsonformsExtended`; the Monaco and AG Grid option bags and shared width/height defaults use flat `config.monaco`, `config.agGridOptions`, `config.width` and `config.height`. Library-specific escape hatches use `options.flowbite`, `options.shadcn`, or `options.skeleton` and the corresponding global vendor bag. Vendor bags are merged by component key; portable option precedence and deliberately removed paths are described in the [migration guide](../migration-and-release-notes.md). The [demo configuration](../demo-configuration.md) shows host settings.

The shared Svelte implementation uses `config.jsonformsSvelte.layoutDefaults.minItemWidth` as an optional vendor-only global default. Local `options.minItemWidth` takes precedence. The portable spec defines `minItemWidth` locally.

## Validator and runtime profile

The default JSON Forms validator is Ajv Draft-07. A host can supply its own Ajv instance and register external schemas before mounting; the renderer resolves document-local pointers, anchors, nested absolute `$id` resources and registered absolute external references. It does not fetch reference URLs. `$dynamicRef` rendering is unsupported and produces a distinct diagnostic. The [validator profile acceptance](../verification-baseline.md) and [base package reference contract](../../packages/jsonforms-svelte/README.md#schema-references) describe the tested boundary. The spec's schemas and examples are Draft-07; a host-supplied different dialect is not a blanket claim that every renderer supports its new visual semantics.

The optional Monaco and AG Grid adapters require their respective browser runtimes; Monaco workers and AG Grid style assets are included in the packed-consumer checks. Shared templates support the implemented Ractive and compiled native Svelte profiles. JSX templates load Sucrase on demand and use the same script-permission gate. Native and Web Component hosts share registries; each Web Component uses a ShadowRoot and must receive its own renderer/cell setup and callback props. The [Web Component acceptance record](../verification-baseline.md) identifies tested host transitions and remaining portal/worker cases.

## Native component decisions and catalog translation

The native adapter decisions are recorded by capability: [text masks](../mask-native-review.md), [numeric controls](../numeric-native-review.md), [booleans](../boolean-native-review.md), [password/OTP](../password-native-review.md), [finite choice](../choice-select-native-review.md), [temporal controls](../temporal-native-review.md), [color](../color-native-review.md), [duration](../duration-native-review.md), [cron](../cron-native-review.md), [file](../file-native-review.md), [Monaco](../monaco-native-review.md), [splitters](../splitter-native-review.md), [choice cards](../choice-cards-native-review.md), [Button](../button-native-review.md) and [detail dialogs](../detail-dialog-native-review.md). These reviews give the reason for an adapter-specific presentation or interaction where native component APIs differ. The [shadcn upstream review](../shadcn-upstream-review.md) and [porting checklist](../renderer-porting-checklist.md) cover source component decisions and the checks required when adding a family.

The spec examples keep their canonical JSON assets and supply EN/BG labels and host adapters separately. The [example matrix](../spec-example-matrix.md) lists each imported fixture, translation asset and declared host requirement. A host should build a translator from the selected locale at render time, retain a fallback locale and preserve literal empty translations. Translated labels do not become stored enum values or stable `name` identities. Missing catalog keys and parameters have coded author diagnostics; see the [diagnostic inventory](../author-diagnostic-inventory.md).

## Reproduce the current checks

From the workspace root, run `pnpm run audit:renderer-inventory` and `pnpm run audit:spec-examples` for registration and fixture provenance, then `pnpm run check-format`. Use a family’s `pnpm --filter './packages/jsonforms-svelte-<family>' run check` and a focused `pnpm --filter './packages/jsonforms-svelte-<family>' exec vp test --run tests/<area>/<file>.svelte.spec.ts` for a changed adapter. `pnpm run build:demo` builds the dependency-ordered packages and demos before a root `pnpm exec vp test --run tests/demos/<scenario>.spec.ts` production matrix. `node scripts/pack-release.mjs` and `pnpm exec vp test --run tests/packed-webcomponents.spec.ts` validate fresh package artifacts and a packed Web Component host. The [tooling guide](../linting-and-formatting.md) lists the broader commands; P8.6 in [TODO](../TODO.md) owns the final full suite and failure review.

## Known limits and verification status

- The declared spec and React-reference profiles have bounded acceptance in the [work ledger](../TODO.md#remaining-work-ledger). This catalog does not certify combinations outside those profiles.
- `$dynamicRef` rendering, remote schema fetching and arbitrary AG Grid/editor option combinations remain outside the supported contract; the corresponding author diagnostics and documented fallbacks apply.
- A native runtime can supply equivalent editor/grid behavior without claiming compatibility with Monaco or AG Grid. These named integrations are browser-specific optional packages.
- For current per-family test and source counts, use `pnpm run audit:renderer-inventory`; for imported examples use `pnpm run audit:spec-examples`. The final all-package/build/packed release evidence is recorded under P8.6 in the [TODO](../TODO.md).
