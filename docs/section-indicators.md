# Section indicators

Groups and categories derive their data/error state from descendant Control and ListWithDetail scopes. Hidden controls still contribute; presentation-only elements do not become root bindings. JSON Pointer segment boundaries preserve literal dots, empty keys, escaped slashes and numeric array positions. A shared error index handles presence, and opt-in counts scan each eligible validator error once even when controls overlap.

Schema errors follow validation visibility. Host additional errors remain available in ValidateAndHide and NoValidation. Element options override `config.jsonformsExtended`; explicit false disables an indicator. Data presence treats false and zero as data, while absent/null/blank/empty values do not mark the section.

Tabs and step headers place markers beside labels. Accordion and Group bars place them at the end of the header. Flowbite's native steppers accept string labels and descriptions rather than heading snippets: they use the native error-icon slot, a data dot beside the label, and translated description text. This retains the native step component and exposes feedback without requiring a hover interaction. Other presentations use the family's native Tooltip with focusable status icons. Clicking a marker or pressing Enter/Space opens its translated summary without toggling the surrounding section; Escape dismisses it. Flowbite uses a fixed native popover with explicit width to avoid resize feedback inside the heading. The data marker uses the same catalog string for its accessible name and native title tooltip.

The shared helper accepts explicit context segments. Mounted adapters use the host's existing JSON Forms path convention; broader literal-key dispatch and ownership audits remain tracked in TODO.md.

Scope collection is shared by UI-schema identity. Six shared helper cases cover overlapping bindings, literal segments, replacement layouts, missing/additional property attribution and validation visibility. Six EN/BG mounted indicator cases cover counts, native tooltip interaction, host errors and explicit local false. Six canonical categorization cases cover error removal after a data correction.
