# Web Component overlay inventory

This is the P7.7 source inventory for popup, portal, tooltip, dialog and
floating surfaces in the three native families and their extended packages.
The source scan covers Svelte files containing `Portal`, `Popover`, `Tooltip`,
`Dialog`, `Popper` or `Floating`. A listed production test is evidence for its
tested interaction, not a claim that every visual state of the group is accepted.

| Surface                              | Source entries (same role across families)                                                                                                                                                                                                                                                                                                                        | Current production evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | P8.2 visual follow-up                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Host and grid overlays               | `ag-grid/runtime/AgGridArrayControlRenderer`, `DispatchCellHost`, `components/DetailDialog`, `RowDetailToggle`                                                                                                                                                                                                                                                    | `webcomponent-host-lifecycle`, `webcomponent-registry-competition`, `ag-grid-commands`, `table-row-details`, `webcomponent-file-feedback-overlays`, `array-controls-grid-sort` (12/12 filter root/background/bounds; Flowbite EN light/dark), `webcomponent-grid-filter-style-parity` (6/6 light/dark native/ShadowRoot), `ag-grid-native-theme` (12/12 opaque light/dark native/ShadowRoot grid surface), `ag-grid-detail-independence` (12/12 dialog root/style/focus), `webcomponent-grid-detail-dialog-style-parity` (3/3 light/dark) | Inline side/bottom panel long-content visual review remains under P8.2.                          |
| Temporal and specialized pickers     | `controls/DateControlRenderer`, `DateTimeControlRenderer`, `TimeControlRenderer`, `CronControlRenderer`, `DurationControlRenderer`, `FileControlRenderer`, `FileOperationFeedback`, `controls/components/ColorPicker`, `CronSelect`                                                                                                                               | `temporal-popup-bounds` (36/36 root/style/bounds), `webcomponent-calendar-style-parity`, `webcomponent-color-style-parity`, `webcomponent-cron-style-parity` and `webcomponent-duration-style-parity` (6/6 light/dark each), color/cron/duration/file overlay matrices; file-feedback style parity passes 3/3                                                                                                                                                                                                                             | Representative specialized popup styles accepted; review long-content visuals under P8.2.        |
| Selectors and choices                | `complex/ArrayChoicesRenderer`, `MixedRenderer`, `OneOfRenderer`, `controls/EnumControlRenderer`, `OneOfEnumControlRenderer`, `controls/components/SearchableChoice`                                                                                                                                                                                              | `choice-selects`, `composition-oneof`, `mixed-imported-invalid-type`, `array-choices`, `finite-choice-invalid-values`, `webcomponent-search-choice-overlays`, direct OneOf/mixed/search, basic Enum/OneOfEnum and ArrayChoices style comparisons                                                                                                                                                                                                                                                                                          | Representative selector popup classes accepted; review long-option visuals under P8.2.           |
| Confirmations and collection details | `additional/ListWithDetailRenderer`, `cells/CompositeCell`, `complex/ArrayControlRenderer`, `ChoiceCardsRenderer`, `RecursiveTreeRenderer`, `TupleControlRenderer`, `complex/components/AdditionalItems`, `AdditionalProperties`, `ConfirmationDialog`, `MixedFrame`, `components/CollectionPager`, `TupleAction`, `layouts/ArrayLayoutRenderer`, `GroupRenderer` | `destructive-confirmation`, `array-controls-dialog-geometry`, `additional-properties`, `collection-pagination-actions`, `list-detail-identity` (12/12 Delete root/style), `recursive-tree` (12/12 Delete root/style/focus); row/composite dialogs and Rename pass 12/12 root/style/focus matrices; choice-card, expandable-array and ListWithDetail dialog style parity pass 6/6 each.                                                                                                                                                    | Representative collection dialogs accepted; review long-content geometry under P8.2.             |
| Validation and section details       | `complex/components/ContainerValidationIndicator`, `controls/components/ValidationBadge`, `layouts/SectionIndicators`, `additional/ImageDiagnostic`                                                                                                                                                                                                               | `image-context`, `container-validation`, `container-validation-summary`, `additional-properties` pass 12/12 root/style matrices; array-summary and group-validation style parity pass 6/6 each; category style parity passes 4/4; ValidationBadge style parity passes 6/6.                                                                                                                                                                                                                                                                | Representative validation popups accepted; compare alternate text/long-error visuals under P8.2. |
| Action and cell tooltips             | `cells/CellContent`, `controls/SliderControlRenderer`, `controls/components/PasswordToggle`, tooltips in the collection renderers above                                                                                                                                                                                                                           | `password-control`, `webcomponent-slider-tooltip-overlays`, `array-controls-row-details`, `array-controls-dialog-geometry` pass 12/12 root/style matrices; Flowbite ListWithDetail Add tooltip passes 4/4 root/style and hover-to-focus; password and slider style comparisons pass 6/6.                                                                                                                                                                                                                                                  | Compare remaining cell and collection action tooltips on focus in narrow light/dark hosts.       |

`CellContent` differs by family: Flowbite exposes the cell error through the
button's native `title` and accessible name, as does Skeleton; shadcn uses a
portalled tooltip. Its native browser tooltip is outside DOM portal ownership
checks. The shadcn tooltip stays in the document or ShadowRoot as appropriate
in the four focused `container-validation-composite` cases.

`ValidationBadge` popovers now have document/ShadowRoot ownership and computed
nontransparent background checks in the 12/12 `additional-properties` family ×
locale × host production journey. Shadcn additionally has computed padding and
hit-testing inside the ShadowRoot in `shadcn-webcomponent-overlays`. Other popup
classes still need computed style comparison.

`ImageDiagnostic` tooltips now have computed nontransparent background and
positive padding in the complete 12-case family × locale × host matrix. This
covers one styled popup class in every family; exact native/Web Component style
comparison and the other classes remain.

`PasswordToggle` reveal tooltips have the same computed style checks in the
complete 12-case password matrix, alongside keyboard and OTP behavior.
The direct native/Web Component comparison passes 6/6 family × locale cases
in light and dark mode, matching computed foreground, background and padding.
Shadcn also matches after switching to a custom zinc design system in 2/2
focused cases; the Web Component now applies generated variables to its themed
wrapper as well as the host.

The destructive-confirmation dialog now passes 12/12 root, focus-entry,
Cancel/Escape dismissal and surviving-trigger focus-return cases across
families, locales and hosts. A separate 6/6 comparison checks its foreground,
background and radius against native rendering in light and dark mode at a
390 px viewport. Other collection dialogs remain in the inventory.

Date, time and date-time popups now pass 36/36 document/ShadowRoot,
short-viewport containment and computed nontransparent-background cases in
`temporal-popup-bounds`. A separate 6/6 narrow native/Web Component comparison
matches date calendar foreground, background and radius in light and dark mode
across families and EN/BG. Other specialized picker style comparisons remain.
Color, cron, duration and compact file-feedback popup surfaces also pass
computed nontransparent-background checks inside Web Component ShadowRoots
across all families and EN/BG (6/6 in each focused overlay file). Their
existing bounds, Escape, focus-return and AG Grid cell hit-testing assertions
remain. The file-feedback test now selects the popup surface directly, avoiding
its simultaneous screen-reader-only message after dismissal.

Searchable-choice popups pass 6/6 narrow Web Component cases with a computed
nontransparent background, root placement, hit-testing, Escape and focus
return. The direct native/Web Component style comparison passes 6/6 for popup
foreground, background and radius in light/dark mode across families and EN/BG.
The narrow Web Component matrix now runs in RTL and still passes 6/6 with
viewport containment and focus return; the direct style comparison covers LTR.

Group `SectionIndicators` validation popovers pass 12/12 document/ShadowRoot,
computed-background, Escape and trigger-focus cases. Skeleton now reads the
reactive portal target at render time; its previous mount-only snapshot could
place the popup in the document outside the Web Component ShadowRoot. Category
validation popovers in Shadcn and Skeleton now pass the same root/background/
Escape/focus checks in the complete 12-case `container-validation` file;
Flowbite renders category feedback as text. Array `showValidationIndicator`
popovers pass 12/12 document/ShadowRoot, computed-background, Escape and
trigger-focus checks in `container-validation-summary`. That file also verifies
translated schema-authored errors and Show more/less after the fixture stopped
supplying a global keyword translation that intentionally outranked the authored
message. A separate 6/6 narrow native/Web Component comparison matches its
computed foreground, background and radius in light and dark mode across all
families and EN/BG.

Flowbite collection Add action tooltips pass 4/4 native/Web Component EN/BG
root-ownership and computed-background checks within `array-controls-bounds`.
Other action tooltips and collection contexts remain in the inventory.

Shadcn collection page-size listboxes now pass document/ShadowRoot ownership,
computed-background, Escape and focus-return checks in the 12/12
`collection-pagination-actions` production file across families, EN/BG and
both hosts. Flowbite and Skeleton use native page-size selects.

Shadcn and Skeleton OneOf selector listboxes pass root-ownership and computed-
background checks in the authored/generated `composition-oneof` production
subset (24/24 across families, EN/BG and both hosts); Flowbite's selector is
native. Escape now returns focus to the trigger without reopening; Skeleton's
controlled close passes the rebuilt 8/8 authored/generated EN/BG native/Web
Component subset. A 4/4 narrow native/Web Component comparison matches the
Shadcn and Skeleton selector's foreground, background and radius in light/dark
mode and EN/BG. A further 320 px authored long-label OneOf branch profile now passes 4/4 Shadcn/Skeleton native/Web Component cases, including full readable option text, local popup bounds and no page overflow; Shadcn required a renderer-owned width/wrapping fix.

Shadcn and Skeleton mixed-type selector listboxes now pass root-ownership and
computed-background checks in the 12/12 `mixed-imported-invalid-type` matrix;
Flowbite uses a native select. A separate 4/4 narrow native/Web Component comparison matches
Shadcn and Skeleton mixed-type listbox foreground, background and radius in
light/dark mode and EN/BG.
The same 12/12 mixed-type production file now verifies Escape dismissal and
trigger focus return after Skeleton's controlled-close fix. The 320 px long translated mixed-type profile passes 4/4 Shadcn/Skeleton native/Web Component cases. Long enum choices pass 8/8 across both locales and hosts, exercising Shadcn default and autocomplete selectors plus Skeleton native-select and combobox variants; Shadcn required a renderer-owned width/wrapping fix.

Shadcn and Skeleton composite-choice selector listboxes pass document/ShadowRoot
and computed-background checks in the 12/12 `choice-selects` matrix; Flowbite
uses a native select. Its existing clear, selection and search behavior remains
covered in the same file.
The rebuilt 12/12 file now also checks Escape dismissal and input focus return;
Skeleton OneOfEnum uses a controlled close at the Escape boundary after a BG
Web Component case left the listbox visible.

Shadcn and Skeleton ArrayChoices finite multi-select popups pass document/
ShadowRoot and computed-background checks in the 12/12
`array-choice-finite-presentations` production subset; Flowbite uses its native
inline listbox. Escape returns focus to the Shadcn/Skeleton trigger; the same
journey retains two-choice selection and exact data.

Basic Shadcn and Skeleton EnumControl listboxes pass root, computed-background,
Escape and input-focus checks in the rebuilt 12/12
`finite-choice-invalid-values` matrix; Skeleton now controls its Escape close.
Flowbite uses a native select in that profile.

Collection row-detail and composite-cell edit dialogs now pass 12/12
document/ShadowRoot, computed-background and Cancel focus-return checks in
`array-controls-dialog-geometry`, alongside their move, resize and maximize
interactions. A 390 px long composite-cell value profile passes 6/6 across all families and native/Web Component hosts: the summary scrolls within its table, the full value remains editable in a viewport-contained detail dialog, and the page does not overflow.

Additional-property Rename dialogs pass 12/12 document/ShadowRoot,
computed-background and Cancel focus-return checks within `additional-properties`.
The dialog is identified by its visible title so a simultaneous validation popup
does not confuse the ownership assertion. Other collection-dialog variants remain.

Keyboard-focused slider value tooltips pass 12/12 document/ShadowRoot and
computed-background checks in the new all-family EN/BG native/Web Component
matrix. Other action and cell tooltip variants remain in the inventory.
A separate 6/6 narrow native/Web Component comparison matches slider tooltip
foreground, background and radius in light/dark mode across families and EN/BG.

Collection row-detail toolbar tooltips now pass 12/12 document/ShadowRoot,
computed-background, hover and keyboard-focus checks in
`array-controls-row-details` across families, EN/BG and both hosts. Skeleton
now explicitly controls focus/hover state and Escape dismissal; its final
EN/BG native/Web Component subset passes 4/4. The tooltip keeps the localized Show/Hide details label
while the same journey exercises dialog, side and bottom panels.

The inline `DialogActionHint` on Cancel inside both row-detail and composite-cell
dialogs now passes 12/12 document/ShadowRoot, computed-background, hover and
keyboard-focus checks in
`array-controls-dialog-geometry` across families, EN/BG and both hosts. The
same file retains dialog geometry and trigger-focus return checks.

Tuple Add icon-action tooltips now pass 12/12 keyboard-focus, Escape,
document/ShadowRoot and computed-background checks in `tuple-control` across
families, EN/BG and both hosts. Shadcn forwards descendant focus from its
disabled-button wrapper; Skeleton now uses its native Tooltip with a
focus-scoped Escape listener. The same journey retains composition blocking
and exact Add/Delete data behavior.

The bespoke choice-card branch-change dialogs now pass 12/12 document/ShadowRoot,
computed-background and Decline focus-return checks in `choice-cards` across
families, EN/BG and both hosts. Skeleton now resolves its portal target after
mount; Flowbite restores the initiating radio after close. The same journey
retains composition blocking and confirmed branch replacement.

Expandable-array deletion dialogs now pass 12/12 document/ShadowRoot,
computed-background and Decline focus-return checks in
`array-controls-expandable` across families, EN/BG and both hosts. Flowbite now
retains the surviving Remove trigger through its keyed Modal close; the same
journey retains disclosure, edit, Add and exact data behavior.

The image and password root assertions were added to the existing full
family × EN/BG × native/Web Component files on 2026-11-02; both pass 12/12.
The inventory is complete for the searched source surfaces. Vendor-generated
popups are exercised through the named production interactions rather than a
static source-file list. P7.7 host portal acceptance is complete. The broader keyboard, long-content and visual profiles are accepted in P8.2; native browser title hints are not portalled surfaces and their keyboard-focus treatment is covered there.
