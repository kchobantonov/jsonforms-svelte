# @chobantonov/jsonforms-svelte-shadcn

## 2.0.0

### Major Changes

- b52b1dd: Use portable horizontal and vertical layout sizing with 16px gaps, explicit wrap control, fixed/span/weight modes, effective visible children and parent-axis Spacer sizing. Spacer reads its declared size; native separators support vertical orientation.

  Layout renderers use the portable sizing contract with options.layout.span, gridColumns and wrap.

- b52b1dd: Correct Svelte peer minimums to match APIs and native UI dependencies: core/shared extended require Svelte 5.20, Flowbite requires 5.40, shadcn requires 5.33, and Skeleton requires 5.29. Existing applications on Svelte 5.50.1 remain compatible.
- 2caadba: Keep tuple action accessible names current when deleting an earlier item renumbers a retained row. An explicitly supplied action label still takes precedence.

### Minor Changes

- b52b1dd: Add native choice-card renderers with typed value identity, branch detail resolution, translated labels, keyboard selection and configurable branch-change confirmation. Preserve enclosing properties when changing branches and restore selection when confirmation is cancelled.

  Use the shared detail resolver in tuple fields, mixed schema helpers and composite cells. Add the latest spec choice-controls demo, including English and Bulgarian generated/registered card detail examples.

- b52b1dd: Use full-header Group disclosure with mounted content, native Collapsible components in shadcn and Skeleton, and a native Flowbite Button. Resolve collapsed defaults from the portable namespace, preserve explicit false, and localize data indicators in English and Bulgarian. Include ListWithDetail values in data presence and ignore inherited object properties.
- b52b1dd: Add bounded OTP password presentation using Bits UI PinInput for shadcn and native input compositions for Flowbite and Skeleton. Preserve partial string codes and leading zeros, retain ordinary masked table cells, and fall back without truncation for oversized imported values or missing length bounds.

### Patch Changes

- a1a5ead: Show the property-name schema's specific validation message while adding a dynamic property without repeating it through the additional-error path. Adding the first property also creates a missing dynamic object. Direct and locally referenced boolean value schemas are normalized before Add, so a permitted `true` pattern schema does not skip the write. Invalid incoming primitive object data no longer appears as character-indexed dynamic properties and can be replaced through Add.
- 2caadba: Use portable `additionalProperties.add`, `addTo`, `rename`, `delete` and `deleteBlocked` messages for dynamic-property actions across all three renderer families. Keep required-property rename/delete permissions.
- 2caadba: Show localized AdditionalProperties Add, Rename, and Delete icon hints on
  keyboard focus as well as hover in native and Web Component hosts.
- 2caadba: Align Flowbite's Additional Properties Add action with the name input and reserve space for Shadcn's invalid-name marker so Rename cannot cover it.
- 2caadba: Wrap long dynamic Additional Properties labels within narrow rows and keep Rename/Delete actions clear and accessible.
- 2caadba: Use the portable additional-property catalog keys for Add, Rename, and mixed-tree Rename titles, placeholder, confirmation/cancel actions, and name-validation feedback. Property row Rename/Delete buttons now use the named catalog labels, including literal property names. Imported EN/BG translations reach these controls in every Svelte renderer family. Keep the mixed type selector and value editor aligned below the row actions. The empty row-detail panel reads `collection.selectItem` and ListWithDetail index text reads `array.indexLabel`; both respond to locale-only changes.
- 2caadba: Keep AG Grid filters active when navigating to an error in a filtered-out row. Open its row-detail dialog or panel directly, and return dialog focus to the visible error-navigation action on cancellation.
- 2caadba: Show localized AG Grid Add and Remove toolbar hints on keyboard focus in native and Web Component hosts. Export the Shadcn and Skeleton action tooltip adapters for the extended grid renderers.
- b52b1dd: Apply authored restriction precedence and min/max item bounds to native checkbox arrays. Keep imported out-of-domain values visible and removable, preserve typed identity, and synchronize checkbox state after removing one duplicated occurrence. Wrap horizontal choices and guard mutation handlers against readonly and disabled changes.
- 2caadba: Expose required state to assistive technology on chips, multi-select controls and automatic checkbox groups, including when the visual asterisk is hidden. Checkbox groups use a localized group description so individual checkboxes are not falsely marked required. Array-choice editors now associate visible help and item-error feedback with the focusable native input, listbox or combobox.
- 2caadba: Honor mount-only initial focus in Array Choices chips, tags input, and multi-select controls, and exclude disabled primary inputs from focus-conflict diagnostics.
- a1a5ead: Keep expandable-array row validation indicators scoped to the exact row path, so an error on index 10 no longer appears on index 1.
- 2caadba: Use renderer catalog messages for array and ListWithDetail action and empty-state fallbacks when optional control translations are absent. Preserve intentionally empty and host-supplied translations.
- a1a5ead: Select ordinary array presenters when item schemas use `oneOf`, `anyOf`, or `allOf`, including local references. Add can initialize the new item through the existing schema-default path; an explicit table option still selects the table presentation.
- a1a5ead: Show array-level validation messages before a short localized child-error notice in normal tables and AG Grid. Check only for child-error presence unless the count option is enabled, and reuse normal-table error positions for pagination and first-invalid-item navigation. The action navigates across pages and reveals rows hidden by active grid filters without expanding field errors into the array header.
- a1a5ead: Keep the same expandable-array item open when an earlier item is removed. Remap the open position only after a confirmed deletion, so declining a prompt leaves expansion unchanged.
- a1a5ead: Localize the screen-reader item index in expandable arrays and update it when the form locale changes.
- 2caadba: Show expandable-array Add, Move Up, Move Down, and Delete hints on keyboard focus in native and Web Component hosts while retaining their localized action names, styling, row creation, and reordering behavior.
- a1a5ead: Select table or expandable array controls for null-item arrays, and select the expandable presentation for arrays of arrays, including when the item schema uses a local `$ref`. Explicit Add now reaches the existing default initializer for these shapes, producing `null` and `[]` respectively.
- b52b1dd: Show array-own validation explanations independently of child-error summaries in table, stacked, master/detail and AG Grid renderers. Honor `showValidationIndicator: false` alongside `hideArraySummaryValidation` when hiding child summaries, while retaining array and item validation.
- acc5dfa: Show array-level validation errors beside the array heading and inside its card. Keep `contains` failures attached to the collection rather than assigning them to a particular row.
- a1a5ead: Keep array-level validation in expandable-array and ListWithDetail headers when `hideArraySummaryValidation` hides descendant errors. Row and list-item indicators continue to show their own errors.
- 2caadba: Show localized array-table Add, Move Up, Move Down, and Delete action hints on
  keyboard focus in native and Web Component hosts.
- a1a5ead: Select expandable array items when a flat array Control sets `table: false` or an explicit non-default `detail`. Keep `table: true` and `format: "table"` as table overrides, matching the React renderers.
- a1a5ead: Show an expandable, localized error summary from the array title when validation indicators are explicitly enabled. Keep the inline child-error notice for the default array presentation.
- 2caadba: Wait for flushed detail-dialog edits and form-owned validation before Apply commits, and reject stale draft or host targets.
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
- aba358e: Add localized native clear actions to boolean checkboxes, switches and table cells. False remains a present, clearable answer; clearing an ordinary property removes it instead of switching it off. Dynamic properties retain their key, and array-item clearing preserves the slot using the boolean empty value. Actions appear on hover/focus or touch, respect clearable and readonly state, and remain separate from property deletion.

  Keep AG Grid boolean widgets centered with their clear action at the cell edge, and align the Flowbite color popup trigger with its text input.

- 2caadba: Show the Boolean Clear action hint on keyboard focus in native and Web Component hosts. Preserve the action's existing styling, focus, and value-clearing behavior.
- a1a5ead: Associate visible help with Boolean checkbox and toggle controls while preserving authored descriptions and missing-value state hints.
- b52b1dd: Accept boolean root schemas without hiding the form. Keep the original schema in core validation so errors retain their original keywords and paths, while adapting the rendering boundary for upstream object-schema APIs.

  Preserve forbidden array items and tuple tails in mixed-tree editors and combine declared property constraints with every matching pattern. Keep imported invalid data available for correction without mutating its schema.

- 2caadba: Use the localized branch-change confirmation title, message, and actions for
  oneOf selectors and choice cards. Remove the unused generic combinator dialog
  catalog entries and fallback mapping, including the old clear-form copy.
- 2caadba: Cancel explicit OneOf and Mixed selector changes before flushing pending edits when the target, host data, or permission changes; recheck committed data after validation.
- d4dd92d: Resolve pending edits before ordinary oneOf branch changes and mixed-type switches
  or clears. Preserve unfinished composition, evaluate confirmation against completed
  drafts, and reject stale targets or revoked permissions. Complex branch confirmation
  excludes supported discriminator-only values. Keep shadcn selectors controlled so
  blocked choices can be retried, and invalidate Flowbite confirmations reliably.

  Handle replacement of an outgoing oneOf schema while its confirmation is open.

- 2caadba: Use only canonical authoring locations and names for template language, Monaco error publication, section and Stepper indicators, layout and AG Grid sizing, array sort actions, mask tokens, ImageView source fields, Button action, label and stable-name fallback, catalog parameters, and readonly options/config. Remove the explicit columns layout adapter and compatibility-only tests.
- d4dd92d: Resolve pending edits before changing choice-card branches. Completed text drafts
  participate in destructive-change confirmation, while unfinished composition or
  pending editor work preserves the current branch and native radio selection.
- 2caadba: Re-report an invalid categorization initial name when a live UI-schema update corrects and then reintroduces it, without changing the selected category or form data.
- a1a5ead: Read Categorization tabs and stepper orientation from the element's local `options.vertical`. The removed flat `config.vertical` no longer changes their orientation.
- a1a5ead: Keep keyboard focus on the visible fallback tab, stepper header, or accordion header when a selected category is hidden. Preserve Skeleton's focused native triggers, and keep conditional shadcn step registration in DOM order. Track unnamed and duplicate-named categories by their UI-schema object so selection survives sibling reorder without duplicate keyed entries. Reconcile equivalent unnamed category objects across UI replacement so a data update does not remount nested tabs or lose focus.
- b52b1dd: Share named initial category selection and stable category identity across tabs and steppers. Refresh category bindings when the UI schema changes, fall back when the selected category hides, and remove stale panels when no category remains visible. Translate Previous/Next through the renderer JSON catalogs and host translator.

  Add native single-open categorization accordions with named initial selection, persistent explicit closure, visibility fallback and live namespaced collapse settings. Closed panels remain mounted using the native components' supported content options.

  Add vertical layout, roving keyboard focus and unique native tab IDs to the Flowbite Tabs adapter. Preserve keyed stepper component identity when named categories move.

- b52b1dd: Keep long category tab strips inside a horizontal scroll container so selecting a distant tab does not scroll or clip the form content on narrow screens.
- a1a5ead: Keep enum-array checkbox and choice-card orientation local to
  `options.vertical`, and keep choice-card radio-circle visibility local to
  `options.showRadio`. Global `config.vertical`, tuple defaults, and global
  `config.showRadio` no longer alter those groups. Checkbox and card groups
  announce the orientation that they draw.
- a1a5ead: Align native choice-card borders, selected outlines, content spacing and invalid-state borders with the React reference.
- a1a5ead: Associate visible choice-card guidance and validation text with the radio group for assistive technology.
- 2caadba: Show an unmatched imported choice-card value with localized invalid feedback and associate it with the card group, while preserving the original data until a user selects a card.
- a1a5ead: Render choice-card rich content before its visible label, matching the React card layout while preserving stable sizing and native selection.
- a1a5ead: Keep choice cards the same size as selection changes, reserve space for selected-only presentation content, and preserve the intrinsic size of images inside cards.
- a1a5ead: Apply flat and local initial-focus configuration to enum selects, searchable choices, radio choices, sliders and extended controls including Cron. Capture the effective focus request when a control mounts so later data or option changes do not reclaim focus, while preserving disabled and readonly behavior across standard and extended controls.
- 2caadba: Report choice-card identifiers, conditional projection failures, layout sizing,
  invalid section settings, and split-pane option problems as structured author
  warnings with stable codes and messages.
- a1a5ead: Show translated local feedback when a coarse date picker selects an out-of-range month. Keep the committed value unchanged and disable Apply until the selected date satisfies the bounds.
- a1a5ead: Honor `collapseNewItems` when adding the first item to an empty expandable
  array. Clear the placeholder expansion for that new position while preserving
  an already expanded older item.
- d4dd92d: Resolve pending edits before ordinary table, expandable-layout and list/detail
  array add/reorder actions. Block unfinished composition and duplicate preparation,
  cancel queued actions after unmount, and recheck schema/path, permissions, options
  and limits before committing.
  Keep expansion and list selection with the moved item. Capture the insertion index
  before adding so newly added layout items open consistently while respecting
  collapseNewItems.
- a1a5ead: Keep collection item validation feedback and an accessible item index when `hideAvatar` removes the numbered marker. Apply the same option to list-with-detail rows, while preserving local overrides and child-summary suppression independently.
- acc5dfa: Use row checkboxes and one toolbar Delete action in Flowbite and Skeleton normal tables, matching Shadcn and the AG Grid collection pattern. Keep selection stable across row moves and pagination, and expose Flowbite table action focus hints. Show complex-cell Edit actions on hover or keyboard focus, with touch access retained, in all three renderer families.

  Use the same Flowbite button style for complex-cell Edit and Remove actions, including AG Grid cells.

- d4dd92d: Resolve pending edits before collection deletion confirmation. Block unfinished
  composition, evaluate discarded values after completed drafts reach form state,
  and recheck permissions, schema, path, data and removal constraints before commit.
  Invalidate stale confirmations and bind dialog callbacks to their own request so
  late native events cannot cancel or accept a newer deletion. Keep Flowbite array
  layout confirmation state controlled during rapid cancel/retry interactions.
- a1a5ead: Track collection occurrences in form-local runtime state using verified add/remove/move metadata and explicit descendant edits. Preserve identities through JSON Forms' deep-cloned array commands, including nested collections and equal primitive values. External replacements retain only reliably matched unique object references.

  Key native table and array-layout rows by these identities and provide their logical target context to nested editors. Monaco diagnostics and invalid drafts follow retained occurrences to their current pointers; deleting or replacing an occurrence disposes its owner without changing host errors. Keep validity pending during reassociation. Flowbite array expansion now relies on its existing controlled selection without competing native selection feedback.

- b52b1dd: Add scoped collection pagination with native controls for array tables, expandable arrays, master/detail lists, dynamic properties and tuple tails. Preserve absolute item paths, flush queued edits before navigation, reveal added items and expose errors on other pages. Add the three canonical pagination examples and English/Bulgarian catalogs.

  Isolate dialog-owned errors from committed form errors. Prevent Apply from accepting pending or unparsed edits, invalidate late results on cancellation, and retain ordinary schema-invalid draft editing. Share composite summary behavior with tuple positions.

- 2caadba: Use the portable `combinator.clearForm*` catalog keys for branch-clear confirmation in OneOf and choice-card renderers, while preserving scoped legacy translation overrides. Imported catalogs now control the title, message, confirm and decline actions in every renderer family.
- b52b1dd: Flush pending debounced control edits on blur so immediate tab navigation preserves the latest value. Cancel pending callbacks when a control is removed so an old edit cannot overwrite externally replaced root data.
- a1a5ead: Provide screen-reader-only help targets in compact cells so focused descriptions and validation errors have valid accessibility references without repeating visible help.
- a1a5ead: Expose renderer-local validation messages through the shared compact cell frame. Cron cells now provide a hoverable and accessible error indicator for invalid expressions even when the schema validator does not recognize the Cron format.
- b52b1dd: Present image diagnostics as compact warnings with native tooltips and buttons. Translate summary and detail-action labels through the renderer JSON catalog. Keep detailed explanations bounded and available through hover, keyboard focus and activation, with Escape dismissal and Web Component portal support. Refused image URLs remain absent from the rendered warning.
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

- 2caadba: Show the localized CompositeCell Remove hint on keyboard focus in native and Web Component hosts, with Escape dismissal and retained focus.
- a1a5ead: Show descendant validation errors on composite table cells, including nested object and array details, while keeping valid sibling cells clear.
- 2caadba: Use portable composite array labels and detail dialog titles in all renderer families. Announce a host value change while an isolated cell dialog is open, and keep Apply disabled until the stale draft is canceled.
- a1a5ead: Apply the shared deletion confirmation policy to optional Clear and Remove actions inside composite detail dialogs. Confirmed actions update only the dialog draft; Apply still commits the change. Cancel, readonly transitions, and changed targets discard pending confirmations.
- a1a5ead: Keep composite object/array type markers visible beside authored Label summaries when enabled globally or for the selected cell.
- b52b1dd: Follow incoming oneOf data until a user chooses a branch, discard stale detail when its node disappears, and recognize distinct required discriminators even when other branch fields are invalid. Bound selected indexes after branch replacement and preserve editable object-only array slots when clearing a branch.

  Route missing required discriminator errors to localized selector feedback and honor validation visibility. Cache discriminator reference analysis by schema/root identity.

  Keep an explicitly selected branch open when its generated defaults are an empty object.

- a1a5ead: Show only the translated error message for a single local property-name error, while retaining the structured summary for counted and multi-error validation indicators.
- 2caadba: Project ordinary fields from referenced `allOf` branches when conditional-field
  presentation is enabled. This keeps generated object details finite and makes
  the referenced fields editable even when the branch has no `if` condition.
- b52b1dd: Add opt-in conditional object fields with isolated condition evaluation, dependencies, authored placement and localized diagnostics. Preserve inactive data and original document validation. Render single oneOf/anyOf branches directly and let anyOf follow incoming data until the user chooses a view.

  Add cached, isolated active-branch feedback for object anyOf/oneOf editors without changing document validity. Respect local overrides and validation visibility.

- a1a5ead: Discover conditional object branches reached through local or host-registered `$ref` inside `allOf`, including finite populated recursive occurrences. Select the object projector for those controls, including in NoValidation, while preserving inactive stored values and leaving whole-form validation authoritative. Add cross-family native and production interaction coverage.
- 2caadba: Let vertical and horizontal control labels wrap at narrow widths in Flowbite, Shadcn and Skeleton. Long localized file labels remain readable above their pickers, and long checkbox labels keep their full text beside the control.
- b52b1dd: Add the six-field cron profile, native structured schedule pickers, staged actions, translated diagnostics, and the canonical scheduled-jobs example with English and Bulgarian catalogs. Preserve invalid expressions and advanced syntax for raw editing.

  Preserve validation constraints when delegating mixed-type schemas, narrow same-value composition branches without changing child schemas, and resolve escaped property names correctly. Explicit mixed types now retain their renderer when composition or enum constraints are present.

  Add mixed nested and JSON code presentations, selected-type detail dispatch in tree mode, and native mixed frames with portable collapse precedence. Preserve numeric editor intent and distinguish clearing a value from clearing its type. Apply the shared confirmation policy to destructive mixed actions and guard delayed dialogs against replaced values and permissions. Import the canonical mixed-control example with English and Bulgarian JSON catalogs.

- 2caadba: Show localized DetailDialog maximize and restore hints on keyboard focus, using the dialog's existing accessible hint component.
- 2caadba: Preserve nested collection selection and editor identity when reordering items inside an isolated detail dialog draft.
  Read dialog targets through the JSON Forms data resolver so inherited prototype
  properties are never treated as stored form values.
  Use the same own-data lookup for tuple fields and mixed-control parent paths
  across all three native families.
  Use that resolver for boolean and slider array-parent checks and composite-cell
  parent removal policy.
  Resolve declared and dynamic composite schemas through own properties, so
  prototype-looking names use their authored schema or additionalProperties.
- a1a5ead: Keep composite detail-dialog action labels and optional Clear/Remove buttons
  scoped to the selected cell, tuple or position options. Flat form labels
  continue to configure temporal and duration pickers without unexpectedly
  relabeling every detail dialog.
- 2caadba: Use only `options.elementLabelProp` for array item labels. Ignore the
  unsupported `childLabelProp` alias and fall back to the shared generated label.
  When no primitive item property supplies a label, array and ListWithDetail
  views show a localized item number.
  Selected enum and constant-based oneOf item values use their translated choice
  labels while preserving the underlying data value.
  The generated first-primitive label also follows item and property `$ref`
  schemas before falling back to a numbered item.
  The selected oneOf choice titles are also exercised through all three demo
  families in English and Bulgarian, with native and Web Component hosts.
  Duplicate displayed labels keep distinct item details, and removing the
  explicit path restores the first-primitive name fallback.
  ListWithDetail row labels likewise use translated choice titles while
  selection still opens the correct item's detail.
- 2caadba: Reject enum-array checkbox mutations after a rule hides their control.
- 2caadba: Count array child errors and locate invalid AG Grid rows using exact JSON Pointer members beneath literal dotted paths.
- 2caadba: Use exact data-path members for active oneOf/anyOf branch validation and missing-discriminator error routing so a literal dotted parent stays separate from its nested lookalike.
- 2caadba: Use exact scoped members for collection error positions and array header validation. Keep cell error filtering on the already complete mapped cell path so valid item errors remain visible.
- 2caadba: Keep before-touch and tuple-position error feedback on exact literal path members.
- 2caadba: Preserve exact parent path members in section and stepper validation indicators, control and array-child error filtering, tuple omitted-position errors, composite-cell summaries and removal limits, and Boolean/slider array-parent checks when a literal dotted member shares a flattened path with nested data. Delay Skeleton icon hint hover opening until the trigger click completes so Boolean Clear still commits after pointer entry.
- 2caadba: Preserve exact Control path members when locating tuple-tail and dynamic-property collection errors.
- b52b1dd: Separate rejected file selections and read failures from stored-data validation. Show local warning/error feedback, clear it on external replacement, and use compact native popups in delegated table/grid cells. Add English and Bulgarian size-limit fallbacks and a shared cell-presentation context for delegated controls.
- 2caadba: Keep imported out-of-domain enum and named-choice values visible beside select and radio presentations in all three renderer families. Associate the localized value with the focusable choice control while preserving the stored data.
- a1a5ead: Stop recursive allOf references at absent data and offer a guarded, localized action to create one child at a time with JSON Forms defaults and local feedback for required missing children. Add optional, required and defaulted finite recursive-reference demos and native/production acceptance coverage.
- a1a5ead: Associate visible help and errors with enum and oneOf select triggers, searchable-choice buttons, and native/combobox inputs while preserving authored description IDs.
- a1a5ead: Read string-control suggestions and multiline mode from merged flat config and local UI-schema options. Global suggestions now appear in native text controls, local suggestion arrays override corresponding global entries by index, and global `multi` selects a textarea unless locally disabled.
- a1a5ead: Associate formatted integer table-cell inputs and textareas with focused schema help and local parsing errors using a stable screen-reader helper.
- 2caadba: Hide formatted-number table-cell Clear actions during read-only state, restore them when the cell becomes writable, and reject delayed input or Clear callbacks after the cell becomes hidden.
- a1a5ead: Forward schema maxLength to formatted-number table inputs and textareas, matching the React Antd and Shadcn cells.
- a1a5ead: Register formatted integer cells for `options.format: true`. JavaScript-authored cell options can provide `toFormatted` and `fromFormatted` callbacks; without both callbacks, the ordinary integer cell remains in use. Honor `multi: true` with a multiline editor. Keep invalid formatter drafts local and preserve numeric data, readonly behavior, and row identity.
- 2caadba: Apply the shared local/global option merge policy to AG Grid controls and cells
  and composite-cell dialogs. Keep local arrays and AG Grid option bags as whole
  replacements while preserving explicit local false, zero and empty values.
- a1a5ead: Use form-owned occurrence identities for AG Grid rows, cell editors and native/grid detail panels. Preserve selected details and Monaco diagnostics through local moves and deletion of other rows; clear ownership when the selected row is removed or externally replaced. Remove the grid's separate positional identity heuristic so duplicate values cannot inherit another row's editor or errors.

  Refresh retained cell bindings after a move even when their displayed values are unchanged, so subsequent edits write to the new source path. Avoid replacing native row data for validation-only updates.

  Provide optional occurrence keys to the shared row-detail selection helper and collection context to detail content, retaining the conservative fallback for callers without keys. Replaced native row occurrences dispose open detail dialogs so stale drafts require reopening.

- a1a5ead: Expose each Group frame as an accessible group named by its visible title. Untitled Groups remain unnamed while retaining their child controls.
- a1a5ead: Honor Group `options.showBorder: false` in all three Svelte renderer families while preserving the default group frame.
- 2caadba: Keep a screen-reader-only associated field label when the native control wrapper is hidden.
- 2caadba: Keep missing ImageView alt text on the author diagnostic channel without showing an in-form warning while the image renders. Missing or refused image content still has a visible explanation.
- b52b1dd: Reject a scope-bound ImageView source when its schema is false. Preserve true-schema support, stored data, localized diagnostics and live schema replacement across renderer families.

  Resolve scope-bound image data by literal property segments so dotted and empty names work within the current array-item context. Ignore inherited values.

  Keep scoped presentation elements out of literal Control isolation and mixed/tuple control selection. ImageView now retains its authored source, alternative text and diagnostics in the full renderer registries, including unrestricted and tuple schemas.

  Restrict the generic array fallback to Control elements as well, so an image bound to an array reports a source-schema diagnostic instead of displaying an array editor.

- a1a5ead: Show imported `propertyNames` validation failures on the offending additional-property label with a readable error indicator in all three renderer sets.
- a1a5ead: Report a coded author warning when multiple focus requests are active in the same form view, including formatted integer table cells. Inactive categories, visited steps, closed accordion panels and collapsed groups do not count; native focus behavior remains unchanged.
- a1a5ead: Show validation errors for invalid imported array choices on the affected pill and in the field, while preserving the stored value until the user removes it.
  Use a complete error-colored border for the invalid pill and keep ordinary field labels neutral when their values fail validation.
- a1a5ead: Show unnumbered property-name error markers beside imported dynamic-property labels, and validate the initial Rename draft against propertyNames across the Svelte renderer sets.
- b52b1dd: Scope Label-summary cell feedback to the fields exposed by its detail layout. Hide preview-only errors and type markers, prevent whole-row clearing, and translate cell error accessible names through the shared catalogs. Preserve document identity when a serialized host echoes equal data, retaining row selection and child editors.
- a1a5ead: Report unsupported, invalid, and conflicting portable layout sizing hints as coded author-facing warnings instead of visible form validation alerts. Keep raw diagnostic details on layout items for inspection and preserve Fixed > Span > Weight precedence.

  Diagnose invalid local/global layout container settings while keeping their normal fallbacks, and reject inherited-property names as align/justify values.

  Assign item warning codes in the shared sizing helper instead of classifying English messages in the layout adapter. Preserve the existing inspection messages and sizing behavior.

- 2caadba: Show ListWithDetail Add, Move Up, Move Down, and Remove hints on hover and keyboard focus in native and Web Component hosts while preserving their separate accessible action names.
- a1a5ead: Honor array panel collapse options in List with detail while retaining the selected item and mounted detail editor when the panel is reopened.
- 2caadba: Use each renderer family's native split pane in ListWithDetail. The list and detail start at a 25/75 split, support resizing and responsive stacking, and retain the selected detail editor during layout changes. Adding an item now selects it and opens its detail editor immediately.
- 2caadba: Keep short ListWithDetail navigation lists at natural height and let overflowing rows scroll without compressing them.
- a1a5ead: Select list/detail items by form-owned occurrence identity, preserving the selected editor through reorder, deletion of earlier items and reliably matched external moves. Clear selection when the owner is removed or replaced, including after reinsertion. Provide collection context to nested editors and preserve nested layout instances when their containing row moves.

  Support primitive arrays in ListWithDetail, matching the React renderer applicability contract. Route list error indicators to the exact row instead of confusing JSON Pointer/data-path formats or matching row-index prefixes.

- a1a5ead: Keep a dynamic additional-property key when a custom renderer clears its isolated value with `undefined`. Use the property's schema default for that clear and reject stale edits after the key is removed. Declared literal controls retain their ordinary clear-to-absent behavior.
- a1a5ead: Render dotted and empty additional-property names through the parent-scoped literal adapter instead of a separate form. Renderer-owned errors and pending validation now contribute to the parent form, while host errors are displayed at the literal field. Preserve nested literal paths, sibling data and dynamic property keys when clearing values.
- a1a5ead: Carry the current source item through collection rendering contexts so interpolated Labels use the rendered row even when a literal dotted property name collides with a nested data path.
- a1a5ead: Bind native table cells for empty, dotted and other unsafe literal property names through isolated compact cell dispatch. Preserve the item's other fields and show translated required column headings.
- b52b1dd: Use explicit schema i18n prefixes for composition branch labels. Refresh array and composition translations when host locale/translations change, and use English/Bulgarian JSON catalogs for oneOf dialog defaults and selector actions. Preserve intentionally empty host translations.
- a1a5ead: Replace global option arrays with explicitly supplied local arrays, including empty arrays, and replace Monaco and AG Grid option bags as units. Keep per-field overrides for other nested option objects across the Svelte renderer families.
- a1a5ead: Apply declared local ImageView width and height dimensions in all three renderer families, ignoring invalid values. Separator orientation now reads only local `options.vertical` and ignores the removed flat config key.
- a1a5ead: Localize ListWithDetail item index announcements in English and Bulgarian, including the Flowbite avatar name, and update them when the form locale changes.
- b52b1dd: Move default theme-toggle action labels into the EN/BG renderer catalog, describe the next cycle mode and hide decorative icons from assistive technology. Preserve host labels, including empty overrides. Use translated native CloseButtons for Flowbite multiline and free-string suggestion controls, restoring editor focus and preserving readonly clearing policy.
- b52b1dd: Add lazy Markdown labels with basic and extended grammar, shared URL policy, escaped text rendering, and English/Bulgarian diagnostics. Keep rich choice-card content inert and render its links as text so native radio selection remains the only interaction. Add lazy CEL interpolation with declared text parameters, gated data namespaces, locale formatting and safe Markdown substitutions. Include the spec Label interpolation and Markdown examples in the demo catalog.

  Improve demo message fallback and avoid stale interpolation parameters. Supply separate EN/BG translation supplements for missing spec-example labels without modifying source fixtures.

- a1a5ead: Use a single string mask as the input placeholder when no placeholder is authored, while preserving an explicit empty placeholder and leaving alternative masks without a fallback hint.
- a1a5ead: Accept a complete masked date entered by paste or browser fill before the mask library reports completion, while continuing to defer incomplete input.
- a1a5ead: Keep format-specific and file string editors ahead of the mask editor when a mask option is also present, including referenced schemas and delegated table cells. Align password renderer rank with React so it wins over conflicting multiline presentation.
- aba358e: Reject stale masked-input edits and clear actions after readonly is enabled, including configurations that keep readonly controls enabled for inspection.

  Share safe mask-token parsing across all three native inputs. Invalid regular expressions retain the default token and display a translated diagnostic instead of throwing during rendering. Preserve Unicode patterns, legacy regex escapes, token removals and host RegExp values.

  Use the shared Svelte text-draft lifecycle with the reference mask engine for all three native inputs. Keep IME drafts provisional, cancel them on host replacement or clearing, preserve caret position during insertion, and enforce stored-value length without HTML maxlength. Compact table cells share the same pending/readonly behavior.

- a1a5ead: Associate visible masked String help and mask-definition errors with the input while preserving author-provided description IDs.
- a1a5ead: Retain a selected mixed Control's `validateActiveBranch` option when delegating to a generated composition editor, including explicit false. Centralize the active-branch validation policy for consistent local/global and validation-mode precedence. Keep the canonical branch-feedback example expanded in nested mixed mode and translate its delegated branch labels.
- a1a5ead: Associate visible help and errors with the free-text input in mixed string-or-enum choices while preserving authored description IDs.
- a1a5ead: Respect `label: false` in mixed controls and their delegated editors, so compact mixed-cell dialogs do not repeat the value-column label. Flowbite also omits empty label elements.
- 2caadba: Show one visible label for an unrestricted dynamic property's mixed type and value while retaining the delegated input's accessible label.
- b52b1dd: Allow aggregate mixed-object forms to edit declared dotted and empty property names through the shared literal-key dispatch boundary. Preserve schema readonly rules and unrelated siblings instead of disabling the entire object.
- a1a5ead: Render selected mixed-tree literal details within the parent form context. Preserve literal paths and tree navigation while publishing renderer-owned errors and pending validation to the parent, displaying host errors at the selected value, and releasing ownership when that value is removed. Reject delayed writes to members that no longer exist.
- 2caadba: Use portable mixed type, tree search and tree region catalog keys in all three renderer families. Type selectors, search inputs and tree navigation expose translated accessible names and respond to host catalog overrides.
- 2caadba: Show a localized focus hint for the Mixed nested array/object View icon in Shadcn and Skeleton.
- 2caadba: Show localized Mixed tree Show/Hide primitives and Rename/Delete hints on keyboard focus in native and Web Component hosts. Keep Rename/Delete actions focusable and reveal them on focus without pointer hover.
- 2caadba: Prevent mixed-tree node writes after the owning control becomes hidden.
- b52b1dd: Translate mixed-tree actions, dialogs, rename errors, navigation labels and array item labels through shared English/Bulgarian JSON catalogs and host overrides. Update mounted trees when the locale changes.
- a1a5ead: Coordinate mixed-tree rename and deletion with pending detail edits, name composition, stale-owner checks and destructive confirmation. Preserve selection through literal-key rename and return to the parent after deletion. Honor required keys and disableRemove, and expose translated rename input and breadcrumb names with accessible inline feedback.

  Preserve unrestricted array-item schemas and generate a value control when no detail layout can be generated, so mixed array rows cannot reuse the root form schema or UI.

- 2caadba: Keep an untouched mixed-tree rename editor open when a sibling control flushes its pending work. A rename still commits after its name changes and an action requests a flush.
- 59330a6: Keep mixed tree rename drafts open until Rename, Cancel, Enter, or Escape. Resolve View actions through the original document path so selected object details and tree rows stay in sync. Keep the selected object's top type selector non-clearable while leaving other selectors unchanged.
- 2caadba: Keep mixed-tree primitive visibility available beside search when filtering hides all rows, and refresh Flowbite's filtered tree when visibility changes.
- 2caadba: Use the live renderer catalog for nested mixed-tree View action names and the Flowbite tooltip. Fall back to the localized object or array type when a control has an empty label.
- b52b1dd: Add Flowbite and Skeleton chips and multi-select adapters with guarded JSON-value selection, native components where their contracts apply, and localized actions. Integrate the canonical array-choice example with English and Bulgarian labels, descriptions and guidance. Preserve repeated tokens, imported invalid members, exact string identity, and schema restrictions.
- aba358e: Preserve checkbox and switch state when readonly is separated from disabled.
  Use native readonly support for shadcn Checkbox and Skeleton Switch; disable
  widgets whose native controls do not support readonly. Restore normal editing
  when readonly is removed.
- b52b1dd: Localize native calendar navigation and announcements through JSON catalogs and host translators. Pass form locales to the native Skeleton calendars and Flowbite date-time picker, and open staged Skeleton calendars on their stored date. Use native shadcn Button variants to retain the reference renderer's theme and focus styles.
- b52b1dd: Honor local and namespaced dialog dimensions, dragging, resizing, and maximize/restore options in native detail dialogs. Keep headers and actions reachable, scroll the body, focus the dialog without selecting editor text, constrain geometry to the viewport, and preserve draft edits and normal geometry through maximize/restore. Add English/Bulgarian actions and maximize/restore icons for each supported shadcn icon library.

  Restore the actual trigger after native dialog teardown, including shadow-root portals. Include native padding in viewport limits and schedule resize updates outside observer delivery.

- 2caadba: Cancel queued native control edits when a rule hides their control and reject hidden callbacks.
- b52b1dd: Use native Flowbite and shadcn Inputs with Maska attachments. Correct eager/reversed option flags, retain imported values the mask cannot represent, support Unicode token patterns, distinguish stored length from separators, and translate clear actions. Exclude temporal boolean mask options from generic masked string selection.
- b52b1dd: Coordinate unfinished OTP composition with form actions and cancel stale edits on
  host replacement or permission changes. Keep readonly OTP inputs focusable when
  readonly and disabled states are separated. Adapt native shadcn Input OTP editing
  and slots to Unicode code points while retaining its native components.
- aba358e: Honor native readonly presentation for numeric, masked and temporal inputs while
  preserving focus and copying. Apply native calendar readonly APIs where supported,
  prevent time-picker edits, and keep effective form permissions above native
  Calendar option overrides.

  Keep six OTP boxes visible beside their actions on narrow layouts, retain compact
  spacing on wide layouts, and honor initial focus on exactly one native OTP input.

- aba358e: Keep native sliders while distinguishing unset and invalid data from their provisional thumb position. Add localized clearing and value announcements, readonly commit guards, zero-based decimal increments, integer-safe fractional multiples and exclusive bounds. Preserve primitive array slots when clearing, and allow explicit selection when only one value fits the range. Forward accessible value text to the shadcn slider thumb and tooltip.

  Initialize Skeleton sliders after their containing root is available and share the native thumb ID with its tooltip, preserving shadow-root measurement and keyboard focus.

- b52b1dd: Preserve IME drafts in native text, multiline and suggested-string inputs, enforce schema length in Unicode code points, and cancel pending edits on host replacement or permission changes. Preserve later typing across feedback from an earlier commit. Button actions flush completed edits before reading form data and do not run while composition remains unfinished.
- a1a5ead: Rebase document-local nested `$id` and `$anchor` references to root pointers for JSON Forms mapping and validation. Keep finite recursive object children absent until explicit, readonly-guarded creation in all three renderer families. Report unresolved local anchors without changing data, including in NoValidation, and recover when the host supplies a valid schema. Cover root and nested resource references through native and production demo interactions.
- a1a5ead: Keep field labels neutral for invalid values while retaining colored error messages and input feedback. Match React Shadcn's full destructive border around invalid imported choice pills; invalid property-name labels remain highlighted.
- a1a5ead: Associate visible Number and Integer helper text with native inputs while preserving authored description IDs and incompatible-value hints across renderer families.
- b52b1dd: Parse complete numeric entries without truncation, non-finite commits or silent decimal precision loss. Keep unsupported entries as local drafts with translated feedback, enforce supported numeric bounds with repair and restrict overrides, and diagnose invalid stepping options. Preserve zero, negative values, clearing semantics and incoming invalid data.

  Preserve native Svelte numeric binding null values as view state, so incomplete signs and exponents remain editable. Use Flowbite’s native selected tab binding and stable category keys.

- a1a5ead: Resolve numeric input increments from local `options.step`, then the schema's suitable `multipleOf`, then the numeric-type fallback. Ignore undeclared flat `config.step` while preserving separate slider increments.
- 2caadba: Report invalid explicit numeric steps to form authors while retaining the safe input step fallback and keeping configuration warnings out of the form.
- a1a5ead: Keep nested Group validation indicators visible when an object detail has no direct errors, and include both direct-object and child errors in its summary.
- b52b1dd: Show translated direct object errors beside the owning Group title, or above non-Group details. Keep required-child and property-name feedback separate, retain host errors when schema validation is hidden, and preserve independently authored nested Group indicators.

  Keep rejected imported properties visible and removable, with translated feedback naming each rejected key at the additional-properties heading. Use the resolved Group as the object boundary, remove redundant inner borders and empty static regions, and frame other nested object details with native cards. Respect explicit object title suppression.

- b52b1dd: Guard repeated object registry dispatch at the same data path and fall back to the generated form, preserving edits and allowing independent reuse of registered layouts.

  Integrate canonical object-control and array-controls examples with English/Bulgarian JSON supplements and a typed object registry. Keep schema localization from annotating property dictionaries and use exact translation keys for constant choices.

  Translate composite-cell dialog labels and generated summaries through the host catalog, preserving schema/UI prefixes and dynamic locales. Give native table column headers explicit column scopes.
  Use the translated schema label as the composite dialog heading when a schema
  title is present, while retaining the generic heading for untitled cells.

- 2caadba: Show the localized OneOf Clear hint on keyboard focus in native and Web Component hosts, with Escape dismissal and retained focus.
- 2caadba: Name the oneOf branch-clear action with the portable "Clear selection" catalog
  key in English and Bulgarian across all three renderer families.
- a1a5ead: Follow a newly supplied, valid oneOf discriminator after a previous user branch choice. Preserve explicit selection for ambiguous alternatives, and verify complex confirmation distinguishes discriminator-only changes from discarded detail across all demo hosts.
- b52b1dd: Use the shared confirmation policy for oneOf branch changes and clearing. Preserve only enclosing properties through the shared branch-change helper, reject readonly/disabled commits and ignore redundant selections while retaining native selectors and dialogs.
- a1a5ead: Keep recursive-tree and Flowbite pane wrappers' generated declarations free of imported component-name collisions, and publish the Lodash types used by the extended package's public template declaration.
- b52b1dd: Use the shared composition-aware text controller for ordinary password inputs,
  including Unicode code-point limits and schema replacement cancellation. Preserve
  native readonly focus and selection for text inputs while preventing edits and
  hiding Clear actions. Guard Skeleton's deferred native enum callbacks against
  host data/schema replacement.
- a1a5ead: Associate visible Password help and errors with standard and segmented OTP inputs in each renderer family while preserving author-provided description IDs and reveal controls.
- b52b1dd: Use native UI-library tooltips for ordinary password and OTP reveal actions. Tooltips share the translated accessible action name, keep one focusable button, and use the host's portal context. Disable reveal actions with the control and guard synthetic clicks without changing form data.
- b52b1dd: Select masked password controls and cells for UI `options.format: "password"` as well as schema format. Translate reveal and clear actions in English and Bulgarian, expose reveal state, and guard mutations when disabled. Flowbite uses its native CloseButton explicitly to support a translated label without dismissing an enclosing dialog.
- b52b1dd: Recheck enabled and readonly state before control changes commit. Cancel queued
  changes when their data, schema or path is replaced, or editing permission is
  revoked, so delayed native editor callbacks cannot overwrite a newer form value.
- b52b1dd: Support portable table columns, whole-row presentation columns, and accessible pointer/keyboard resizing with RTL and English/Bulgarian labels. Preserve resized widths across row edits and pagination.

  Apply portable pagination and columns to AG Grid, with independent native pagination overrides and native column-list precedence, including empty lists, groups, and computed columns.

- b52b1dd: Share pre-touch control error filtering across native families. Filter eligible schema and host errors together, retain nonmatching host messages, and respect validation visibility without changing structured errors or validity. Remove permanent array-summary suppression until summaries can follow child touch state. Integrate the canonical pre-touch example with English/Bulgarian JSON supplements.
- a1a5ead: Coordinate additional-property add and rename with pending edits. Preserve composing input, reject duplicate and stale commands, honor readonly/disableAdd and required-key restrictions, and cancel obsolete rename dialogs. Resolve updated property options reactively so runtime restrict and permission changes take effect without remounting.

  Give each property editor a unique rename-input ID so labels remain associated with the correct dialog when multiple editors are mounted.

- a1a5ead: Keep detailed schema failures when validating a dynamic property name and show their translated messages in Rename dialogs instead of a generic invalid-name message.
- 2caadba: Distinguish a dynamic property name rejected by `patternProperties` from other invalid names. Mixed-tree Rename now shows the portable `additionalProperties.namePattern` catalog message without changing the validation result or stored data.
- a1a5ead: Preserve additional-property editor identity through confirmed local renames, including transitions between ordinary, dotted and empty names. Relocate renderer-owned errors without moving host-supplied errors or briefly losing selection-time file metadata. Restore focus to the surviving rename action after the native dialog closes, and keep external replacements distinct from explicit local renames.
- a1a5ead: Associate visible help with each focusable enum and oneOf radio option while preserving authored description IDs. Name each radio group from its field label and track focus moving within Flowbite groups.
- 2caadba: Reject recursive Object and AllOf Create callbacks after their control becomes hidden.
- b52b1dd: Add recursive node-tree editing with native navigation, selected-node details, validated rename, guarded deletion and descendant validation indicators. Include the canonical recursive-tree and finite-depth examples in the demo catalog.

  Keep dispatcher prop snapshots stable between changes so nested native components mount and unmount without repeatedly traversing the entire ancestor dependency graph. Preserve immutable reducer state and avoid redundant additional-error updates.

  Resolve array restriction defaults from authored configuration (local override, global override, then enabled), recheck array layout mutation bounds, and translate default array actions through the shared English/Bulgarian JSON catalogs with host overrides.

  Show native validation badges in mixed trees and avoid duplicated headings in structured mixed details.

- a1a5ead: Use shared localized rename-dialog titles, descriptions, and property-name labels across the Svelte renderer sets. Render Shadcn rename validation feedback in the theme's destructive color.
- b52b1dd: Move renderer UI translations into JSON catalogs, remove locale-specific component branches, and preserve dynamic host translation overrides.
- a1a5ead: Preserve the stored instant when a date-time picker edits minutes or seconds in a repeated local hour during the fall daylight-saving transition. Range feedback and Apply now use the same candidate instant.
- 2caadba: Open the affected native row-detail dialog when “Go to first error” reveals an invalid row, so errors in hidden detail fields can be corrected.
- 2caadba: Keep right-side row-detail fields at a readable minimum width on narrow screens and allow horizontal scrolling inside the detail pane.
- b52b1dd: Add opt-in whole-row table and AG Grid detail dialogs and persistent panels with item-relative authored/registered/generated layouts, isolated drafts, stale replacement protection, and readonly inspection. Keep hidden columns available to row details and localize row actions in English and Bulgarian.

  Inject scoped Svelte component styles into their owning shadow root so Web Component content retains component-level layout, focus, and interaction styles, including column resize handles.

  Support Label-based cell summaries through renderer dispatch, with React-compatible summary-only actions and readonly detail inspection. Integrate the canonical table-row-details example with English/Bulgarian catalogs.

- 2caadba: Report unresolved UI-schema rule references through the author diagnostic channel and treat the rule as unmet until its reference resolves.
- b52b1dd: Use the shared message catalogs for remaining scalar clear actions and enum placeholders, including duration controls. Preserve existing host translation overrides and authored placeholders.
- 2caadba: Send unresolved and unsupported dynamic schema references through the author diagnostic channel while preserving their accessible fallback and invalid status.
- a1a5ead: Apply `jsonformsExtended.array.collapsed` to array table and stacked panels across all three Svelte families. The initial stacked item follows the same scoped default, local `collapsed: false` overrides it.
- b52b1dd: Resolve mixed-control details relative to the selected value while preserving its full data path. Avoid proxy-induced reactive loops when structured values change.

  Share composite summary semantics across renderer families, distinguish generated descriptions from literal data, and support decorative type indicators with cell overrides. Use JSON translation catalogs for composite actions and native Flowbite/shadcn dialog buttons.

  Add the canonical array detail modes and editor details examples with trusted Svelte registry adapters and English/Bulgarian translations.

- a1a5ead: Apply `jsonformsExtended.radio.vertical` to enum and oneOf radio controls across all three Svelte families. Explicit local `vertical: false` overrides the scoped default, and the removed flat `config.vertical` no longer affects radio orientation.
- d4dd92d: Keep searchable enum and multi-select popups within the available viewport height. Preserve the search field while long option lists scroll, including keyboard access to the last option on short screens.
- aba358e: Honor autocomplete on finite enum and const-oneOf choices using native library components. Search visible labels while retaining exact JSON values and distinct duplicate labels; do not commit query text. Add translated empty results, keyboard selection, clearing and readonly guards. Skeleton filters only user input and retains selected labels after host reload. Include the official shadcn Command components used by its Popover combobox composition.
- a1a5ead: Open section validation summaries on hover while preserving click and keyboard access. Align validation and data indicators at the right edge of Shadcn and Skeleton accordion headers.
- a1a5ead: Report a stable author diagnostic when the effective section `collapsed` option has a non-boolean value. Valid local values suppress warnings from lower-priority settings, and invalid values continue to use the next valid collapse default without truthiness coercion.
- a1a5ead: Show Group and Category error indicators as soon as displayable section errors exist, independently of control touch. Keep pre-touch filtering local to each Control, so required-field text waits for blur while a section cue can guide navigation. Remove the form-scoped touch store.
- b52b1dd: Share bound-control traversal for Group and Category data/error indicators. Keep section errors visible when panels close, count overlapping control bindings once, attribute missing/additional property errors to their child, and preserve host errors when schema validation is hidden. Local false options override namespaced defaults.

  Translate section summaries and validation popup headings using English/Bulgarian JSON catalogs and live host overrides. Flowbite native steppers use their icon and description slots for section feedback.

  Use native tooltips for keyboard and pointer access to section error summaries without toggling the surrounding disclosure. Cache descendant scope collection by UI-schema identity.

  Provide Skeleton native disclosures with their shadow-root resolver so closing updates accessible state. Stretch native Group and mixed-frame content to the available width, retaining full-width headings with trailing status indicators.

- 2caadba: Use the portable selected-row action and confirmation messages in the Shadcn
  array table, with English and Bulgarian defaults.
- a1a5ead: Keep Shadcn accordion category headers free of hover underlines and render the has-data status as a circular indicator with its accessible label and tooltip.
- 44ece2e: Align the additional-property Add button with the property-name input using a shared grid row, including when the form renderer wraps the field, labels are hidden, or validation messages are displayed.
- b52b1dd: Add shared array-choice applicability and guarded positional mutations, and shadcn chips and searchable multi-select renderers. Preserve imported values, repeated tokens, schema bounds, readonly state, and host translations with English and Bulgarian catalog defaults.
- a1a5ead: Align native and guarded chip fields and show one coherent focus border around the field instead of an inner input border or offset selected-tag ring.
- a1a5ead: Open finite multi-select choices from the full field and present searchable Command rows with selection checkmarks. Preserve chip removal by mouse and keyboard without opening the choices popup.
- 2caadba: Localize the Shadcn dialog close button's accessible name in English and
  Bulgarian across native and Web Component renderer dialogs.
- a1a5ead: Use the pinned shadcn-svelte-extras Tags Input for unique free-string chips while preserving guarded fallback handling for repeated, typed, finite, and bounded arrays. Include both UI copies in the upstream sync audit and localize their tag removal buttons.
- b52b1dd: Load the existing icon mappings through supported per-icon package exports. This avoids transforming entire Lucide, Tabler and Remix catalogs in server-side consumers and tests without changing icon selection.
- 2caadba: Make ListWithDetail's shadcn listbox use one tab stop and support Arrow, Home, and End selection while preserving read-only navigation and form data.
- 2caadba: Keep authored long enum, OneOf branch, scalar OneOf, and translated mixed-type labels inside narrow Shadcn select popups in native and Web Component hosts. The renderer now caps the popup to the viewport, wraps option labels, and truncates the selected trigger label without changing the upstream copied Select component.
- a1a5ead: Make multi-select search opt-in through `options.autocomplete` and retain the hovered row highlight when a choice is toggled.
- b52b1dd: Use the official shadcn-svelte Input OTP Root, Group and Slot components instead of renderer-authored slot markup. Preserve masking, leading zeros, partial values and ordinary password cells. Consuming applications must install the input-otp component alongside the other required shadcn components.
- a1a5ead: Match the React shadcn normal table's page and row selection, bulk deletion, quieter row dividers, active column resize handles, and contact-cell edit action visibility.
- aba358e: Keep table and AG Grid row details scrollable inside native resizable panes so
  long forms remain reachable in right and bottom panels. Prevent unnecessary
  vertical scrollbars in category tab strips while retaining horizontal navigation.
- b52b1dd: Respect a split pane's inherited RTL/LTR direction when it differs from the document direction, including forms hosted in Shadow DOM. Retain native shadcn/PaneForge panels and adapt horizontal keyboard, mouse and touch input only when their direction differs from PaneForge's document-level calculation.
- 2e5054a: Align the mixed renderer's primitive visibility toggle with the tree search field.
- a1a5ead: Reset staged time-picker selections after Cancel so reopening starts from the
  committed time in shadcn and Skeleton controls.
- a1a5ead: Anchor short section-error popups directly above the validation icon when there is insufficient room below, including in stepper headers.
- a1a5ead: Use the shadcn-svelte-extras stepper for Shadcn categorizations, with circular step indicators and connecting lines. Keep category selection, validation indicators, optional navigation buttons, keyboard navigation, and responsive content bounds.
- a1a5ead: Style active tabs from Bits UI's `data-state="active"` attribute so category and composition navigation highlights follow the selected content in the shadcn renderer and Web Component.
- 2caadba: Sync the copied Input OTP slot structure to current Shadcn source in both
  hosts. Keep translated dialog close names in renderer-owned content rather
  than changing the copied Dialog component.
- a1a5ead: Open validation summaries on hover as well as click, including property-name error markers, and keep the interactive summary open while moving the pointer into it.
- 2caadba: Align control and container validation popovers to the trigger's end edge so wide error summaries remain inside narrow native and Web Component viewports.
- 2caadba: Keep a clicked validation summary open when the pointer leaves its trigger before a keyboard action inside the summary.
- a1a5ead: Keep long validation-summary popovers within the viewport and let their expanded error lists scroll internally across all three Svelte renderer families.
- b52b1dd: Apply the shared always/never/complex confirmation policy to collection deletion, additional properties and tuple items, direct composite-cell removal and AG Grid batches. Flush pending edits and recheck permissions, constraints, path and owner data before committing. Keep detail-editor draft actions isolated until Apply.

  Use native translated dialogs, fix Flowbite dialog names and shadcn nested cancellation buttons, and integrate the canonical destructive-confirmation example with English and Bulgarian catalogs.

- b52b1dd: Share editor detail resolution across object, array-layout and master/detail
  renderers. Accept bare elements containers as vertical layouts and preserve
  GENERATE when a fallback Control delegates to another editor. Export detail
  helpers for the remaining editor and choice-card integrations.
- b52b1dd: Apply the namespaced host URL policy before loading presentation images. Share policy resolution for allowed schemes, relative URLs and opt-in image data URLs, including rejection of browser-normalized network paths.

  Support top-level image sources and alternative text, reactive scoped image data, and English/Bulgarian diagnostics with host translation overrides. A defined top-level source, including an empty string, takes precedence over scoped data.

- a1a5ead: Associate slider value text and visible field help with the focusable control while preserving authored description IDs. Show focus-only help when the Shadcn slider thumb receives focus.
- 2caadba: Report invalid split-layout resizable and container dimension options, invalid local minimum item widths, and resizable hints outside split layouts through the author diagnostic channel while preserving fallback sizing behavior.
- 2caadba: Report invalid split-pane minimum and keyboard-step options independently, without repeating an unchanged warning during a live option update.
- 2caadba: Report invalid splitter sizing and keyboard options with stable diagnostic codes and use safe numeric defaults.
- b52b1dd: Keep Skeleton splitter handles above adjacent pane content and prevent browser scrolling from taking over touch resizing. Preserve the original touch during scoped-direction shadcn resizing when another finger starts or ends on the handle, and cleanly stop the native drag on cancellation.
- b52b1dd: Complete portable splitter sizing: fixed CSS dimensions, weighted remainder, vertical content sizing, per-pane bounds, gaps, alignment and constrained overflow. Preserve resized shares and mounted controls during data updates and responsive stacking.

  Retain native Flowbite Pane/Divider components with a shared bounded controller because the native group lacks controlled per-pane constraints. Forward shadcn's native Resizable layout API and preserve the adapter during component sync. Harden drag ownership and cancellation, and add localized sizing examples with browser coverage for native and Web Component hosts.

- b52b1dd: Share splitter visibility and weighted initial sizing across renderer families. Honor disabled resizing while keeping the native boundary visible, localize handle names and unsupported-wrap/span diagnostics, and clean up active Flowbite/Skeleton drags on removal. Add the source split-layout demo with English and Bulgarian supplements.

  Fixed child dimensions and min/max constraints remain outside this initial weighted sizing implementation.

- a1a5ead: Keep previously visited categorization step panels mounted but hidden and inert so pending text edits survive step navigation. Unopened steps remain unmounted to avoid premature initial focus. The shadcn stepper also avoids remounting all panels when named categories reorder.
- a1a5ead: Associate visible string-control help and errors with the native input in each renderer family, preserving author-provided `aria-describedby` IDs and avoiding references when the wrapper is hidden.

  Apply the same association to native multiline textareas.

- a1a5ead: Preserve structured collection, section, object-owned, mixed-tree and recursive-tree errors with translated field labels and one-based row context. Include root-array descendants, retain separate errors sharing a schema path, and provide bounded native disclosures with localized expansion controls. Keep row and section actions outside nested native buttons, route direct object and rejected-property failures to their own headings, and restore focus after dismissal.
- 2e5054a: Show recursive tree rename and delete actions on hover or selection, and use inline confirm and cancel buttons when renaming mixed tree nodes.
- b52b1dd: Key tuple tail editors by their bound array position so edits continue to target the current position after removal or external data replacement. Use the supported Svelte open-shadow option in Flowbite and Skeleton Web Components.
- a1a5ead: Reserve `TemplateLayout` for its extended renderer in each standard family. An unsupported configured template language now reaches the renderer's localized diagnostic instead of being silently handled as an empty generic layout.

  Report unsupported languages as structured author diagnostics with stable codes and safe details.

  Report denied script permission for a visible supported `TemplateLayout` once per mounted path, alongside its translated in-form explanation.

- b52b1dd: Resolve live relative $data temporal bounds and the spec's namespaced restrict setting. Prevent restricted picker selections while preserving imported values and typed range violations with schema validation. Diagnose save formats incompatible with schema-selected date/time formats.

  Apply time views independently of storage, provide localized native month/year selectors for coarse date views, and translate picker controls through JSON catalogs. Import the canonical temporal-controls fixture with English and Bulgarian supplements.

  Keep Flowbite native popover triggers inside their owning shadow root.

- a1a5ead: Associate visible date, time and date-time help and errors with their inputs while preserving authored descriptions and draft and range hints.
- a1a5ead: Use authored flat `config.restrict` for date, time and date-time pickers, with local `options.restrict` taking precedence. Ignore the removed `jsonformsExtended.restrict` path consistently with other controls.
- 2caadba: Report an incompatible temporal save format again when the same mounted control moves to another data path.
- a1a5ead: Constrain date, time, and date-time renderer selection to string Controls when UI `options.format` is supplied, so numeric schemas keep their numeric renderer.
- 2caadba: Localize the 12-hour time picker's AM/PM display text and accessible names through the renderer message catalog. Update them when the host locale changes without changing the stored time.
- a1a5ead: Keep date, date-time and time picker popovers within the viewport and allow their content to scroll on short screens.
- 2caadba: Report incompatible temporal save formats once per affected mounted control
  with a structured warning and the control path. A second form with the same
  invalid option now receives its own warning.
- a1a5ead: Honor a selected seconds view in time and date-time pickers even when the display format omits seconds. Preserve and save the edited seconds without changing the display format. Discard staged date-time picker drafts when the host replaces the value while the picker is open. Keep incomplete date, time and date-time text local until it can be completed, and discard those drafts on host value or control-target replacement. Collection actions now respect unfinished temporal text in a sibling control, including across nested pagination scopes, and resume after completion.

  Resolve absolute `$data` temporal bounds from the form root so native date pickers can update their disabled dates when host data changes.
  For direct date, time and date-time values edited under literal dotted property names, resolve sibling and root `$data` bounds before compiling the isolated validator, and refresh those bounds when parent data changes.
  Carry the original document root through nested literal-key editors so both relative sibling and absolute root bounds keep their meaning.
  Use that same root and exact path for ordinary date, time and date-time children of an isolated literal-key object.

  Show translated, input-associated guidance while date, time or date-time text is incomplete or invalid, without publishing a committed-value error. Clear the guidance when the text becomes parseable.

- a1a5ead: Honor `showActions: false` for month and year date/date-time pickers: publish
  valid selections immediately and omit OK/Cancel. With `showActions: true`, keep
  selection staged until confirmation. Flowbite also preserves the selected day
  when changing a coarse calendar view.
- 44ece2e: Align workspace ajv-formats with version 3 so timezone-less time values fail JSON Schema validation consistently with the JSON editor.
- a1a5ead: Initialize time pickers from the same local clock shown in their text controls so offset-bearing values and referenced bounds use consistent hours.
- a1a5ead: Compare offset-bearing time-picker selections and schema bounds on the same reference date as the time validator. Valid local-midnight selections remain available, while lower and exclusive upper bounds still reject out-of-range steps.
- a1a5ead: Keep the selected AM/PM period unchanged when a restricted time or date-time picker rejects the alternate period. Advance 12-hour controls on the underlying 24-hour clock, so hour steps cross noon and midnight correctly.
- a1a5ead: Explain rejected out-of-range time and date-time picker steps beside the control, keep Apply disabled until the draft is valid, and preserve the committed value after rejected edits.
- b52b1dd: Translate table and AG Grid column headings using JSON Forms schema and path label keys. Refresh grid columns when the locale, translator or control path changes, preserve explicitly empty translations, and retain authored native column headings.
- 2caadba: Open tuple icon-action tooltips on keyboard focus inside Web Components and dismiss them on Escape while retaining Add/Delete behavior.
- a1a5ead: Show the disabled Add action beside corrective Delete when imported tuple data exceeds a forbidden tail, matching the React renderers.
- a1a5ead: Show the tuple-wide `additionalItems` validation error beside the Additional Items heading while a forbidden imported tail can be removed.
- b52b1dd: Dispatch authored tuple position layouts through native layouts, preserving positional data paths and per-position summary/detail overrides. Diagnose invalid or undeclared position scopes and retain omitted values and validation. Keep tuple-level generation modes separate from inline position layouts. Align additional-item heading and delete translations with the reference catalogs (`tuple.additionalItems` and `tuple.delete` with a translated `label`).
- a1a5ead: Style blocked tuple-tail Add feedback as an error in all three Svelte renderer sets.
- a1a5ead: Summarize validation errors in tuple trailing items, including off-page errors, and navigate to the first invalid trailing item without counting fixed-position errors.
- a1a5ead: Preserve tuple-tail editor occurrences through local edits, additions and removals, including duplicate values and literal property scopes. Keep fixed tuple positions positional, relocate surviving editor errors, and dispose removed or externally replaced subjects. Reconcile file-size metadata after delegated paths settle so moving a retained editor does not discard its selection-time errors.
- b52b1dd: Distinguish true, false, absent and invalid boolean data in native checkboxes, switches and cells. Provide English/Bulgarian accessible state descriptions and preserve required-field semantics without forcing a true answer through native HTML validation. Guard disabled mutation callbacks.
- b52b1dd: Use internal selection IDs for enum and const-oneOf selects and radios, preserving original JSON types, null and empty-string choices, duplicate labels, and structural selection after a host reload. This prevents duplicate-key crashes for object-valued choices.

  Support finite enum arrays of any JSON type. Compare multi-choice members structurally and avoid removing an unrelated last item when a requested member is absent. Preserve standalone falsy const choices despite the installed JSON Forms mapper's truthiness check.

- b52b1dd: Select the mixed JSON editor for unrestricted root and property schemas, including annotation-only schemas and resolved references. Preserve specialized enum, composition, object, and constrained-schema selection. Share the selection rule across renderer families.

  Preserve translation keys in delegated mixed primitive inputs, including live English/Bulgarian label updates.

- a1a5ead: Show field and composite validation summaries on hover in the Svelte renderer families while retaining click, keyboard and Escape access.
- d4dd92d: Build Web Components with Vite 8 and Rolldown, preserving registration side effects and library chunk execution order. Preserve demo Web Component entry and chunk URLs with static-copy 4. Align workspace tooling with Vitest 5 and migrate browser tests to asynchronous rendering.

  Center boolean checkboxes and clear action when used inside a mixed-type selector.

- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [aba358e]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [aba358e]
- Updated dependencies [d4dd92d]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [d4dd92d]
- Updated dependencies [d4dd92d]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [aba358e]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [aba358e]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
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
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [acc5dfa]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
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
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [aba358e]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [59330a6]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [aba358e]
- Updated dependencies [aba358e]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
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
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
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
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
- Updated dependencies [2caadba]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [a1a5ead]
- Updated dependencies [b52b1dd]
- Updated dependencies [b52b1dd]
- Updated dependencies [2caadba]
  - @chobantonov/jsonforms-svelte@2.0.0

## 1.0.2

### Patch Changes

- bfcaa62: Correct browser web-component exports and published TypeScript declarations, validate packed artifacts for all packages, fix the Flowbite AG Grid CSS selector, and prepare independent npm consumers.
- Updated dependencies [bfcaa62]
  - @chobantonov/jsonforms-svelte@1.0.2

## 1.0.1

### Patch Changes

- 79b2ff4: Publish the initial npm packages for the core Svelte bindings, Flowbite and Shadcn renderer sets, extended helpers, and web components.
- Updated dependencies [79b2ff4]
  - @chobantonov/jsonforms-svelte@1.0.1
