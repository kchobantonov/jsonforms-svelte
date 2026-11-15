# @chobantonov/jsonforms-svelte

## 2.0.0

### Major Changes

- b52b1dd: Correct Svelte peer minimums to match APIs and native UI dependencies: core/shared extended require Svelte 5.20, Flowbite requires 5.40, shadcn requires 5.33, and Skeleton requires 5.29. Existing applications on Svelte 5.50.1 remain compatible.

### Minor Changes

- b52b1dd: Expose authored host configuration separately from defaults inserted by JSON Forms. Add shared restriction resolution with local boolean, authored global boolean, then the specification's true default. Existing core reducer defaults remain unchanged for upstream-compatible consumers.
- b52b1dd: Separate rejected file selections and read failures from stored-data validation. Show local warning/error feedback, clear it on external replacement, and use compact native popups in delegated table/grid cells. Add English and Bulgarian size-limit fallbacks and a shared cell-presentation context for delegated controls.
- b52b1dd: Add native choice-card renderers with typed value identity, branch detail resolution, translated labels, keyboard selection and configurable branch-change confirmation. Preserve enclosing properties when changing branches and restore selection when confirmation is cancelled.

  Use the shared detail resolver in tuple fields, mixed schema helpers and composite cells. Add the latest spec choice-controls demo, including English and Bulgarian generated/registered card detail examples.

- b52b1dd: Use full-header Group disclosure with mounted content, native Collapsible components in shadcn and Skeleton, and a native Flowbite Button. Resolve collapsed defaults from the portable namespace, preserve explicit false, and localize data indicators in English and Bulgarian. Include ListWithDetail values in data presence and ignore inherited object properties.
- b52b1dd: Provide a form-local renderer error store with per-instance ownership, generation checks for asynchronous results, explicit path relocation, pending state and cleanup. Merge its errors with host-supplied errors without replaying stale form data. Add a separate onvaliditychange callback covering schema errors, additional errors and pending validation while preserving the base onchange contract.

  Forward combined validity through the extended form and a typed validity-change Web Component event; expose merged additional errors in the extended action context.

- b52b1dd: Add bounded OTP password presentation using Bits UI PinInput for shadcn and native input compositions for Flowbite and Skeleton. Preserve partial string codes and leading zeros, retain ordinary masked table cells, and fall back without truncation for oversized imported values or missing length bounds.
- b52b1dd: Use portable horizontal and vertical layout sizing with 16px gaps, explicit wrap control, fixed/span/weight modes, effective visible children and parent-axis Spacer sizing. Spacer reads its declared size; native separators support vertical orientation.

  Layout renderers use the portable sizing contract with options.layout.span, gridColumns and wrap.

- b52b1dd: Infer omitted schemas from every JSON root type, including arrays, scalars and null, and regenerate them when external data changes type. Preserve absent data and authored schemas. Dispatch a root Control when the installed core cannot generate a UI schema for an unrestricted schema.

  Use the same inference helpers in the extended JsonForms host so demos and Web Components preserve absent schema/data and infer scalar roots correctly.

- b52b1dd: Share catalog translation between demos and Web Components. Resolve each message through exact locale, language, English and the supplied fallback; preserve intentional empty strings and undefined misses. Cache parsed text substitutions while using current parameters on every call, and keep catalog expressions inert instead of executing lodash templates.
- b52b1dd: Apply the namespaced host URL policy before loading presentation images. Share policy resolution for allowed schemes, relative URLs and opt-in image data URLs, including rejection of browser-normalized network paths.

  Support top-level image sources and alternative text, reactive scoped image data, and English/Bulgarian diagnostics with host translation overrides. A defined top-level source, including an empty string, takes precedence over scoped data.

- b52b1dd: Distinguish true, false, absent and invalid boolean data in native checkboxes, switches and cells. Provide English/Bulgarian accessible state descriptions and preserve required-field semantics without forcing a true answer through native HTML validation. Guard disabled mutation callbacks.
- b52b1dd: Select the mixed JSON editor for unrestricted root and property schemas, including annotation-only schemas and resolved references. Preserve specialized enum, composition, object, and constrained-schema selection. Share the selection rule across renderer families.

  Preserve translation keys in delegated mixed primitive inputs, including live English/Bulgarian label updates.

### Patch Changes

- a1a5ead: Show the property-name schema's specific validation message while adding a dynamic property without repeating it through the additional-error path. Adding the first property also creates a missing dynamic object. Direct and locally referenced boolean value schemas are normalized before Add, so a permitted `true` pattern schema does not skip the write. Invalid incoming primitive object data no longer appears as character-indexed dynamic properties and can be replaced through Add.
- 2caadba: Use portable `additionalProperties.add`, `addTo`, `rename`, `delete` and `deleteBlocked` messages for dynamic-property actions across all three renderer families. Keep required-property rename/delete permissions.
- a1a5ead: Keep additional-property name drafts usable when a malformed name schema or unavailable host validator keyword prevents preview compilation. The form validator remains responsible for reporting schema errors.
- 2caadba: Use the portable additional-property catalog keys for Add, Rename, and mixed-tree Rename titles, placeholder, confirmation/cancel actions, and name-validation feedback. Property row Rename/Delete buttons now use the named catalog labels, including literal property names. Imported EN/BG translations reach these controls in every Svelte renderer family. Keep the mixed type selector and value editor aligned below the row actions. The empty row-detail panel reads `collection.selectItem` and ListWithDetail index text reads `array.indexLabel`; both respond to locale-only changes.
- a1a5ead: Reveal newly added AG Grid rows on the correct native pagination page. When a filter hides a new row, show translated feedback and a control to clear the filters.
- 2caadba: Keep AG Grid filters active when navigating to an error in a filtered-out row. Open its row-detail dialog or panel directly, and return dialog focus to the visible error-navigation action on cancellation.
- b52b1dd: Support anonymous recursive root schemas in the default validator without inserting a schema ID or changing authored schema identity. Temporarily register anonymous roots during compilation, release the registration afterwards, and retain cached validators until explicitly removed. Supplied host validators remain unchanged.
- 2caadba: Apply native multi-select batch changes in interaction order and check array size after the complete replacement, so swaps at `minItems` or `maxItems` remain possible.
- b52b1dd: Apply authored restriction precedence and min/max item bounds to native checkbox arrays. Keep imported out-of-domain values visible and removable, preserve typed identity, and synchronize checkbox state after removing one duplicated occurrence. Wrap horizontal choices and guard mutation handlers against readonly and disabled changes.
- 2caadba: Expose required state to assistive technology on chips, multi-select controls and automatic checkbox groups, including when the visual asterisk is hidden. Checkbox groups use a localized group description so individual checkboxes are not falsely marked required. Array-choice editors now associate visible help and item-error feedback with the focusable native input, listbox or combobox.
- a1a5ead: Keep failed `contains` validation on the array instead of showing Ajv's provisional candidate failures as errors on each item. Independent item validation and host errors remain visible.
- a1a5ead: Show array-level validation messages before a short localized child-error notice in normal tables and AG Grid. Check only for child-error presence unless the count option is enabled, and reuse normal-table error positions for pagination and first-invalid-item navigation. The action navigates across pages and reveals rows hidden by active grid filters without expanding field errors into the array header.
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
- aba358e: Add localized native clear actions to boolean checkboxes, switches and table cells. False remains a present, clearable answer; clearing an ordinary property removes it instead of switching it off. Dynamic properties retain their key, and array-item clearing preserves the slot using the boolean empty value. Actions appear on hover/focus or touch, respect clearable and readonly state, and remain separate from property deletion.

  Keep AG Grid boolean widgets centered with their clear action at the cell edge, and align the Flowbite color popup trigger with its text input.

- b52b1dd: Accept boolean root schemas without hiding the form. Keep the original schema in core validation so errors retain their original keywords and paths, while adapting the rendering boundary for upstream object-schema APIs.

  Preserve forbidden array items and tuple tails in mixed-tree editors and combine declared property constraints with every matching pattern. Keep imported invalid data available for correction without mutating its schema.

- 2caadba: Use the localized branch-change confirmation title, message, and actions for
  oneOf selectors and choice cards. Remove the unused generic combinator dialog
  catalog entries and fallback mapping, including the old clear-form copy.
- 2caadba: Use only canonical authoring locations and names for template language, Monaco error publication, section and Stepper indicators, layout and AG Grid sizing, array sort actions, mask tokens, ImageView source fields, Button action, label and stable-name fallback, catalog parameters, and readonly options/config. Remove the explicit columns layout adapter and compatibility-only tests.
- a1a5ead: Validate custom choice-card identifiers before applying them. Duplicate,
  unknown, out-of-range, and ambiguous entries no longer customize a card, and
  the renderer reports author-facing diagnostic codes for those entries.
- aba358e: Cancel choice-card branch confirmations when their data, schema, path or edit permissions change. Recheck the captured target before committing a confirmed branch change. Bound shared shadcn Select popups by the available viewport and a 16rem maximum while preserving native scrolling and keyboard navigation.
- d4dd92d: Resolve pending edits before changing choice-card branches. Completed text drafts
  participate in destructive-change confirmation, while unfinished composition or
  pending editor work preserves the current branch and native radio selection.
- a1a5ead: Report `i18n.missingKey` once for a catalog lookup that has neither a translation nor fallback text. Keep intentional fallback lookups silent.
- a1a5ead: Report a stable author diagnostic once when a catalog translation references a missing interpolation parameter, including when the caller supplies no values object. Keep its placeholder visible and leave ordinary fallback strings out of the diagnostic path.
- a1a5ead: Give the author-facing warning for a missing Categorization `options.initial` target the stable `categorization.initialNotFound` diagnostic code while retaining the first-visible-category fallback.
- 2caadba: Re-report an invalid categorization initial name when a live UI-schema update corrects and then reintroduces it, without changing the selected category or form data.
- a1a5ead: Keep keyboard focus on the visible fallback tab, stepper header, or accordion header when a selected category is hidden. Preserve Skeleton's focused native triggers, and keep conditional shadcn step registration in DOM order. Track unnamed and duplicate-named categories by their UI-schema object so selection survives sibling reorder without duplicate keyed entries. Reconcile equivalent unnamed category objects across UI replacement so a data update does not remount nested tabs or lose focus.
- 2caadba: Report an unmatched initial category as a structured author warning with a
  stable code, severity, message and authored initial value.
- b52b1dd: Share named initial category selection and stable category identity across tabs and steppers. Refresh category bindings when the UI schema changes, fall back when the selected category hides, and remove stale panels when no category remains visible. Translate Previous/Next through the renderer JSON catalogs and host translator.

  Add native single-open categorization accordions with named initial selection, persistent explicit closure, visibility fallback and live namespaced collapse settings. Closed panels remain mounted using the native components' supported content options.

  Add vertical layout, roving keyboard focus and unique native tab IDs to the Flowbite Tabs adapter. Preserve keyed stepper component identity when named categories move.

- a1a5ead: Reject cyclic choice-card presentation layouts without recursing indefinitely, while allowing shared presentation nodes.
- 2caadba: Show an unmatched imported choice-card value with localized invalid feedback and associate it with the card group, while preserving the original data until a user selects a card.
- a1a5ead: Cancel a pending choice-card branch confirmation when a host changes a referenced branch definition in the root schema.
- a1a5ead: Keep choice cards the same size as selection changes, reserve space for selected-only presentation content, and preserve the intrinsic size of images inside cards.
- a1a5ead: Reject interpolated labels inside selectable choice-card content and retain the choice label as a safe fallback.
- 2caadba: Report choice-card identifiers, conditional projection failures, layout sizing,
  invalid section settings, and split-pane option problems as structured author
  warnings with stable codes and messages.
- a1a5ead: Show translated local feedback when a coarse date picker selects an out-of-range month. Keep the committed value unchanged and disable Apply until the selected date satisfies the bounds.
- 2caadba: Cancel queued collection commands when their owning config or UI-schema options change.
- d4dd92d: Resolve pending edits before ordinary table, expandable-layout and list/detail
  array add/reorder actions. Block unfinished composition and duplicate preparation,
  cancel queued actions after unmount, and recheck schema/path, permissions, options
  and limits before committing.
  Keep expansion and list selection with the moved item. Capture the insertion index
  before adding so newly added layout items open consistently while respecting
  collapseNewItems.
- d4dd92d: Resolve pending edits before collection deletion confirmation. Block unfinished
  composition, evaluate discarded values after completed drafts reach form state,
  and recheck permissions, schema, path, data and removal constraints before commit.
  Invalidate stale confirmations and bind dialog callbacks to their own request so
  late native events cannot cancel or accept a newer deletion. Keep Flowbite array
  layout confirmation state controlled during rapid cancel/retry interactions.
- 2caadba: Use the cached ancestor error index to skip unrelated collections and resolve affected row counts without rebuilding a JSON Pointer for every item.
- a1a5ead: Track collection occurrences in form-local runtime state using verified add/remove/move metadata and explicit descendant edits. Preserve identities through JSON Forms' deep-cloned array commands, including nested collections and equal primitive values. External replacements retain only reliably matched unique object references.

  Key native table and array-layout rows by these identities and provide their logical target context to nested editors. Monaco diagnostics and invalid drafts follow retained occurrences to their current pointers; deleting or replacing an occurrence disposes its owner without changing host errors. Keep validity pending during reassociation. Flowbite array expansion now relies on its existing controlled selection without competing native selection feedback.

- b52b1dd: Add scoped collection pagination with native controls for array tables, expandable arrays, master/detail lists, dynamic properties and tuple tails. Preserve absolute item paths, flush queued edits before navigation, reveal added items and expose errors on other pages. Add the three canonical pagination examples and English/Bulgarian catalogs.

  Isolate dialog-owned errors from committed form errors. Prevent Apply from accepting pending or unparsed edits, invalidate late results on cancellation, and retain ordinary schema-invalid draft editing. Share composite summary behavior with tuple positions.

- a1a5ead: Keep collection pagination work proportional to the visible page and detect added row keys with a linear lookup, so large collections do not build a full index list on every page read or repeatedly scan previous keys on Add.
- 2caadba: Cancel queued collection commands before flushing edits when their target or data changes, and recheck data after post-flush validation.
- aba358e: Add HEX, RGB and HSB channel views and opacity editing to color pickers using each renderer library's native popup and field components. Reopening restores the configured save-format view; changing views preserves stored data. Keep invalid values and rejected transparent hex3 drafts intact, retain picker-only clearing, and translate channel labels through the JSON catalogs and host translator.

  Honor local `options.format` selection for color and duration on string schemas, matching the Antd reference and canonical examples. Keep these testers inapplicable to incompatible schemas and non-Control UI elements.

  Keep color selection in one popover with an inline saturation/brightness surface and hue slider. Remove the nested browser chooser across all three UI families; preserve alpha, channel formats, readonly guards and compact cell triggers.

- 2caadba: Use the portable `combinator.clearForm*` catalog keys for branch-clear confirmation in OneOf and choice-card renderers, while preserving scoped legacy translation overrides. Imported catalogs now control the title, message, confirm and decline actions in every renderer family.
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

- a1a5ead: Resolve temporal `$data` bounds inside composed schemas when editing direct or nested literal property names. Compatible referenced `allOf` date branches now render one editor with live picker limits and typed-value validation.
- 2caadba: Use portable composite array labels and detail dialog titles in all renderer families. Announce a host value change while an isolated cell dialog is open, and keep Apply disabled until the stale draft is canceled.
- a1a5ead: Apply the shared deletion confirmation policy to optional Clear and Remove actions inside composite detail dialogs. Confirmed actions update only the dialog draft; Apply still commits the change. Cancel, readonly transitions, and changed targets discard pending confirmations.
- 2caadba: Reject composite-cell Empty callbacks after their cell becomes hidden.
- b52b1dd: Follow incoming oneOf data until a user chooses a branch, discard stale detail when its node disappears, and recognize distinct required discriminators even when other branch fields are invalid. Bound selected indexes after branch replacement and preserve editable object-only array slots when clearing a branch.

  Route missing required discriminator errors to localized selector feedback and honor validation visibility. Cache discriminator reference analysis by schema/root identity.

  Keep an explicitly selected branch open when its generated defaults are an empty object.

- 2caadba: Project ordinary fields from referenced `allOf` branches when conditional-field
  presentation is enabled. This keeps generated object details finite and makes
  the referenced fields editable even when the branch has no `if` condition.
- a1a5ead: Treat a local conditional-field `$ref` resolving to the boolean schema `false` as a valid reference instead of reporting it as missing.
- b52b1dd: Add opt-in conditional object fields with isolated condition evaluation, dependencies, authored placement and localized diagnostics. Preserve inactive data and original document validation. Render single oneOf/anyOf branches directly and let anyOf follow incoming data until the user chooses a view.

  Add cached, isolated active-branch feedback for object anyOf/oneOf editors without changing document validity. Respect local overrides and validation visibility.

- a1a5ead: Report conditional-field projection reference and evaluation failures as deduplicated coded author warnings with the affected path. Keep the localized in-form fallback and form data unchanged.
- a1a5ead: Discover conditional object branches reached through local or host-registered `$ref` inside `allOf`, including finite populated recursive occurrences. Select the object projector for those controls, including in NoValidation, while preserving inactive stored values and leaving whole-form validation authoritative. Add cross-family native and production interaction coverage.
- 2caadba: Recheck a deletion confirmation's target before flushing edits during acceptance so a host replacement cannot receive a stale write.
- 2caadba: Align section and container validation indicator counts and paged first-invalid-item navigation with their detailed summaries by excluding provisional errors from failed `contains` candidates. Independent item errors and the array-level `contains` failure remain visible.
- b52b1dd: Add the six-field cron profile, native structured schedule pickers, staged actions, translated diagnostics, and the canonical scheduled-jobs example with English and Bulgarian catalogs. Preserve invalid expressions and advanced syntax for raw editing.

  Preserve validation constraints when delegating mixed-type schemas, narrow same-value composition branches without changing child schemas, and resolve escaped property names correctly. Explicit mixed types now retain their renderer when composition or enum constraints are present.

  Add mixed nested and JSON code presentations, selected-type detail dispatch in tree mode, and native mixed frames with portable collapse precedence. Preserve numeric editor intent and distinguish clearing a value from clearing its type. Apply the shared confirmation policy to destructive mixed actions and guard delayed dialogs against replaced values and permissions. Import the canonical mixed-control example with English and Bulgarian JSON catalogs.

- a1a5ead: Expose current automatic schema validation in combined-validity notifications. NoValidation no longer reports an empty-error form as valid. Notify hosts when validation modes change without a data edit, preserving pending and additional-error contributions for submit guards.
- 2caadba: Cancel open deletion confirmations when their owning options or config change.
- 2caadba: Forward focus conflicts from isolated detail dialogs to the owning form's author diagnostic callback.
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
- a1a5ead: Clear row-detail selection when an external collection update makes the selected occurrence ambiguous. Duplicate primitive values and repeated object references no longer transfer the detail pane to an arbitrary surviving row. Preserve unique-object moves and existing immutable row-edit behavior across the native table and AG Grid integrations.
- b52b1dd: Share duration parsing and draft handling across native pickers. Use separate weeks/component modes and native unit selectors, preserve exact imported values, accept duration quantities beyond clock-field limits, and retain incomplete drafts without rounding or overwriting committed data. Publish pending validity separately from schema errors and provide JSON-catalog English/Bulgarian feedback.
- b52b1dd: Preserve equivalent duration spellings when applying an unchanged picker value. Move picker units, actions, hints and accessible names into the shared translation catalogs with English and Bulgarian defaults.
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
- 2caadba: Count array child errors and locate invalid AG Grid rows using exact JSON Pointer members beneath literal dotted paths.
- 2caadba: Use exact parent and scope path members for literal control document context, ArrayChoices item-error ownership, and interpolated Label nearest-item lookup. Keep a literal dotted array distinct from its nested lookalike.
- 2caadba: Use exact data-path members for active oneOf/anyOf branch validation and missing-discriminator error routing so a literal dotted parent stays separate from its nested lookalike.
- 2caadba: Use exact scoped members for collection error positions and array header validation. Keep cell error filtering on the already complete mapped cell path so valid item errors remain visible.
- 2caadba: Route object, rejected-property, and property-name errors by exact JSON Pointer members so a literal dotted object and a nested lookalike do not share feedback.
- 2caadba: Keep before-touch and tuple-position error feedback on exact literal path members.
- 2caadba: Capture exact renderer path members for scoped rule evaluation so a literal dotted parent and its nested lookalike remain distinct. Apply the same rule path to extended Button and Label-summary mapping.
- 2caadba: Keep scalar composition messages on their exact JSON Pointer member when literal dotted and nested paths collide.
- 2caadba: Preserve exact parent path members in section and stepper validation indicators, control and array-child error filtering, tuple omitted-position errors, composite-cell summaries and removal limits, and Boolean/slider array-parent checks when a literal dotted member shares a flattened path with nested data. Delay Skeleton icon hint hover opening until the trigger click completes so Boolean Clear still commits after pointer entry.
- 2caadba: Preserve exact Control path members when locating tuple-tail and dynamic-property collection errors.
- 2caadba: Keep imported out-of-domain enum and named-choice values visible beside select and radio presentations in all three renderer families. Associate the localized value with the focusable choice control while preserving the stored data.
- a1a5ead: Stop recursive allOf references at absent data and offer a guarded, localized action to create one child at a time with JSON Forms defaults and local feedback for required missing children. Add optional, required and defaulted finite recursive-reference demos and native/production acceptance coverage.
- acc5dfa: Keep Flowbite detail-dialog action hints inside the dialog by placing the maximize hint below its button and aligning the Apply hint with the button's right edge.
- b52b1dd: Refresh native AG Grid messages after locale or host-catalog changes, retaining grid sorting, filtering, paging, widths and selection. Preserve open isolated dialogs and invalid drafts before recreating the grid. Respect native locale overrides, including empty messages. Use native family buttons for grid add/remove actions.
- b52b1dd: Translate asynchronous grid loading and failure messages through the shared JSON catalogs and host translator, including English and Bulgarian defaults.
- a1a5ead: Use form-owned occurrence identities for AG Grid rows, cell editors and native/grid detail panels. Preserve selected details and Monaco diagnostics through local moves and deletion of other rows; clear ownership when the selected row is removed or externally replaced. Remove the grid's separate positional identity heuristic so duplicate values cannot inherit another row's editor or errors.

  Refresh retained cell bindings after a move even when their displayed values are unchanged, so subsequent edits write to the new source path. Avoid replacing native row data for validation-only updates.

  Provide optional occurrence keys to the shared row-detail selection helper and collection context to detail content, retaining the conservative fallback for callers without keys. Replaced native row occurrences dispose open detail dialogs so stale drafts require reopening.

- 2caadba: Reject hidden ArrayChoices, ChoiceCards and tuple-tail mutation callbacks.
- a1a5ead: Preserve host-validator property-name errors in additional-property Add and Rename feedback, including host-only formats and keywords.
  Keep the Add field's visible and accessible Property Name label when a name constraint supplies a composed draft schema.
- a1a5ead: Render absolute references to external schema documents already registered with the host Ajv instance from identified or anonymous roots while validating against the original schema. Support transitive registered references, nested `$id` resources and document-local anchors without fetching URLs or duplicating nested resources. Diagnose missing documents, anchors, JSON Pointers and anonymous-root relative refs even in NoValidation while preserving data and recovering when the host supplies Ajv. Report `$dynamicRef` as unsupported for rendering rather than opening an unconstrained editor. Pass JSON schema resources through each demo and Web Component, with native and production interaction coverage across all three renderer families.
- 2caadba: Keep missing ImageView alt text on the author diagnostic channel without showing an in-form warning while the image renders. Missing or refused image content still has a visible explanation.
- 2caadba: Report ImageView configuration and URL-policy diagnostics to authors once per
  mounted condition without including the source URL.
- a1a5ead: Keep image data URLs behind `allowImageDataUrls` and require an image MIME type even when the host also lists `data` among allowed URL schemes.
- b52b1dd: Reject a scope-bound ImageView source when its schema is false. Preserve true-schema support, stored data, localized diagnostics and live schema replacement across renderer families.

  Resolve scope-bound image data by literal property segments so dotted and empty names work within the current array-item context. Ignore inherited values.

  Keep scoped presentation elements out of literal Control isolation and mixed/tuple control selection. ImageView now retains its authored source, alternative text and diagnostics in the full renderer registries, including unrestricted and tuple schemas.

  Restrict the generic array fallback to Control elements as well, so an image bound to an array reports a source-schema diagnostic instead of displaying an array editor.

- a1a5ead: Show imported `propertyNames` validation failures on the offending additional-property label with a readable error indicator in all three renderer sets.
- a1a5ead: Report a coded author warning when multiple focus requests are active in the same form view, including formatted integer table cells. Inactive categories, visited steps, closed accordion panels and collapsed groups do not count; native focus behavior remains unchanged.
- 2caadba: Preserve translated Label templates until their `textParams` are resolved, so
  valid interpolated summaries do not emit false missing-parameter diagnostics.
- a1a5ead: Show validation errors for invalid imported array choices on the affected pill and in the field, while preserving the stored value until the user removes it.
  Use a complete error-colored border for the invalid pill and keep ordinary field labels neutral when their values fail validation.
- a1a5ead: Show unnumbered property-name error markers beside imported dynamic-property labels, and validate the initial Rename draft against propertyNames across the Svelte renderer sets.
- b52b1dd: Prevent compiled composition branch probes from inserting defaults or transforming live form data during renderer selection.
- b52b1dd: Evaluate schema and predicate rules against isolated data in shared renderer mappings, layout visibility and Button conditions. Preserve host validator references and formats while preventing rule defaults and transforms from modifying live form data.
- b52b1dd: Scope Label-summary cell feedback to the fields exposed by its detail layout. Hide preview-only errors and type markers, prevent whole-row clearing, and translate cell error accessible names through the shared catalogs. Preserve document identity when a serialized host echoes equal data, retaining row selection and child editors.
- a1a5ead: Report unsupported, invalid, and conflicting portable layout sizing hints as coded author-facing warnings instead of visible form validation alerts. Keep raw diagnostic details on layout items for inspection and preserve Fixed > Span > Weight precedence.

  Diagnose invalid local/global layout container settings while keeping their normal fallbacks, and reject inherited-property names as align/justify values.

  Assign item warning codes in the shared sizing helper instead of classifying English messages in the layout adapter. Preserve the existing inspection messages and sizing behavior.

- b52b1dd: Keep brackets literal when routing collection error badges, Group/Category validation indicators, Flowbite stepper feedback and label item context. Use the existing JSON Forms data-path parser so a property named rows[0] remains distinct from rows.0, including host errors under hidden schema validation.
- a1a5ead: Resolve composite Control summary previews and field schemas from decoded JSON Pointer members, preserving literal dotted, empty, escaped, and prototype-looking property names.
- b52b1dd: Edit declared properties with dotted or empty names through literal-key dispatch boundaries. Retain sibling values, required and host validation, readonly state, references, and renderer-owned error paths.

  Keep literal-boundary selection and forwarded renderer props on the same snapshot during host UI-schema replacement, including control-to-layout transitions.

- a1a5ead: Keep a dynamic additional-property key when a custom renderer clears its isolated value with `undefined`. Use the property's schema default for that clear and reject stale edits after the key is removed. Declared literal controls retain their ordinary clear-to-absent behavior.
- 2caadba: Route control errors by their original JSON Pointer members when a literal
  dotted key and a nested path flatten to the same control path. This keeps an
  error on one field from marking the other field invalid.
- b52b1dd: Preserve repeated escaped tildes, hash and empty property names in scoped image sources, editable controls, list/detail bindings and section indicators. Resolve literal schemas through local references and composition branches without losing false schemas or following inherited properties. Keep required flags and unrelated values intact during literal-property edits. Default translation keys use the same decoded scope as the stored value.
- a1a5ead: Match label-detail validation errors by decoded JSON Pointer members so literal dotted, empty, slash and repeated-tilde property names do not inherit errors from nested lookalikes. Suppress document validation in NoValidation while preserving host feedback.
- a1a5ead: Carry the current source item through collection rendering contexts so interpolated Labels use the rendered row even when a literal dotted property name collides with a nested data path.
- a1a5ead: Evaluate rule conditions against literal dotted, empty, and repeatedly escaped tilde property names without interpreting them as nested paths. Preserve host Ajv formats and keywords, compound rules, and predicate isolation.
- a1a5ead: Bind native table cells for empty, dotted and other unsafe literal property names through isolated compact cell dispatch. Preserve the item's other fields and show translated required column headings.
- b52b1dd: Use explicit schema i18n prefixes for composition branch labels. Refresh array and composition translations when host locale/translations change, and use English/Bulgarian JSON catalogs for oneOf dialog defaults and selector actions. Preserve intentionally empty host translations.
- a1a5ead: Replace global option arrays with explicitly supplied local arrays, including empty arrays, and replace Monaco and AG Grid option bags as units. Keep per-field overrides for other nested option objects across the Svelte renderer families.
- a1a5ead: Apply declared local ImageView width and height dimensions in all three renderer families, ignoring invalid values. Separator orientation now reads only local `options.vertical` and ignores the removed flat config key.
- a1a5ead: Localize ListWithDetail item index announcements in English and Bulgarian, including the Flowbite avatar name, and update them when the form locale changes.
- b52b1dd: Move default theme-toggle action labels into the EN/BG renderer catalog, describe the next cycle mode and hide decorative icons from assistive technology. Preserve host labels, including empty overrides. Use translated native CloseButtons for Flowbite multiline and free-string suggestion controls, restoring editor focus and preserving readonly clearing policy.
- b52b1dd: Add lazy Markdown labels with basic and extended grammar, shared URL policy, escaped text rendering, and English/Bulgarian diagnostics. Keep rich choice-card content inert and render its links as text so native radio selection remains the only interaction. Add lazy CEL interpolation with declared text parameters, gated data namespaces, locale formatting and safe Markdown substitutions. Include the spec Label interpolation and Markdown examples in the demo catalog.

  Improve demo message fallback and avoid stale interpolation parameters. Supply separate EN/BG translation supplements for missing spec-example labels without modifying source fixtures.

- aba358e: Reject stale masked-input edits and clear actions after readonly is enabled, including configurations that keep readonly controls enabled for inspection.

  Share safe mask-token parsing across all three native inputs. Invalid regular expressions retain the default token and display a translated diagnostic instead of throwing during rendering. Preserve Unicode patterns, legacy regex escapes, token removals and host RegExp values.

  Use the shared Svelte text-draft lifecycle with the reference mask engine for all three native inputs. Keep IME drafts provisional, cancel them on host replacement or clearing, preserve caret position during insertion, and enforce stored-value length without HTML maxlength. Compact table cells share the same pending/readonly behavior.

- a1a5ead: Retain a selected mixed Control's `validateActiveBranch` option when delegating to a generated composition editor, including explicit false. Centralize the active-branch validation policy for consistent local/global and validation-mode precedence. Keep the canonical branch-feedback example expanded in nested mixed mode and translate its delegated branch labels.
- a1a5ead: Render selected mixed-tree literal details within the parent form context. Preserve literal paths and tree navigation while publishing renderer-owned errors and pending validation to the parent, displaying host errors at the selected value, and releasing ownership when that value is removed. Reject delayed writes to members that no longer exist.
- 2caadba: Use portable mixed type, tree search and tree region catalog keys in all three renderer families. Type selectors, search inputs and tree navigation expose translated accessible names and respond to host catalog overrides.
- b52b1dd: Translate mixed-tree actions, dialogs, rename errors, navigation labels and array item labels through shared English/Bulgarian JSON catalogs and host overrides. Update mounted trees when the locale changes.
- a1a5ead: Coordinate mixed-tree rename and deletion with pending detail edits, name composition, stale-owner checks and destructive confirmation. Preserve selection through literal-key rename and return to the parent after deletion. Honor required keys and disableRemove, and expose translated rename input and breadcrumb names with accessible inline feedback.

  Preserve unrestricted array-item schemas and generate a value control when no detail layout can be generated, so mixed array rows cannot reuse the root form schema or UI.

- 59330a6: Keep mixed tree rename drafts open until Rename, Cancel, Enter, or Escape. Resolve View actions through the original document path so selected object details and tree rows stay in sync. Keep the selected object's top type selector non-clearable while leaving other selectors unchanged.
- 2caadba: Emit structured, safe Monaco author warnings for inactive themes, diagnostic failures, editor load failures and unavailable error publication stores.
  Add severity to shared UI-schema, dynamic-default and Button script author diagnostics.
  Include severity on template language, permission and URL refusal warnings.
  Add structured severity to shared catalog warnings and a stable message and
  safe option details to invalid Group/accordion collapsed warnings.
  Align Button permission and Monaco option warnings in all native
  extended families. File read failures report a safe coded error without
  logging the caught exception.
- a1a5ead: Track Monaco diagnostic requests by model, content version and logical target. Reject obsolete worker results, keep participating validation pending until the current result arrives, and report validation failures with localized feedback. Preserve unrelated host errors and retain invalid drafts when the same object target moves.

  Isolate external target and schema replacements with new owned model URIs while retaining the editor instance and selection. Preserve the model during ordinary edit feedback. Query JSON, JavaScript/TypeScript and CSS-family diagnostics directly so empty results also complete validation, and prevent validity publication from triggering a validation loop.

- b52b1dd: Publish one owned, translated Monaco language-error summary when propagateErrors is enabled. Ignore warnings and other models, retract summaries on correction or language changes, and preserve host errors. Avoid republishing JSON Schema diagnostics already handled by the form validator.

  Import the canonical additional-errors example with English/Bulgarian host catalogs and simulated server actions. Editing a field clears only that field's simulated server error; no request is sent.

- b52b1dd: Render explicitly requested string code controls with plaintext when no language is supplied. Show translated loading and initialization-failure feedback, release owned resources after failed setup, and preserve worker providers configured by the host application.

  Configure all supported Monaco language workers in the shared demo host so its preserved worker provider handles JavaScript/TypeScript, CSS and HTML as well as JSON.

- a1a5ead: Name the rejected file in localized file-size warnings while retaining the previously committed attachment. Count-limit warnings now state the actual maximum and that existing attachments were kept, matching the React copy.
- 2caadba: Distinguish named templates when detecting UI-schema dispatch cycles so nested
  templates at one data path render, while true cycles still stop. Report template
  lookup and native slot problems as structured author diagnostics.
- b52b1dd: Add Flowbite and Skeleton chips and multi-select adapters with guarded JSON-value selection, native components where their contracts apply, and localized actions. Integrate the canonical array-choice example with English and Bulgarian labels, descriptions and guidance. Preserve repeated tokens, imported invalid members, exact string identity, and schema restrictions.
- b52b1dd: Localize native calendar navigation and announcements through JSON catalogs and host translators. Pass form locales to the native Skeleton calendars and Flowbite date-time picker, and open staged Skeleton calendars on their stored date. Use native shadcn Button variants to retain the reference renderer's theme and focus styles.
- b52b1dd: Honor local and namespaced dialog dimensions, dragging, resizing, and maximize/restore options in native detail dialogs. Keep headers and actions reachable, scroll the body, focus the dialog without selecting editor text, constrain geometry to the viewport, and preserve draft edits and normal geometry through maximize/restore. Add English/Bulgarian actions and maximize/restore icons for each supported shadcn icon library.

  Restore the actual trigger after native dialog teardown, including shadow-root portals. Include native padding in viewport limits and schedule resize updates outside observer delivery.

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

- b52b1dd: Add a trusted compiled Svelte component profile for TemplateLayout with live data, core errors, host context, permission state, translation and delegated Slot components. Compiled templates operate without runtime script evaluation permission.

  Diagnose unsupported string-template languages, avoid child-name collisions, preserve literal slot names, load Ractive only when allowed and visible, and retain template DOM during data-only updates. Refresh live host context independently of schema validation errors.

  Import the canonical template-engine fixture with English/Bulgarian catalogs and a native Svelte host adapter. JSX remains an explicitly unsupported string engine in the default Svelte registry.

  Provide defineNativeTemplate to mount compiled components and delegated slots in their owning Svelte runtimes, including separately bundled Web Component hosts.

- b52b1dd: Preserve IME drafts in native text, multiline and suggested-string inputs, enforce schema length in Unicode code points, and cancel pending edits on host replacement or permission changes. Preserve later typing across feedback from an earlier commit. Button actions flush completed edits before reading form data and do not run while composition remains unfinished.
- a1a5ead: Rebase document-local nested `$id` and `$anchor` references to root pointers for JSON Forms mapping and validation. Keep finite recursive object children absent until explicit, readonly-guarded creation in all three renderer families. Report unresolved local anchors without changing data, including in NoValidation, and recover when the host supplies a valid schema. Cover root and nested resource references through native and production demo interactions.
- a1a5ead: Hide document validation messages from scalar controls in NoValidation mode while retaining host-provided additional errors.
- b52b1dd: Parse complete numeric entries without truncation, non-finite commits or silent decimal precision loss. Keep unsupported entries as local drafts with translated feedback, enforce supported numeric bounds with repair and restrict overrides, and diagnose invalid stepping options. Preserve zero, negative values, clearing semantics and incoming invalid data.

  Preserve native Svelte numeric binding null values as view state, so incomplete signs and exponents remain editable. Use Flowbite’s native selected tab binding and stable category keys.

- a1a5ead: Resolve numeric input increments from local `options.step`, then the schema's suitable `multipleOf`, then the numeric-type fallback. Ignore undeclared flat `config.step` while preserving separate slider increments.
- 2caadba: Report invalid explicit numeric steps to form authors while retaining the safe input step fallback and keeping configuration warnings out of the form.
- b52b1dd: Show translated direct object errors beside the owning Group title, or above non-Group details. Keep required-child and property-name feedback separate, retain host errors when schema validation is hidden, and preserve independently authored nested Group indicators.

  Keep rejected imported properties visible and removable, with translated feedback naming each rejected key at the additional-properties heading. Use the resolved Group as the object boundary, remove redundant inner borders and empty static regions, and frame other nested object details with native cards. Respect explicit object title suppression.

- b52b1dd: Guard repeated object registry dispatch at the same data path and fall back to the generated form, preserving edits and allowing independent reuse of registered layouts.

  Integrate canonical object-control and array-controls examples with English/Bulgarian JSON supplements and a typed object registry. Keep schema localization from annotating property dictionaries and use exact translation keys for constant choices.

  Translate composite-cell dialog labels and generated summaries through the host catalog, preserving schema/UI prefixes and dynamic locales. Give native table column headers explicit column scopes.
  Use the translated schema label as the composite dialog heading when a schema
  title is present, while retaining the generic heading for untitled cells.

- 2caadba: Name the oneOf branch-clear action with the portable "Clear selection" catalog
  key in English and Bulgarian across all three renderer families.
- a1a5ead: Require oneOf or anyOf arrays and each branch's required list, reference, and discriminator constant to be own schema properties. Inherited prototype properties no longer select an editor or trigger missing-kind selector feedback.
- b52b1dd: Use the current JSON Forms data and nearest item consistently for visible and searchable labels, including isolated literal-property editors and detail drafts. Keep brackets literal when mapping renderer-owned error paths to JSON Pointers.
- b52b1dd: Use the shared composition-aware text controller for ordinary password inputs,
  including Unicode code-point limits and schema replacement cancellation. Preserve
  native readonly focus and selection for text inputs while preventing edits and
  hiding Clear actions. Guard Skeleton's deferred native enum callbacks against
  host data/schema replacement.
- a1a5ead: Associate visible Password help and errors with standard and segmented OTP inputs in each renderer family while preserving author-provided description IDs and reveal controls.
- a1a5ead: Wait for transient form-owned validation before dispatching an action clicked once. Keep composition and invalid drafts as immediate blockers, and let Monaco's owned pending publication represent transient diagnostics and reconciliation. Cancel waiting deletion and choice-card branch requests when their data is replaced before or after pending edits flush.
- 2caadba: Use portable file catalog messages for attachment count limits, read failures, reading progress, multi-file clear actions, and numbered unnamed attachments. Keep the existing atomic read and permission behavior.
- b52b1dd: Support portable table columns, whole-row presentation columns, and accessible pointer/keyboard resizing with RTL and English/Bulgarian labels. Preserve resized widths across row edits and pagination.

  Apply portable pagination and columns to AG Grid, with independent native pagination overrides and native column-list precedence, including empty lists, groups, and computed columns.

- b52b1dd: Share pre-touch control error filtering across native families. Filter eligible schema and host errors together, retain nonmatching host messages, and respect validation visibility without changing structured errors or validity. Remove permanent array-summary suppression until summaries can follow child touch state. Integrate the canonical pre-touch example with English/Bulgarian JSON supplements.
- 2caadba: Resolve Draft 2020-12 `prefixItems` positions before the trailing `items` schema when formatting validation summaries, so positional and tail error translations use the owning schema and UI schema.
- b52b1dd: Translate ImageView alternative text through its i18n prefix or host text key, retaining explicit decorative empty alternatives. Import the canonical presentation example with English/Bulgarian supplements and preserve its URL security configuration.

  Import the canonical Draft-07 metaschema example without changing its official schema identity, with localized host introduction and native schema-document editing coverage.

- a1a5ead: Keep detailed schema failures when validating a dynamic property name and show their translated messages in Rename dialogs instead of a generic invalid-name message.
- 2caadba: Distinguish a dynamic property name rejected by `patternProperties` from other invalid names. Mixed-tree Rename now shows the portable `additionalProperties.namePattern` catalog message without changing the validation result or stored data.
- a1a5ead: Validate dynamic property-name drafts against their schema when no host Ajv is supplied, preserving specific length and pattern errors in Rename feedback.
- a1a5ead: Preserve additional-property editor identity through confirmed local renames, including transitions between ordinary, dotted and empty names. Relocate renderer-owned errors without moving host-supplied errors or briefly losing selection-time file metadata. Restore focus to the surviving rename action after the native dialog closes, and keep external replacements distinct from explicit local renames.
- b52b1dd: Align literal-property editors with React by rooting their existing JSON Forms context at the selected value. Remove the extra form-document context and use core data for labels, templates and dialog drafts. Preserve required presentation, literal-key updates, parent error routing and renderer-owned validation; compile draft validation against the isolated schema.
- b52b1dd: Use stable position keys for tuple prefix editors. Tighten data, configuration,
  dialog and mixed-value helper types without changing stored values.
- b52b1dd: Add recursive node-tree editing with native navigation, selected-node details, validated rename, guarded deletion and descendant validation indicators. Include the canonical recursive-tree and finite-depth examples in the demo catalog.

  Keep dispatcher prop snapshots stable between changes so nested native components mount and unmount without repeatedly traversing the entire ancestor dependency graph. Preserve immutable reducer state and avoid redundant additional-error updates.

  Resolve array restriction defaults from authored configuration (local override, global override, then enabled), recheck array layout mutation bounds, and translate default array actions through the shared English/Bulgarian JSON catalogs with host overrides.

  Show native validation badges in mixed trees and avoid duplicated headings in structured mixed details.

- 2caadba: Require recursive-tree command and child-schema lookups to use declared own
  properties. A prototype-named label no longer exposes Rename when its field is
  absent from the schema. Mixed-tree readonly checks likewise apply an authored
  `additionalProperties` constraint to undeclared prototype-named keys.
  Branch-discard and choice-card discriminator inspection also require own schema
  properties.
  Recursive-tree detail layouts now isolate selected nodes beneath literal dotted,
  empty or prototype-named child members. Repeated child paths remain editable, and
  recursive child links retain their target identity inside the isolated detail.
  Replacing a mounted recursive-tree UI schema no longer throws during the
  renderer transition.
- 2caadba: Detect structurally equivalent UI-schema registry cycles and report a coded
  author diagnostic while falling back to generated object fields.
- a1a5ead: Use shared localized rename-dialog titles, descriptions, and property-name labels across the Svelte renderer sets. Render Shadcn rename validation feedback in the theme's destructive color.
- b52b1dd: Move renderer UI translations into JSON catalogs, remove locale-specific component branches, and preserve dynamic host translation overrides.
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
- aba358e: Honor autocomplete on finite enum and const-oneOf choices using native library components. Search visible labels while retaining exact JSON values and distinct duplicate labels; do not commit query text. Add translated empty results, keyboard selection, clearing and readonly guards. Skeleton filters only user input and retains selected labels after host reload. Include the official shadcn Command components used by its Popover combobox composition.
- a1a5ead: Reuse a validation-result ancestor index for Group and Category error-presence indicators. Segment keys distinguish sibling array positions, and explicit counts still collect each matching error once.
- a1a5ead: Report a stable author diagnostic when the effective section `collapsed` option has a non-boolean value. Valid local values suppress warnings from lower-priority settings, and invalid values continue to use the next valid collapse default without truthiness coercion.
- a1a5ead: Show Group and Category error indicators as soon as displayable section errors exist, independently of control touch. Keep pre-touch filtering local to each Control, so required-field text waits for blur while a section cue can guide navigation. Remove the form-scoped touch store.
- b52b1dd: Share bound-control traversal for Group and Category data/error indicators. Keep section errors visible when panels close, count overlapping control bindings once, attribute missing/additional property errors to their child, and preserve host errors when schema validation is hidden. Local false options override namespaced defaults.

  Translate section summaries and validation popup headings using English/Bulgarian JSON catalogs and live host overrides. Flowbite native steppers use their icon and description slots for section feedback.

  Use native tooltips for keyboard and pointer access to section error summaries without toggling the surrounding disclosure. Cache descendant scope collection by UI-schema identity.

  Provide Skeleton native disclosures with their shadow-root resolver so closing updates accessible state. Stretch native Group and mixed-frame content to the available width, retaining full-width headings with trailing status indicators.

- 2caadba: Use the portable selected-row action and confirmation messages in the Shadcn
  array table, with English and Bulgarian defaults.
- b52b1dd: Add shared array-choice applicability and guarded positional mutations, and shadcn chips and searchable multi-select renderers. Preserve imported values, repeated tokens, schema bounds, readonly state, and host translations with English and Bulgarian catalog defaults.
- 2caadba: Localize the Shadcn dialog close button's accessible name in English and
  Bulgarian across native and Web Component renderer dialogs.
- a1a5ead: Match the React shadcn normal table's page and row selection, bulk deletion, quieter row dividers, active column resize handles, and contact-cell edit action visibility.
- 2caadba: Include severity and stable messages in unsupported renderer/cell, UI-schema
  cycle, tuple and focus-conflict author warnings while preserving their paths and
  scopes.
- b52b1dd: Apply the shared always/never/complex confirmation policy to collection deletion, additional properties and tuple items, direct composite-cell removal and AG Grid batches. Flush pending edits and recheck permissions, constraints, path and owner data before committing. Keep detail-editor draft actions isolated until Apply.

  Use native translated dialogs, fix Flowbite dialog names and shadcn nested cancellation buttons, and integrate the canonical destructive-confirmation example with English and Bulgarian catalogs.

- b52b1dd: Share editor detail resolution across object, array-layout and master/detail
  renderers. Accept bare elements containers as vertical layouts and preserve
  GENERATE when a fallback Control delegates to another editor. Export detail
  helpers for the remaining editor and choice-card integrations.
- a1a5ead: Prevent sibling collection pending-change scopes from recursively traversing one another during pagination and detail actions. Each pending edit is checked and flushed once per action, while blocked edits in sibling collections still prevent navigation.
- a1a5ead: Allow the shared split-pane transition state to compile at the core Svelte peer floor, and raise the Skeleton renderer peer floor to Svelte 5.32.0 because its native tooltip dependency uses `fromAction`.
- b52b1dd: Support simple `{name}` placeholders, including current AJV error parameters. Preserve missing and empty translations without evaluating expressions or reading inherited properties.
- 2caadba: Report invalid split-layout resizable and container dimension options, invalid local minimum item widths, and resizable hints outside split layouts through the author diagnostic channel while preserving fallback sizing behavior.
- a1a5ead: Initialize split-pane transition state from the current option without capturing a reactive prop outside an effect. Live transition updates continue to follow the existing option-sync effect.
- 2caadba: Report invalid split-pane minimum and keyboard-step options independently, without repeating an unchanged warning during a live option update.
- 2caadba: Report invalid splitter sizing and keyboard options with stable diagnostic codes and use safe numeric defaults.
- b52b1dd: Complete portable splitter sizing: fixed CSS dimensions, weighted remainder, vertical content sizing, per-pane bounds, gaps, alignment and constrained overflow. Preserve resized shares and mounted controls during data updates and responsive stacking.

  Retain native Flowbite Pane/Divider components with a shared bounded controller because the native group lacks controlled per-pane constraints. Forward shadcn's native Resizable layout API and preserve the adapter during component sync. Harden drag ownership and cancellation, and add localized sizing examples with browser coverage for native and Web Component hosts.

- 2caadba: Show validation feedback for invalid custom values in string-or-enum controls, including referenced alternatives. Summarize failed alternatives while preserving independent constraints.
- a1a5ead: Preserve structured collection, section, object-owned, mixed-tree and recursive-tree errors with translated field labels and one-based row context. Include root-array descendants, retain separate errors sharing a schema path, and provide bounded native disclosures with localized expansion controls. Keep row and section actions outside nested native buttons, route direct object and rejected-property failures to their own headings, and restore focus after dismissal.
- a1a5ead: Keep expanded validation summaries inside a narrow viewport by capping their scrolling list height, so the Show less action remains reachable in Web Components.
- 2caadba: Place the optional shared Svelte global minimum item width under the
  `jsonformsSvelte` vendor namespace and apply it to portable layout items.
- b52b1dd: Require host permission for Ractive string templates, remove mounted content on revocation, and provide JSON-catalog diagnostics. Honor the namespaced default template language.
- a1a5ead: Show a localized accessible status when a named Template is missing or cyclic and therefore cannot render its content, while retaining the author diagnostic without adding a form validation error. Emit named-template, duplicate-child and unknown-native-slot warnings with stable codes and structured name/path details.
- b52b1dd: Resolve live relative $data temporal bounds and the spec's namespaced restrict setting. Prevent restricted picker selections while preserving imported values and typed range violations with schema validation. Diagnose save formats incompatible with schema-selected date/time formats.

  Apply time views independently of storage, provide localized native month/year selectors for coarse date views, and translate picker controls through JSON catalogs. Import the canonical temporal-controls fixture with English and Bulgarian supplements.

  Keep Flowbite native popover triggers inside their owning shadow root.

- a1a5ead: Use authored flat `config.restrict` for date, time and date-time pickers, with local `options.restrict` taking precedence. Ignore the removed `jsonformsExtended.restrict` path consistently with other controls.
- 2caadba: Report an incompatible temporal save format again when the same mounted control moves to another data path.
- 2caadba: Localize the 12-hour time picker's AM/PM display text and accessible names through the renderer message catalog. Update them when the host locale changes without changing the stored time.
- 2caadba: Report incompatible temporal save formats once per affected mounted control
  with a structured warning and the control path. A second form with the same
  invalid option now receives its own warning.
- a1a5ead: Honor a selected seconds view in time and date-time pickers even when the display format omits seconds. Preserve and save the edited seconds without changing the display format. Discard staged date-time picker drafts when the host replaces the value while the picker is open. Keep incomplete date, time and date-time text local until it can be completed, and discard those drafts on host value or control-target replacement. Collection actions now respect unfinished temporal text in a sibling control, including across nested pagination scopes, and resume after completion.

  Resolve absolute `$data` temporal bounds from the form root so native date pickers can update their disabled dates when host data changes.
  For direct date, time and date-time values edited under literal dotted property names, resolve sibling and root `$data` bounds before compiling the isolated validator, and refresh those bounds when parent data changes.
  Carry the original document root through nested literal-key editors so both relative sibling and absolute root bounds keep their meaning.
  Use that same root and exact path for ordinary date, time and date-time children of an isolated literal-key object.

  Show translated, input-associated guidance while date, time or date-time text is incomplete or invalid, without publishing a committed-value error. Clear the guidance when the text becomes parseable.

- 2caadba: Ignore an unsupported `date` view name when selecting the finest calendar
  panel. Only the portable `day`, `month` and `year` names affect the date view.
- a1a5ead: Compare offset-bearing time-picker selections and schema bounds on the same reference date as the time validator. Valid local-midnight selections remain available, while lower and exclusive upper bounds still reject out-of-range steps.
- a1a5ead: Explain rejected out-of-range time and date-time picker steps beside the control, keep Apply disabled until the draft is valid, and preserve the committed value after rejected edits.
- a1a5ead: Keep tuple position layouts and registered detail selection scoped to the
  authored tuple control. Form-wide `detail` no longer changes every tuple.
- a1a5ead: Recognize draft-2020-12 `prefixItems` with `items: false` as a forbidden tuple tail when presenting the Additional Items error indicator.
- a1a5ead: Apply validation-mode visibility and live error translation to complex tuple-position feedback, including host additional errors.
- a1a5ead: Show the tuple-wide `additionalItems` validation error beside the Additional Items heading while a forbidden imported tail can be removed.
- 2caadba: Report explicit tuple presentation on a non-array schema as
  `variant.inapplicable`, with a localized accessible explanation, while retaining
  `variant.unsupported` for invalid array tuple shapes.
- a1a5ead: Show the localized View details fallback for tuple object positions when a registry summary is absent or does not resolve to a usable value, instead of displaying the schema title.
- b52b1dd: Dispatch authored tuple position layouts through native layouts, preserving positional data paths and per-position summary/detail overrides. Diagnose invalid or undeclared position scopes and retain omitted values and validation. Keep tuple-level generation modes separate from inline position layouts. Align additional-item heading and delete translations with the reference catalogs (`tuple.additionalItems` and `tuple.delete` with a translated `label`).
- 2caadba: Report an author diagnostic for invalid or undeclared tuple position scopes,
  while retaining an accessible explanation where the field cannot render.
- 2caadba: Fill missing fixed tuple positions when editing a later position or adding a tail item to a host-provided array with holes or undefined entries. Commit initialized positions with the edit, and retain the Add warning when a missing position has no unambiguous initial value.
- a1a5ead: Summarize validation errors in tuple trailing items, including off-page errors, and navigate to the first invalid trailing item without counting fixed-position errors.
- a1a5ead: Preserve tuple-tail editor occurrences through local edits, additions and removals, including duplicate values and literal property scopes. Keep fixed tuple positions positional, relocate surviving editor errors, and dispose removed or externally replaced subjects. Reconcile file-size metadata after delegated paths settle so moving a retained editor does not discard its selection-time errors.
- a1a5ead: Coordinate tuple tail additions with pending edits across all renderer families. Flush drafts before appending, block additions during composition, ignore duplicate activation, and recheck permissions, schema ownership and limits before changing data.
- a1a5ead: Emit the stable `variant.unsupported` author diagnostic when an explicit tuple presentation has no positional schema or equal fixed bounds. Keep the accessible in-form explanation because no tuple fields can be rendered.
- a1a5ead: Ignore inline `options.detail` objects without a UI-schema `type` and fall back to registered or generated detail forms, as required by the portable detail-selection contract.
- b52b1dd: Use internal selection IDs for enum and const-oneOf selects and radios, preserving original JSON types, null and empty-string choices, duplicate labels, and structural selection after a host reload. This prevents duplicate-key crashes for object-valued choices.

  Support finite enum arrays of any JSON type. Compare multi-choice members structurally and avoid removing an unrelated last item when a requested member is absent. Preserve standalone falsy const choices despite the installed JSON Forms mapper's truthiness check.

- 2caadba: Report missing renderer and cell capabilities with stable, collision-safe author diagnostics and an accessible localized fallback while preserving form data.

## 1.0.2

### Patch Changes

- bfcaa62: Correct browser web-component exports and published TypeScript declarations, validate packed artifacts for all packages, fix the Flowbite AG Grid CSS selector, and prepare independent npm consumers.

## 1.0.1

### Patch Changes

- 79b2ff4: Publish the initial npm packages for the core Svelte bindings, Flowbite and Skeleton renderer sets, extended helpers, and web components.
