# Shadcn side-by-side visual review

## Additional Properties, light theme

On 2026-11-02, the built React Shadcn and Svelte Shadcn demos rendered the
same imported `additional-properties` spec fixture in headless Chromium at
desktop (1280 px) and narrow (390 px) widths. The four captures are in the
ignored `test-results/shadcn-side-by-side/` directory. Both pages rendered
without page errors. This is a bounded manual screenshot review, not a full
theme or accessibility sign-off; the React build predates the current Svelte
build, so source and spec decide any apparent behavioral difference.

The dynamic-property cards show the same inventory, telemetry and header
entries, labels, edit/remove actions, input values and invalid `sensor-x`
marker. At 390 px the actions stay visible and the input rows fit inside their
cards. React places its Data editor below the form, while the Svelte demo
places Data in a separate tab. That is demo-shell layout, outside the form
renderer.

React's older build shows a pager with size 5 and `1/1` for each collection.
Svelte omits this footer because no available page size can change the visible
entries. This follows spec §18.21.1, which says to hide unnecessary navigation
and retain the size selector only when it can change the visible result. No
renderer change is warranted for this difference. The spacing and type scale
differ between the two family applications, but no field, action or feedback
was lost or obscured in these captures.

The current Svelte build also passed a 390 px dark RTL inspection in native
and Web Component views. Both document roots reported `dir="rtl"`, body scroll
width stayed at 390 px, and Chromium reported no page errors. The three
collection headings and their rows are present in both views; the Web
Component `Inventory labels` heading has a visible 107 px bounding box and
the same computed 14 px foreground text as native. Actions and invalid
feedback remain visible in the two captures. These captures are also in the
ignored screenshot directory. A focused built-demo regression file now checks
the heading bounds, invalid marker, direction, horizontal overflow and page
errors in both hosts; `shadcn-additional-properties-visual.spec.ts` passes 2/2
after rebuilding the Shadcn demo with the current Web Component bundle.

Light/dark, RTL, long-text and keyboard-focus profiles are recorded in the
P8.2 acceptance evidence in [TODO](TODO.md). The upstream copied-component audit is tracked in
[Shadcn upstream comparison](shadcn-upstream-review.md) and
[Shadcn Extras component sources](shadcn-extras-upstream-review.md).

## Choice cards, light theme

The same imported `spec-choice-controls` fixture was captured from the built
React and Svelte Shadcn demos at 1280 px and 390 px. The four group captures
are in `test-results/shadcn-side-by-side-choice-cards/`. Both builds rendered
without page errors or horizontal page overflow. At desktop width, both show
the selected approval card and decline card in one row; at 390 px, both wrap
them into a vertical stack. The approval image, selected content, visible
choice labels and selected border remain visible in both builds.

React keeps the card group to its content width and gives the two cards
different widths. Svelte's group spans its available form width and uses equal
256 px card widths at desktop; at 390 px, the cards fit within the 266 px
group. The visible control label sits inside React's radio group and in
Svelte's control wrapper, while each group retains the accessible name
`Decision`. These are layout differences in the current builds; no content,
selection feedback or action is lost. The separate native focus/error matrix
passes 6/6 across all three Svelte families and EN/BG in light and dark modes.
Later dark RTL and complex-fixture comparisons are recorded below; long-text
production coverage is recorded in [TODO](TODO.md).

A later narrow dark RTL capture of the same choice-card fixture passes all
**12** Flowbite/Shadcn/Skeleton EN/BG native/Web Component cases after the
Skeleton form direction and native Tabs fixes were rebuilt. The RTL direction
reaches the rendered radio group and both cards remain inside its 390 px
viewport. Shadcn's two host captures are byte-identical in each locale.
Skeleton's native and Web Component BG captures were reviewed together: card
content, selection border and label alignment are visible in both. These
The React/Svelte dark RTL side-by-side capture follows below.

A further built-demo comparison captured the React and Svelte Shadcn EN native
choice-card groups at 390 px with Dark and RTL selected in each demo. Both
render the selected Approve card and Decline card without page errors or
horizontal overflow; the captures are
`test-results/shadcn-side-by-side-choice-cards/react-en-native-dark-rtl.png`
and `svelte-en-native-dark-rtl.png`. Svelte's radio group computes `rtl` and
right-aligns its card content. The React demo shell has `dir="rtl"`, but its
Tabs wrapper has `dir="ltr"`, so its radio group computes `ltr`. This is a
bounded reference-build difference, not evidence that Svelte should force LTR.
The React screenshot's selected border, image and labels remain visible. Other
Svelte locales and hosts are covered by the 12-case production matrix; this
React comparison is bounded to EN native.

## Array control composite cells, narrow light and dark RTL

The built React and Svelte Shadcn demos rendered the same imported
`spec-array-controls` fixture with the “Scalar and composite cells” tab selected
at 390 px. Four native captures are in
`test-results/shadcn-side-by-side-array-cells/`: `react` and `svelte` light,
plus `react` and `svelte` dark RTL. Each capture includes the two staff rows,
the normal table and AG Grid view, collection actions, headers and page
controls. Both versions keep the page scroll width at 390 px, put the wide
normal table in a locally scrollable region, and report no page errors. The
React table measures about 1610 px inside a 260 px scroll region; the Svelte
table measures about 1663 px inside a 234 px scroll region. The action buttons,
required Name header, row selection and grid pager remain visible at the narrow
width. Svelte wraps the first “Conference staff” heading; React keeps it on
one line. Neither loses the heading or its actions.

In dark RTL, both demos keep readable headings, table borders and controls
without page overflow. The React shell has `dir="rtl"`, while its table computes
LTR; the Svelte table computes RTL under its RTL shell. This matches the
previously observed React Tabs direction boundary in the choice-card review.
The Svelte direction follows spec §30.3's logical RTL layout. The React demo
shows its Data editor below the form; the Svelte demo keeps Data in a separate
tab, a demo-shell presentation difference. The table-cell content and actions
remain available in both.
