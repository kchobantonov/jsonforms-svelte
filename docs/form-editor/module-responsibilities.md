# Module responsibilities and implementation status

The updated owner-supplied design adds §12.1, a useful responsibility map. Adopt it as the target organization; keep `additional-design.md` verbatim and apply the confirmed decisions in `design-integration.md` when wording conflicts. Repository package names retain their `jsonforms-svelte-` prefix. This map distinguishes existing building blocks from planned features; a directory name alone does not mean its feature is complete.

## Model and commands

| Target under native `src/lib/editor/` | Responsibility | Current implementation / next extraction |
| --- | --- | --- |
| `document/types.ts` | Shared JSON/document vocabulary; no DOM APIs or command behavior. Separate persisted form parts from session metadata. | `InitialForm`, JSON values and snapshot detail exist; richer schema-node/dialect types remain planned. Custom-element types live in the wrapper. |
| `document/schema-paths.ts` | Central schema pointer parsing, escaping and targeted immutable traversal/mutation. | Basic helpers currently live in `document/commands/index.ts`; extract before expanding schema authoring. |
| `document/scope-index.ts` | Derived scope information and unresolved-binding diagnostics, using shared reference/dynamic-object helpers. | Basic lookup/diagnostics exist in `commands/index.ts`; memoized, reference-aware index is planned. |
| `document/root-schema.ts` | Root-node view and pure root-conversion impact analysis; no dialogs. | Root binding exists; guided conversion is planned. |
| `document/draft-config.ts` | Draft capability tables, local meta-schemas and validator factories. | Draft-07 Monaco metadata exists in `monaco/`; dialect selection is planned. |
| `document/ref-resolution.ts` | Reference chains, cycles, extraction/unlink analysis without flattening stored schemas. | Planned. |
| `document/dynamic-properties.ts` | Dynamic-object pseudo-children and keyword helpers; no fixed-key controls for unknown keys. | Planned. |
| `document/merge-patch.ts` | Shared targeted patch/delete semantics, preserving unrelated and vendor keys. | Current commands preserve unrelated fields; extract common helpers as field coverage grows. Absence, explicit deletion and JSON null must remain distinct. |
| `document/commands/types.ts` | Command/transaction contracts, independent of components. | Current commands return immutable snapshots; explicit transaction API is planned. |
| `document/commands/schema-commands.ts` | Schema mutations and impact-aware cross-part reference rewrites. | Basic new-field/required operations are in `commands/index.ts`; full schema authoring remains planned. |
| `document/commands/uischema-commands.ts` | Insert, move, remove, properties and rules; no UI event handling. | Basic commands exist in `commands/index.ts`; rules remain planned. |
| `document/commands/replace-commands.ts` | Validated replacements for explicitly applied source changes. | `history-store.svelte.ts` currently performs Apply/initialization; extract replacement logic here as validation grows. |
| `document/history-store.svelte.ts` | Session, committed snapshots, history, selection and command dispatch. | Implemented initial session/history. Selection/presentation is outside document snapshots; remove-by-ID repairs selection without changing schema. |
| `document/identity.ts` | Stable, nonserialized node identity across commands/history. | Implemented with WeakMap identity transfer. Keep this additional module. |

## Drag/drop, registrations and inspector definitions

| Target | Responsibility | Current implementation / next extraction |
| --- | --- | --- |
| `dnd/payloads.ts` | Typed schema, palette and canvas payloads; parent/index drop targets. | Implemented initial payload types. |
| `dnd/drop-handler.ts` | One semantic drop dispatcher producing atomic model changes. | Implemented initial binding/scaffolding/moving. A future bind-or-create dialog is UI orchestration around this pure dispatcher. |
| `dnd/compatibility.ts` | Central parent/child rules shared by highlights, drops and commands. | Current rules are in `commands/index.ts` and `drop-handler.ts`; extract before adding extended layouts. |
| `dnd/DragZone.svelte` | Library lifecycle and transient hover items only; final events invoke commands. | Implemented using `svelte-dnd-action`; keep this small adapter. |
| `registrations/control-definitions.ts` | Shipped authoring descriptors, later extended/overridden by hosts. | Currently a preset list; full renderer registration API is planned. |
| `inspector/schemas/` | Native inspector's own schema/UI-schema pairs; pure composition for selection kind and draft. | Current small form is composed in `Inspector.svelte`; extract as selection/constraint forms expand. |
| `inspector/renderers/` | Editor-specific JSON Forms renderer/tester pairs for enum/rule editors. | Planned; ordinary fields use native shadcn JSON Forms renderers. |

## Components and presentation

| Target | Responsibility | Current implementation / next extraction |
| --- | --- | --- |
| `components/SchemaTree.svelte` | Schema navigation, selection, context actions and drag sources using model helpers. | Expandable ARIA tree and whole-object/array binding implemented via `SchemaTree/SchemaBranch.svelte`, `tree-state.svelte.ts` and `document/schema-tree.ts`; definitions/full schema editing remain planned. |
| `components/Palette.svelte` | Render registered control/layout choices and drag handles. | Implemented initial palette; descriptor groups are planned. |
| `components/Canvas/Canvas.svelte` | Canvas root composition and session/drop wiring. | Currently composed by `EditorShell`; extract when root canvas behavior expands. |
| `components/Canvas/CanvasNode.svelte` | Node identity, selection, child/drop composition and delegation. | Implemented recursive canvas; extract type-specific bodies into `nodes/` as they grow. |
| `components/Canvas/NodeActions.svelte` | Small accessible per-node remove action, sharing the session command with inspector removal. | Added for hover/selection/focus actions, including category tabs. |
| `components/Canvas/nodes/` | Focused control/layout/group/categorization authoring bodies. | Planned extraction from the current canvas; preserve actual-renderer fidelity and inert data entry. |
| `components/Inspector/Inspector.svelte` | Choose inspector form, mount native `JsonForms`, map changes to commands. | Implemented basic label/multiline/required form using host-shared shadcn sources. |
| `components/Inspector/PropertyPanel.svelte` | Inspector panel chrome and selection-level actions. | Implemented. |
| `components/MonacoPane.svelte` | Reusable language-aware editor lifecycle, workers/models/completion/diagnostics and disposal. | Implemented basic adapter; retain `SourcePanel` for Apply/Revert and draft ownership. |
| `components/LivePreview.svelte` and `components/preview/Runtime.svelte` | Committed form projection, independent preview data and actual runtime component adapter. | Implemented initial web-component preview; separate Form Input/Output controls remain planned. |
| `theme/`, `i18n/` | Shared theme/locale context, catalogs and presentation-only state. | Shared resolved-theme helper now drives editor dark variants; full theme-context consolidation and localization remain planned. |
| `EditorShell.svelte` | Compose toolbar and panes and pass host/session context; no schema algorithms. | Implemented initial composition with shadcn/Paneforge splitters. |

## Packages and hosts

- Native `Editor.svelte` is the public Svelte boundary. Native JSON Forms/shadcn renderers are externally supplied dependencies; shadcn source components resolve through the host alias, not an npm package of copied components.
- The wrapper keeps `EditorElement.svelte`, `register.ts` and `types.ts` as small separate boundaries. §12.1's `define-element.ts` is a responsibility description, not a requirement to combine these files. The wrapper owns `src/components/ui` and bundles its dependencies and assets.
- The demo owns example/resource acquisition, unsaved-change prompts and integration selection. It maps editor and native-inspector UI imports to the same wrapper-owned component set; a different native host may provide its own source set.
- A shared UI-schema meta-schema package remains planned. Keep one canonical module until extraction; do not introduce parallel copies for Monaco and the inspector.

## Clarifications from the review

1. Keep explicit Apply/Revert. “Replace commands” execute on Apply; source debounce may validate drafts but must not commit them.
2. Keep resource loading/saving host-owned, preserve all supplied form parts (`uischemas`, config, translations and unknown extensions), and keep UI-only metadata out of exported documents.
3. Use native JSON Forms for the inspector, sharing host components and theme. The confirmed preview remains the renderer web component despite the new `LivePreview` description suggesting native rendering.
4. Keep real-renderer-looking canvas controls with inert form inputs, despite the new node-body description suggesting compact labels only.
5. Keep transactions explicitly bounded by a user action. A microtask alone must not batch unrelated actions or split one action awaiting a dialog into accidental commits.
6. Keep semantic drop/command code independent of popovers. UI components can request a bind-or-create choice, then pass the result to the drop dispatcher.
7. Use the scope index for authoring information. Monaco data validation still receives the complete authored schema and its definitions/reference context; a dereferenced index is not a replacement schema.
8. Do not add an npm peer dependency on the shadcn CLI as a substitute for actual host component sources. Preserve the shared alias in packaged output; type checking may resolve it locally, but declaration generation must not write into the host's source directory.
9. Avoid unrelated refactoring merely to populate every suggested filename. Extract working responsibilities as features grow, with tests preserving behavior.
