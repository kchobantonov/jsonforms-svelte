# Editor test strategy and feature coverage

Automated tests are required deliverables, not a final optional activity. Each implementation phase must add relevant regression tests and pass its checks before a feature is marked complete. The final release must demonstrate the requested workflows with browser end-to-end tests against production assets as well as unit/component tests.

## Test layers

1. **Pure document tests:** initialization, preservation, pointer escaping, scope/reference resolution, schema/layout commands, atomic transactions, history and codecs. Assert semantic outcomes and invariants, not implementation details.
2. **Browser component tests:** scoped shadcn styling, canvas selection and nested drop targets, inspector projections, Monaco language/schema associations, draft conflicts, keyboard interactions, tabs and component lifecycle. Use real browser DOM/shadow boundaries where behavior depends on them.
3. **End-to-end tests:** production demo mounting, host initial inputs, full visual/source/preview loops, example switching, host persistence adapters, native and web-component modes once available. Use Playwright with the actual renderer, Monaco workers and distribution assets. A mock renderer cannot establish renderer fidelity or rule behavior.
4. **Visual/accessibility checks:** representative design/preview screenshots under the same schema, UI settings and sample data; light/dark and English/Bulgarian/RTL fixtures; keyboard focus and accessible names. Use stable viewports, fonts and settled rendering. Snapshot review complements functional assertions, not replaces them.

## Required feature matrix

| Feature                                       | Required automated evidence                                                                                                                                           | Current status                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Host-supplied initial parts                   | In-memory, decoded bundle/split and simulated network/database hosts produce equivalent state; no editor resource I/O; immutable inputs                               | Partial initialization unit coverage                    |
| New control / existing schema binding         | Atomic property + scoped control; textarea options; duplicate binding without duplicate schema; undo once                                                             | Basic command tests; browser workflow under development |
| Visual schema authoring                       | Add/rename/retype/required/constraints/nesting/order/delete without Monaco; unknown keywords preserved                                                                | Pending implementation                                  |
| References and definitions                    | Escaped/nested pointers, consumers updated, extract/unlink, cycles, missing resources                                                                                 | Escaped pointer/required tests only                     |
| Non-object roots / dialects / dynamic objects | Root binding/conversion/undo; draft-aware inspector and meta-schema completion; additional/pattern properties                                                         | Pending implementation                                  |
| Layouts / categories / steps                  | Every supported layout, empty and rule-hidden containers, every tab, add/remove/rename/reorder, cross-tab move                                                        | Initial browser coverage in progress                    |
| Drag/drop and keyboard alternatives           | Pointer and keyboard produce equivalent documents; cycles and incompatible targets rejected; cancellation is unchanged                                                | Core movement/compatibility tests                       |
| JSON Forms-driven inspector                   | Real renderer edit → command → model/source/canvas; no commits from initialization; selection changes cannot write stale data                                         | Initial browser coverage in progress                    |
| Monaco and synchronization                    | Schema keyword/value completion; UI scopes; live data completion; Apply/Revert, invalid drafts, overlaps, undo/redo, language projections, no implicit schema fetches | Initial browser coverage in progress                    |
| Rules                                         | All four effects, undefined/existence semantics, schema-based and composite conditions, complex JSON round trips, actual preview effects                              | Pending implementation                                  |
| Reusable UI schemas / templates / extensions  | Per-entry editing, definitions vs overrides, cycles, unknown preservation, safe executable-content handling                                                           | Pending full coverage                                   |
| Preview and data panels                       | Actual renderer input/output, sample promotion/reset, no schema mutation from data input, independent panel hiding/restoration and focus mode                         | Initial preview only                                    |
| Themes / localization                         | Light/dark/system, theme boundaries, locale changes, catalog parity, separate form/editor locales, RTL and long labels                                                | Pending full coverage                                   |
| Host persistence and history                  | Exact-revision save acknowledgments, partial failures, draft resolution, recovery, format conversion, saved checkpoint undo                                           | Pending implementation                                  |
| Packaging and lifecycle                       | Web-component production asset/worker loading; native mode parity; repeated mount/unmount, multiple-instance isolation                                                | Web-component smoke workflow in progress                |
| Component provenance                          | Unmodified shadcn source baseline; editor-specific behavior in wrappers; reported approved deviations                                                                 | Byte comparisons performed; automate before release     |

Status is intentionally conservative. A test file existing does not establish coverage until it passes and asserts the feature's observable result. Update this matrix with test file paths and CI commands as each feature lands; record unsupported combinations explicitly.

## End-to-end release journeys

- Open an existing example, bind fields, insert a textarea, change its label/type/required constraints, nest layouts, create/populate/reorder/remove tabs, edit a rule, and verify the actual preview and exported model.
- Start with no form and with schema-only input; visually build valid schema and layout, save through the host, reload, and compare canonical output.
- Modify Schema/UI Schema/Model in Monaco and Apply; verify canvas/inspector/preview updates. Enter invalid JSON and retain the last committed document; resolve drafts and undo/redo across editing modes.
- Import vendor keywords, referenced definitions, advanced conditions and reusable UI schemas; perform ordinary visual edits and export without losing unrelated content.
- Change examples/documents with unsaved edits or drafts; verify host confirmation/cancellation and isolated new sessions.
- Repeat representative authoring in light/dark and English/Bulgarian, with keyboard-only navigation. Hide and restore Preview/Input/Output without losing state.
- Exercise the final native-library and custom-element integrations with the same fixtures and compare emitted models.

## Execution and reliability

Run a fast focused suite during feature development, then the relevant production browser suite. CI must build renderer/editor/demo assets before E2E, start a local server on an allocated port, and capture traces/screenshots/logs on failure. Test invalid and missing assets as negative cases; do not accept an application shell loading while workers fail. Use explicit state assertions instead of long arbitrary sleeps. Test clipboard/type input as real Monaco interactions and verify the resulting committed JSON.

At release, test Chromium, Firefox and WebKit for the supported browser contract, with documented browser-specific limitations. Establish performance budgets from measured large-form fixtures. Avoid repeated broad runs without code changes or an unresolved concern; retain useful failure artifacts and a clear validation report.

## Package split increment: concrete regression cases

`packages/jsonforms-svelte-editor/tests/document.test.ts` tests atomic schema/control insertion, escaped nested scopes, required ownership, immutable moves, destination-index correction, cycle rejection, category compatibility, invalid models, unresolved bindings and nonserialized stable identities. `tests/shadcn.test.ts` compares the full host-owned shadcn source set byte-for-byte with the existing repository shadcn set.

The demo browser suite includes:

- `tests/workspace.ts`: real pointer palette drops, existing-field binding without schema mutation, insertion into a selected categorization tab, atomic undo, keyboard canvas reordering, pointer and keyboard splitter resizing, in native and web-component modes.
- `tests/smoke.ts`: example selection, control insertion, JSON Forms inspector updates, undo/redo, real Monaco Apply/Revert, draft locking and categorization selection, in both modes.
- `tests/monaco.ts`: real JSON Schema keyword completion, meta-schema diagnostics and data completion based on the authored schema.

Run the native package `test` script for command/provenance checks. Build and serve the production demo on port 4178, then run `pnpm --filter jsonforms-svelte-editor-demo test:browser` (`EDITOR_DEMO_URL` overrides the URL). Browser checks use Chromium. They cover this increment; they do not yet prove the full feature matrix, all browsers, accessibility, localization or all extended renderers.

Inspector browser regression also verifies that the property panel contains no renderer custom element and that its native inputs share the editor DOM/theme boundary, in both integration modes.

## Canvas node actions

`tests/node-actions.ts` exercises both native and web-component modes: the remove action is hidden when idle, revealed by hover/selection/keyboard focus, removes only the UI subtree, preserves another selected sibling, removes layouts and category tabs, respects unapplied-source locking, and restores deleted content with one undo. Root removal is intentionally unavailable because the root has no owning layout.

UI review must check for hand-written native controls replacing available shadcn components. Any exception needs a documented rationale and owner awareness. Verify dropdown foreground/background contrast and portal placement in light, dark and system modes, including inside the editor shadow root; shared components alone do not guarantee a correctly configured host theme.

## Tree, theming and blank initialization

`tests/tree-theme-new.ts` covers omitted-initialForm startup, first insertion, guarded New form reset, source-dropdown foreground/background contrast and in-editor portal placement in light/dark/system modes, hierarchical expansion/keyboard navigation and whole object/array drops. Run it in both integration modes. Existing example-based tests select their fixture explicitly instead of relying on the default. `schema-tree.test.ts` covers escaped pointers, container identity, visible branches, root shapes and tuple item structure.

## Test implementation language

Use TypeScript for editor tests, including browser/E2E tests and their helpers. The demo browser suite runs `pnpm test:check` first (`tsc --noEmit --project tsconfig.tests.json`), then executes `.ts` files with Node 22's type stripping and Playwright. Type stripping is execution support, not a replacement for type checking. Browser fixture/event types and Playwright `Page`/`Locator` types belong in the test code; do not bypass checking with `ts-nocheck` or a blanket `any` conversion. Existing unit tests remain TypeScript as well.

Drag feedback must distinguish selection from drop eligibility. Compatible
containers must not all acquire selection-colored outlines during a drag. The
insertion placeholder indicates the destination; the selected element retains
its selection styling. The TypeScript workspace browser test checks this during
palette, schema-field, and category-content drops in both integration modes.

`tests/panels.ts` checks designer/preview side-by-side positioning, width recovery
when preview collapses, restoration via the rail, input/output toggles, and
preservation of a dirty Model JSON draft across collapse in both integrations.

Application confirmation coverage uses shadcn dialog roles and buttons, never
Playwright's native-dialog acceptance handlers. `tree-theme-new.ts` verifies New
Form discard, Cancel/Escape preservation, theme ancestry, and cancellation of
example/integration switches. Existing smoke, workspace, and canvas-action tests
accept the same dialog when switching examples with unsaved edits.

Current view regression coverage in `panels.ts` checks Design/Validate/full-width
JSON Model, grouped Label/Button insertion, demo-owned history, required markers
without design validation errors, and preserved draft locks. `node-actions.ts`
now asserts selection-only deletion, explicitly rejecting hover/focus revelation.
These replace the earlier hover-delete and lower Model JSON panel expectations.

Group browser tests run for Shadcn, Skeleton, and Flowbite: opt-in behavior,
initial collapse, expanded/collapsed indicator visibility, and reactive removal
of the dot when data is cleared. Shared tests cover false/zero, empty values,
escaped property names, nested layouts, and array-item paths. Inspector unit tests
cover field applicability and preservation of unrelated schema/UI properties.

### Navigation and translation regression coverage

The TypeScript `translations.ts` browser scenario runs against both native Svelte
and web-component integration. It checks exclusive Design/Validate selection,
JSON Model toggling back to the previous visual preset, source actions above
Monaco with tooltips, independent UI/form locales, and inspector-authored labels
rendering in the form. Unit tests cover translation namespace preservation,
locale-specific writes, and avoiding accidental copies when changing keys.

`schema-selection.ts` exercises both integrations with duplicate controls across
category tabs: selecting unused fields without insertion, preserving a selected
occurrence, choosing a different occurrence, revealing its tab, independently
editing multiline, and filtering used scopes after deletion/undo. The
`schema-usage.test.ts` unit cases cover duplicate paths and retained ancestor
branches for unused descendants.

Presentation renderer browser tests run against Shadcn, Skeleton and Flowbite,
covering divider rendering, default/custom spacer height, image source/alt, and
visibility rules. Editor command tests cover presentation presets without schema
fields, enum/oneOf conversion, checkbox array schemas and rejected duplicate
values. Palette and inspector browser coverage checks actual design samples and
choice editing in both integration modes.

The node-actions browser regression also inserts several controls into a blank
form and asserts exactly one selected canvas node after each insertion. An
unresolved canvas path must never be treated as the root path for selection;
selection highlighting compares element identities after resolving the node.

Language-authoring unit tests cover empty declarations, canonical language tags,
duplicate/invalid tags, all-locale inspector fields and independent writes.
The translations browser workflow adds fr through the Add form language dialog alongside existing en/bg catalogs,
fills their translations simultaneously, and verifies preview switching
in native and web-component integration.

Schema authoring: `schema-edit.test.ts` exercises definitions/$defs, reference
rewrites, escaped names, object arrays, required flags, sample-data preservation,
name collisions and atomic refusal of referenced deletions. Browser
`tests/schema-edit.ts` covers blank-form creation, object definitions, reference
properties, renaming, protected deletion, undo and nested array fields in both
native and web-component integrations.

`tests/scroll-area.ts` verifies that Components, Schema tree and Properties use
shared ScrollArea roots, that the palette viewport scrolls with the mouse wheel,
that a themed scrollbar appears, and that an off-screen palette item can still
be added in both editor integrations.

`tests/schema-only-types.ts` exercises schema-only Apply and generated Preview, absence of generated canvas controls, schema union creation, unplaced-field type editing, and the separation of form-level language management from Properties in both integrations. `schema-types.test.ts` verifies canonical omission and first-drop materialization, including palette and existing-field drops.

Rule coverage: `rules.test.ts` exercises the six-effect contract, occurrence isolation, atomic removal, missing-value behavior, and lossless visual projection. `tests/rules.ts` covers visual Apply, JSON editing, all six runtime effects, invalid JSON recovery, canvas markers, removal and Undo in both integrations. The Svelte binding browser test `readonly.svelte.spec.ts` verifies that custom-control dispatch respects READONLY/WRITABLE. Compound visual conditions and array-detail rule contexts remain outside the current browser coverage.
