# Color renderer integration

The parser and serializers are adapted from the MIT-licensed React renderer common package at `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`, `src/colorFormat.ts`. Parsing, serialization and the shared AJV color format use the same profile. Non-finite functional arguments are additionally rejected before channel conversion.

## Stored values and drafts

Accepted input is #RGB, #RRGGBB, #RRGGBBAA and comma-separated RGB, HSL and HSB notation with optional alpha. RGB channels are integers from 0 through 255. Save formats are hex, hex3, rgb and hsb. Actual edits normalize hue and percentages to whole units and functional alpha to two decimals; eight-digit hex uses 8-bit alpha. Hex3 refuses transparency. Incoming data is preserved on mount and on format changes.

The source example is imported unchanged; its Svelte factory adds translation keys to explanatory labels and supplies Bulgarian field descriptions in the host adapter.

The former hex mask stripped supported functional input. Text entry now keeps incomplete or unsupported text in a local draft and displays a translated message without replacing committed data. Valid prefixes retain their typed text while normalized values are committed, so typing a six-digit hex value is not interrupted when its first three digits become valid. Unrelated data changes retain the draft; external replacement and target/format/enabled changes invalidate it. Global settings resolve through `jsonformsExtended`, with local options taking precedence and legacy flat defaults retained. Legacy deprecation diagnostics remain open.

## Native components and channel editing

Flowbite retains its Input, CloseButton and Popover; shadcn retains its themed field, Button and Popover; Skeleton uses its input/button styling and native Popover. Color selection opens one popover containing the saturation/brightness surface, hue slider, channel values and opacity. There is no nested browser color dialog.

The installed UI libraries do not supply an inline color surface equivalent to Antd ColorPicker. The shared `ColorSpectrum` component is the documented exception: a pointer-operated saturation/brightness area with arrow-key access and a native range input for hue. Left/right change saturation, up/down change brightness, and Shift increases the step. Pointer capture supports dragging outside the surface. The family libraries still own popup positioning, focus, dismissal and channel controls. All labels come from the renderer catalog and host translator.

The previous composition put `input[type=color]` inside the popover, requiring a second chooser to make a visual selection. That interaction was rejected in review. Tests now assert that opening the picker immediately exposes the selection surface and does not render a browser color input.

RGB edits preserve alpha from the current stored value. Invalid/absent values use a neutral checkerboard in the trigger instead of displaying fallback black as a selected color. `colorTextEntry: false` removes text entry while retaining the chooser, label association and permitted clear action.

The shared channel controller offers HEX, RGB and HSB views plus opacity. Each opening selects the configured save format (hex3 uses HEX); changing views does not write data or change the save format. Channel edits serialize through the same profile as text edits. Opacity is preserved at its stored precision until explicitly edited. Transparent hex3 drafts show a localized error without replacing the stored value and can be repaired by restoring opacity. Empty/invalid imported values remain unchanged on opening.

Both color and duration accept explicit local format opt-in for string schemas,
matching Antd. Their testers reject incompatible schemas and do not use global
format defaults to select renderers.

The native adapters provide translated channel labels, popup clearing, permission checks and Escape dismissal. Skeleton popup content is mounted only while open, because its native component retains closed content. Fifty-one native browser scenarios cover real registries, compact cells, view switching, alpha, readonly transitions, invalid values and arbitrary host translation overrides. Production acceptance for the inline surface is recorded in the verification baseline. Compact cells preserve alpha and neighboring values while incomplete drafts remain local.

Readonly is independent of disabled presentation: text stays focusable when the
host requests separate states, while the native picker is disabled and pending
picker commits are canceled. The same permission checks guard synthetic events.

The installed Skeleton 4.12.1 exports do not provide a separate inline color-picker component. Its documented native color input opens a browser chooser, so it cannot be embedded inside this single-popover interaction. Antd ColorPicker remains the interaction reference; the React shadcn platform chooser does not supply the complete channel-view profile.

## Compact picker layout

The channel selector, HEX or RGB/HSB fields and opacity share one row, following the Antd presentation. Translated accessible labels and field titles remain available without separate visible label rows. Changing the display channel does not change the configured storage format. The official [shadcn-svelte component catalog](https://www.shadcn-svelte.com/docs/components) has no ColorPicker; the installed Flowbite and Skeleton exports also have no color-picker component. The shared surface remains an explicit fallback, not a native library component.
