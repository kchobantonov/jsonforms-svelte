# October 3 reference update

Reviewed spec `9d8a6915bd19972b7ce9fe3b584926fc23e66fb7` and React
`150fd688ae09f0f3b28e989649f3daf1d9f6d91d`, comparing the full diff from the
original planning revisions. Each repository has one new commit in that interval.
These revisions replace the planning targets; earlier verification remains historical.

## Requirements added or clarified

| Change                                                                                                                                                                                           | Implementation and acceptance owner                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Branch-card `detail` accepts inline UI, bare elements containers and string modes. Case-insensitive GENERATE bypasses matching registrations; other strings consult the registry, then generate. | P3.9/P4.1. Resolve the branch `$ref` against the document root; preserve schema scope, nested data path and relative inline scopes. Value cards never dispatch branch details.                         |
| Card detail modes example uses one value in generated and registered presentations; Email matches a trusted registry and Postal deliberately misses.                                             | Phase 2/P3.9. Import `choice-controls/uischemas.mjs`, tab and label translations; execute EN/BG synchronized edits and fallback. Do not treat React tests as Svelte coverage.                          |
| Null-only controls distinguish absent from explicit null and participate in both renderer and cell registries.                                                                                   | P3/R23, P4 cells. Clearing writes absence; nullable unions still select mixed controls.                                                                                                                |
| Base/extended authoring schemas share choice identifiers/detail and collection/detail-related definitions. Exactly one of value or branch identifies a card; explicit null is a valid value.     | P0.1/P1.1/P2. Schema parity includes pagination, rowDetail, additionalItems, additionalProperties, columnDefs and dialog definitions. Do not reject unknown format hints or irrelevant temporal views. |
| Array-summary refactoring must retain local/global hideArraySummaryValidation precedence, including local false.                                                                                 | P1.6/P4.7. Hide descendant summary only; retain own array type errors and item indicators.                                                                                                             |
| Config-consumption evidence is refined, including scoped collapsed fallback and per-property dialog overrides.                                                                                   | P1.1/P1.2/P4.12. Inventory now contains 145 entries; authoring cases increase from 140 to 154. Behavior-vector count remains 21; example count remains 47.                                             |

The React change resolves branch details before dispatch and expands Antd/shadcn
choice-card and example tests. Its ListWithDetail generic and cleared-branch type
changes are typing refinements. Removed unused React test imports do not change
acceptance requirements.

## Implementation started here

The shared Svelte detail resolver is adapted from React common `src/detail.ts` at
the pinned revision. It keeps JSON Forms 3.9.0-alpha.1 registry/mode behavior,
normalizes bare elements to VerticalLayout, and forwards GENERATE through fallback
Controls without mutating their options. `resolveEditorDetail` preserves a caller's
existing fallback when no explicit detail was supplied.

Object, array-layout and master/detail renderers in all three Svelte families use
the shared resolver. Mixed/tuple/composite/recursive integration and choice-card
renderers remain open. No new visible strings are introduced by this helper; the
new EN/BG example and native card presentation are still required before R16 closes.

## Implementation provenance

The shared `choiceCards`, `confirmation`, `combinators` and `urlPolicy` helpers
adapt the React reference at the revision above. Svelte reactive state and native
selection/dialog adapters are implemented locally. The image source resolver
adapts the reference `ImageViewRenderer` pure helper and is integrated in all
three families, with translated diagnostics and stricter non-string handling. Browser-normalized backslash network paths receive an additional
URL-policy regression beyond the reference tests.

## Markdown implementation provenance

The shared Markdown profile and policy follow React `util/markup.ts`, `util/markdown.tsx` and `MarkupLabelRenderer` at the pinned reference commit. Svelte renders an allowlisted AST through recursive snippets instead of injecting HTML. The parser remains a dynamic import in the extended package. Choice-card content follows the reference inert presentation boundary; links additionally become spans within that boundary. Shared semantic typography is an initial adapter and still needs native family visual review.

The Label interpolation adapter reuses the reference pure `interpolate`, `celTemplate`, `celEnvironment` and `markdownEscape` algorithms and ports their absent-data/formatting tests. CEL 8.0.0 matches the installed reference evaluator. Svelte loads the evaluator separately from Markdown and re-evaluates reactive data, config, translator and locale. Parameter storage uses a null-prototype record to preserve literal parameter names. Renderer data paths supply the nearest array item through own-property traversal. Dynamic UI overlays remain deferred per current spec §11.

Native Link behavior follows React `LinkRenderer.tsx`: empty/refused URLs retain text, labels use the core i18n lookup, and new-window relations preserve authored tokens while enforcing isolation. Flowbite binds its `A` component. The React shadcn reference uses a semantic anchor; Svelte shadcn follows that choice and Skeleton uses its documented anchor class.

The demo translator now resolves each message through exact locale, language, English, then the caller fallback. Its existing `${name}` substitutions cache parsed segments and apply current parameters; they no longer compile executable Lodash templates. Label CEL syntax remains separate and unchanged.

## Spec packaging follow-up

Rechecked spec HEAD `f0183923295c495c60024fddca58dbe99e82e816` against the pinned behavioral revision `9d8a6915bd19972b7ce9fe3b584926fc23e66fb7`. The only change is `scripts/pack-release.mjs`: packaged fixture validation now compares property presence and values against the catalog, allowing inference examples to omit schema/data. No renderer contract or fixture changed. React remains at `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`.
