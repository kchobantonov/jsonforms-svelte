# Array-choice component decisions

The React Antd and shadcn implementations share framework-independent applicability and mutation rules in `jsonforms-react-renderer-common/src/arrayChoices.ts`. The Svelte core now uses the same contract, with Svelte bindings and TypeScript tests. Explicit variants rank above automatic checkbox arrays. Chips accept homogeneous strings, including finite string choices; multi-select requires finite string choices and `uniqueItems: true`. Unsupported structured choice schemas retain their existing renderer.

## Shadcn

`ArrayChoicesRenderer.svelte` uses the pinned [shadcn-svelte-extras Tags Input](shadcn-extras-upstream-review.md) for free unique-string chips. The adapter supplies localized removal labels and delegates additions/removals to the shared guarded mutations. Repeated values, imported typed or duplicate values, finite choices, and asymmetric add/remove limits retain positional pills with native Input and Button. Multi-select composes native Popover and Command, as the searchable single-select does. The entire field opens the popup, which offers search and checkmarked choice rows; selected pills remain removable without opening it. These paths preserve case-sensitive identity, schema bounds, authored `restrict` precedence, readonly controls, and IME composition.

Both chips paths place pills and the entry input inside one bordered field. The field receives the focus ring; the upstream Tags Input's inner input does not draw a second focus border, and its keyboard-selected tag uses a subtle fill without an offset ring. The guarded fallback retains its explicit add button because duplicate and finite values cannot use the upstream widget's mutation contract.

The Shadcn multi-select shows its search input only with `options.autocomplete: true`. A hovered row retains its highlight while the Command list updates after a click; its checkmark independently shows which choices are stored.

The renderer never rewrites incoming arrays on mount. Removing a repeated value removes the selected occurrence. Invalid non-array data remains available to document validation and is not silently replaced by an empty array. An invalid addition keeps the draft so it can be corrected.

All three Svelte families attribute validation errors at a direct array index to the corresponding selected pill and the field summary. A stored value outside the finite choices, such as `Fax` in imported preferences, remains visible and removable, with an error icon and explanation on its pill. This applies to normal and Web Component rendering and clears when the offending occurrence is removed. React Ant Design and React shadcn use the same behavior; array-level bounds errors stay on the field rather than marking an arbitrary pill.

## Flowbite

Multi-select uses native MultiSelect with opaque option IDs, native search Input, and translated per-occurrence removal buttons. Selected values stay visible when filtering suggestions. The native clear-all button is hidden because it does not expose a localized label or the required removal policy. The controlled adapter checks all mutations against the current data and schema bounds.

Chips compose native Input and Button with theme styling. Installed Flowbite `Tags.svelte` uses `toLowerCase()` for uniqueness and available-tag matching, hardcodes validation messages, and does not expose translated per-token delete labels. Direct binding would violate case-sensitive enum identity and host localization. This is a component-contract exception, not a reason to replace native components elsewhere.

## Skeleton

Multi-select uses native multiple Combobox with opaque IDs, filtering, and Shadow DOM portal targeting. Removable pills retain every imported occurrence, including invalid typed values.

Native TagsInput is used for free string arrays with `uniqueItems: true` and unique incoming string values. The adapter supplies catalog translations for accessibility announcements, preserves rejected drafts, and handles whitespace-sensitive additions before the widget trims them. Native state-machine keyboard behavior is exercised after focusing the input.

Finite-choice chips, repeated-token schemas, and invalid typed/duplicate imports use Skeleton's styled native inputs/buttons. Installed Zag TagsInput applies `uniq(value.concat(inputValue))`; directly binding these cases would silently collapse repeated entries or lose JSON types. Removal in the fallback remains positional.

## Verification scope

TypeScript browser tests cover both native widgets and fallback compositions. The canonical `spec-array-choices` demo is registered for all families with original source JSON, separate English/Bulgarian supplements, and provenance hashes. Production native/Web Component checks are recorded in the verification baseline. Full dark-mode, RTL, narrow-width, and screen-reader acceptance remains part of the project-wide visual/accessibility matrix.
