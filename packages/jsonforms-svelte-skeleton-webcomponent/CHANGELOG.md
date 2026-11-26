# @chobantonov/jsonforms-svelte-skeleton-webcomponent

## 2.0.0

### Minor Changes

- b52b1dd: Provide a form-local renderer error store with per-instance ownership, generation checks for asynchronous results, explicit path relocation, pending state and cleanup. Merge its errors with host-supplied errors without replaying stale form data. Add a separate onvaliditychange callback covering schema errors, additional errors and pending validation while preserving the base onchange contract.

  Forward combined validity through the extended form and a typed validity-change Web Component event; expose merged additional errors in the extended action context.

- a1a5ead: Accept a host-supplied Ajv instance through the JavaScript `ajv` property so Web Components can validate schemas using a dialect such as Draft 2020-12. The generated validator remains the default.

### Patch Changes

- 2caadba: Expose a typed `ondiagnostic` author callback on Svelte forms and a `diagnostic`
  CustomEvent on all three Web Components. Route shared author warnings, native
  temporal and split-pane option warnings, extended template, markup, Monaco,
  button, file, UI-schema script and dynamic-default warnings, and unhandled actions to this channel without
  changing form validation, console warnings or accessible missing-content
  fallbacks. Catalog translators can deliver missing-key and missing-parameter
  warnings to an optional author sink.
  Template child, named-template and native-slot warnings avoid repetition during
  live form updates.
  Correcting an invalid section `collapsed` option now resets its mounted warning
  deduplication, so a later invalid value is reported again to the author.
  It also reports a changed invalid value type at the same option source with
  updated safe type details.
  Portable layout sizing warnings likewise follow active authored conditions and
  report again when a corrected invalid option is reintroduced.
  ImageView and conditional-field author warnings use the same active-condition
  deduplication during live UI-schema changes.
  Missing renderer/cell and invalid tuple-position warnings also reset after the
  condition is resolved, allowing a later occurrence to reach the host callback.
  UI-schema registry-cycle warnings reset when the cycle is no longer active.
  Cycle warnings also wait for a settled dispatch tree, avoiding a transient
  false warning while a host replaces a recursive entry with a valid detail.
  Extended split-layout warnings also track current authored options during live
  changes, reporting a newly reintroduced unsupported wrap setting.
  Focus-conflict warnings reset after a conflict stays resolved for a render
  turn, while transient request teardown/re-registration stays deduplicated.
  Template script-permission and unsupported-language warnings now report again
  when a previously resolved author condition returns during a live host update.
  Markup policy warnings likewise reappear when a corrected host option is
  reintroduced.
  Choice-card invalid/duplicate identifier warnings also reset after the
  authored choices become valid, then report again if the issue returns.
  Unhandled-action warnings reset after that action reaches a host handler,
  then report again if the handler is removed.
  Unsupported tuple warnings reset when their authored condition resolves,
  then report again if it returns.
  Monaco's missing form-owned error-store warning resets when publication is
  disabled and identifies a new control path as a new author condition.
  All three Web Component hosts deliver recurring missing-renderer and
  unsupported-tuple diagnostics after their authored conditions resolve and
  return, and forward extended script-policy warnings as composed events.
- 2caadba: Report conflicting Button action and script authoring through the diagnostic channel in native and Web Component hosts, while keeping the action usable and avoiding an in-form warning.
- 2caadba: Re-report an invalid categorization initial name when a live UI-schema update corrects and then reintroduces it, without changing the selected category or form data.
- 2caadba: Let vertical and horizontal control labels wrap at narrow widths in Flowbite, Shadcn and Skeleton. Long localized file labels remain readable above their pickers, and long checkbox labels keep their full text beside the control.
- a1a5ead: Expose current automatic schema validation in combined-validity notifications. NoValidation no longer reports an empty-error form as valid. Notify hosts when validation modes change without a data edit, preserving pending and additional-error contributions for submit guards.
- 2caadba: Preserve exact parent path members in section and stepper validation indicators, control and array-child error filtering, tuple omitted-position errors, composite-cell summaries and removal limits, and Boolean/slider array-parent checks when a literal dotted member shares a flattened path with nested data. Delay Skeleton icon hint hover opening until the trigger click completes so Boolean Clear still commits after pointer entry.
- b52b1dd: Include shared extended renderer sources when generating bundled Tailwind utilities. Include Flowbite's native extended renderer sources as well so compact file controls and other extended widgets retain their declared dimensions and theme utilities.
- a1a5ead: Render absolute references to external schema documents already registered with the host Ajv instance from identified or anonymous roots while validating against the original schema. Support transitive registered references, nested `$id` resources and document-local anchors without fetching URLs or duplicating nested resources. Diagnose missing documents, anchors, JSON Pointers and anonymous-root relative refs even in NoValidation while preserving data and recovering when the host supplies Ajv. Report `$dynamicRef` as unsupported for rendering rather than opening an unconstrained editor. Pass JSON schema resources through each demo and Web Component, with native and production interaction coverage across all three renderer families.
- 2caadba: Keep missing ImageView alt text on the author diagnostic channel without showing an in-form warning while the image renders. Missing or refused image content still has a visible explanation.
- b52b1dd: Use a readable foreground for Flowbite's default yellow warning Button while
  retaining the native palette and explicit styling overrides. Correct the Skeleton
  Web Component's native surface utility so its background follows light/dark mode.
- aba358e: Keep native sliders while distinguishing unset and invalid data from their provisional thumb position. Add localized clearing and value announcements, readonly commit guards, zero-based decimal increments, integer-safe fractional multiples and exclusive bounds. Preserve primitive array slots when clearing, and allow explicit selection when only one value fits the range. Forward accessible value text to the shadcn slider thumb and tooltip.

  Initialize Skeleton sliders after their containing root is available and share the native thumb ID with its tooltip, preserving shadow-root measurement and keyboard focus.

- 2caadba: Report invalid explicit numeric steps to form authors while retaining the safe input step fallback and keeping configuration warnings out of the form.
- b52b1dd: Add opt-in whole-row table and AG Grid detail dialogs and persistent panels with item-relative authored/registered/generated layouts, isolated drafts, stale replacement protection, and readonly inspection. Keep hidden columns available to row details and localize row actions in English and Bulgarian.

  Inject scoped Svelte component styles into their owning shadow root so Web Component content retains component-level layout, focus, and interaction styles, including column resize handles.

  Support Label-based cell summaries through renderer dispatch, with React-compatible summary-only actions and readonly detail inspection. Integrate the canonical table-row-details example with English/Bulgarian catalogs.

- 2caadba: Report unresolved UI-schema rule references through the author diagnostic channel and treat the rule as unmet until its reference resolves.
- 2caadba: Send unresolved and unsupported dynamic schema references through the author diagnostic channel while preserving their accessible fallback and invalid status.
- b52b1dd: Share catalog translation between demos and Web Components. Resolve each message through exact locale, language, English and the supplied fallback; preserve intentional empty strings and undefined misses. Cache parsed text substitutions while using current parameters on every call, and keep catalog expressions inert instead of executing lodash templates.
- a1a5ead: Keep a removed accordion category mounted for one update while focus moves from its header to the visible fallback. Keep the Skeleton accordion renderer selected through an empty-category update so its focused final native trigger can release focus before the accordion subtree unmounts. This avoids native teardown errors and preserves form data.
- b52b1dd: Replace dependency environment checks when building the standalone Skeleton web component so file feedback and dialog interactions do not require a Node process global in the browser.
- b52b1dd: Use Skeleton's native Dialog and Portal components for row and composite-cell detail editors. Preserve isolated drafts, measured sizing, maximize/restore, focus return and Shadow DOM portal targets. Keep modal pointer interaction working when geometry styles change.
- a1a5ead: Keep a removed tab trigger mounted briefly while focus moves to the selected fallback. Keep the Skeleton Categorization renderer selected through an empty-category update so its focused final native trigger can release focus before the tab subtree unmounts.
- 2caadba: Report invalid split-layout resizable and container dimension options, invalid local minimum item widths, and resizable hints outside split layouts through the author diagnostic channel while preserving fallback sizing behavior.
- 2caadba: Report invalid split-pane minimum and keyboard-step options independently, without repeating an unchanged warning during a live option update.
- b52b1dd: Keep Skeleton splitter handles above adjacent pane content and prevent browser scrolling from taking over touch resizing. Preserve the original touch during scoped-direction shadcn resizing when another finger starts or ends on the handle, and cleanly stop the native drag on cancellation.
- b52b1dd: Complete portable splitter sizing: fixed CSS dimensions, weighted remainder, vertical content sizing, per-pane bounds, gaps, alignment and constrained overflow. Preserve resized shares and mounted controls during data updates and responsive stacking.

  Retain native Flowbite Pane/Divider components with a shared bounded controller because the native group lacks controlled per-pane constraints. Forward shadcn's native Resizable layout API and preserve the adapter during component sync. Harden drag ownership and cancellation, and add localized sizing examples with browser coverage for native and Web Component hosts.

- b52b1dd: Key tuple tail editors by their bound array position so edits continue to target the current position after removal or external data replacement. Use the supported Svelte open-shadow option in Flowbite and Skeleton Web Components.
- 2caadba: Report Ractive template render failures again when an author replaces one malformed template with another, while keeping data-only updates quiet.
- 2caadba: Report an incompatible temporal save format again when the same mounted control moves to another data path.
- 2caadba: Re-report an unhandled action after a host briefly installs and removes its action handler, even when the handler was never invoked. Repeated clicks without a handler remain deduplicated.
- b52b1dd: Require live host permission for JavaScript computed defaults and isolate provider registrations per validator. Preserve cached-validator revocation and report unavailable browser query providers in server hosts.
- d4dd92d: Build Web Components with Vite 8 and Rolldown, preserving registration side effects and library chunk execution order. Preserve demo Web Component entry and chunk URLs with static-copy 4. Align workspace tooling with Vitest 5 and migrate browser tests to asynchronous rendering.

  Center boolean checkboxes and clear action when used inside a mixed-type selector.

- 2caadba: Forward catalog translation warnings through the Web Component `diagnostic`
  event, including live missing-parameter recovery, without changing form data.
- 0088552: Declare the source libraries and CSS plugins as build dependencies. The published Web Component bundles and their type declarations have no external imports, so consumers only need the bundle.
- a1a5ead: Set the Web Component host color scheme explicitly for light, dark, and system modes. Flowbite now exposes its selected mode on the host so native controls and scrollbars use the same appearance as the form.
- 2caadba: Forward validator-owned author diagnostics from each Web Component's default
  AJV instance to its composed `diagnostic` event. Denied dynamic-default scripts
  now reach the host without changing form data or validity. Default validators
  start a fresh diagnostic interval when the authored schema changes; restoring
  the same schema object after a valid interval reports an active warning again,
  while data-only updates continue to reuse the validator.

## 1.0.2

### Patch Changes

- bfcaa62: Correct browser web-component exports and published TypeScript declarations, validate packed artifacts for all packages, fix the Flowbite AG Grid CSS selector, and prepare independent npm consumers.
- Updated dependencies [bfcaa62]
  - @chobantonov/jsonforms-svelte@1.0.2
  - @chobantonov/jsonforms-svelte-extended@1.0.2
  - @chobantonov/jsonforms-svelte-skeleton@1.0.2
  - @chobantonov/jsonforms-svelte-skeleton-extended@1.0.2

## 1.0.1

### Patch Changes

- 79b2ff4: Publish the initial npm packages for the core Svelte bindings, Flowbite and Skeleton renderer sets, extended helpers, and web components.
- Updated dependencies [79b2ff4]
  - @chobantonov/jsonforms-svelte@1.0.1
  - @chobantonov/jsonforms-svelte-extended@1.0.1
  - @chobantonov/jsonforms-svelte-skeleton@1.0.1
  - @chobantonov/jsonforms-svelte-skeleton-extended@1.0.1
