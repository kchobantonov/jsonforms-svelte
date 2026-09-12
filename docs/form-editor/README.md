# JSON Forms visual editor — implementation handoff

Status: design and implementation handoff, 2026-09-11. The initial web-component scaffold now lives in `packages/jsonforms-svelte-editor`, with a browser host in `apps/jsonforms-svelte-editor-demo`. Run `pnpm editor:demo:dev` to inspect the initial pane. The feature phases below remain to be implemented.

## Goal

Build a Svelte 5 and shadcn-svelte authoring application in which JSON Schema, JSON Forms UI schemas, reusable UI schemas, rules, and form settings can be edited visually and as JSON. Visual actions and applied source edits must produce the same document. Preview must use the existing `jsonforms-svelte-shadcn` web component.

The supplied Camunda screenshot is functional inspiration for palette, canvas, inspector, source, and preview. Do not copy its visual design or introduce Camunda's document model.

Read these documents in order:

1. [Architecture and behavior](./architecture.md): model, persistence, synchronization, authoring, and preview contracts.
2. [Implementation phases and acceptance tests](./implementation-plan.md): bounded deliverables and release gates.

## Confirmed integration requirement

The reusable editor accepts optional initial JSON values (`schema`, `uischema`, `uischemas`, data, configuration, and other form parts) supplied by its host application. The host owns obtaining and persisting those values, whether from a network, filesystem, database, embedded objects, one file, or multiple files. The editor exposes committed changes and snapshots without depending on a storage format or transport. See the host integration contract in [Architecture](./architecture.md#host-integration-contract).

## Proposed defaults

- New `apps/jsonforms-svelte-editor` application in this monorepo, with reusable core and Svelte editor packages.
- The reference host app is a local-first browser application: file selection, folder import where supported, download/export, and recovery storage. No server, login, collaboration, or cloud persistence required initially.
- The reference host app supports bundled `person.form.json` and same-basename split files as lossless representations of the same model; neither format is required to embed the editor.
- All standard JSON Forms layouts are required. Repository extensions are included in the final scope, with explicit authoring adapters rather than assuming arbitrary runtime renderers are automatically editable.
- Apply/Revert source editing; committed visual edits appear immediately in clean Monaco models. Unapplied source text is never overwritten silently.
- JSON Schema draft-07 is the first fully tested visual authoring dialect. Other dialects and unsupported keywords are preserved with clear capability diagnostics; they are not silently converted.
- A reusable editor component is required; publishing it to npm or shipping an editor web component is a separate release decision.

These defaults allow implementation to proceed unless the owner changes them. The requested clarification concerns deployment and extension scope; neither question prevents documenting the architecture.

## Non-negotiable outcomes

1. Accept host-supplied initial form parts; start from schema only, a complete form, or an empty form without performing resource I/O.
2. Drag existing schema fields into layouts without duplicating their definitions.
3. Drag a new input into a layout to create its schema property and UI control atomically. Text area creates a string property and `options.multi: true`.
4. Edit field names, types, constraints, required status, layout structure, renderer options, and rules through JSON Forms-driven property panels.
5. Add, select, rename, reorder, remove, and populate every categorization tab or step, including empty and runtime-hidden categories.
6. Access Monaco for each document component and the entire model, alongside the visual authoring surface. Use a language-agnostic wrapper with document-aware tooling; JSON Schema keyword/value completion and validation are mandatory.
7. Apply JSON changes to update the tree, canvas, inspector, and preview; switch views without losing state or using stale JSON.
8. Preserve unknown extension data and unsupported schema constructs through load/edit/save.
9. Keep preview instance data distinct from schema/UI authoring, with explicit promotion to saved sample data.
10. Undo and redo cross-component changes as single transactions.
11. Internationalize the editor UI, including JSON Forms-driven inspectors, messages, and accessibility labels; keep editor language separate from authored form translations.
12. Use Svelte 5 and shadcn-svelte throughout the editor UI, supporting light, dark, and system appearance.
13. Display controls on the design canvas as closely as practical to the actual shadcn renderers, with authoring interactions replacing ordinary data entry (for example, clicking a text input selects it rather than editing its value).

## Repository foundations verified

| Existing source                                                                          | Use in the editor                                                                                                                            |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm-workspace.yaml`                                                                    | Existing `apps/*` and `packages/*` workspace, JSON Forms catalog currently `^3.8.0`                                                          |
| `apps/jsonforms-svelte-shadcn-demo/package.json`                                         | Svelte 5, SvelteKit/Vite, Tailwind 4, shadcn, Monaco, and testing conventions                                                                |
| `packages/jsonforms-svelte-demo-common/src/lib/core/monaco.ts`                           | Existing Vite worker configuration; extract/share narrowly or reproduce the small browser bootstrap without importing the whole demo library |
| `packages/jsonforms-svelte-shadcn/src/lib/layouts/`                                      | Base layout, array, categorization, and stepper runtime behavior                                                                             |
| `packages/jsonforms-svelte-shadcn-extended/src/lib/layouts/SplitLayoutRenderer.entry.ts` | Split layout is a horizontal/vertical layout with `options.variant: "splitter"`, not a new serialized `SplitLayout` type                     |
| `packages/jsonforms-svelte-extended/src/lib/layouts/`                                    | TemplateLayout, Template, and Slot extensions                                                                                                |
| `packages/jsonforms-svelte-extended/src/lib/core/uischemas.ts`                           | Existing registry serialization accepts string tester functions; also transforms string rule validators                                      |
| `packages/jsonforms-svelte-demo-common/src/lib/examples/template-slot/`                  | Reusable named UI schemas and slot examples                                                                                                  |
| `packages/jsonforms-svelte-shadcn-webcomponent/README.md`                                | Preview properties, events, shadow DOM, and complete bundle deployment contract                                                              |

Use local workspace builds for preview. Do not depend on assumed CDN publication. Follow the lockfile and repository tooling during implementation rather than upgrading dependencies as part of this project.

## External references

Verified during planning; repository source determines renderer-specific details.

- [JSON Forms layouts](https://jsonforms.io/docs/uischema/layouts/): standard layout structure.
- [JSON Forms UI schema](https://jsonforms.io/docs/uischema/): renderer-specific options.
- [JSON Forms rules](https://jsonforms.io/docs/uischema/rules): schema-based conditions and effects.
- [JSON Forms validation](https://jsonforms.io/docs/validation/): AJV and validation modes.
- [Monaco JSON diagnostics](https://microsoft.github.io/monaco-editor/typedoc/interfaces/languages_features_json_register.DiagnosticsOptions.html): URI-associated schema validation.
- [Monaco text model](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.ITextModel.html): model lifecycle and editing API.

## Workspace visibility

Preview, Form Input, and Form Output can each be shown or hidden independently. Designer focus mode hides all three and gives their space to the designer. Restoring panels preserves their data, drafts, and layout preferences. These are session/host preferences, not changes to the authored form.
