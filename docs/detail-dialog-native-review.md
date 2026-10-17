# Detail dialog component review

This review covers the spec's “Form-wide detail-dialog defaults” section and the measured-geometry
requirements in `docs/implementation-pitfalls.md`. Reference revisions: spec
`48b96b5266e2ff9ddd16b81419eced90d46e4ed7` and React renderers
`935122d5c3a5c0a606ef841e73238a653083cd81`.

## Native components

- Flowbite uses its public `Modal`, including the library's dialog, header, body
  and footer. The installed 1.33.1 modal exposes neither dragging nor resizing.
- Shadcn uses the generated Dialog components backed by Bits UI. Its native portal,
  focus management and dismissal hooks remain responsible for modal behavior.
- Skeleton 4.12.1 exports `Dialog` and `Portal`. Detail editors now use these
  primitives, including Trigger, Backdrop, Positioner, Content, Title and
  CloseTrigger. The host-provided portal target and root-node getter keep the
  modal inside the correct Shadow DOM context. The previous hand-built HTML
  dialog is removed.

The shared Svelte geometry controller manages dimensions and measured drag bounds;
CSS supplies native manual resizing. This follows React's `DetailModal`,
`DetailDialogContent` and shared `useDetailDialog`. It does not replace the UI
library's modal, focus trap or portal behavior. Skeleton's FloatingPanel is a
separate interaction model and is not used as a replacement modal.

Skeleton's modal layer disables body pointer events. Geometry updates replace the
content's inline style, so the content also carries `pointer-events-auto`. Native
layer-specific inline overrides still take precedence. This preserves pointer
interaction after maximize/restore without changing the library's layer manager.

## Acceptance

Mounted tests cover English/Bulgarian geometry, initial container focus, form
config/local false precedence, maximize/restore, viewport containment, draft
preservation, cancellation and return focus. Existing row and composite-cell tests
exercise isolated edits and actions through the native Skeleton dialog.

The table-row-details production scenario covers both row and composite-cell
editors: real pointer resizing, measured negative offsets, all four viewport
edges after resizing, maximize/restore, smaller viewports with reachable headers
and footers, Escape, focus return, and cancellation preserving stored data. The
same scenario exercises native-table and AG Grid dialogs and persistent side and
bottom panels. Validation indicators remain in accessible tab names; selectors
match the translated category prefix rather than assuming an error-free label.

Verification: 17 focused Skeleton component cases and all 12 family × EN/BG ×
native/Web Component production scenarios pass. Skeleton package checks and both
production builds pass; unchanged Flowbite/shadcn hosts were reused.
