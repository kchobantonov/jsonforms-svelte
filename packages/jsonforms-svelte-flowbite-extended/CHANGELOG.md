# @chobantonov/jsonforms-svelte-flowbite-extended

## 2.0.0

### Major Changes

- b52b1dd: Cancel obsolete file reads on replacement, external data/schema/readonly changes and unmount. Ignore stale load/progress results without overwriting the current value or closing a newer progress dialog.

  Follow the file specification's cancellation contract: cancelling the native chooser or an active attachment clears the scoped value using the normal Clear behavior. Internal cancellation and failed reads preserve existing stored data. Hosts that relied on chooser cancellation retaining an existing attachment must account for this change.

  Honor explicit picker `accept` before schema media-type hints, including an empty filter. Localize progress, Cancel, Clear and conversion-failure messages in English and Bulgarian. Flowbite retains its native Fileupload and CloseButton components while providing a translated clear action and cancelling reads when its progress dialog is dismissed.

  Display filenames retained in persisted binary values and localized fallback text for base64 attachments. Keep the last committed local filename when a replacement is rejected; external data replacements cannot retain another value's filename.

- b52b1dd: Correct Svelte peer minimums to match APIs and native UI dependencies: core/shared extended require Svelte 5.20, Flowbite requires 5.40, shadcn requires 5.33, and Skeleton requires 5.29. Existing applications on Svelte 5.50.1 remain compatible.

### Minor Changes

- b52b1dd: Support the shared color input and serialization profile, including RGB, HSL and HSB inputs, hex/RGB/HSB output, and alpha-preserving picker edits. Keep incomplete text as a local draft and retain invalid incoming values. Align the color format validator with supported input syntax.

  Honor namespaced color defaults and local overrides, support picker-only entry with a clear action, and localize picker actions and feedback in English and Bulgarian. Existing hexadecimal pattern and mask exports remain available for consumers that explicitly require hex-only input.

- b52b1dd: Support homogeneous file arrays, including referenced item schemas, across native renderers and delegated file cells. Append each batch atomically, preserve existing attachments on read failure, enforce authored array-count restrictions, deduplicate unique values, and remove duplicate occurrences by position. Add bounded persisted filenames and localized attachment actions.
- b52b1dd: Use localized native buttons and filename badges for file selection, with a bounded row of controls in table/grid cells. Keep platform file inputs hidden and preserve encoding, cancellation and readonly behavior. Make Flowbite file feedback open explicitly on focus and activation. Associate Skeleton field labels with their primary control instead of wrapping compound controls and attachment names.
- b52b1dd: Preserve converted JSON editor drafts and valid edit formatting independently of committed data. Add opt-in owned parse-error publication, reactive English/Bulgarian editor actions and feedback, and shared config support for code-editor options. Preserve other validation messages and enforce host readonly state even when native editor options request editing.

  Dispose the editor before its owned model, and use the same default occurrence-highlighting setting as the demo editors to avoid background requests during teardown.

  Register converted-JSON section schemas per editor model, resolve local references against the document root, and remove only owned registrations. Preserve explicit null and literal schema data, and prevent native options from replacing the bound model, language, theme or value. Guard cancelled completion callbacks that reach an already-disposed owned model.

  Resolve Monaco error publication from local options, then namespaced global defaults. Replace local Monaco option bags wholesale so global editor options and action arrays cannot leak into an authored override.

- b52b1dd: Add Link renderers with translated labels, shared URL policy, safe new-window attributes and non-navigating text for empty or refused destinations. Flowbite uses its native anchor component; shadcn and Skeleton use semantic anchors with their text-link styling.

### Patch Changes

- a1a5ead: Reveal newly added AG Grid rows on the correct native pagination page. When a filter hides a new row, show translated feedback and a control to clear the filters.
- a1a5ead: Apply authored array-panel collapse options to AG Grid arrays while retaining the mounted grid and its sort state across collapse and reopen.
- a1a5ead: Keep focus on embedded controls inside AG Grid cells by suppressing AG Grid's own cell focus, matching the React adapters. Cover live readonly generated cells and readonly row-detail inspection in each extended family.
- a1a5ead: Preserve JSON Forms cell rendering for AG Grid native columns that identify a schema field by `colId` alone. Name primitive-array value columns `value` so React-compatible native overrides reach them. Honor authored row-drag columns, including grouped and computed columns, without adding a duplicate generated drag handle.
- a1a5ead: Prepare pending cell edits before AG Grid Add and drag reorder, block composition and duplicate activation, and recheck current permissions, owner and row order before changing data. Honor live disableAdd and readonly state in toolbar actions and native drag options. Retain sorting guards and native drag-column overrides; detect quick, external and column filters through AG Grid’s native filter-state API before allowing reorder.
- a1a5ead: Sort and filter AG Grid composite columns by their displayed Control summary text instead of the raw object value.
- 2caadba: Keep AG Grid filters active when navigating to an error in a filtered-out row. Open its row-detail dialog or panel directly, and return dialog focus to the visible error-navigation action on cancellation.
- a1a5ead: Give generated AG Grid drag and row-detail columns the stable `$drag` and `$detail` IDs used by React. Keep the drag column at 38px and the detail column pinned on the right.
- 2caadba: Reject AG Grid edit requests after their owning array control becomes hidden.
- a1a5ead: Route AG Grid native editor requests through JSON Forms data instead of mutating its wrapped rows. Preserve sorted source identity and occurrence keys, primitive array edits, literal dotted property names, readonly and stale-row guards, pending-draft coordination, and authored edit-request callbacks.
- a1a5ead: Mark required AG Grid columns with an asterisk, including grouped native columns, while honoring grid-wide and per-cell `hideRequiredAsterisk` options. Remove the generated row-drag column while a grid is read-only and restore it when editing is enabled. Share one injected runtime stylesheet per root and remove it after the last grid unmounts, preserving host-supplied styles.
- a1a5ead: Open AG Grid side-panel row details when a row background is clicked, while preserving cell controls and forwarding the native row-click callback.
- a1a5ead: Show each AG Grid row's validation indicator beside its detail action, retaining the correct row error through sorting and validation updates.
- 2caadba: Show localized AG Grid row-detail Select hints on keyboard focus in native and Web Component hosts, with Escape dismissal and retained focus.
- 2caadba: Refresh AG Grid cell hosts when their source row changes, so virtual Label summaries display the committed row value in native and Web Component forms.
- 2caadba: Show localized AG Grid Add and Remove toolbar hints on keyboard focus in native and Web Component hosts. Export the Shadcn and Skeleton action tooltip adapters for the extended grid renderers.
- a1a5ead: Replace AG Grid's raw-message error badge with each renderer's structured validation disclosure, preserving live translation and host feedback across validation modes.
- a1a5ead: Show array-level validation messages before a short localized child-error notice in normal tables and AG Grid. Check only for child-error presence unless the count option is enabled, and reuse normal-table error positions for pagination and first-invalid-item navigation. The action navigates across pages and reveals rows hidden by active grid filters without expanding field errors into the array header.
- b52b1dd: Show array-own validation explanations independently of child-error summaries in table, stacked, master/detail and AG Grid renderers. Honor `showValidationIndicator: false` alongside `hideArraySummaryValidation` when hiding child summaries, while retaining array and item validation.
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
- aba358e: Add localized native clear actions to boolean checkboxes, switches and table cells. False remains a present, clearable answer; clearing an ordinary property removes it instead of switching it off. Dynamic properties retain their key, and array-item clearing preserves the slot using the boolean empty value. Actions appear on hover/focus or touch, respect clearable and readonly state, and remain separate from property deletion.

  Keep AG Grid boolean widgets centered with their clear action at the cell edge, and align the Flowbite color popup trigger with its text input.

- 2caadba: Report conflicting Button action and script authoring through the diagnostic channel in native and Web Component hosts, while keeping the action usable and avoiding an in-form warning.
- b52b1dd: Support portable Button options.fullWidth across native renderer families. Fill the allocated layout cell without changing its span, and import the canonical two-column language-button example.
- 2caadba: Cancel pending Button actions when host data, schema, UI schema, or config is replaced before or after edit flushing, while allowing form-owned commits such as completed IME input.
- 2caadba: Allow a Button action to consume a completed pending edit when the host echoes that edit and recreates equivalent UI schema during the flush. Keep pre-flush host replacement guards and cancel the action if its authored target or flushed data changes afterward.
- b52b1dd: Require explicit host permission before compiling Button string scripts. Preserve trusted callback support, await asynchronous actions, prevent duplicate activation, normalize action parameters, and display translated execution diagnostics. Dispatch buttons without a declared command using an empty action and report action/script conflicts while preserving action precedence.
- a1a5ead: Report visible denied Button scripts through the shared `script.evaluationDisabled` author diagnostic, once per permission interval in each renderer family.
- 2caadba: Use only canonical authoring locations and names for template language, Monaco error publication, section and Stepper indicators, layout and AG Grid sizing, array sort actions, mask tokens, ImageView source fields, Button action, label and stable-name fallback, catalog parameters, and readonly options/config. Remove the explicit columns layout adapter and compatibility-only tests.
- a1a5ead: Apply flat and local initial-focus configuration to enum selects, searchable choices, radio choices, sliders and extended controls including Cron. Capture the effective focus request when a control mounts so later data or option changes do not reclaim focus, while preserving disabled and readonly behavior across standard and extended controls.
- 2caadba: Show localized Color control Clear hints on keyboard focus in native and Web Component hosts, with Escape dismissal and retained focus.
- a1a5ead: Associate color text and swatch controls with visible help and invalid-color feedback.
- aba358e: Add HEX, RGB and HSB channel views and opacity editing to color pickers using each renderer library's native popup and field components. Reopening restores the configured save-format view; changing views preserves stored data. Keep invalid values and rejected transparent hex3 drafts intact, retain picker-only clearing, and translate channel labels through the JSON catalogs and host translator.

  Honor local `options.format` selection for color and duration on string schemas, matching the Antd reference and canonical examples. Keep these testers inapplicable to incompatible schemas and non-Control UI elements.

  Keep color selection in one popover with an inline saturation/brightness surface and hue slider. Remove the nested browser chooser across all three UI families; preserve alpha, channel formats, readonly guards and compact cell triggers.

- 2caadba: Show localized ColorPicker action hints on hover and keyboard focus in native and Web Component hosts while preserving picker clicks and trigger identity.
- 2caadba: Keep extended ColorPicker panels inside short viewports, with internal scrolling and reachable channel fields in native and Web Component hosts.
- aba358e: Keep cron picker labels and native controls on compact horizontal rows, matching the AntD interaction. Replace repeated full-width Every buttons with localized inline reset icons. Use Skeleton's native Combobox for multiple values and retain staged Apply/Cancel behavior and advanced cron text.
- aba358e: Place native cron picker icon triggers and clear actions inside the input frame.
  Match the color control clear button and show it only for nonempty editable values
  while the cron field is hovered or focused.
  Replace text visibility buttons for table and AG Grid detail panels with native
  icon buttons and translated tooltips, retaining accessible names and expanded state.
  Group detail visibility beside the table add/delete actions.

  Avoid repeated empty composition publications when readonly text fields are
  inspected in a detail dialog.

- aba358e: Keep color format, channel values and opacity in one compact row with translated accessible labels. Bound shadcn cron option lists, widen its picker, reserve room for clear actions and reveal centered reset icons only on hover or focus. Align selected text to the logical start and use the configured icon library consistently for password and panel visibility.

  Reveal OTP clear actions only on field hover or focus. Disable shadcn PinInput's optional password-manager width adjustment so focusing a short code does not introduce horizontal scrolling.

- 2caadba: Let vertical and horizontal control labels wrap at narrow widths in Flowbite, Shadcn and Skeleton. Long localized file labels remain readable above their pickers, and long checkbox labels keep their full text beside the control.
- b52b1dd: Add the six-field cron profile, native structured schedule pickers, staged actions, translated diagnostics, and the canonical scheduled-jobs example with English and Bulgarian catalogs. Preserve invalid expressions and advanced syntax for raw editing.

  Preserve validation constraints when delegating mixed-type schemas, narrow same-value composition branches without changing child schemas, and resolve escaped property names correctly. Explicit mixed types now retain their renderer when composition or enum constraints are present.

  Add mixed nested and JSON code presentations, selected-type detail dispatch in tree mode, and native mixed frames with portable collapse precedence. Preserve numeric editor intent and distinguish clearing a value from clearing its type. Apply the shared confirmation policy to destructive mixed actions and guard delayed dialogs against replaced values and permissions. Import the canonical mixed-control example with English and Bulgarian JSON catalogs.

- 2caadba: Show a localized Cron Choose hint on hover and keyboard focus in native and Web Component hosts. Escape also closes Flowbite's focus-opened picker so the following click opens it normally.
- 2caadba: Show localized Cron control Clear hints on keyboard focus in native and Web Component hosts, with Escape dismissal and retained focus.
- a1a5ead: Register compact cron table cells in the extended renderer sets so cron fields retain their editor and picker inside normal tables and grids.
- 2caadba: Show localized focus hints for multivalue Cron picker field Clear actions while preserving keyboard access and the exact draft change.
- a1a5ead: Associate Cron text and picker controls with visible help and validation errors.
- 2caadba: Expose required state on the editable Cron input and Monaco textbox across all three renderer families, including when the visual required marker is hidden.
- 2caadba: Keep the outer Cron editor panel inside short viewports with a scrolling content frame in native and Web Component hosts.
- a1a5ead: Associate Duration text and picker controls with visible help while preserving incomplete-draft feedback.
- b52b1dd: Share duration parsing and draft handling across native pickers. Use separate weeks/component modes and native unit selectors, preserve exact imported values, accept duration quantities beyond clock-field limits, and retain incomplete drafts without rounding or overwriting committed data. Publish pending validity separately from schema errors and provide JSON-catalog English/Bulgarian feedback.
- 2caadba: Bound extended Duration editor panels to short viewports and scroll their
  unit fields internally across all three renderer families.
- b52b1dd: Preserve equivalent duration spellings when applying an unchanged picker value. Move picker units, actions, hints and accessible names into the shared translation catalogs with English and Bulgarian defaults.
- 2caadba: Count array child errors and locate invalid AG Grid rows using exact JSON Pointer members beneath literal dotted paths.
- 2caadba: Publish file-size, Monaco, and duration draft errors at exact scoped pointer members.
- aba358e: Honor readonly independently of disabled state in color, duration, file and null
  controls. Preserve focusable readonly text, disable mutating picker actions,
  close duration drafts and cancel pending color/file operations when permissions
  change. Use the native shadcn checkbox readonly API for null values.
- a1a5ead: Honor live global and local `disableAdd` and `disableRemove` options in file-array controls. Disabled commands now guard both their UI affordances and handlers, including in Web Components.
- a1a5ead: Reject a restricted non-unique file batch that would exceed `maxItems` before starting file conversion. Keep the post-conversion count check for `uniqueItems`, where encoded duplicates can reduce the final count.
- 2caadba: Show localized File control Clear hints on keyboard focus in native and Web Component hosts, with Escape dismissal and retained focus.
- 2caadba: Keep long compact File feedback inside short viewports with wrapped, scrollable popup content in native and Web Component hosts.
- b52b1dd: Use persisted filenames for the default AG Grid filtering and sorting of single and multiple file columns. Nameless attachments contribute empty search text, keeping encoded contents and MIME metadata out of searches. File cells continue editing the original stored values, and explicit column overrides retain precedence.

  Stop inheriting the parent grid variant into cell controls so array-valued file columns render file pickers instead of nested grids. Explicit per-column variants remain supported.

- 2caadba: Cancel pending file reads and reject file actions when a rule hides their control.
- a1a5ead: Discard selection-time file-size metadata when its encoded value leaves the control. Importing the same string later no longer revives an error from a removed attachment. Preserve metadata for retained values, including array reordering, and preserve unrelated host errors.

  Mount AG Grid cell components independently of parent reactive effects so asynchronous feedback remains live after tab transitions, including in Shadow DOM. Cancel a scheduled mount if AG Grid destroys the cell first, and use the latest cell props if it refreshes before mounting.

- b52b1dd: Separate rejected file selections and read failures from stored-data validation. Show local warning/error feedback, clear it on external replacement, and use compact native popups in delegated table/grid cells. Add English and Bulgarian size-limit fallbacks and a shared cell-presentation context for delegated controls.
- 2caadba: Show localized File control picker hints on keyboard focus in native and Web Component hosts, preserving file chooser behavior.
- a1a5ead: Associate visible File pickers with wrapper help and local rejected-file feedback, including compact cells.
- 2caadba: Announce required File picker controls through the visible picker button’s localized accessible name, including when the visual required asterisk is hidden.
- 2caadba: Show localized File attachment Remove hints with filenames on keyboard focus in native and Web Component hosts.
- a1a5ead: Apply every configured inclusive and exclusive file-size bound independently. A weaker inclusive limit no longer hides a stricter exclusive limit; schema values retain precedence over UI options for the same bound key.
- a1a5ead: Keep file-size metadata only for attachments actually appended to a unique file array. Selecting an encoded duplicate no longer assigns selection-time size errors to a previously imported attachment or dispatches an unchanged array.
- acc5dfa: Style the AG Grid collection toolbar Delete action like the normal Flowbite table Delete action, including its disabled appearance and button size.
- a1a5ead: Keep the Flowbite color swatch clickable in narrow table cells when the input's clear adornment overlaps it.
- acc5dfa: Show populated Cron dialog dropdown Clear actions only while the dropdown is hovered or focused, including keyboard and touch access.
- 2caadba: Show the nested Cron reset hint on keyboard focus, and keep the picker open with focus on its reset button when Escape dismisses that hint.
- 2caadba: Keep the Cron minute choices inside the picker's visible scroll frame in short viewports, preserve wheel and touch hit testing, and scroll keyboard-active options into view.
- a1a5ead: Synchronize the duration editor with Flowbite's native popover state so Escape reliably closes the picker and returns focus to its trigger, including inside a Web Component.
- 2caadba: Keep AG Grid boolean checkboxes centered when their clear actions have trailing hidden elements.
- acc5dfa: Keep Flowbite input borders in AG Grid row detail dialogs by limiting borderless grid cell styling to controls outside dialogs.
- 2caadba: Give AG Grid and its filter menu opaque Flowbite palette surfaces in light and dark native and Web Component hosts.
- b52b1dd: Update Flowbite Svelte to 1.33.1 for development and bundled hosts. Adapt its native horizontal split panes for RTL keyboard, mouse and touch resizing, including nested panes and drag cleanup. Apply the same compatibility action to mixed-property trees and the demo splitter while retaining native Flowbite components.
- b52b1dd: Use Flowbite CloseButton's native name and ariaLabel props for translated date, time, date-time and duration clear actions. Hide those actions when the value is empty or clearing is disabled.
- a1a5ead: Make persisted single and multiple attachment names keyboard-focusable, including when Remove and Clear are unavailable. Preserve full filename text and title in narrow file fields.
- 2caadba: Apply the shared local/global option merge policy to AG Grid controls and cells
  and composite-cell dialogs. Keep local arrays and AG Grid option bags as whole
  replacements while preserving explicit local false, zero and empty values.
- a1a5ead: Apply flat and local height dimensions to AG Grid in all three renderer families. Share the dimension conversion used by split layouts.
- b52b1dd: Use resolved Label-summary text for AG Grid filtering and sorting, sharing Label translations, declared interpolation parameters and dynamic-value permissions. Refresh search values on data, locale and permission changes while preserving source row identity and native value-getter overrides. Keep expression evaluation lazy and hide unresolved expressions from search.
- b52b1dd: Refresh native AG Grid messages after locale or host-catalog changes, retaining grid sorting, filtering, paging, widths and selection. Preserve open isolated dialogs and invalid drafts before recreating the grid. Respect native locale overrides, including empty messages. Use native family buttons for grid add/remove actions.
- b52b1dd: Translate asynchronous grid loading and failure messages through the shared JSON catalogs and host translator, including English and Bulgarian defaults.
- a1a5ead: Use form-owned occurrence identities for AG Grid rows, cell editors and native/grid detail panels. Preserve selected details and Monaco diagnostics through local moves and deletion of other rows; clear ownership when the selected row is removed or externally replaced. Remove the grid's separate positional identity heuristic so duplicate values cannot inherit another row's editor or errors.

  Refresh retained cell bindings after a move even when their displayed values are unchanged, so subsequent edits write to the new source path. Avoid replacing native row data for validation-only updates.

  Provide optional occurrence keys to the shared row-detail selection helper and collection context to detail content, retaining the conservative fallback for callers without keys. Replaced native row occurrences dispose open detail dialogs so stale drafts require reopening.

- a1a5ead: Present file controls as a single input-like field with a file-picker icon, attached filenames, and an inline clear action. Keep the same arrangement in compact table cells while preserving upload limits, validation, and accessible picker labels.
- a1a5ead: Carry the current source item through collection rendering contexts so interpolated Labels use the rendered row even when a literal dotted property name collides with a nested data path.
- a1a5ead: Replace global option arrays with explicitly supplied local arrays, including empty arrays, and replace Monaco and AG Grid option bags as units. Keep per-field overrides for other nested option objects across the Svelte renderer families.
- b52b1dd: Use catalog translations for native Select placeholders and clear actions. Keep Flowbite Select and CloseButton components, restore focus after clearing, and preserve explicit empty placeholders. Remove duplicate English placeholder options from cron, duration, month/year and page-size selectors.
- b52b1dd: Add lazy Markdown labels with basic and extended grammar, shared URL policy, escaped text rendering, and English/Bulgarian diagnostics. Keep rich choice-card content inert and render its links as text so native radio selection remains the only interaction. Add lazy CEL interpolation with declared text parameters, gated data namespaces, locale formatting and safe Markdown substitutions. Include the spec Label interpolation and Markdown examples in the demo catalog.

  Improve demo message fallback and avoid stale interpolation parameters. Supply separate EN/BG translation supplements for missing spec-example labels without modifying source fixtures.

- 2caadba: Emit structured, safe Monaco author warnings for inactive themes, diagnostic failures, editor load failures and unavailable error publication stores.
  Add severity to shared UI-schema, dynamic-default and Button script author diagnostics.
  Include severity on template language, permission and URL refusal warnings.
  Add structured severity to shared catalog warnings and a stable message and
  safe option details to invalid Group/accordion collapsed warnings.
  Align Button permission and Monaco option warnings in all native
  extended families. File read failures report a safe coded error without
  logging the caught exception.
- a1a5ead: Apply local and flat Monaco `theme`/`mode` options to built-in light/dark appearance with live updates. Guard global fallback changes when another Monaco editor exists, preserve an active custom host theme, and diagnose inactive named themes without repainting other editors. Add cross-family config precedence and dynamic language coverage.
- a1a5ead: Track Monaco diagnostic requests by model, content version and logical target. Reject obsolete worker results, keep participating validation pending until the current result arrives, and report validation failures with localized feedback. Preserve unrelated host errors and retain invalid drafts when the same object target moves.

  Isolate external target and schema replacements with new owned model URIs while retaining the editor instance and selection. Preserve the model during ordinary edit feedback. Query JSON, JavaScript/TypeScript and CSS-family diagnostics directly so empty results also complete validation, and prevent validity publication from triggering a validation loop.

- a1a5ead: Apply Monaco JSON conversion and schema-validation mode only while the resolved editor language is JSON. A data-bound switch to JavaScript now retains language-service error publication and retracts it on return to JSON.
- a1a5ead: Apply flat and local code-editor width and height dimensions in all three Svelte renderer families. Numeric values use CSS pixels, CSS dimension strings retain their authored units, and removed nested geometry keys stay ignored.
- a1a5ead: Associate Monaco's focusable editor input with visible field help and invalid state in each extended renderer family.
- b52b1dd: Publish one owned, translated Monaco language-error summary when propagateErrors is enabled. Ignore warnings and other models, retract summaries on correction or language changes, and preserve host errors. Avoid republishing JSON Schema diagnostics already handled by the form validator.

  Import the canonical additional-errors example with English/Bulgarian host catalogs and simulated server actions. Editing a field clears only that field's simulated server error; no request is sent.

- a1a5ead: Name the rejected file in localized file-size warnings while retaining the previously committed attachment. Count-limit warnings now state the actual maximum and that existing attachments were kept, matching the React copy.
- b52b1dd: Use a readable foreground for Flowbite's default yellow warning Button while
  retaining the native palette and explicit styling overrides. Correct the Skeleton
  Web Component's native surface utility so its background follows light/dark mode.
- a1a5ead: Use family typography for interpolated and Markdown Labels, with block-safe Markdown wrappers and a working `typography: false` override.
- b52b1dd: Add a trusted compiled Svelte component profile for TemplateLayout with live data, core errors, host context, permission state, translation and delegated Slot components. Compiled templates operate without runtime script evaluation permission.

  Diagnose unsupported string-template languages, avoid child-name collisions, preserve literal slot names, load Ractive only when allowed and visible, and retain template DOM during data-only updates. Refresh live host context independently of schema validation errors.

  Import the canonical template-engine fixture with English/Bulgarian catalogs and a native Svelte host adapter. JSX remains an explicitly unsupported string engine in the default Svelte registry.

  Provide defineNativeTemplate to mount compiled components and delegated slots in their owning Svelte runtimes, including separately bundled Web Component hosts.

- b52b1dd: Preserve IME drafts in native text, multiline and suggested-string inputs, enforce schema length in Unicode code points, and cancel pending edits on host replacement or permission changes. Preserve later typing across feedback from an earlier commit. Button actions flush completed edits before reading form data and do not run while composition remains unfinished.
- a1a5ead: Associate visible Null checkbox help with the focusable checkbox while preserving authored description IDs.
- 2caadba: Use portable file catalog messages for attachment count limits, read failures, reading progress, multi-file clear actions, and numbered unnamed attachments. Keep the existing atomic read and permission behavior.
- b52b1dd: Support portable table columns, whole-row presentation columns, and accessible pointer/keyboard resizing with RTL and English/Bulgarian labels. Preserve resized widths across row edits and pagination.

  Apply portable pagination and columns to AG Grid, with independent native pagination overrides and native column-list precedence, including empty lists, groups, and computed columns.

- b52b1dd: Move renderer UI translations into JSON catalogs, remove locale-specific component branches, and preserve dynamic host translation overrides.
- b52b1dd: Add opt-in whole-row table and AG Grid detail dialogs and persistent panels with item-relative authored/registered/generated layouts, isolated drafts, stale replacement protection, and readonly inspection. Keep hidden columns available to row details and localize row actions in English and Bulgarian.

  Inject scoped Svelte component styles into their owning shadow root so Web Component content retains component-level layout, focus, and interaction styles, including column resize handles.

  Support Label-based cell summaries through renderer dispatch, with React-compatible summary-only actions and readonly detail inspection. Integrate the canonical table-row-details example with English/Bulgarian catalogs.

- b52b1dd: Use the shared message catalogs for remaining scalar clear actions and enum placeholders, including duration controls. Preserve existing host translation overrides and authored placeholders.
- b52b1dd: Apply the shared always/never/complex confirmation policy to collection deletion, additional properties and tuple items, direct composite-cell removal and AG Grid batches. Flush pending edits and recheck permissions, constraints, path and owner data before committing. Keep detail-editor draft actions isolated until Apply.

  Use native translated dialogs, fix Flowbite dialog names and shadcn nested cancellation buttons, and integrate the canonical destructive-confirmation example with English and Bulgarian catalogs.

- 2caadba: Report invalid split-layout resizable and container dimension options, invalid local minimum item widths, and resizable hints outside split layouts through the author diagnostic channel while preserving fallback sizing behavior.
- a1a5ead: Report unsupported splitter wrap/span and invalid pane sizing hints as coded developer warnings instead of form validation alerts. Keep the splitter layout behavior and localized diagnostic messages.
  Report repeated invalid hints separately for each pane, with the pane index and option in structured warning details.
- b52b1dd: Complete portable splitter sizing: fixed CSS dimensions, weighted remainder, vertical content sizing, per-pane bounds, gaps, alignment and constrained overflow. Preserve resized shares and mounted controls during data updates and responsive stacking.

  Retain native Flowbite Pane/Divider components with a shared bounded controller because the native group lacks controlled per-pane constraints. Forward shadcn's native Resizable layout API and preserve the adapter during component sync. Harden drag ownership and cancellation, and add localized sizing examples with browser coverage for native and Web Component hosts.

- b52b1dd: Share splitter visibility and weighted initial sizing across renderer families. Honor disabled resizing while keeping the native boundary visible, localize handle names and unsupported-wrap/span diagnostics, and clean up active Flowbite/Skeleton drags on removal. Add the source split-layout demo with English and Bulgarian supplements.

  Fixed child dimensions and min/max constraints remain outside this initial weighted sizing implementation.

- 2caadba: Report Ractive template render failures again when an author replaces one malformed template with another, while keeping data-only updates quiet.
- b52b1dd: Translate table and AG Grid column headings using JSON Forms schema and path label keys. Refresh grid columns when the locale, translator or control path changes, preserve explicitly empty translations, and retain authored native column headings.
- b52b1dd: Tighten types for dynamic-default arguments, UI-schema testers, Monaco options, and
  native button overrides. Preserve reactive updates while bringing the extended
  packages under the shared Svelte lint checks.
- 2caadba: Re-report an unhandled action after a host briefly installs and removes its action handler, even when the handler was never invoked. Repeated clicks without a handler remain deduplicated.
- b52b1dd: Allow size-invalid selections when restriction is disabled while publishing owned size errors based on original file byte metadata. Preserve host errors, relocate errors after attachment reordering, and clear errors after replacement or removal. Pending reads publish pending validity and clear it after completion or cancellation. Rejected selections and read failures remain local operation feedback.
- a1a5ead: Keep compact file-operation feedback usable by keyboard in AG Grid Web Components. Enter opens the feedback popup, Escape closes it without an immediate focus-triggered reopen, and the message remains visible inside the host ShadowRoot.
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
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
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [acc5dfa]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
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
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
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
- Updated dependencies [2caadba]
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
- Updated dependencies [a1a5ead]
- Updated dependencies [aba358e]
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
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
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
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [acc5dfa]
- Updated dependencies [a1a5ead]
- Updated dependencies [acc5dfa]
- Updated dependencies [a1a5ead]
- Updated dependencies [acc5dfa]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [1fddc68]
- Updated dependencies [59330a6]
- Updated dependencies [2caadba]
- Updated dependencies [59330a6]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [acc5dfa]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [acc5dfa]
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
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
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
- Updated dependencies [2caadba]
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
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
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
- Updated dependencies [aba358e]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
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
- Updated dependencies [a1a5ead]
- Updated dependencies [44ece2e]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
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
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
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
  - @chobantonov/jsonforms-svelte-flowbite@2.0.0
  - @chobantonov/jsonforms-svelte@2.0.0

## 1.0.2

### Patch Changes

- bfcaa62: Correct browser web-component exports and published TypeScript declarations, validate packed artifacts for all packages, fix the Flowbite AG Grid CSS selector, and prepare independent npm consumers.
- Updated dependencies [bfcaa62]
  - @chobantonov/jsonforms-svelte@1.0.2
  - @chobantonov/jsonforms-svelte-extended@1.0.2
  - @chobantonov/jsonforms-svelte-flowbite@1.0.2

## 1.0.1

### Patch Changes

- 79b2ff4: Publish the initial npm packages for the core Svelte bindings, Flowbite and Skeleton renderer sets, extended helpers, and web components.
- Updated dependencies [79b2ff4]
  - @chobantonov/jsonforms-svelte@1.0.1
  - @chobantonov/jsonforms-svelte-extended@1.0.1
  - @chobantonov/jsonforms-svelte-flowbite@1.0.1
