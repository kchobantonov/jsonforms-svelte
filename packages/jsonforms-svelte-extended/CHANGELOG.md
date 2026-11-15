# @chobantonov/jsonforms-svelte-extended

## 2.0.0

### Major Changes

- b52b1dd: Correct Svelte peer minimums to match APIs and native UI dependencies: core/shared extended require Svelte 5.20, Flowbite requires 5.40, shadcn requires 5.33, and Skeleton requires 5.29. Existing applications on Svelte 5.50.1 remain compatible.

### Minor Changes

- b52b1dd: Support the shared color input and serialization profile, including RGB, HSL and HSB inputs, hex/RGB/HSB output, and alpha-preserving picker edits. Keep incomplete text as a local draft and retain invalid incoming values. Align the color format validator with supported input syntax.

  Honor namespaced color defaults and local overrides, support picker-only entry with a clear action, and localize picker actions and feedback in English and Bulgarian. Existing hexadecimal pattern and mask exports remain available for consumers that explicitly require hex-only input.

- b52b1dd: Support homogeneous file arrays, including referenced item schemas, across native renderers and delegated file cells. Append each batch atomically, preserve existing attachments on read failure, enforce authored array-count restrictions, deduplicate unique values, and remove duplicate occurrences by position. Add bounded persisted filenames and localized attachment actions.
- b52b1dd: Use persisted filenames for the default AG Grid filtering and sorting of single and multiple file columns. Nameless attachments contribute empty search text, keeping encoded contents and MIME metadata out of searches. File cells continue editing the original stored values, and explicit column overrides retain precedence.

  Stop inheriting the parent grid variant into cell controls so array-valued file columns render file pickers instead of nested grids. Explicit per-column variants remain supported.

- b52b1dd: Separate rejected file selections and read failures from stored-data validation. Show local warning/error feedback, clear it on external replacement, and use compact native popups in delegated table/grid cells. Add English and Bulgarian size-limit fallbacks and a shared cell-presentation context for delegated controls.
- b52b1dd: Cancel obsolete file reads on replacement, external data/schema/readonly changes and unmount. Ignore stale load/progress results without overwriting the current value or closing a newer progress dialog.

  Follow the file specification's cancellation contract: cancelling the native chooser or an active attachment clears the scoped value using the normal Clear behavior. Internal cancellation and failed reads preserve existing stored data. Hosts that relied on chooser cancellation retaining an existing attachment must account for this change.

  Honor explicit picker `accept` before schema media-type hints, including an empty filter. Localize progress, Cancel, Clear and conversion-failure messages in English and Bulgarian. Flowbite retains its native Fileupload and CloseButton components while providing a translated clear action and cancelling reads when its progress dialog is dismissed.

  Display filenames retained in persisted binary values and localized fallback text for base64 attachments. Keep the last committed local filename when a replacement is rejected; external data replacements cannot retain another value's filename.

- b52b1dd: Use localized native buttons and filename badges for file selection, with a bounded row of controls in table/grid cells. Keep platform file inputs hidden and preserve encoding, cancellation and readonly behavior. Make Flowbite file feedback open explicitly on focus and activation. Associate Skeleton field labels with their primary control instead of wrapping compound controls and attachment names.
- b52b1dd: Add lazy Markdown labels with basic and extended grammar, shared URL policy, escaped text rendering, and English/Bulgarian diagnostics. Keep rich choice-card content inert and render its links as text so native radio selection remains the only interaction. Add lazy CEL interpolation with declared text parameters, gated data namespaces, locale formatting and safe Markdown substitutions. Include the spec Label interpolation and Markdown examples in the demo catalog.

  Improve demo message fallback and avoid stale interpolation parameters. Supply separate EN/BG translation supplements for missing spec-example labels without modifying source fixtures.

- b52b1dd: Preserve converted JSON editor drafts and valid edit formatting independently of committed data. Add opt-in owned parse-error publication, reactive English/Bulgarian editor actions and feedback, and shared config support for code-editor options. Preserve other validation messages and enforce host readonly state even when native editor options request editing.

  Dispose the editor before its owned model, and use the same default occurrence-highlighting setting as the demo editors to avoid background requests during teardown.

  Register converted-JSON section schemas per editor model, resolve local references against the document root, and remove only owned registrations. Preserve explicit null and literal schema data, and prevent native options from replacing the bound model, language, theme or value. Guard cancelled completion callbacks that reach an already-disposed owned model.

  Resolve Monaco error publication from local options, then namespaced global defaults. Replace local Monaco option bags wholesale so global editor options and action arrays cannot leak into an authored override.

- b52b1dd: Add Link renderers with translated labels, shared URL policy, safe new-window attributes and non-navigating text for empty or refused destinations. Flowbite uses its native anchor component; shadcn and Skeleton use semantic anchors with their text-link styling.
- b52b1dd: Add a trusted compiled Svelte component profile for TemplateLayout with live data, core errors, host context, permission state, translation and delegated Slot components. Compiled templates operate without runtime script evaluation permission.

  Diagnose unsupported string-template languages, avoid child-name collisions, preserve literal slot names, load Ractive only when allowed and visible, and retain template DOM during data-only updates. Refresh live host context independently of schema validation errors.

  Import the canonical template-engine fixture with English/Bulgarian catalogs and a native Svelte host adapter. JSX remains an explicitly unsupported string engine in the default Svelte registry.

  Provide defineNativeTemplate to mount compiled components and delegated slots in their owning Svelte runtimes, including separately bundled Web Component hosts.

- b52b1dd: Provide a form-local renderer error store with per-instance ownership, generation checks for asynchronous results, explicit path relocation, pending state and cleanup. Merge its errors with host-supplied errors without replaying stale form data. Add a separate onvaliditychange callback covering schema errors, additional errors and pending validation while preserving the base onchange contract.

  Forward combined validity through the extended form and a typed validity-change Web Component event; expose merged additional errors in the extended action context.

- b52b1dd: Share splitter visibility and weighted initial sizing across renderer families. Honor disabled resizing while keeping the native boundary visible, localize handle names and unsupported-wrap/span diagnostics, and clean up active Flowbite/Skeleton drags on removal. Add the source split-layout demo with English and Bulgarian supplements.

  Fixed child dimensions and min/max constraints remain outside this initial weighted sizing implementation.

- a1a5ead: Allow a host to explicitly create the extended Ajv validator for Draft 2020-12 while preserving the default Draft-07 profile.

### Patch Changes

- 2caadba: Report unhandled form actions as structured author warnings with a stable code,
  severity, message and action details.
- a1a5ead: Report a once-per-form developer diagnostic when a Button action has no host handler. Keep the diagnostic out of form validation and allow a handler attached later to process the action normally.
- b52b1dd: Support anonymous recursive root schemas in the default validator without inserting a schema ID or changing authored schema identity. Temporarily register anonymous roots during compilation, release the registration afterwards, and retain cached validators until explicitly removed. Supplied host validators remain unchanged.
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
- 2caadba: Keep readable Markdown and refused link text in the form while sending policy diagnostics only to authors.
- 2caadba: Allow field and global keyword translations to override schema-authored AJV error messages while retaining the authored translation as the fallback.
- b52b1dd: Accept boolean root schemas without hiding the form. Keep the original schema in core validation so errors retain their original keywords and paths, while adapting the rendering boundary for upstream object-schema APIs.

  Preserve forbidden array items and tuple tails in mixed-tree editors and combine declared property constraints with every matching pattern. Keep imported invalid data available for correction without mutating its schema.

- 2caadba: Report conflicting Button action and script authoring through the diagnostic channel in native and Web Component hosts, while keeping the action usable and avoiding an in-form warning.
- b52b1dd: Support portable Button options.fullWidth across native renderer families. Fill the allocated layout cell without changing its span, and import the canonical two-column language-button example.
- 2caadba: Cancel pending Button actions when host data, schema, UI schema, or config is replaced before or after edit flushing, while allowing form-owned commits such as completed IME input.
- a1a5ead: Emit safe `script.evaluationFailed` author diagnostics for Button script compile and execution failures while preserving the original rejection for callers.

  Report CSP compilation refusal as `script.evaluationUnavailable` while retaining the existing `unavailable` result and translated renderer status.

- b52b1dd: Require explicit host permission before compiling Button string scripts. Preserve trusted callback support, await asynchronous actions, prevent duplicate activation, normalize action parameters, and display translated execution diagnostics. Dispatch buttons without a declared command using an empty action and report action/script conflicts while preserving action precedence.
- 2caadba: Use only canonical authoring locations and names for template language, Monaco error publication, section and Stepper indicators, layout and AG Grid sizing, array sort actions, mask tokens, ImageView source fields, Button action, label and stable-name fallback, catalog parameters, and readonly options/config. Remove the explicit columns layout adapter and compatibility-only tests.
- 2caadba: Report choice-card identifiers, conditional projection failures, layout sizing,
  invalid section settings, and split-pane option problems as structured author
  warnings with stable codes and messages.
- a1a5ead: Track collection occurrences in form-local runtime state using verified add/remove/move metadata and explicit descendant edits. Preserve identities through JSON Forms' deep-cloned array commands, including nested collections and equal primitive values. External replacements retain only reliably matched unique object references.

  Key native table and array-layout rows by these identities and provide their logical target context to nested editors. Monaco diagnostics and invalid drafts follow retained occurrences to their current pointers; deleting or replacing an occurrence disposes its owner without changing host errors. Keep validity pending during reassociation. Flowbite array expansion now relies on its existing controlled selection without competing native selection feedback.

- b52b1dd: Add scoped collection pagination with native controls for array tables, expandable arrays, master/detail lists, dynamic properties and tuple tails. Preserve absolute item paths, flush queued edits before navigation, reveal added items and expose errors on other pages. Add the three canonical pagination examples and English/Bulgarian catalogs.

  Isolate dialog-owned errors from committed form errors. Prevent Apply from accepting pending or unparsed edits, invalidate late results on cancellation, and retain ordinary schema-invalid draft editing. Share composite summary behavior with tuple positions.

- a1a5ead: Resolve color storage format and text entry from local control options, then `config.jsonformsExtended`, then defaults. Ignore removed flat color config keys while retaining explicit local overrides across all three Svelte renderer families.
- aba358e: Add HEX, RGB and HSB channel views and opacity editing to color pickers using each renderer library's native popup and field components. Reopening restores the configured save-format view; changing views preserves stored data. Keep invalid values and rejected transparent hex3 drafts intact, retain picker-only clearing, and translate channel labels through the JSON catalogs and host translator.

  Honor local `options.format` selection for color and duration on string schemas, matching the Antd reference and canonical examples. Keep these testers inapplicable to incompatible schemas and non-Control UI elements.

  Keep color selection in one popover with an inline saturation/brightness surface and hue slider. Remove the nested browser chooser across all three UI families; preserve alpha, channel formats, readonly guards and compact cell triggers.

- aba358e: Keep cron picker labels and native controls on compact horizontal rows, matching the AntD interaction. Replace repeated full-width Every buttons with localized inline reset icons. Use Skeleton's native Combobox for multiple values and retain staged Apply/Cancel behavior and advanced cron text.
- aba358e: Keep color format, channel values and opacity in one compact row with translated accessible labels. Bound shadcn cron option lists, widen its picker, reserve room for clear actions and reveal centered reset icons only on hover or focus. Align selected text to the logical start and use the configured icon library consistently for password and panel visibility.

  Reveal OTP clear actions only on field hover or focus. Disable shadcn PinInput's optional password-manager width adjustment so focusing a short code does not introduce horizontal scrolling.

- b52b1dd: Add the six-field cron profile, native structured schedule pickers, staged actions, translated diagnostics, and the canonical scheduled-jobs example with English and Bulgarian catalogs. Preserve invalid expressions and advanced syntax for raw editing.

  Preserve validation constraints when delegating mixed-type schemas, narrow same-value composition branches without changing child schemas, and resolve escaped property names correctly. Explicit mixed types now retain their renderer when composition or enum constraints are present.

  Add mixed nested and JSON code presentations, selected-type detail dispatch in tree mode, and native mixed frames with portable collapse precedence. Preserve numeric editor intent and distinguish clearing a value from clearing its type. Apply the shared confirmation policy to destructive mixed actions and guard delayed dialogs against replaced values and permissions. Import the canonical mixed-control example with English and Bulgarian JSON catalogs.

- 2caadba: Close Cron drafts and reject commits after a rule hides their control.
- 2caadba: Expose required state on the editable Cron input and Monaco textbox across all three renderer families, including when the visual required marker is hidden.
- a1a5ead: Expire acknowledged duration commits so later host replacements, including a return to a previously committed value, discard incomplete text and picker drafts and release pending validity. Preserve newer typing while the current local commit is acknowledged.
- b52b1dd: Share duration parsing and draft handling across native pickers. Use separate weeks/component modes and native unit selectors, preserve exact imported values, accept duration quantities beyond clock-field limits, and retain incomplete drafts without rounding or overwriting committed data. Publish pending validity separately from schema errors and provide JSON-catalog English/Bulgarian feedback.
- a1a5ead: Report denied dynamic-default script evaluation with the shared `script.evaluationDisabled` author diagnostic and capability details.

  Report permitted script failures and unavailable server query providers with stable codes and safe details, without logging expression text.

- 2caadba: Discard compiled dynamic-default code when script permission is revoked, and compile the current function source after a grant or source change.
- 2caadba: Use exact parent and scope path members for literal control document context, ArrayChoices item-error ownership, and interpolated Label nearest-item lookup. Keep a literal dotted array distinct from its nested lookalike.
- 2caadba: Publish file-size, Monaco, and duration draft errors at exact scoped pointer members.
- 2caadba: Capture exact renderer path members for scoped rule evaluation so a literal dotted parent and its nested lookalike remain distinct. Apply the same rule path to extended Button and Label-summary mapping.
- 2caadba: Keep template author-warning deduplication identities separate for literal delimiter characters in paths and names.
- a1a5ead: Discard selection-time file-size metadata when its encoded value leaves the control. Importing the same string later no longer revives an error from a removed attachment. Preserve metadata for retained values, including array reordering, and preserve unrelated host errors.

  Mount AG Grid cell components independently of parent reactive effects so asynchronous feedback remains live after tab transitions, including in Shadow DOM. Cancel a scheduled mount if AG Grid destroys the cell first, and use the latest cell props if it refreshes before mounting.

- a1a5ead: Apply every configured inclusive and exclusive file-size bound independently. A weaker inclusive limit no longer hides a stricter exclusive limit; schema values retain precedence over UI options for the same bound key.
- a1a5ead: Apply flat and local height dimensions to AG Grid in all three renderer families. Share the dimension conversion used by split layouts.
- b52b1dd: Use resolved Label-summary text for AG Grid filtering and sorting, sharing Label translations, declared interpolation parameters and dynamic-value permissions. Refresh search values on data, locale and permission changes while preserving source row identity and native value-getter overrides. Keep expression evaluation lazy and hide unresolved expressions from search.
- a1a5ead: Render absolute references to external schema documents already registered with the host Ajv instance from identified or anonymous roots while validating against the original schema. Support transitive registered references, nested `$id` resources and document-local anchors without fetching URLs or duplicating nested resources. Diagnose missing documents, anchors, JSON Pointers and anonymous-root relative refs even in NoValidation while preserving data and recovering when the host supplies Ajv. Report `$dynamicRef` as unsupported for rendering rather than opening an unconstrained editor. Pass JSON schema resources through each demo and Web Component, with native and production interaction coverage across all three renderer families.
- b52b1dd: Evaluate schema and predicate rules against isolated data in shared renderer mappings, layout visibility and Button conditions. Preserve host validator references and formats while preventing rule defaults and transforms from modifying live form data.
- a1a5ead: Remove conflicting author-supplied `opener` tokens from `_blank` Link elements while retaining `noopener` and `noreferrer`.
- b52b1dd: Keep brackets literal when routing collection error badges, Group/Category validation indicators, Flowbite stepper feedback and label item context. Use the existing JSON Forms data-path parser so a property named rows[0] remains distinct from rows.0, including host errors under hidden schema validation.
- a1a5ead: Carry the current source item through collection rendering contexts so interpolated Labels use the rendered row even when a literal dotted property name collides with a nested data path.
- b52b1dd: Refresh validator error messages at presentation time when the locale changes, preserving authored schema messages and host error translators. Restore original keywords and paths through nested authored-error wrappers.
- b52b1dd: Use displayed Markdown label text for table filtering and sorting. Load the optional parser lazily and keep interpolated values literal, matching visible labels.
- 2caadba: Percent-encode interpolated values inside authored Markdown link targets while
  continuing to escape substitutions in ordinary Markdown text.
  Also encode parentheses that could terminate an authored Markdown link.
- a1a5ead: Keep Markdown list markers, link underlines, headings and other content styling when a Label disables the typography wrapper.
- 2caadba: Report disabled or unsupported markup requests and refused Markdown links to
  form authors with stable codes, while retaining the readable in-form fallback.
- 2caadba: Report Markdown loading and interpolation failures to authors while keeping readable fallback text and accessible missing-content explanations.
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

- 2caadba: Report Monaco diagnostic-reader failures once per active interval and re-report after validation recovers.
- a1a5ead: Apply flat and local code-editor width and height dimensions in all three Svelte renderer families. Numeric values use CSS pixels, CSS dimension strings retain their authored units, and removed nested geometry keys stay ignored.
- a1a5ead: Associate Monaco's focusable editor input with visible field help and invalid state in each extended renderer family.
- 2caadba: Wait briefly for asynchronously registered language providers before running Monaco initialization actions, so format-document runs when requested for JavaScript. Keep the editor interactive while an unavailable action waits, and cancel late actions after a local edit or host model replacement.
- a1a5ead: Wait for Monaco's asynchronously registered JSON language worker before reading initial editor diagnostics, so first-mount validation does not report an initialization failure.
- b52b1dd: Publish one owned, translated Monaco language-error summary when propagateErrors is enabled. Ignore warnings and other models, retract summaries on correction or language changes, and preserve host errors. Avoid republishing JSON Schema diagnostics already handled by the form validator.

  Import the canonical additional-errors example with English/Bulgarian host catalogs and simulated server actions. Editing a field clears only that field's simulated server error; no request is sent.

- a1a5ead: Reset removed Monaco editor options, including nested options, to their defaults without replacing the editor or affecting other instances.
- b52b1dd: Render explicitly requested string code controls with plaintext when no language is supplied. Show translated loading and initialization-failure feedback, release owned resources after failed setup, and preserve worker providers configured by the host application.

  Configure all supported Monaco language workers in the shared demo host so its preserved worker provider handles JavaScript/TypeScript, CSS and HTML as well as JSON.

- a1a5ead: Clear inherited control margins when maximizing Monaco so the editor fills the viewport in native and Web Component hosts.
- a1a5ead: Resolve local, URI and anchor JSON Schema references to nested `$id` resources in Monaco, and resolve relative host references against their authored base URI while preserving independent editor registrations.
- a1a5ead: Remove Monaco's injected stylesheet when the last editor in a document or ShadowRoot is disposed, while preserving sibling editors and host-supplied styles.
- a1a5ead: Match the Monaco editor's specified 10-row fixed default and 3–30-row auto-grow bounds. Keep auto-grow height in sync when the editor value changes, and leave fixed rows independent of auto-grow limits.
- a1a5ead: Do not keep form validity pending for Monaco languages without a supported diagnostic reader. An HTML editor can still publish its Monaco markers, but it no longer leaves the form showing “Checking…” until the user edits that field.
- a1a5ead: Guard owned Monaco models before detaching them so late editor computations cannot raise disposed-model errors when a Web Component reconnects or changes renderer.
- a1a5ead: Name the rejected file in localized file-size warnings while retaining the previously committed attachment. Count-limit warnings now state the actual maximum and that existing attachments were kept, matching the React copy.
- 2caadba: Distinguish named templates when detecting UI-schema dispatch cycles so nested
  templates at one data path render, while true cycles still stop. Report template
  lookup and native slot problems as structured author diagnostics.
- b52b1dd: Guard recursive named templates at the same data path while preserving independent sibling reuse. Diagnose missing and duplicate names, retain the first exact registry match, and keep named lookup independent of ranked testers.

  Import the canonical named Template/Slot example with a trusted TypeScript registry adapter and English/Bulgarian JSON supplements.

- a1a5ead: Use family typography for interpolated and Markdown Labels, with block-safe Markdown wrappers and a working `typography: false` override.
- b52b1dd: Use the current JSON Forms data and nearest item consistently for visible and searchable labels, including isolated literal-property editors and detail drafts. Keep brackets literal when mapping renderer-owned error paths to JSON Pointers.
- a1a5ead: Keep recursive-tree and Flowbite pane wrappers' generated declarations free of imported component-name collisions, and publish the Lodash types used by the extended package's public template declaration.
- a1a5ead: Wait for transient form-owned validation before dispatching an action clicked once. Keep composition and invalid drafts as immediate blockers, and let Monaco's owned pending publication represent transient diagnostics and reconciliation. Cancel waiting deletion and choice-card branch requests when their data is replaced before or after pending edits flush.
- 2caadba: Use portable file catalog messages for attachment count limits, read failures, reading progress, multi-file clear actions, and numbered unnamed attachments. Keep the existing atomic read and permission behavior.
- 2caadba: Refresh Ractive template URL policy in place so policy changes keep mounted template inputs, unsaved drafts, focus and caret position. Restore currently permitted bound and literal URLs without rebuilding the template.
- b52b1dd: Align literal-property editors with React by rooting their existing JSON Forms context at the selected value. Remove the extra form-document context and use core data for labels, templates and dialog drafts. Preserve required presentation, literal-key updates, parent error routing and renderer-owned validation; compile draft validation against the isolated schema.
- b52b1dd: Move renderer UI translations into JSON catalogs, remove locale-specific component branches, and preserve dynamic host translation overrides.
- b52b1dd: Infer omitted schemas from every JSON root type, including arrays, scalars and null, and regenerate them when external data changes type. Preserve absent data and authored schemas. Dispatch a root Control when the installed core cannot generate a UI schema for an unrestricted schema.

  Use the same inference helpers in the extended JsonForms host so demos and Web Components preserve absent schema/data and infer scalar roots correctly.

- 2caadba: Report native and Ractive template failures to authors without showing caught exception text to form users.
- 2caadba: Report invalid split-layout resizable and container dimension options, invalid local minimum item widths, and resizable hints outside split layouts through the author diagnostic channel while preserving fallback sizing behavior.
- a1a5ead: Report unsupported splitter wrap/span and invalid pane sizing hints as coded developer warnings instead of form validation alerts. Keep the splitter layout behavior and localized diagnostic messages.
  Report repeated invalid hints separately for each pane, with the pane index and option in structured warning details.
- b52b1dd: Honor global splitter height and minimum-height defaults while preserving local overrides, explicit zero and existing pane instances during dimension changes.
- b52b1dd: Complete portable splitter sizing: fixed CSS dimensions, weighted remainder, vertical content sizing, per-pane bounds, gaps, alignment and constrained overflow. Preserve resized shares and mounted controls during data updates and responsive stacking.

  Retain native Flowbite Pane/Divider components with a shared bounded controller because the native group lacks controlled per-pane constraints. Forward shadcn's native Resizable layout API and preserve the adapter during component sync. Harden drag ownership and cancellation, and add localized sizing examples with browser coverage for native and Web Component hosts.

- 59330a6: Keep static interpolated labels stable when unrelated form data changes by reusing lazy module loads and interpolation results. Dynamic labels still update when their data changes.
- b52b1dd: Isolate Ractive data bindings, apply host URL policy to template-owned markup, and preserve delegated renderer ownership across local template updates. Supply the resolved URL policy to compiled Svelte templates.
- 2caadba: Report Ractive template render failures again when an author replaces one malformed template with another, while keeping data-only updates quiet.
- b52b1dd: Require host permission for Ractive string templates, remove mounted content on revocation, and provide JSON-catalog diagnostics. Honor the namespaced default template language.
- a1a5ead: Reserve `TemplateLayout` for its extended renderer in each standard family. An unsupported configured template language now reaches the renderer's localized diagnostic instead of being silently handled as an empty generic layout.

  Report unsupported languages as structured author diagnostics with stable codes and safe details.

  Report denied script permission for a visible supported `TemplateLayout` once per mounted path, alongside its translated in-form explanation.

- 2caadba: Treat template `<source src>` as a media URL, so image data URL opt-in applies only to image sources such as picture `srcset`.

  Protect Link targets spelled `_BLANK` with `noopener noreferrer` and discard conflicting `opener` tokens.

- a1a5ead: Show a localized accessible status when a named Template is missing or cyclic and therefore cannot render its content, while retaining the author diagnostic without adding a form validation error. Emit named-template, duplicate-child and unknown-native-slot warnings with stable codes and structured name/path details.
- b52b1dd: Read template data from the current JSON Forms context, matching React isolated-property editors. Preserve local draft data, delegated slot editing, Cancel, and current sibling data on Apply without a separate data context.
- a1a5ead: Apply the image data URL policy to SVG `<image>` and `<feImage>` `href`/`xlink:href` attributes in template content.
- a1a5ead: Report refused template URL attributes with a stable author diagnostic and safe tag/attribute details, without logging URL contents.
- a1a5ead: Preserve tuple-tail editor occurrences through local edits, additions and removals, including duplicate values and literal property scopes. Keep fixed tuple positions positional, relocate surviving editor errors, and dispose removed or externally replaced subjects. Reconcile file-size metadata after delegated paths settle so moving a retained editor does not discard its selection-time errors.
- b52b1dd: Tighten types for dynamic-default arguments, UI-schema testers, Monaco options, and
  native button overrides. Preserve reactive updates while bringing the extended
  packages under the shared Svelte lint checks.
- 2caadba: Reject nonfinite and negative ranks from string-authored UI-schema registry
  testers. Only the not-applicable sentinel or a finite non-negative rank may
  select a registered detail; invalid results retain the author diagnostic and
  do not expose script source.
- a1a5ead: Report denied and failed UI-schema tester and rule scripts with stable author diagnostic codes and capability details, without exposing supplied source text.
- b52b1dd: Require explicit host script permission before compiling or invoking string UI-schema testers and rule predicates. Recheck permission on every invocation, preserve trusted native callbacks, and report denied capabilities without executing their source.
- 2caadba: Keep transformed UI-schema registry testers stable across data-only form updates so permitted tester failures report once per active authored interval and report again after correction and reintroduction.
- 2caadba: Re-report an unhandled action after a host briefly installs and removes its action handler, even when the handler was never invoked. Repeated clicks without a handler remain deduplicated.
- b52b1dd: Allow size-invalid selections when restriction is disabled while publishing owned size errors based on original file byte metadata. Preserve host errors, relocate errors after attachment reordering, and clear errors after replacement or removal. Pending reads publish pending validity and clear it after completion or cancellation. Rejected selections and read failures remain local operation feedback.
- b52b1dd: Require live host permission for JavaScript computed defaults and isolate provider registrations per validator. Preserve cached-validator revocation and report unavailable browser query providers in server hosts.
- a1a5ead: Preserve schema-authored validation messages ahead of generic keyword translations, including when a Web Component receives an AJV instance from its host bundle.
- 2caadba: Forward validator-owned author diagnostics from each Web Component's default
  AJV instance to its composed `diagnostic` event. Denied dynamic-default scripts
  now reach the host without changing form data or validity. Default validators
  start a fresh diagnostic interval when the authored schema changes; restoring
  the same schema object after a valid interval reports an active warning again,
  while data-only updates continue to reuse the validator.
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

- 79b2ff4: Publish the initial npm packages for the core Svelte bindings, Flowbite and Skeleton renderer sets, extended helpers, and web components.
- Updated dependencies [79b2ff4]
  - @chobantonov/jsonforms-svelte@1.0.1
