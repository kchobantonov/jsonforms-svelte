# @chobantonov/jsonforms-svelte-shadcn-webcomponent

## 1.1.0

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
- b52b1dd: Require Bits UI 2.19.5 for upstream Shadow DOM focus restoration, popup dismissal
  and lifecycle fixes. Keep the shadcn demo and Web Component on the same native
  component version.
- 2caadba: Report conflicting Button action and script authoring through the diagnostic channel in native and Web Component hosts, while keeping the action usable and avoiding an in-form warning.
- aba358e: Cancel choice-card branch confirmations when their data, schema, path or edit permissions change. Recheck the captured target before committing a confirmed branch change. Bound shared shadcn Select popups by the available viewport and a 16rem maximum while preserving native scrolling and keyboard navigation.
- 2caadba: Re-report an invalid categorization initial name when a live UI-schema update corrects and then reintroduces it, without changing the selected category or form data.
- a1a5ead: Keep keyboard focus on the visible fallback tab, stepper header, or accordion header when a selected category is hidden. Preserve Skeleton's focused native triggers, and keep conditional shadcn step registration in DOM order. Track unnamed and duplicate-named categories by their UI-schema object so selection survives sibling reorder without duplicate keyed entries. Reconcile equivalent unnamed category objects across UI replacement so a data update does not remount nested tabs or lose focus.
- 2caadba: Let vertical and horizontal control labels wrap at narrow widths in Flowbite, Shadcn and Skeleton. Long localized file labels remain readable above their pickers, and long checkbox labels keep their full text beside the control.
- a1a5ead: Expose current automatic schema validation in combined-validity notifications. NoValidation no longer reports an empty-error form as valid. Notify hosts when validation modes change without a data edit, preserving pending and additional-error contributions for submit guards.
- b52b1dd: Include shared extended renderer sources when generating bundled Tailwind utilities. Include Flowbite's native extended renderer sources as well so compact file controls and other extended widgets retain their declared dimensions and theme utilities.
- a1a5ead: Render absolute references to external schema documents already registered with the host Ajv instance from identified or anonymous roots while validating against the original schema. Support transitive registered references, nested `$id` resources and document-local anchors without fetching URLs or duplicating nested resources. Diagnose missing documents, anchors, JSON Pointers and anonymous-root relative refs even in NoValidation while preserving data and recovering when the host supplies Ajv. Report `$dynamicRef` as unsupported for rendering rather than opening an unconstrained editor. Pass JSON schema resources through each demo and Web Component, with native and production interaction coverage across all three renderer families.
- 2caadba: Keep missing ImageView alt text on the author diagnostic channel without showing an in-form warning while the image renders. Missing or refused image content still has a visible explanation.
- aba358e: Keep native sliders while distinguishing unset and invalid data from their provisional thumb position. Add localized clearing and value announcements, readonly commit guards, zero-based decimal increments, integer-safe fractional multiples and exclusive bounds. Preserve primitive array slots when clearing, and allow explicit selection when only one value fits the range. Forward accessible value text to the shadcn slider thumb and tooltip.

  Initialize Skeleton sliders after their containing root is available and share the native thumb ID with its tooltip, preserving shadow-root measurement and keyboard focus.

- 2caadba: Report invalid explicit numeric steps to form authors while retaining the safe input step fallback and keeping configuration warnings out of the form.
- b52b1dd: Add opt-in whole-row table and AG Grid detail dialogs and persistent panels with item-relative authored/registered/generated layouts, isolated drafts, stale replacement protection, and readonly inspection. Keep hidden columns available to row details and localize row actions in English and Bulgarian.

  Inject scoped Svelte component styles into their owning shadow root so Web Component content retains component-level layout, focus, and interaction styles, including column resize handles.

  Support Label-based cell summaries through renderer dispatch, with React-compatible summary-only actions and readonly detail inspection. Integrate the canonical table-row-details example with English/Bulgarian catalogs.

- 2caadba: Report unresolved UI-schema rule references through the author diagnostic channel and treat the rule as unmet until its reference resolves.
- 2caadba: Send unresolved and unsupported dynamic schema references through the author diagnostic channel while preserving their accessible fallback and invalid status.
- aba358e: Honor autocomplete on finite enum and const-oneOf choices using native library components. Search visible labels while retaining exact JSON values and distinct duplicate labels; do not commit query text. Add translated empty results, keyboard selection, clearing and readonly guards. Skeleton filters only user input and retains selected labels after host reload. Include the official shadcn Command components used by its Popover combobox composition.
- a1a5ead: Show Group and Category error indicators as soon as displayable section errors exist, independently of control touch. Keep pre-touch filtering local to each Control, so required-field text waits for blur while a section cue can guide navigation. Remove the form-scoped touch store.
- a1a5ead: Flip the Breadcrumb separator chevron in right-to-left layouts.
- a1a5ead: Align shadcn Checkbox and Radio Group borders, Field-label focus states, and Select group-heading and selected-indicator sizing with the pinned upstream component styles. The demo and Web Component copies now use the same visual tokens while retaining logical placement for RTL.

  Remove redundant Select item focus tokens and use the pinned upstream disabled-state selectors in both copies.

- a1a5ead: Align native and guarded chip fields and show one coherent focus border around the field instead of an inner input border or offset selected-tag ring.
- a1a5ead: Apply the default shadcn button hover color to native buttons as well as links.
- 2caadba: Localize the Shadcn dialog close button's accessible name in English and
  Bulgarian across native and Web Component renderer dialogs.
- a1a5ead: Use the pinned shadcn-svelte-extras Tags Input for unique free-string chips while preserving guarded fallback handling for repeated, typed, finite, and bounded arrays. Include both UI copies in the upstream sync audit and localize their tag removal buttons.
- a1a5ead: Forward the Resizable pane-group ref, restore Sheet overlay transitions, and align Field title and nested-label states with the pinned shadcn registry.
- a1a5ead: Make multi-select search opt-in through `options.autocomplete` and retain the hovered row highlight when a choice is toggled.
- b52b1dd: Use the official shadcn-svelte Input OTP Root, Group and Slot components instead of renderer-authored slot markup. Preserve masking, leading zeros, partial values and ordinary password cells. Consuming applications must install the input-otp component alongside the other required shadcn components.
- a1a5ead: Style native select option groups consistently with their options and highlight table rows containing an expanded control.
- a1a5ead: Use the installed Bits UI popover transform origin and valid tooltip arrow offsets in the shadcn Web Component overlay wrappers. Keep Badge transitions aligned with the pinned shadcn source.
- b52b1dd: Respect a split pane's inherited RTL/LTR direction when it differs from the document direction, including forms hosted in Shadow DOM. Retain native shadcn/PaneForge panels and adapt horizontal keyboard, mouse and touch input only when their direction differs from PaneForge's document-level calculation.
- a1a5ead: Forward Select item labels to Bits UI, expose the pinned Select.Value wrapper, and use the native Select content transform origin.
- a1a5ead: Use the shadcn-svelte-extras stepper for Shadcn categorizations, with circular step indicators and connecting lines. Keep category selection, validation indicators, optional navigation buttons, keyboard navigation, and responsive content bounds.
- a1a5ead: Style active tabs from Bits UI's `data-state="active"` attribute so category and composition navigation highlights follow the selected content in the shadcn renderer and Web Component.
- 2caadba: Sync the copied Input OTP slot structure to current Shadcn source in both
  hosts. Keep translated dialog close names in renderer-owned content rather
  than changing the copied Dialog component.
- 2caadba: Keep a clicked validation summary open when the pointer leaves its trigger before a keyboard action inside the summary.
- a1a5ead: Position Web Component popovers, tooltips, and select menus against the viewport so validation messages and date or date-time pickers remain visible outside scrollable demo panes.
- b52b1dd: Share catalog translation between demos and Web Components. Resolve each message through exact locale, language, English and the supplied fallback; preserve intentional empty strings and undefined misses. Cache parsed text substitutions while using current parameters on every call, and keep catalog expressions inert instead of executing lodash templates.
- 2caadba: Report invalid split-layout resizable and container dimension options, invalid local minimum item widths, and resizable hints outside split layouts through the author diagnostic channel while preserving fallback sizing behavior.
- 2caadba: Report invalid split-pane minimum and keyboard-step options independently, without repeating an unchanged warning during a live option update.
- b52b1dd: Keep Skeleton splitter handles above adjacent pane content and prevent browser scrolling from taking over touch resizing. Preserve the original touch during scoped-direction shadcn resizing when another finger starts or ends on the handle, and cleanly stop the native drag on cancellation.
- b52b1dd: Complete portable splitter sizing: fixed CSS dimensions, weighted remainder, vertical content sizing, per-pane bounds, gaps, alignment and constrained overflow. Preserve resized shares and mounted controls during data updates and responsive stacking.

  Retain native Flowbite Pane/Divider components with a shared bounded controller because the native group lacks controlled per-pane constraints. Forward shadcn's native Resizable layout API and preserve the adapter during component sync. Harden drag ownership and cancellation, and add localized sizing examples with browser coverage for native and Web Component hosts.

- 2caadba: Report Ractive template render failures again when an author replaces one malformed template with another, while keeping data-only updates quiet.
- 2caadba: Report an incompatible temporal save format again when the same mounted control moves to another data path.
- 2caadba: Re-report an unhandled action after a host briefly installs and removes its action handler, even when the handler was never invoked. Repeated clicks without a handler remain deduplicated.
- b52b1dd: Require live host permission for JavaScript computed defaults and isolate provider registrations per validator. Preserve cached-validator revocation and report unavailable browser query providers in server hosts.
- d4dd92d: Build Web Components with Vite 8 and Rolldown, preserving registration side effects and library chunk execution order. Preserve demo Web Component entry and chunk URLs with static-copy 4. Align workspace tooling with Vitest 5 and migrate browser tests to asynchronous rendering.

  Center boolean checkboxes and clear action when used inside a mixed-type selector.

- 2caadba: Forward catalog translation warnings through the Web Component `diagnostic`
  event, including live missing-parameter recovery, without changing form data.
- 2caadba: Apply the selected design-system variables to the Web Component's themed form wrapper as well as its host, so controls and portalled tooltips use the same light, dark and custom theme colors as native rendering.
- a1a5ead: Set the Web Component host color scheme explicitly for light, dark, and system modes. Flowbite now exposes its selected mode on the host so native controls and scrollbars use the same appearance as the form.
- 2caadba: Forward validator-owned author diagnostics from each Web Component's default
  AJV instance to its composed `diagnostic` event. Denied dynamic-default scripts
  now reach the host without changing form data or validity. Default validators
  start a fresh diagnostic interval when the authored schema changes; restoring
  the same schema object after a valid interval reports an active warning again,
  while data-only updates continue to reuse the validator.
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [acc5dfa]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [aba358e]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [d4dd92d]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [aba358e]
- Updated dependencies [d4dd92d]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [d4dd92d]
- Updated dependencies [a1a5ead]
- Updated dependencies [acc5dfa]
- Updated dependencies [d4dd92d]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [aba358e]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [aba358e]
- Updated dependencies [b52b1dd]
- Updated dependencies [aba358e]
- Updated dependencies [aba358e]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [aba358e]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [acc5dfa]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [aba358e]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [59330a6]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [aba358e]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [aba358e]
- Updated dependencies [aba358e]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [d4dd92d]
- Updated dependencies [aba358e]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [44ece2e]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [aba358e]
- Updated dependencies [b52b1dd]
- Updated dependencies [2e5054a]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [59330a6]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2e5054a]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [44ece2e]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [d4dd92d]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
  - @chobantonov/jsonforms-svelte-extended@2.0.0
  - @chobantonov/jsonforms-svelte-shadcn@2.0.0
  - @chobantonov/jsonforms-svelte@2.0.0
  - @chobantonov/jsonforms-svelte-shadcn-extended@2.0.0

## 1.0.2

### Patch Changes

- bfcaa62: Correct browser web-component exports and published TypeScript declarations, validate packed artifacts for all packages, fix the Flowbite AG Grid CSS selector, and prepare independent npm consumers.
- Updated dependencies [bfcaa62]
  - @chobantonov/jsonforms-svelte@1.0.2
  - @chobantonov/jsonforms-svelte-extended@1.0.2
  - @chobantonov/jsonforms-svelte-shadcn@1.0.2
  - @chobantonov/jsonforms-svelte-shadcn-extended@1.0.2

## 1.0.1

### Patch Changes

- 79b2ff4: Publish the initial npm packages for the core Svelte bindings, Flowbite and Shadcn renderer sets, extended helpers, and web components.
- Updated dependencies [79b2ff4]
  - @chobantonov/jsonforms-svelte@1.0.1
  - @chobantonov/jsonforms-svelte-extended@1.0.1
  - @chobantonov/jsonforms-svelte-shadcn@1.0.1
  - @chobantonov/jsonforms-svelte-shadcn-extended@1.0.1
