# Renderer porting checklist

Use this checklist when adding or updating a renderer family. Compare the current
spec and React Antd/shadcn implementations before choosing the UI composition.

## Native components and visual behavior

- Inspect the target library's installed components and APIs before implementing a
  custom control. Use native OTP, popup, tooltip and button components where available.
- Compare related controls within the same family. A cron clear action should use
  the color control's button variant, size, icon and spacing. An outlined button
  is not equivalent to a compact ghost icon button even if both clear the value.
- Check action placement as well as functionality. Group table detail visibility
  with add/delete actions, as React does. Putting the toggle directly between a
  title and Add in a `justify-between` container spreads it into the toolbar center.
- Verify state-dependent visibility: a clear action requires a nonempty editable
  value and appears on field hover or focus within the field. Keep it visible when
  keyboard focus moves to the action. Empty, readonly and disabled states must
  follow the related native controls.
- Scope hover/focus styles to the field. Use a named group when ancestor groups
  could reveal actions while the pointer is elsewhere in the form.
- Inspect computed sizes when mixing native component classes with utility classes.
  Skeleton’s `btn-icon` sizing can override an intended compact picker size; test
  the complete hit area, not only the visible icon.
- Reserve input padding for embedded icons; check actual bounds, logical start/end
  positioning, keyboard access and focus retention after pointer actions.
- Give icon-only actions translated accessible names and native tooltips where
  required. Keep text in JSON catalogs and support host translators without
  branching on locale names.
- Keep scalar clear actions within their field layout. Anchoring them at the end
  of a dynamic-property row can overlap that row’s Delete action. Test real pointer
  clicks with both actions present, including compact cells.
- Preserve justified exceptions: the File renderer follows the compact React
  presentation so it remains usable inside table cells. Document the concrete
  reason for each deviation from native UI components.

## Readonly is independent of disabled

- Test with `separateReadonlyFromDisabled: true`. Checking only `enabled` leaves
  mutating picker actions available on readonly controls. Use native readonly
  text/checkbox APIs where supported and guard actions using both permissions.
- Permission changes must close editable popups and cancel queued commits or file
  reads. Restoring permission must not revive a stale edit. Preserve inspectable
  text and allow a fresh interaction after restoration.

## Masked input lifecycle

- Inspect whether the masking library installs its own input listener. It must not
  rewrite IME drafts before composition ends. Prefer the reference's pure mask
  engine with the shared framework draft lifecycle when the DOM action cannot
  preserve composition.
- Check stored length separately from displayed separators and UTF-16 length.
  Preserve imported invalid values, middle-insertion caret position, and pending
  state in real table cells. Changing the mask during composition must cancel the
  old edit even if the current stored value displays identically.

## Native popup lifecycle

- Inspect the actual trigger role and dismissal behavior. Bits UI Select uses a
  button trigger; Flowbite click popovers open on focus/mousedown and do not use
  the trigger as a close toggle. Test keyboard Escape and outside dismissal.
- Load the same Tailwind/native styles in browser component tests as in production.
  Unstyled tests miss inherited pointer-event rules and popup positioning. Flowbite
  Input icon slots disable pointer events; an embedded popup must explicitly restore
  pointer access for its contents, including clear buttons. Use real clicks, not
  only programmatic value updates.
- Pass custom trigger IDs through the library’s root `ids` API when positioning
  looks up generated IDs. Overriding only the DOM ID can strand a popup at the
  document origin even though all its controls still respond to clicks. Assert
  anchor geometry and inspect screenshots in Shadow DOM.
- Check native action side effects as well as appearance. Flowbite CloseButton
  invokes its enclosing dismiss context unless the click is prevented. Field
  clearing must retain the enclosing editor; use the native color variants and
  verify contrast in both themes.
- Resolve Shadow DOM roots when the native primitive requests them. Capturing a
  portal target during component initialization can retain `undefined` before the
  Web Component mounts, sending positioning and focus lookup to the document.
- Native popovers can retain closed content. Avoid leaving active field editors
  mounted when their interaction should end on close; verify reopening restores
  the intended draft/view state without changing stored data.
- Keep display-channel selection separate from storage format. A color preview
  must convert HSB before CSS rendering and preserve alpha during RGB edits.

## Bounded panels and navigation overflow

- Inspect native pane styles: PaneForge sets inline `overflow: hidden`, so adding
  `overflow-auto` to the pane class cannot make tall details scroll. Put a bounded,
  shrinking scroll region inside the native pane, as React does. Check both right
  and bottom details and verify keyboard focus can reach the last field without
  enlarging the panel or scrolling an unrelated ancestor.
- Horizontal tab strips should scroll only horizontally when needed. Explicitly
  control the other axis: `overflow-x: auto` can make the computed vertical
  overflow `auto` too. Allow space for focus outlines and check both wide and
  narrow layouts. Spec implementation pitfall P16 calls out this scenario.

## Validation without repeated full builds

1. Inspect and batch related changes across affected families before validation.
2. Run focused browser tests for the changed behavior. For layout corrections,
   assert geometry or inspect screenshots; click success alone misses spacing and
   visibility mistakes. Include idle, hover, focus, empty and readonly states.
3. Scope production locators to the active panel: native tabs may retain hidden
   content. A column header can include a resize handle’s accessible label; verify
   the translated heading without assuming its complete accessible name is only
   the visible title.
4. Run formatting, lint and type checks on the affected files/packages. Repeat
   checks when edits or failures justify them, not after every small change.
5. Rebuild production demos and Web Components at an integration checkpoint when
   packaging, generated CSS, portals or Shadow DOM need verification. Reuse current
   artifacts for unchanged packages; distinguish source checks from artifact checks.
6. Run wider tests and release checks at the milestone boundary. Mark TODO items
   complete only after their stated acceptance checks pass, and record any pending
   production verification precisely.

## Color picker layers

A picker trigger must reveal its editing surface immediately. Do not wrap a platform `input[type=color]` in another picker popover: it opens a second browser dialog and adds an unnecessary step. Verify the actual pointer and keyboard interaction, not only channel input values or a screenshot of the closed trigger. Keep alpha, format controls and the color surface together, matching Antd’s single-popover interaction.

## Compact structured pickers

Compare the open picker with the reference, including the largest ordinary mode. Cron labels and controls belong on the same row; field reset actions should be small inline icons rather than extra full-width rows. Multiple selections must not expand the whole picker indefinitely. Keep Apply/Cancel reachable without scrolling on an ordinary desktop viewport, and test the compact layout in the Web Component as well.

## Picker review checks

- Open the longest option list and use the mouse wheel to reach its last item. A compact closed selector is insufficient if its popup grows beyond the viewport.
- Bound dropdown height by both a sensible list maximum and the available viewport space. Long lists must scroll inside the native popup, never expand into a large page-height list or hide unreachable choices below the screen. Preserve the library's scroll indicators and keyboard navigation; verify the last option using wheel, touch and keyboard in native and Shadow DOM hosts. Apply this to every dropdown across demo navigation/settings, renderer fields, cron and other pickers, shared UI components and future renderer sets. Prefer enforcing the bound in the shared native component so callers inherit it.
- Reserve separate space for selected text, clear actions and dropdown arrows. Check vertical centers and hover/focus visibility with several selections.
- Use the family icon adapter for repeated actions so a user-selected icon library applies consistently to password and panel visibility.
- Inspect all color channel modes at narrow widths. Keep format, values and opacity compact while preserving translated accessible names.

## Comparable React and Svelte tests

For each parity area, inspect both React Antd and shadcn tests and map their
behavioral scenarios to executed Svelte tests. Compare stored values, preserved
siblings, validation and confirmation decisions, permission changes and interaction
outcomes. Adapt mounting, event dispatch, portals and native widget locators to
Svelte; do not replace behavioral checks with source matching or file counts.
Record reference paths/revision and any untested scenarios in the verification
baseline. Add Svelte lifecycle regressions where the framework requires them.

A native select may optimistically remember a value even when an asynchronous
renderer action rejects it. With Bits UI, use its documented function binding for
fully controlled value reads/writes. Test selecting the same option again after a
blocked action, not just retention of form data. Native dialog transitions may
retain outgoing DOM; wait for dismissal before starting the next user interaction,
and separately verify host invalidation closes an active confirmation.

Bind confirmation callbacks to the request that created the dialog. An outgoing
native dialog must not read a newer request when a delayed close event arrives.
A Svelte `{@const}` inside a keyed block can still be reactive: explicitly capture
an immutable request snapshot where the outgoing instance needs one. Forward
request-specific callback getters through helper layers instead of caching their
initial value. Test cancel/retry alongside composite-cell and tuple-tail adapters.
