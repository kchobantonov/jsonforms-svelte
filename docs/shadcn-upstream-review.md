# Shadcn upstream comparison

## Component-copy policy

Keep every copied shadcn component aligned with its pinned upstream source in
both the native demo and Web Component host. Update copied source when the
origin source changes, and put JSON Forms presentation and behavior in
renderer components or application theme styles. Existing local adapters for
demonstrated upstream bugs, installed dependencies and host constraints are
recorded below and must be reviewed against each origin update; do not add a
new feature fix directly to a copied UI primitive. Icon placeholders that the
registry expects its CLI to replace are generated substitutions.

This review covers the official shadcn-svelte registry. The copied Stepper and
Tags Input are maintained by [shadcn-svelte-extras](shadcn-extras-upstream-review.md)
and have their own pinned audit and synchronized update command.

The read-only registry comparison is pinned to upstream revision
`7e463da6dbf4b9cf086ce3e7d845650bc2a1163b`, Nova style. Reproduce it with:

```sh
pnpm shadcn:check --ref 7e463da6dbf4b9cf086ce3e7d845650bc2a1163b --stage tests/test-results/shadcn-upstream
```

The monthly workflow compares current main against
[`scripts/shadcn-accepted-source.json`](../scripts/shadcn-accepted-source.json):

```sh
pnpm shadcn:check --accepted-baseline scripts/shadcn-accepted-source.json --stage tests/test-results/shadcn-current-review
```

The baseline pins the reviewed revision and hashes every official component's
upstream, normalized local and raw local source in both hosts. It accepts the
documented adapters below while failing on a changed upstream revision, a
local source edit, a missing or extra file, or an unreviewed component. The
ordinary `shadcn:check` remains a strict textual upstream comparison and
therefore reports the 34 accepted differences. A current-main baseline check
passes for all 34 installed families; a deliberately altered component digest
causes the check to fail. Stepper and Tags Input remain under their separate
exact adapted-source checks.

The 2026-11-02 current-main audit at
`633fbd1456ebc0793d7b107b7e1ac2a719b4e8ca` found three changed
registry files since this pin. Both Calendar month/year selectors already
guard an absent selected item locally; the latest registry now adds those
guards. Both local Input OTP slot copies now use the latest registry's
`child({ props })` structure and `data-active` on the inner cell. The focused
mounted OTP file passes 23/23, and the rebuilt Shadcn password matrix passes
4/4 across EN/BG and native/Web Component hosts. Renderer, demo and Web
Component builds pass.
The later current-main revision `688cff9494c8f38fb80dd28dd8c11b590af251a6`
has the same registry component source as that audit; only the reported CLI
version advanced to 1.7.2. A fresh read-only comparison still finds no extra
local component source files. Since the previous source review, the only
changes inside either copied official UI tree are the two Input OTP slot files;
each matches the current generated upstream slot exactly. No copied Extras
source file changed in this workstream.
The latest read-only rerun confirms 199 official registry files in both the
pinned and current snapshots, with only the two Calendar selectors and the
Input OTP slot changed upstream. Both local Calendar copies already include
the current selected-item guards; the OTP slot matches the current generated
file in both hosts. Each host has the same 221 UI source paths; their 58 raw
text differences are covered by the documented host adapters and formatting
review below. The official source check remains intentionally nonzero for
the 34 classified registry families; the two current-main Extras checks pass
with 0 differing or extra Stepper/Tags Input files in both copies.
Generated Web Component `.d.ts` files are excluded from the source-file
comparison. The current registry still reports textual differences in 34
families because of the previously classified formatting, icon substitutions
and installed-API/host adapters. There are no extra local component source
files. Renderer-owned `LocalizedDialogContent` now supplies the translated
close name, so neither copied Dialog source needs a localization edit; its
focused mounted suite passes 9/9 and the rebuilt filtered confirmation file
passes 26/26 Shadcn cases.

The ignored stage contains the raw registry JSON, normalized source and a report
with upstream/local SHA-256 values for every file. The 33 component
families present in that snapshot differ textually from the newer registry; the command's nonzero result
reports that drift. There were no extra local component files. The upstream
`select/select-value.svelte` wrapper has since been added to both copies;
existing renderer triggers still provide their selected text directly.

## Local copies and dependencies

The demo and Web Component copies are otherwise aligned after whitespace and
class-token ordering are normalized. The Web Component Popover, Tooltip and
Select content wrappers set Bits UI's `strategy="fixed"` so overlays remain
visible beyond the demo's scroll pane while staying in the styled Shadow DOM.
Preserve this host-specific override when syncing the registry. Sample full
diffs for input, calendar and slider confirm their formatter-only differences.
Both hosts resolve Bits UI 2.19.5,
PaneForge 1.0.2, shadcn-svelte 1.4.2, Tailwind 4.3.3 and Svelte 5.50.1. The latest CLI
reported by the registry is 1.7.0; staged component source is pinned independently.
Both hosts map `@jsonforms-svelte-shadcn-ui` to their own component copy: SvelteKit
uses its `kit.alias`, while the Web Component uses Vite and TypeScript aliases.
Both CSS entry points scan the packed renderer packages and map HSL theme
variables through Tailwind's inline color tokens. The native demo's explicit
`@source` now points to its actual `src` directory; the same erroneous
`src/src` path was corrected in the Flowbite and Skeleton demos. A rebuilt
shadcn native bundle contains the table expanded-row, Field-label, Checkbox
and RTL utility selectors; the Web Component inlines its own generated CSS.

## Changes requiring care

- **Icons:** current components use Lucide imports. The raw registry now contains
  `IconPlaceholder` with several icon-library alternatives. A plain file copy is
  incomplete until the CLI's icon substitution is applied; `$lib/components/icon-placeholder`
  is not a local application component. All 17 staged files with a placeholder
  now have the matching named Lucide import in both local copies; neither copy
  retains an unresolved placeholder. The Select item already disables pointer
  events on nested SVGs at the parent level, and Calendar applies the registry's
  unresolved RTL marker as a real `rtl:rotate-180` utility on its buttons.
- **Slider:** preserve the native thumb tooltip, focus/hover behavior and forwarding
  of accessible value/name/description attributes. These support unset/invalid
  numeric values in the spec. The upstream wrapper does not provide this adapter.
- **Resizable:** preserve the PaneForge `getLayout`/`setLayout` forwarding used by
  controlled split layouts. The local PaneGroup now forwards `ref` to the installed
  native API as well; the focused split-pane suite passes.
- **Theme styles:** upstream Button secondary hover uses a color-mix expression
  over whole-color variables. The current theme stores HSL channels; adopting that
  expression requires a coordinated theme change. Retain the working current
  hover classes during the spec port.
- **Popovers:** compare the native transform-origin variable and logical-side
  animation classes with the installed Bits UI API. Re-run Shadow DOM anchor and
  RTL checks when changing them.
- **General registry drift:** import order and class order account for many textual
  changes. The component-level decisions below distinguish those changes from
  needed source updates and retained adapters.

The per-component API/style classification is recorded below. The pinned
Checkbox/Radio border and Field-label focus tokens are now applied in both
copies, with the installed Lucide icons retained. Their 17 placeholder source
substitutions have matching names in both hosts. Bounded native/Web Component
visual and adapter checks complete P0.8; broader renderer visual coverage
is accepted in P8.2. This snapshot does not certify a wholesale upgrade to the
staged registry.

## Reviewed UI components (2026-10-29)

All thirty-three installed component families were compared file-by-file against the pinned
stage in both the demo and Web Component copies:

| Component     | Classification                                                                                                                                                                                                                                                                                                                                                                                    | Decision                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Input         | Identical element/API and class-token set; only import and class order differ.                                                                                                                                                                                                                                                                                                                    | Retain local formatting.                                                                                              |
| Textarea      | Identical element/API and class-token set; only class order differs.                                                                                                                                                                                                                                                                                                                              | Retain local formatting.                                                                                              |
| Checkbox      | Local Lucide Check/Minus icons replace the registry's unsubstituted `IconPlaceholder`. Unchecked border and Field label-focus variants now match the pinned source after class ordering.                                                                                                                                                                                                          | Retain the required local icon substitution and aligned border/focus styles.                                          |
| Radio group   | Root differs by class order. The item uses a local Lucide Circle icon; its unchecked border and Field label-focus variants now match the pinned source after class ordering.                                                                                                                                                                                                                      | Retain the local icon substitution and aligned border/focus styles.                                                   |
| Switch        | The local track styles target `data-state=checked/unchecked`, and the thumb translates from the reactive `checked` value. The staged registry targets `data-checked`/`data-unchecked`. Installed Bits UI 2.19.5 emits `data-state`, so the local adapter is required for the installed dependency.                                                                                                | Keep the installed-API adapter; do not copy the staged state selectors without a Bits UI migration and browser check. |
| Button        | The local default variant restricted its hover color to links; the pinned registry applies it to links and buttons. The secondary variant keeps an HSL-compatible hover token instead of upstream's whole-color `color-mix`. Other differences are import/class order.                                                                                                                            | Apply the default hover class to both element types in both copies; retain the secondary theme adapter.               |
| Dialog        | Wrapper props, slots, exports and layout tokens match. The close icon is the local Lucide substitute for upstream's unresolved icon placeholder. Other differences are class/import order and the unused `cn-font-heading` marker on Title.                                                                                                                                                       | Retain the local icon and typography adapter; no functional source change.                                            |
| Tabs          | The pinned registry uses `data-active` and `group-data-horizontal/vertical` selectors. Installed Bits UI 2.19.5 emits `data-state="active"` and `data-orientation`, so the local orientation selectors are required. The Web Component already used the installed active-state selector, while the native demo still used `data-active`. Local `cn-tabs-list-variant-*` markers have no CSS rule. | Align the native trigger with the Web Component's `data-state` selector; retain installed-API orientation selectors.  |
| Accordion     | Wrapper props, exports and content styles match after class ordering. The local Lucide chevrons substitute for the registry's unresolved icon placeholders; installed Bits UI emits `aria-expanded` on the trigger, matching the local icon selectors. Local `cn-accordion*` markers have no CSS rule.                                                                                            | Retain the local icon adapter and class ordering.                                                                     |
| Collapsible   | Root, Trigger and Content match the pinned source; only index import order differs.                                                                                                                                                                                                                                                                                                               | Retain the local source.                                                                                              |
| Slider        | The local wrapper adds thumb hover/focus value labels and forwards accessible value/name/description props to thumbs. Both host copies differ only in class order; track classes repeat some identical tokens.                                                                                                                                                                                    | Preserve the spec-required tooltip and accessibility adapter; do not replace with the upstream wrapper.               |
| Avatar        | The complete Avatar component family has matching props, slots, exports and class tokens after import/class ordering. The local `cn-avatar-group` marker has no CSS rule.                                                                                                                                                                                                                         | Retain the local source.                                                                                              |
| Breadcrumb    | Props, slots and exports match. Local Lucide icons substitute for the registry's unresolved placeholders; the separator icon omitted the registry's RTL-flip marker. Other differences are import/class order and an unused `cn-breadcrumb` marker.                                                                                                                                               | Apply `rtl:rotate-180` to the local separator icon in both copies; retain the local icon substitution.                |
| Native select | The local OptGroup omitted the upstream Canvas text/background classes and used `native-select-opt-group` instead of the registry’s `native-select-optgroup` slot. The Root’s Lucide chevron substitutes for the registry icon; other differences are class/import order and an unused wrapper marker.                                                                                            | Align OptGroup styling and slot in both copies; retain the local chevron.                                             |
| Table         | Row omitted the pinned `has-aria-expanded:bg-muted/50` state style; other component tokens, props, slots and exports match after class/import order.                                                                                                                                                                                                                                              | Add the expanded-control row background in both copies.                                                               |
| Input group   | Props, slots, exports and class tokens match after ordering, except local `calc(var(--radius)-Npx)` spelling and an unused `cn-input-group-button-size-sm` marker. Tailwind emits the spaced CSS calculation.                                                                                                                                                                                     | Retain the equivalent local classes.                                                                                  |
| Input OTP     | The only source difference is the local Lucide Minus icon in place of the registry’s unresolved placeholder.                                                                                                                                                                                                                                                                                      | Retain the local icon substitution.                                                                                   |
| Scroll area   | Wrapper props, exports and class tokens match after import/class order. The local `cn-scroll-area-viewport` marker has no CSS rule.                                                                                                                                                                                                                                                               | Retain local formatting.                                                                                              |
| Toggle        | Props and class tokens match; only class order differs.                                                                                                                                                                                                                                                                                                                                           | Retain local formatting.                                                                                              |
| Toggle group  | Root/item props, exports and tokens match after import/class order. Installed Bits UI emits `data-orientation`, which Tailwind’s `data-horizontal`/`data-vertical` variants target.                                                                                                                                                                                                               | Retain local formatting.                                                                                              |
| Resizable     | The local handle uses logical positioning and an explicit Lucide grip. The PaneGroup preserves `getLayout`/`setLayout` forwarding for controlled split layouts but accepted `ref` without forwarding it to PaneForge.                                                                                                                                                                             | Forward `ref` in both copies; retain the imperative API and local handle.                                             |
| Sheet         | Content, portal, header, footer and exports match after class/import order and local Lucide close icon substitution. Overlay omitted the registry’s fade classes; `cn-font-heading` on Title has no local CSS rule.                                                                                                                                                                               | Add the overlay fade classes in both copies; retain the local icon and typography adapter.                            |
| Field         | Title used the `field-label` slot instead of `field-title`. Label omitted the registry’s nested-control hover/focus states; local orientation classes use equivalent direct-child selectors. Field Description’s horizontal selector is explicit rather than the registry shorthand.                                                                                                              | Correct Title slot and restore Label states in both copies; retain equivalent orientation selectors.                  |
| Item          | Props, slots, exports and class tokens match after import/class order.                                                                                                                                                                                                                                                                                                                            | Retain local formatting.                                                                                              |
| Calendar      | Local Lucide icons replace unresolved registry placeholders. The month/year selectors tolerate a missing selected item rather than dereferencing it. Navigation buttons already carry the RTL flip utility; other differences are import/class order.                                                                                                                                             | Preserve defensive caption fallback and local icon substitution.                                                      |

Popover exports and wrapper props match; header/title/description differ only
by import order. Installed Bits UI writes
`--bits-popover-content-transform-origin`, while both local content wrappers
used `--transform-origin`. Both now use the installed variable. The Web
Component's `strategy="fixed"` and local logical-side animations remain
intentional adapters.

Tooltip exports and content props match. Its local arrow expressions omitted
the spaces required around `+` and `-` in CSS `calc()`; both copies now use the
pinned upstream expressions. The Web Component keeps `strategy="fixed"` so its
tooltip can escape the scroll pane.

Badge exposes the same variants and props. Its local base class had both
`transition-all` and `transition-colors`, creating competing transition
declarations; both copies now retain only the upstream `transition-all`.
Label and Progress have matching props and class-token sets, with only class
order differences. Separator deliberately uses `data-orientation` selectors
and vertical `h-full` instead of the registry's `data-vertical:self-stretch`;
the local comment records that self-stretch breaks its consuming layout, so
this adapter remains. Card's differences are import/class order plus local
`cn-card-action` and absent upstream `cn-font-heading` marker classes. Neither
marker has a local CSS rule; the Card structure, slots, sizing, and exports
otherwise match. Preserve the current visual typography until a theme-level
review establishes a real font difference.

Select keeps the local 16rem popup bound, logical-side animations, Lucide icon
substitution and Web Component `strategy="fixed"`. Its item wrapper accepted
`label` without forwarding it to Bits UI; that now reaches the native item API,
so richer option children still yield the supplied selected label. Both copies
now include the pinned `Select.Value` wrapper/export and use Bits UI's Select
content transform origin. GroupHeading padding and the selected indicator's
size/pointer policy now match the pinned source; `end-2` retains logical RTL
placement. The item focus and disabled tokens now match the pinned source;
the existing `data-highlighted` states remain as a separate class argument.
Existing renderer triggers display their own selected text and do not require
migration to `Select.Value`.

The Badge change passed targeted demo and Web Component Svelte checks and
ESLint; both targeted builds passed. The Web Component check retained its
existing custom-element compile warning. This is a style-token correction,
so no new test that merely mirrors the class string was added.

The mounted Select item-label regression passed after the wrapper update. The
old wrapper omitted the label prop, so Bits UI would fall back to the rich
child text instead of the explicit label. The focused Select/enum/popup mounted
suites passed **15/15** cases. Demo and Web Component checks, ESLint and targeted
builds passed; the rebuilt shadcn choice demo passed **4/4** locale × host
scenarios. The Web Component check retained its existing custom-element warning.

After aligning native Tabs active-state selectors, a rebuilt production check
passed **4/4** shadcn EN/BG × native/Web Component cases. It verifies the
selected tab receives the visible active background and the previous tab loses
it after the transition. Both targeted hosts compiled and built; the Web
Component check retained its existing custom-element warning.

Both targeted Svelte checks passed (the Web Component retained its existing
custom-element compile warning). Both targeted builds passed, and the emitted
demo CSS and Web Component bundle contain the Bits UI popover origin and
`calc(-50% - 2px)` arrow rule. The focused production overlay and stepper
tooltip-position suites passed **4/4** cases each after rebuilding the Web
Component before the demo that embeds it.

The two host copies differ by generated class order and the recorded fixed-position
overrides, not by the choices above. All 33 staged component families have a
recorded source decision; the additional Command, Tags Input and Stepper copies
are reviewed in their own documents.

The focused mounted shadcn BooleanState suite passed **21/21** cases against
the installed UI copy and Bits UI dependency. It covers checkbox and switch
rendering, imported invalid values, required false, readonly behavior and
host-prop merging. Later rebuilt Checkbox and Radio production checks verify
their unchecked borders against the local `--input` token in both locales and
hosts.

Final focused acceptance used rebuilt demo and Web Component bundles. The
normal-table and radio-orientation visual checks pass **4/4** each; popup,
tabs and accordion production checks pass **14/14**; Select behavior and popup
bounds pass **6/6**. Mounted slider and split-pane adapter suites pass **20/20**.
The installed versions, host aliases, generated CSS selectors, and all 17
Lucide placeholder substitutions are verified above. This closes P0.8 at the
upstream-component scope; P8.2 renderer visual review is accepted.

## Command addition

Searchable finite choices add the twelve official Command files from the same
pinned Nova revision to both hosts. Registry aliases and Lucide placeholders are
resolved locally; the renderer supplies translated search and empty-state text.
This addition uses the installed Bits UI Command API and does not apply the other
staged upstream component replacements. The earlier 33-component report predates
this addition.

## Shared Select popup bound

Both UI roots add a 16rem maximum capped by `--bits-select-content-available-height` to Select.Content. This applies to demo navigation/settings and renderer selectors. Keep native Viewport and scroll controls; preserve this bound when syncing the registry. A 100-option mounted test verifies bounded height and native End/Enter selection of the final option. The broader all-dropdown audit remains in TODO.
