# Shadcn upstream comparison

The read-only registry comparison is pinned to upstream revision
`7e463da6dbf4b9cf086ce3e7d845650bc2a1163b`, Nova style. Reproduce it with:

```sh
pnpm shadcn:check --ref 7e463da6dbf4b9cf086ce3e7d845650bc2a1163b --stage tests/test-results/shadcn-upstream
```

The ignored stage contains the raw registry JSON, normalized source and a report
with upstream/local SHA-256 values for every file. The 33 component
families present in that snapshot differ textually from the newer registry; the command's nonzero result
reports that drift. There are no extra local component files. Upstream adds
`select/select-value.svelte`; current renderers provide their selected text in the
native trigger, so this file's absence does not establish a missing selection UI.

## Local copies and dependencies

The demo and Web Component copies have no differences after whitespace and
class-token ordering are normalized. Sample full diffs for input, calendar and
slider confirm the formatter-only differences. Both hosts resolve Bits UI 2.19.5,
PaneForge 1.0.2, shadcn-svelte 1.4.2, Tailwind 4.2.1 and Svelte 5.50.1. The latest CLI
reported by the registry is 1.7.0; staged component source is pinned independently.
Both hosts map `@jsonforms-svelte-shadcn-ui` to their own component copy. Both CSS
entry points scan the packed renderer packages and map HSL theme variables through
Tailwind's inline color tokens.

## Changes requiring care

- **Icons:** current components use Lucide imports. The raw registry now contains
  `IconPlaceholder` with several icon-library alternatives. A plain file copy is
  incomplete until the CLI's icon substitution is applied; `$lib/components/icon-placeholder`
  is not a local application component.
- **Slider:** preserve the native thumb tooltip, focus/hover behavior and forwarding
  of accessible value/name/description attributes. These support unset/invalid
  numeric values in the spec. The upstream wrapper does not provide this adapter.
- **Resizable:** preserve the PaneForge `getLayout`/`setLayout` forwarding used by
  controlled split layouts. Review upstream `bind:ref` against the installed native
  API before adopting that wrapper.
- **Theme styles:** upstream Button secondary hover uses a color-mix expression
  over whole-color variables. The current theme stores HSL channels; adopting that
  expression requires a coordinated theme change. Retain the working current
  hover classes during the spec port.
- **Popovers:** compare the native transform-origin variable and logical-side
  animation classes with the installed Bits UI API. Re-run Shadow DOM anchor and
  RTL checks when changing them.
- **General registry drift:** import order and class order account for many textual
  changes. Other changed upstream classes and wrapper APIs remain update candidates,
  rather than reasons to replace the tested local components wholesale.

The per-component API/style classification is still open under P0.8. This snapshot
establishes provenance and identifies the local behavior that a future sync must
preserve. It does not certify a wholesale upgrade to the staged registry.

## Command addition

Searchable finite choices add the twelve official Command files from the same
pinned Nova revision to both hosts. Registry aliases and Lucide placeholders are
resolved locally; the renderer supplies translated search and empty-state text.
This addition uses the installed Bits UI Command API and does not apply the other
staged upstream component replacements. The earlier 33-component report predates
this addition.

## Shared Select popup bound

Both UI roots add a 16rem maximum capped by `--bits-select-content-available-height` to Select.Content. This applies to demo navigation/settings and renderer selectors. Keep native Viewport and scroll controls; preserve this bound when syncing the registry. A 100-option mounted test verifies bounded height and native End/Enter selection of the final option. The broader all-dropdown audit remains in TODO.
