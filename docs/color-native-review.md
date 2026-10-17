# Color renderer integration

The parser and serializers are adapted from the MIT-licensed React renderer common package at `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`, `src/colorFormat.ts`. Parsing, serialization and the shared AJV color format use the same profile. Non-finite functional arguments are additionally rejected before channel conversion.

## Stored values and drafts

Accepted input is #RGB, #RRGGBB, #RRGGBBAA and comma-separated RGB, HSL and HSB notation with optional alpha. RGB channels are integers from 0 through 255. Save formats are hex, hex3, rgb and hsb. Actual edits normalize hue and percentages to whole units and functional alpha to two decimals; eight-digit hex uses 8-bit alpha. Hex3 refuses transparency. Incoming data is preserved on mount and on format changes.

The source example is imported unchanged; its Svelte factory adds translation keys to explanatory labels and supplies Bulgarian field descriptions in the host adapter.

The former hex mask stripped supported functional input. Text entry now keeps incomplete or unsupported text in a local draft and displays a translated message without replacing committed data. Valid prefixes retain their typed text while normalized values are committed, so typing a six-digit hex value is not interrupted when its first three digits become valid. Unrelated data changes retain the draft; external replacement and target/format/enabled changes invalidate it. Global settings resolve through `jsonformsExtended`, with local options taking precedence and legacy flat defaults retained. Legacy deprecation diagnostics remain open.

## Native components and limits

Flowbite retains its Input and CloseButton; shadcn retains its native themed field and Button; Skeleton uses its input/button styling. All use the platform color chooser. Its RGB edits preserve alpha from the current stored value rather than silently making a color opaque. Invalid/absent values use a neutral checkerboard instead of displaying the platform's fallback black as a selected color.

`colorTextEntry: false` removes text entry while retaining the chooser, label association and permitted clear action. Chooser actions and local feedback have English/Bulgarian fallbacks and translator overrides.

The platform chooser does not expose a portable API for selecting its initial channel view or editing alpha across browsers. A native-library channel editor and full light/dark/narrow/Shadow DOM visual acceptance remain open. The imported source fixture is not a claim of complete color-profile UI conformance.
