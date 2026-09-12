# Implementation phases and acceptance tests

Follow the [testing strategy and feature coverage matrix](./testing-strategy.md). Automated tests, including production browser E2E workflows, are required for the final editor and must grow with each phase.

Implement incrementally. A phase is done only when its deliverables and acceptance scenarios pass; the initial slice is not the full requested editor. Do not substitute a static drag-and-drop mockup for document semantics.

## Phase 0 — contracts and integration spikes

Deliver the host input/change/snapshot/replacement/save-acknowledgment API, envelope JSON Schema, optional pure persistence codecs and fixtures, authoring descriptor interfaces, supported-renderer inventory, and an architecture decision record for preview isolation. Inventory every base and extended shadcn renderer's tester, schema requirements, options, nested UI schemas, and property inspector fields. Record options unsupported in the inspector as raw-JSON capabilities rather than dropping them.

Prove browser-only Monaco workers, local shadcn web component loading, resource resolution for `$ref`, and nested drag/drop with keyboard and cross-tab movement. Choose the drag library after the spike, keeping core independent. Define desktop browser support and fallback file behavior. Use the repository's installed dependency versions.

Acceptance: a minimal host renders a real web-component form and receives data/errors; a JSON Schema Monaco model provides keyword/value completion and meta-schema diagnostics by URI, and a separate sample-data model uses the authored schema; the chosen drag mechanism can move a child to an inactive tab without mutating twice. Document any component API changes required for resources/isolation. Prove a runtime-faithful text field/textarea design adapter that remains selectable without accepting data input, and verify scoped shadcn themes and inspector translation integration.

## Phase 1 — document engine and persistence

Create the framework-independent core, versioned model, optional pure bundled/split codecs, in-memory resource/pointer resolver, reference index, command dispatcher, undo/redo, and saved checkpoints. Add fixtures covering unknown fields, missing optional components, dotted basenames, conflicting input files, references, registry entries, and boolean schemas.

Acceptance: bundled → split → bundled is semantically equal; unknown data and optional-field presence survive. Rename with escaped keys updates only resolved references. A cross-component command undoes in one step. Partial split-save failure retains dirty status. No editor IDs leak into exported JSON.

## Phase 2 — shell, Monaco, and preview

Create the app and reusable Svelte editor package with the host integration contract. In the host app, add New/Open/Save/Save As, document navigation, resizable palette/canvas/inspector/source/preview areas, recovery, clean/draft status, diagnostics, and keyboard shortcuts. Implement host-configurable editor locale/catalogs/direction and light/dark/system mode across shadcn, inspector, Monaco, and portals, separate from form translations and preview settings. Add independent Preview/Form Input/Form Output visibility toggles, designer focus/restore actions, and host-owned workspace preferences with state-preserving panel restoration. Build the language-agnostic Monaco wrapper and source descriptor registry, including document-specific schema associations, completion providers, native-language string projections, and Apply/Revert/Apply All. Integrate actual shadcn web-component preview with separate sample/runtime data.

Acceptance: mount the reusable editor with optional initial schema/UI schema/registry values in an in-memory host, without file or network APIs. Verify immutable inputs, atomic change callbacks, explicit asynchronous replacement, and revision-specific save acknowledgments. Then edit and apply schema JSON, observe preview changes, save/reopen in either format. Invalid JSON leaves the last committed model intact. A draft locks visual mutations without blocking navigation. Overlapping drafts cannot silently overwrite one another. Opening source after a committed edit always shows current JSON. Preview typing never edits the schema or marks sample data dirty until explicitly promoted.

## Phase 3 — first complete visual workflow

Implement descriptor registry, schema tree, selection, standard control presets, VerticalLayout/HorizontalLayout/Group, empty drop targets, move/remove/duplicate, and the JSON Forms-driven inspector. Use actual renderer presentation or shared shadcn presentation adapters for canvas controls, with selection-safe interaction and no runtime data-entry side effects. Implement atomic new-field insertion, binding existing fields, required/type/name editing, reference-aware operations, and selected-node JSON.

Acceptance walkthrough: create an empty form; drop a textarea; rename its field to notes; make it required; switch to schema and UI source and observe the correct property, parent required array, and `options.multi`; apply `multi: false`; observe text-input rendering; undo the apply and then undo the rename. Drag the same schema property into two different groups and confirm only one schema definition exists.

This is a useful first release candidate for feedback, but does not fulfill the full requested scope until later phases pass.

## Phase 4 — all standard layouts and nested authoring

Add Categorization/Category, stepper variant, tab/step add/remove/reorder/rename, hover activation, cross-tab drag, keyboard move, runtime-hidden category editing, layout outline navigation, and array/object detail editing. Track active categories by stable IDs. Test nested layouts and correct scope contexts.

Acceptance: populate three tabs independently; move a control from the first to the third via hover and keyboard; remove the middle tab without deleting schema properties; select a rule-hidden tab in Design; preview actual tab visibility; remove all categories and recover through an empty-state Add tab action. Edit an array item detail whose field name matches a root field and verify no scope confusion.

## Phase 5 — schema depth and rules

Add constraints/default/enum editors, definitions and reference navigation, combinator branch editing, impact-aware deletion/type changes, rule builder, raw condition source, and preview evaluation badges. Establish the dialect capability matrix and preserve unsupported constructs. Cover root and nested existence conditions, undefined semantics, and all four effects.

Acceptance: a field without a control can be renamed and constrained in the schema tree. Rename a nested property used by controls and a rule across registry/detail UI schemas; verify all resolvable references change and opaque code is flagged. Complex condition JSON survives visiting the visual builder. Schema and UI errors are distinguishable from preview data errors.

## Phase 6 — repository extensions and registry authoring

Add split layout variant, registry management and per-entry canvas, TemplateLayout source/named-child authoring, Template/Slot reference/default/override editing, and descriptors for extended controls (Button, Color, Duration, File, Monaco, Null, and AG Grid array rendering as supported by the installed packages). Complete the Phase 0 capability inventory with tests or explicit unsupported-option diagnostics.

Acceptance: import the existing template-slot example, edit a slot default and instance override, export/reopen, and preview the expected result. Split layout serializes the proper base type and variant. Recursive/missing templates remain editable without a crash. Tester strings round-trip without running in the authoring page. Preview actions are displayed without invoking external effects.

## Phase 7 — release hardening and handoff

Complete Playwright workflows, core unit tests, component tests, keyboard/screen-reader checks, responsive panel behavior, save/recovery scenarios, and consumer documentation. Verify production static build, Monaco worker paths, and the entire web-component asset bundle. Add editor workspace scripts and explicit CI coverage; the root test script currently selects packages, so app E2E tests need their own CI command.

Use a measured fixture of at least 500 fields, 50 containers, and 10 categories to establish responsiveness and prevent full-document work on every pointer move. Record environment and measured timings before setting CI performance thresholds. Dispose abandoned Monaco models and event handlers; test repeated document opening and preview remounts.

Acceptance: all mandatory scenarios below pass, production build works without a dev server, local file data survives recovery, and the implementation documentation accurately states remaining limitations. No backend or npm publication is necessary to complete this plan.

## Mandatory end-to-end regression matrix

| Scenario                                   | Observable result                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Open schema-only input                     | Schema tree populated; explicit generated starting UI; authored layout subsequently preserved |
| Open bundle and equivalent split set       | Same canonical form and preview                                                               |
| Unknown options/keywords/envelope metadata | Survive visual edit, JSON apply, and format conversion                                        |
| Existing field dragged twice               | Two Controls, one schema property                                                             |
| New textarea dropped                       | New string property and scoped Control with `options.multi: true`, one undo entry             |
| Nested rename containing `/` or `~`        | Proper escaping; reference consumers updated; unrelated references unchanged                  |
| Rename/delete with opaque code reference   | Impact shown; no unannounced code rewriting                                                   |
| Type change with incompatible constraints  | Proposed removals visible; unrelated options retained                                         |
| Required toggled                           | Owning object's required array changes correctly                                              |
| Visual edit then source switch             | Current JSON shown in whole-model and component views                                         |
| Invalid source draft then Design switch    | Draft retained, last applied canvas identified, no destructive synchronization                |
| Disjoint component drafts Apply All        | One transaction, cross-component validation against the full candidate                        |
| Stale/overlapping draft                    | Apply blocked or conflict shown, never silent replacement                                     |
| All standard layouts nested                | Correct drop targets, ordering, selection, and export                                         |
| Empty/hidden/inactive tabs and steps       | Editable and accessible; runtime preview still obeys rules                                    |
| Moving child into itself/descendant        | Rejected without partial mutation                                                             |
| Array detail edit                          | Uses item schema scope; root property unaffected                                              |
| Rule visual ↔ JSON                         | Equivalent schema condition/effect retained, including advanced conditions                    |
| Referenced schema resource                 | Identity retained through conversion; preview resolves or gives precise diagnostic            |
| Registry/template/slot edit                | Definition/override target explicit, registry order and tester text preserved                 |
| Preview data edit and reset                | No schema mutation; saved sample only changes on explicit promotion                           |
| Keyboard add/move/delete                   | Equivalent document commands to pointer interactions                                          |
| Save failure or page recovery              | Unsaved work retained and status truthful                                                     |
| Unknown renderer/dialect                   | Source preserved, placeholder/diagnostic shown, no fabricated support                         |

## Monaco language and semantic tooling acceptance

- In a JSON Schema document, completion offers schema keywords such as `properties`, `type`, and `required`, valid type values, and hover documentation. An invalid keyword value produces a meta-schema diagnostic rather than sample-data validation errors.
- In sample data, completion offers actual form properties and enum values; applying a schema change refreshes that tooling without discarding drafts.
- UI schema completion offers supported element types/options and valid escaped scopes, including array-detail and registry contexts. Whole-model and selected-fragment editors retain the corresponding semantic behavior.
- Open two editor instances with different schemas: completions and diagnostics remain isolated. Closing one does not remove the other's tooling.
- Supported dialect selection changes the meta-schema association; unsupported dialect tooling is identified. All checks work without fetching schema URLs.
- Edit a template or tester string with its registered language, then Apply: only its JSON field changes, quoting round-trips correctly, and no source code executes. Overlapping parent JSON drafts remain guarded.
- Register a host source descriptor without modifying the Monaco wrapper. Verify language configuration is independent of editor UI locale.

## Editor localization, appearance, and design fidelity acceptance

- Switch editor locale with an unapplied source draft and a selected element: all editor-owned labels, inspector messages, and accessibility announcements update while document, selection, and drafts remain intact.
- Verify an English catalog, a second locale, missing-key fallback, plural messages, long translations, and RTL layout. Changing editor language leaves form translations and preview locale unchanged.
- Switch light/dark/system mode; verify shadcn chrome, inspector, portals, Monaco, focus/drop indicators, and inherited canvas/preview appearance. Explicit form preview appearance remains independent. No document edit or host theme mutation occurs.
- Drop text input and textarea presets: design appearance matches the real renderer under equivalent settings; clicking selects and dragging moves them, while typing changes neither document nor preview instance data.
- Change label, required, description, multiline, format, and visual options through the inspector; both Design and Preview reflect the actual renderer variant immediately.
- Verify selection wrappers work by keyboard as well as pointer. Runtime inputs/actions never activate accidentally; tab/step navigation and explicit authoring actions remain available.
- Compare representative controls and complex-renderer adapters with Preview in light/dark and translated form configurations. Record justified design-mode deviations; generic placeholders are acceptable only for unsupported renderers.

## Host integration acceptance scenarios

- Pass the same form parts from embedded objects, a simulated network response, a database record, decoded bundled JSON, and decoded split JSON. The editor produces identical authoring state without knowing the origin.
- Pass only schema, all components, or no initial form; each initializes correctly. Initialization does not emit a user-change callback.
- Freeze host input objects; visual edits and source Apply succeed without modifying them. Mutating a returned snapshot cannot change editor state.
- Echo committed changes through host rerenders; selection, drafts, and history remain intact. Explicit document replacement with outstanding edits requires resolution.
- Load initial resources asynchronously in the host and replace atomically; the editor never assembles partially loaded components on its own.
- Reference a missing URI while resource network APIs are blocked: show a diagnostic, issue no resource request, then resolve it after the host supplies the JSON. Verify Monaco and preview also avoid implicit schema fetching.
- Save revision N through a delayed host adapter, edit to N+1, then acknowledge N: the editor remains dirty. Failed saves and acknowledgments for a previous document never mark current edits saved.
- Run component tests without filesystem adapters, database clients, fetch-based resource loaders, or IndexedDB recovery. Test those separately in the reference host app.

## Instructions for the implementing model

Read the architecture and existing source before coding. Keep resource acquisition and persistence in the host app; the reusable editor accepts optional initial JSON parts and exposes committed snapshots regardless of origin. Execute one phase at a time and report what passed. Begin with fixture-backed document contracts and the preview/Monaco/drop integration spikes. Preserve existing renderer behavior; propose narrowly scoped runtime changes only when an integration spike proves they are necessary. Keep source synchronization, drag operations, and inspector updates on the same command path. Do not mark the project complete after the first visual slice, omit Category authoring, replace Monaco with a textarea, or replace the requested web-component preview with a mock.

For each phase, record changed packages, meaningful automated checks, manual checks where needed, and unresolved limitations. Seek owner input only for a material deviation from these proposed contracts; routine component and file organization choices can proceed autonomously.

## Workspace visibility acceptance

- Hide Preview, Form Input, and Form Output independently and together; freed space is used by the designer, with no empty panel tracks.
- Enter designer focus mode and restore: previous visibility and panel sizes return. All panels remain discoverable through the View menu.
- Hide and restore a panel with an unapplied input draft: text, cursor, runtime data, and errors survive without applying or discarding it.
- Keep Form Output visible with Preview hidden: runtime output continues to update after applied input/document changes.
- Hide all three, edit the form, then restore: the preview and output reflect the current committed form, with pending/stale evaluation clearly identified.
- Visibility changes neither mutate the form nor add undo entries or dirty status. Initial host preferences and preference callbacks work without direct editor storage access.
- Keyboard focus remains predictable, and restored Monaco editors correctly resize.

## Additional design coverage

Use the [expanded requirement and phase mapping](./design-integration.md#phase-mapping-and-completion-gates) as part of each phase acceptance review. The [owner-supplied design](./additional-design.md) adds configurable dialects, visual root conversion, definition extraction/unlinking, dynamic-property inspectors, and English/Bulgarian catalogs. The current interactive slice does not fulfill these later gates.
