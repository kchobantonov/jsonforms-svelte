# Popup height inventory

This is the source check behind the compact picker and panel actions in
[TODO.md](TODO.md). The search covers rendered `Select.Content`,
`Combobox.Content`, `Dropdown`, `MultiSelect`, native selects and listboxes in
the three renderer families, their extended controls, and the three demo
shells. The separate [Web Component overlay inventory](webcomponent-overlay-inventory.md)
tracks portal ownership and styling. A fixed maximum height alone does not
prove that a popup fits below a low trigger; the production cases below check
actual rectangles and access to the final choice.

| Source group                                                | Height and placement                                                                                                                                                                                                                                                                                          | Production evidence                                                                                                                                                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shadcn base and extended Select menus (8 content sites)     | The shared Select content uses the Bits available-height variable, a 16rem cap and internal scrolling. The extended Cron menu no longer overrides that rule.                                                                                                                                                  | `choice-popup-bounds` reaches option 99 by wheel, touch and keyboard in narrow native and Shadow DOM hosts; `cron-control` reaches minute 59 in 4/4 narrow EN/BG native/Web Component cases.                                 |
| Shadcn searchable and checkbox choices                      | The outer popup is capped to available height, with a separate scrolling option list.                                                                                                                                                                                                                         | `choice-popup-bounds` and `searchable-choice-popup-bounds` cover 100 options, the final choice and short viewports.                                                                                                          |
| Skeleton base and extended Combobox menus (6 content sites) | Enum, OneOf, mixed type, array choices and Cron now use the positioner's available-height variable and internal scrolling.                                                                                                                                                                                    | `searchable-choice-popup-bounds`, `skeleton-branch-type-popup-bounds` and `cron-control` cover 100-choice and 60-minute menus, including the last item by wheel/touch and native/Shadow DOM bounds.                          |
| Flowbite finite choices                                     | SearchableChoice keeps its search field above a bounded scrolling list; ArrayChoices and Cron MultiSelect place their bounded lists on the roomier side. Cron uses the visible portion of its own picker frame, which otherwise clips an absolutely positioned menu.                                          | `searchable-choice-popup-bounds`, `flowbite-multi-select-popup-bounds` and `cron-control` cover 100-choice and 60-minute menus in narrow native/Shadow DOM hosts. Cron's final item passes wheel, touch and keyboard checks. |
| Demo settings and navigation                                | Flowbite and Skeleton settings/sidebar selectors are browser-native. Shadcn's sidebar and settings selectors inherit the shared Select cap. Shadcn's theme selectors inherit that cap; its theme panel scrolls internally. Flowbite's four-choice theme menu and Skeleton's theme panel fit a short viewport. | `shadcn-theme-popup-bounds` and `demo-theme-overlays` cover final theme/settings choices; the TODO records their focused EN/BG runs.                                                                                         |
| Temporal and validation popovers                            | Date/time content and validation summaries have viewport caps and internal scrolling.                                                                                                                                                                                                                         | `temporal-popup-bounds` passes 36/36; focused validation badge and container-summary suites reach the final message.                                                                                                         |
| Extended Duration editor panels                             | Shadcn and Skeleton cap their panel to the positioner's available height and scroll the unit fields internally. Flowbite sizes its inner content from the roomier side of the trigger before opening, then scrolls internally; its outer native Popover retains `overflow-visible`.                           | The rebuilt 390×450 `duration short-viewport popup` matrix passes 12/12 across families, EN/BG and native/Web Component hosts, including bounds, internal overflow and focus/edit access to the final seconds field.         |
| Extended ColorPicker panels                                 | Shadcn caps its portal to Bits' available height. Skeleton and Flowbite measure the roomier trigger side and cap their renderer-owned panel; Skeleton uses fixed positioning so a scrolled page cannot displace the panel. Each keeps an internal scroll frame.                                               | The rebuilt 390×450 `color picker short-viewport popup` matrix passes 12/12 across families, EN/BG and native/Web Component hosts, including bounds, internal overflow, ShadowRoot ownership and keyboard access to Blue.    |
| Compact File operation feedback                             | Flowbite wraps long messages and caps its content to the roomier trigger side. Shadcn reserves space below Bits' available-height bound. Skeleton uses the fixed positioner and its available-height bound. All three scroll long feedback internally.                                                        | The rebuilt 390×450 long-message `file feedback short-viewport popup` matrix passes 12/12 across families, EN/BG and native/Web Component hosts; the adjacent Enter/Escape/click Web Component journey passes 6/6.           |

| Extended Cron editor panels | Shadcn caps the outer portal to Bits' available height. Flowbite and Skeleton measure the roomier trigger side and cap the outer panel, which contains the shared scrolling CronPicker and its nested selectors. | The rebuilt 390×450 `cron short-viewport editor panel` matrix passes 12/12 across families, EN/BG and native/Web Component hosts, including panel bounds, ShadowRoot ownership and focus reaching the expression field. |

The source scan finds exactly two renderer-owned Shadcn Command list sites:
SearchableChoice and ArrayChoices. Both use the available-height Popover cap
and an internally scrolling Command list, and both have the 100-choice
production evidence above. No other renderer or demo uses Command outside
the copied UI wrappers.

Section error indicators in all three families render the shared
`ErrorSummaryList`. That list already caps its error rows to
`min(20rem, 35dvh)` and scrolls them internally; no extra popup cap is needed
for a long list of validation errors.

The rendered dropdown and long-content popup source audit is accepted.
Collection page-size and mixed/OneOf selectors use the shared bounded Select
or Combobox wrappers; finite choice lists have final-option wheel, touch and
keyboard production evidence. Duration, ColorPicker, File feedback and Cron
outer panels each pass a 12-case 390×450 native/Web Component matrix. The
adjacent complete Duration and Cron editing files pass 36/36 and 48/48.
Browser-native select and datalist popup rendering remains owned by the
browser; the native datalist's visual popup is explicitly not verified in
headless Chromium as a P8.2 platform-rendering limitation. The separate side-by-side light/dark and long-text
visual review is accepted in P8.2.

The copied Shadcn Extras TagsInput suggestion branch still has upstream's
fixed `max-h-50` and `top-full` placement. The current ArrayChoices renderer
does not pass `suggestions`, so no current form opens that list. The source
audit is complete: both copies match the adapted current upstream source.
Track any future upstream placement change through the extras sync; do not
patch the copied primitive for this inactive branch.
