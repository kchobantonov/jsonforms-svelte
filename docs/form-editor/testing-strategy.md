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

- `tests/workspace.mjs`: real pointer palette drops, existing-field binding without schema mutation, insertion into a selected categorization tab, atomic undo, keyboard canvas reordering, pointer and keyboard splitter resizing, in native and web-component modes.
- `tests/smoke.mjs`: example selection, control insertion, JSON Forms inspector updates, undo/redo, real Monaco Apply/Revert, draft locking and categorization selection, in both modes.
- `tests/monaco.mjs`: real JSON Schema keyword completion, meta-schema diagnostics and data completion based on the authored schema.

Run the native package `test` script for command/provenance checks. Build and serve the production demo on port 4178, then run `pnpm --filter jsonforms-svelte-editor-demo test:browser` (`EDITOR_DEMO_URL` overrides the URL). Browser checks use Chromium. They cover this increment; they do not yet prove the full feature matrix, all browsers, accessibility, localization or all extended renderers.

Inspector browser regression also verifies that the property panel contains no renderer custom element and that its native inputs share the editor DOM/theme boundary, in both integration modes.
