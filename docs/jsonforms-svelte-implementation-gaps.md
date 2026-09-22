# Svelte renderer implementation gaps and review notes

This document tracks source findings and implementation work separately from
[the portable UI-model specification](jsonforms-extended-ui-model-spec.md).
It is not normative and does not assert complete renderer coverage. No
renderer implementation changes have been made as part of this review.

## Review baseline

- Neighboring JSON Forms checkout: fork commit `ad85cf39`, declaring
  `3.9.0-alpha.1`.
- Svelte core dependency declaration: `^3.8.0`; this is not a resolved-version assertion.
- Distinguish official upstream behavior, fork additions, and Svelte adaptations.
- Findings below are based on source inspection, not browser verification.

## Confirmed gap: password selection through UI options

Affected families: Flowbite, Skeleton, and shadcn.

Their `PasswordControlRenderer.entry.ts` testers currently use
`rankWith(2, and(isStringControl, formatIs('password')))`. They support schema
`format: "password"` but do not select the password renderer using only
UI `options.format: "password"` on a plain string schema.

Required follow-up: accept either schema or UI password format while retaining
string applicability and schema-driven selection for generated UI schemas.
Review password cells as well as controls for consistent behavior.

Verification should cover schema-only selection, UI-only selection, both
paths together, generated UI schemas, ordinary strings, incompatible types,
and competing presentation options. Do not change schema or form data merely
to select the password renderer.

Sources:

- `packages/jsonforms-svelte-flowbite/src/lib/controls/PasswordControlRenderer.entry.ts`
- `packages/jsonforms-svelte-skeleton/src/lib/controls/PasswordControlRenderer.entry.ts`
- `packages/jsonforms-svelte-shadcn/src/lib/controls/PasswordControlRenderer.entry.ts`

Comparison: neighboring Vuetify uses schema format; neighboring Material
checks applied UI `format` in `mui-controls/MuiInputText.tsx`. Svelte's
validators register custom `password` format without content constraints.

## Slider value handling: differences requiring review

- Flowbite and Skeleton preserve finite numeric zero and use a display
  fallback for missing or nonnumeric values.
- shadcn uses `Number(value)`, so null and the empty string become zero.
- Neighboring Material uses `Number(data || schema.default)`, which can
  display a nonzero default for actual data equal to zero.

These observations concern display values; they do not establish that mounting
changes stored form data. Agree on missing/invalid-value behavior and verify
widget behavior before implementing fixes.

Sources: each family's `src/lib/controls/SliderControlRenderer.svelte` and
`../jsonforms/packages/material-renderers/src/controls/MaterialSliderControl.tsx`.

## Date/time selection and formatting: review baseline

Core `isDateControl`, `isTimeControl`, and `isDateTimeControl` accept either
schema format or UI `options.format`. Their UI-option branches do not enforce
string type themselves. All three Svelte date entries use `isDateControl`
at rank 2. OR-based selection alone does not establish precedence when schema
and UI formats request different renderers.

The neighboring `packages/examples/src/examples/dates.ts` includes custom
display/save formats such as `dateSaveFormat: 'YYYY-MM'`. Individual renderer
support, defaults, format tokens, bounds, and invalid-value handling still
need review; these examples do not prove cross-renderer parity.

Sources:

- `../jsonforms/packages/core/src/testers/testers.ts`
- `../jsonforms/packages/examples/src/examples/dates.ts`
- `packages/jsonforms-svelte-{flowbite,skeleton,shadcn}/src/lib/controls/`

## Temporal controls: source support matrix

Inspected all Date, Time, and DateTime control components in the Flowbite,
Skeleton, shadcn, and neighboring fork's Vuetify renderer sets. This is a
source-level matrix; passing props is not proof of complete widget enforcement.
Official upstream Vuetify parity is not established by inspecting this fork.

| Behavior | Flowbite | Skeleton | shadcn | Neighboring Vuetify fork |
| --- | --- | --- | --- | --- |
| Four literal format-bound keywords | Read by all three controls | Read by all three | Read by all three | Read by all three |
| `$data` bound resolution in these controls | Not implemented | Not implemented | Not implemented | Not implemented |
| Display/save format options, temporal mask, confirmation labels/actions | Present | Present | Present | Present |
| Date `views` | No direct option handling found | Special year/month-only branch | Special year/month-only branch | Filters day/month/year views and maps navigation modes |
| UI `pickerIcon` | No direct option handling found | No direct option handling found | No direct option handling found | Present on all three controls |
| Explicit component date-bound override | Datepicker availableFrom/availableTo | DatePicker min/max | DatePicker min/max | v-date-picker min/max |
| Explicit component time-bound override | Timepicker min/max | No corresponding extraction found | No corresponding extraction found | v-time-picker min/max |
| Date-time boundary-day source | Committed pickerValue.date | Active staged date while open | Active staged date while open | date-picker ref inputDate |

The date `views` branches in Skeleton/shadcn recognize arrays containing year
and month and excluding day/date. This is narrower than arbitrary view-array
support. Flowbite's lack of direct handling should be recorded as an option
coverage gap, not silently treated as equivalent support through component props.

## Temporal bounds: implementation follow-up

1. **Combined bounds:** the inspected components use `if` / `else if` for
   inclusive versus exclusive bounds on each side. If both are supplied,
   the inclusive bound takes precedence even when the exclusive constraint
   is tighter. Review intersection handling against validator semantics.
2. **Precision:** exclusive dates shift by one day; exclusive times and
   date-times shift by one second when the display format contains `s`,
   otherwise one minute. Inclusive times are formatted down to that precision.
   Review rounding for nonaligned bounds (e.g. minimum 09:30:30 in a
   minute-only picker), fractional seconds, midnight, and empty ranges.
3. **Dynamic bounds:** type declarations accept `{ $data: ... }`, but bound
   branches test for strings. Validator support for `$data` is not widget
   support. Any future resolver must define its data scope and reactivity.
4. **Flowbite staged date-time selection:** minTime/maxTime use committed
   `pickerValue.date`. With `showActions: true`, changing selectedDate does
   not update that source until commit. Verify boundary-day restrictions
   while selecting an uncommitted date; Skeleton/shadcn use activeDate.
5. **Time picker input format:** standalone Svelte Time controls pass raw
   control data to TimePicker, whose initialization splits on colons and
   parses numbers. Verify custom save formats such as 12-hour strings against
   the main field's format-aware parser. Date-time paths pass formatted time.
6. **Clear and readonly behavior:** inspect shared binding and already-open
   picker paths together. Disabled triggers alone do not prove every pending
   selection/confirmation path obeys a later readonly or enabled change.
7. **Parsing and offsets:** the Flowbite helper calls `dayjs(data, format)`
   without strict parsing. Record normalization, invalid dates, timezone/offset
   round trips, and DST behavior before promising strict format preservation.

These are source-observed limitations or targeted verification items, not
claims that every listed scenario has been reproduced in a browser.

## Temporal option details and supporting sources

All inspected controls derive a mask from display format, defer incomplete
nonempty masked edits, parse completed text, and serialize successful edits
with the save format. Text input is not directly checked against picker bounds.

The shared Svelte bindings merge global config then UI options. Picker bounds
may instead read renderer component props first. Skeleton/shadcn calendar
prop spreads can override earlier props; inspect individual contracts rather
than declaring one universal override policy.

Vuetify Time defines a computed `clearLabel`, but no use of it was found in
that component's template. Do not advertise an effective option solely from
its computed-property declaration.

Source paths (relative to the repository):

- `packages/jsonforms-svelte-{flowbite,skeleton,shadcn}/src/lib/controls/DateControlRenderer.svelte`
- `packages/jsonforms-svelte-{flowbite,skeleton,shadcn}/src/lib/controls/TimeControlRenderer.svelte`
- `packages/jsonforms-svelte-{flowbite,skeleton,shadcn}/src/lib/controls/DateTimeControlRenderer.svelte`
- `packages/jsonforms-svelte-{flowbite,skeleton,shadcn}/src/lib/components/TimePicker.svelte`
- `packages/jsonforms-svelte-flowbite/src/lib/util/datejs.ts`
- `packages/jsonforms-svelte-flowbite/src/lib/util/composition.svelte.ts`
- `../jsonforms/packages/vue-vuetify/src/controls/{Date,Time,DateTime}ControlRenderer.vue`

Validation reference: [ajv-formats comparison keywords](https://ajv.js.org/packages/ajv-formats.html).
They require a schema format with comparison support; UI format alone cannot
make a plain-string schema with these keywords compile under that contract.

## Applicability and validation-only examples

The baseline String, Number, and Integer Svelte entries use the respective
core type testers at rank 1. The core date/time testers' UI-only branch lacks
a string guard. Aligning temporal selection with the intended string-domain
contract therefore requires a compatibility review and explicit negative tests
for UI temporal formats on number/object schemas.

Flowbite String does not derive a mask from schema `pattern`. It does map
`maxLength` to input maxlength when UI `restrict` is enabled. Flowbite Number
uses UI `step` (default 0.1); Integer defaults to 1. These facts should not be
confused with the Slider mapping of schema `multipleOf` to widget step, nor
with automatic numeric minimum/maximum enforcement in every number input.

## Masked string controls: implementation findings

Affected Svelte families: Flowbite, Skeleton, and shadcn. The neighboring
Vuetify fork contains the same selection and boolean-option patterns.

- **Inverted boolean options:** `eager` and `reversed` are computed with
  `appliedOptions.<option> === false`. Omission produces false, explicit true
  produces false, and explicit false produces true. Follow-up should align
  true/false with the option's intended meaning and test all three cases.
- **Overbroad selection:** rank-2 testers use
  `and(isStringControl, hasOption('mask'))`. Presence alone makes a boolean
  temporal `mask: false` eligible for the generic mask renderer as well.
  Review string-mask applicability and rank/order conflicts against temporal
  controls, including schema-generated and explicitly supplied UI schemas.
- **Placeholder difference:** Vuetify uses `placeholder ?? mask`; the Svelte
  controls use the explicit placeholder only. Decide whether to align this
  behavior or document the difference in the renderer-family contract.
- **Length restriction:** `restrict` forwards schema maxLength to the input.
  Verify whether separators count toward that limit when returnMaskedValue
  is false; do not confuse display length with stored-string validation.

All inspected Svelte implementations support returnMaskedValue, tokens,
maskReplacers, and tokensReplace. Their token builder starts from renderer
defaults, applies the selected token configuration, and passes the resulting
map to Maska. `tokens` wins over `maskReplacers` when both are supplied.
Existing tests cover masked and unmasked updates; this review did not execute
them or verify the additional scenarios above in a browser.

Source locations: each Svelte family's
`src/lib/controls/StringMaskControlRenderer.entry.ts` and
`StringMaskControlRenderer.svelte`; corresponding Vue files are under
`../jsonforms/packages/vue-vuetify/src/controls/`. No corresponding generic
mask-option implementation was found in the neighboring Material renderer
source search; that is not a claim that custom Material inputs cannot mask.

## Choice controls: autocomplete and suggestions

The intended portable encoding is UI `options.autocomplete`, without a
variant alias. Source review shows the following differences; widget search
behavior has not been verified in a browser.

| Family | Inspected enum presentation and selection |
| --- | --- |
| Neighboring Material | Enum/oneOf controls use autocomplete unless the applied option is false, then select. |
| Neighboring Vuetify fork | Separately registered autocomplete enum/oneOf renderers use rank 10 and schema testers; they do not check the autocomplete option. |
| Svelte Flowbite | Enum/oneOf controls use Select and do not inspect autocomplete. |
| Svelte Skeleton | Enum/oneOf controls use Combobox by default, or a native select with nativeSelect true; no autocomplete-option branch. |
| Svelte shadcn | Enum/oneOf controls use Select and do not inspect autocomplete. |

Follow-up: support explicit autocomplete true/false while preserving documented
family defaults and existing nativeSelect behavior. Do not equate nativeSelect
with autocomplete false: native versus custom widget and searchable versus
non-searchable interaction are distinct choices. Verify actual list filtering
in Skeleton; use of Combobox alone does not establish filtering support.

Suggested strings are a separate capability. The Svelte String controls read
UI `suggestion` arrays; supported AnyOfStringOrEnum controls derive suggestions
from an enum branch. Neither should restrict input to suggestions unless the
schema itself does so. Review global configuration versus direct UI-option
lookup before advertising inherited suggestion configuration.

## Choice controls: stored-value identity review

- Flowbite Enum uses the DOM select value in its change handler, which is a
  string. Verify numeric/boolean option types are preserved through the full
  binding path; the inspected handler does not map back to the option value.
- Skeleton Enum's combobox maps option values through String and returns the
  selected string. Its native-select path instead maps back to an option's
  original value. Verify and align these paths.
- shadcn Enum maps string widget identifiers back to original option values,
  but values such as numeric 1 and string "1" collide under that encoding.
  Skeleton uses the same string identity representation.
- Skeleton/shadcn Enum treat empty string and null as unselected in their
  display adapters. Verify legitimate enum members, unknown existing values,
  and clear behavior rather than assuming absence semantics.

These are source-level findings, not browser-reproduced data-change results.
Review both enum and oneOf handlers, radio counterparts, and tests for typed
values before implementing a common identity adapter.

Sources:

- `../jsonforms/packages/material-renderers/src/controls/Material{Enum,OneOfEnum}Control.tsx`
- `../jsonforms/packages/vue-vuetify/src/extended/Autocomplete{Enum,OneOfEnum}ControlRenderer.entry.ts`
- `packages/jsonforms-svelte-{flowbite,skeleton,shadcn}/src/lib/controls/EnumControlRenderer.svelte`
- The corresponding `OneOfEnumControlRenderer.svelte`, `StringControlRenderer.svelte`, and `AnyOfStringOrEnumControlRenderer` entry/component files.
- `../jsonforms/packages/core/src/util/schema.ts` for enum/constant and oneOf detection.

## Restrict policy: defaults and consistent enforcement

Use the existing `restrict` option; the earlier proposed renderer config.strict
policy has been superseded. Ajv strict mode is unrelated. The target profile
prefers true, resolved from per-control options then global config. The
neighboring core's `src/configDefault.ts` currently sets `restrict: false`.
Adopting the target default requires explicit integration/migration handling;
merely documenting it does not change the core-provided merged default.

Source inspection confirms appliedOptions.restrict guards in Flowbite
ArrayLayoutRenderer for array counts and in
`complex/components/AdditionalProperties.svelte` for property counts.
The latter uses Object.keys(control.data).length, counting all properties.
The inspected EnumArray components do not directly check minItems/maxItems.

Temporal controls currently derive picker bounds without checking restrict,
and their completed text handlers do not enforce those bounds before commit.
Align both paths with the target contract: enabled restriction prevents invalid
bounded commits; disabled restriction permits them while validation continues.
Keep incomplete input local and show feedback without silently replacing it.

Review all relevant mutation handlers as well as disabled action states:
checkbox selection, deselection, chips, multi-select, add/remove properties,
batch edits, clear, picker confirmation, typing, and paste. Verify per-control
and global true/false, default handling, readonly/disabled state, boundaries,
and repair of invalid initial data. Do not infer that enum-array addItem and
removeItem inherit every guard from ordinary control onChange.

## Explicit tables, composite cells, and AG Grid comparison

Compared Svelte Flowbite implementation and demos with
`../jsonforms-vue-renderers/packages/jsonforms-vue-vuetify-extended-renderers/src/`.
The older neighboring jsonforms-vuetify-webcomponent project also contains
AG Grid files; the comparison here uses the Vue renderer monorepo extension.
No official upstream AG Grid capability is implied.

Shared conventions: variant ag-grid, agGridOptions, gridHeight/gridWidth,
cells[property].display/detail, JSON Forms dispatched cells, schema-generated
columns, and disabling row drag under sorting/filtering. Svelte AG Grid's rank
is 10; Vuetify extension's is 4. Exact selection must account for all registered
renderers. The Svelte ordinary-table tester raises its rank from 3 to 5 for
table true or format table, overriding the usual rank-4 nested-item layout.

Composite cells in both inspected families resolve display.scope relative to
the cell, dispatch detail at the original cell data path, and edit live. Their
TypeScript detail annotation says ControlElement although actual demos pass
layouts. Review widening the type to UISchemaElement. Both composite cell
entries have unconditional rank-1 testers: audit fallback applicability and
ties against scalar cells rather than claiming type-specific selection.

Differences and verification items:

- The agreed contract permits global config.agGridOptions defaults with local
  overrides, recursively merging objects and replacing arrays. Svelte's current
  top-level config/UI spread selects a whole local agGridOptions object rather
  than merging its nested defaults; Vuetify reads UI options only. Both need
  review against this merge contract.
- Svelte accepts string gridHeight/gridWidth; Vuetify uses truthy values in
  style bindings. Non-string dimensions are not established portable support.
- Svelte protects internal row/event plumbing and composes selected user
  callbacks; Vuetify additionally merges vuetifyProps('v-ag-grid'). Keep
  adapter-specific behavior explicit instead of promising identical callbacks.
- Svelte copies grid options before deleting protected fields; the inspected
  Vuetify implementation deletes rowData from the selected baseOptions object.
  Review source-option mutation in that adapter.
- Svelte wraps rows with key/sourceIndex/value; Vuetify uses its own row identity
  scheme. Application callbacks must not assume identical params.data shapes.
- Ordinary Svelte tables pass cells[property] options; AG Grid also inherits
  array options (excluding cells and agGridOptions in Svelte). Verify inherited
  detail/variant values do not accidentally change nested renderer selection.
- Test edits/removals after sort/filter, primitive duplicate rows, nested dialogs,
  readonly transitions, batch deletion below minItems, and row identity without
  mutating serialized data. This comparison is source inspection, not execution.

Sources: Svelte `src/lib/cells/CompositeCell.svelte`, ordinary
`complex/ArrayControlRenderer.entry.ts`, extended `ag-grid/entry.ts` and
`ag-grid/runtime/AgGridArrayControlRenderer.svelte`; Vue extension
`renderers/AgGridArrayControlRenderer.vue`, its entry, and
`cells/CompositeCellRenderer.vue`. Examples are under Svelte demo-common
`examples/table-cells/uischema.json` and `examples/ag-grid/uischema.json`.

## Monaco: dynamic language and scoped JSON editing

The portable authoring contract uses `$dynamic.options.language` rather than
`:language`. Current Svelte and neighboring Vue helpers directly resolve
`:language` from root data, and their testers accept that option. Adapt these
paths to the common pre-dispatch resolver while preserving legacy compatibility
where required. Do not introduce another code-editor variant.

Both inspected helpers use format code with a string language option for
string schemas, or explicit language json and convertJson true for JSON-value
editing. The conversion branch's tester does not narrow schema type. Parsed
JSON is sent to the existing Control path; parsing failure suppresses the
commit. The agreed target now infers text mode for string/nullable-string
schemas and JSON-value mode for explicit types excluding string. Ambiguous
or untyped schemas require an explicit boolean convertJson. Implement this
in both selection and value adaptation, including omitted language defaults
of plaintext or json as appropriate. Existing testers/helpers do not yet
implement these defaults.

Review null and empty handling: toMonacoEditorValue currently turns null into
empty text, while fromMonacoEditorValue cannot parse empty text as JSON. Also
verify dynamic language changes do not accidentally switch a JSON-value control
into string storage. The agreed contract requires resolved language json for
JSON-value editing, retaining that requirement from the current helpers.
However, an incompatible language with inferred/explicit JSON-value mode must
produce a diagnostic/fallback without stringifying structured data; the current
non-JSON helper branch converts non-string values with String(value). JSON parse success does not imply target-schema validity.

Sources: `packages/jsonforms-svelte-extended/src/lib/core/monaco.ts`, the
family MonacoControlRenderer components, and
`../jsonforms-vue-renderers/packages/jsonforms-vue-extended-renderers/src/renderers/monaco.ts`.

Monaco follow-up cases: resolved references; nullable strings; objects, arrays,
numeric/boolean/null schemas; ambiguous unions; explicit true/false precedence;
missing or dynamic language; invalid JSON drafts; and commits to a nested
Control path without altering sibling data. Keep schema validation separate
from parsing and do not silently rewrite data when mode/language changes.

## Monaco diagnostics and combined form validity

Source inspection of MonacoEditor.svelte found editor creation and content
change subscriptions, but no model-specific JSON Schema association or marker
subscription feeding JSON Forms additionalErrors. Implement scoped schema
association with resolvable references and per-editor model URIs. Avoid
clobbering shared JSON language defaults used by other editors.

Provide an owned diagnostic registry in the integration layer, preserving
host additionalErrors. Map blocking language diagnostics to the owning form
instancePath, retain marker positions, deduplicate equivalent validator errors,
and handle model/version changes, disposal, stale results, and pending analysis.
Invalid uncommitted JSON drafts must affect form validity despite valid last
committed data. Diagnostic availability varies by installed language service.

The base Svelte JsonForms onchange effect currently reports core.errors and
watches data/core.errors identity; it does not expose an aggregated editor
validity state or pending diagnostics. Verify standard field error selectors
and add an integration-level validity notification without silently breaking
the existing onchange API. AdditionalErrors rendering alone is insufficient
for validity-driven commands.

Ordinary core schema rules call ajv.validate(condition.schema, scopedData);
they do not automatically consult additionalErrors. Connect submit/button
enabled state to combined validity through the host/extension, and guard action
execution as well as appearance. This requires a defined integration contract;
it must not be claimed to work by setting additionalErrors alone.

Diagnostic publication is independent of restrict. Follow-up tests should
cover valid stored data with an invalid draft, errors in non-JSON source text,
multiple editor instances plus host errors, recovery without data change,
pending validation, schema references, and row movement/unmount path changes.

## Monaco diagnostic aggregation

Publish at most one owned additionalError per editor instance with blocking
errors, using a localized summary and errorCount. Keep detailed diagnostics
and positions in Monaco/the internal registry, not in the form error list.
Exclude warnings, information, and hints from both count and blocking validity.
Remove the summary when errors clear, even if warnings remain. Immediate JSON
parse errors and later language-service results share the same summary.

Verify hundreds of markers produce one summary, warning-only content produces
none, counts update without form-data changes, multiple editors remain isolated,
and host errors are preserved. Deduplicate parser/service reports and avoid
redundant summaries for schema errors already presented by the form validator.

## File control: cancellation, filtering, and error integration

The agreed contract changes the existing cancellation behavior: cancelling the
chooser or aborting an attachment clears both native selection and scoped form
value using the clear-value convention. Svelte handleFileChange currently
returns for an empty selection, explicitly preserving existing data; abort
resets reader/input/progress without clearing form data. Review native cancel
events as well as empty change events, readonly transitions, and stale read
completion. Invalid-size rejection remains distinct: preserve the previous
committed value while publishing the rejection error.

UI accept must take precedence, including an explicit empty string meaning no
filter; only absent accept falls back to schema contentMediaType. All three
Svelte implementations currently prefer contentMediaType and ignore empty
accept. The inspected Vuetify FileRenderer uses contentMediaType only. These
are picker hints, not content-validation guarantees.

Keep the existing format-bound names and file-byte-size interpretation.
Current Svelte code checks File.size before FileReader conversion, which is the
correct efficient path. It rejects invalid sizes unconditionally; align the
preventive branch with effective restrict while keeping validation/error
reporting active. Also review combined inclusive/exclusive bounds rather than
inclusive-first selection and numeric-string compatibility.

Svelte currentFileValidationError overrides local wrapper error text but is
not published through additionalErrors. Add control-owned aggregated errors
and pending-read validity while preserving host errors and existing schema
errors. Test failed replacement with valid old data, recovery, cancellation,
clear, read failure, and multiple controls. No decoder is required for new-file
size checks; validation of preloaded encoded strings remains separate.

Sources: the three Svelte extended FileControlRenderer.svelte components and
fileSchema.ts, plus the neighboring Vue extension's FileRenderer.vue and
shared isBase64FileControl tester. This is a specification follow-up, not an
implementation change or a claim of browser-tested cancellation support.

## Duration and Color contracts

Duration: retain confirmation by default and support showActions false for
immediate picker commits. Guided masked text entry is required behavior;
there is no portable mask toggle. Existing Vuetify mask false handling is a
renderer-specific compatibility feature, not a parity requirement. Flowbite
always supplies its mask; neighboring Vuetify always uses its confirmation
wrapper. Audit guided input coverage and confirmation behavior across families. Preserve duration
Cancel as draft cancellation, unlike the agreed attachment cancellation rule.
Test invalid typed drafts, non-negative integer components, weeks exclusivity,
zero P0D, and controls whose displayed component limits differ from parsing.

Color: add UI options.format color selection alongside schema format color,
including generated-schema and plain-string examples. Existing testers are
schema-format driven. The shared COLOR_REGEX and extended createAjv currently
accept only #RGB, #RRGGBB, #RRGGBBAA. The agreed colorSaveFormat option supports hex (default), hex3, rgb, and hsl.
RGB/HSL function strings require coordinated parser/serializer/validator work.
Native RGB picker adaptation drops alpha from its display value. Verify picker
commits preserve stored alpha rather than replacing it with six-digit text.

Sources: extended family DurationControlRenderer and ColorControlRenderer,
Flowbite duration.ts, shared core/color.ts and core/validate.ts, and neighboring
Vue Vuetify extension DurationRenderer/ColorRenderer components. No runtime
changes or browser verification were performed in this review.

Duration guided-entry follow-up: verify valid grammar coverage, partial local
prefixes, invalid typing/paste prevention, correction/deletion, and invalid
preloaded data remaining visible with validation feedback. Do not let the mask
hide or rewrite existing invalid values. Completed invalid nonempty drafts must
not commit; publish their invalidity even when committed data remains valid.

Color serialization follow-up: implement colorSaveFormat hex/rgb/hsl, accepting
all supported representations independently of selected output. Preserve legacy
short/full hex input, preserve alpha through RGB picker edits, and avoid data
normalization on mount or option change. Add shared conversion/rounding vectors,
including fractional alpha, equivalent RGB/HSL colors, and invalid/out-of-profile
input. Six/eight-digit hex is the default output; explicit hex3 uses three digits; named colors and additional CSS
syntaxes are outside the initial profile.

Color hex3 implementation: all three extended Svelte renderer sets now support
`options.colorSaveFormat: "hex3"` for picker and complete opaque hex text edits.
Shared rounding maps each channel to the nearest multiple of 17, and the picker
previews the saved color. Existing transparent values remain unchanged with the
RGB picker disabled and localized guidance (`color.hex3Transparency`);
transparent typed drafts do not commit. The color demo now gives shortColor a
three-digit pattern and this explicit option. Regression tests cover picker
rounding, text serialization, and transparency preservation; shared tests cover
rounding boundaries. RGB/HSL parsing/serialization and default-mode alpha
preservation remain separate follow-up work above.

## Split layout selection and provenance

The supported model uses HorizontalLayout/VerticalLayout with variant splitter,
not a splitter boolean or a separate SplitLayout type. The neighboring Vue
extension's legacy SplitLayout tester branch is outside the supported contract;
do not advertise or add it as a supported encoding. Both inspected extensions
already accept the selected layout-plus-variant representation.

The variant key is an established renderer convention (official Material uses
variant stepper); the splitter value and renderer remain project extensions.
Audit entries and individual added options for provenance rather than attributing
all behaviors found in a fork to official JSON Forms.

Flowbite SplitLayout currently divides all schema children equally and inserts
padding. Review it against visible-child sizing, spacing-neutral layout,
resizable, and keyboard/focus behavior required by the model. Selecting the
existing encoding does not imply these newer behavioral requirements are met.

## Categorization: navigation and vertical presentation

The agreed model retains showNavButtons (default false) and uses vertical
(default false) for Categorization orientation. Do not introduce an orientation
alias for this element. Ordinary step navigation is supported; validation-gated
or linear-wizard workflow remains outside v1.

Source review found showNavButtons in all three Svelte stepper components and
Material/Vuetify counterparts. No direct vertical/orientation option handling
was found in the inspected Svelte Categorization and stepper components; the
neighboring Vuetify components use vertical true. Record this as an option
coverage gap, not a reason to invent another encoding.

Verify visible-category changes preserve a valid active selection and clamp
Previous/Next at visible boundaries, including no visible categories. Flowbite
Stepper keeps a numeric current step while deriving a filtered category list;
review shrinking/reordered visible lists and initial-category integration.
No validation gate should be inferred from completed-step styling.

## Accordion categorization

The spec retains ordinary Categorization as tabs without a tabs variant and
adds options.variant: "accordion" as a project extension. The inspected Svelte
Categorization renderers provide tabs and stepper presentation; expandable
ArrayLayout renderers do not implement this structural Categorization contract.
Add a dedicated accordion renderer/tester with precedence over the generic
Categorization tester. It must work without an array binding or populated data.

The contract keeps exactly one visible Category open, uses the initial Category
name or first visible category, and preserves selection identity across reorder.
Opening another category closes the old one; the active header cannot close the
last open panel. Handle hidden/removed active categories and no visible categories,
preserve descendant data and validation, and provide accessible accordion
headings, keyboard interaction, and expanded-state/panel relationships. Verify
unbound Label content with schema {} as well as bound controls. Do not inherit
array-item options or add a multiple-open mode through this catalog entry.

## Group state and data indicator

The agreed Group contract uses collapsible, effective collapsed with change
synchronization, and showDataIndicator (all default false), without additional
Group variants. Keep showDataIndicator as the runtime name; use Show data presence
indicator as its editor label. All three Svelte Group components use useGroupState.
Its data-presence semantics include hidden Controls and current item paths and
count false/zero while ignoring recursively empty values.

The helper's reactive initiallyCollapsed value and local toggle are consistent
with the revised synchronization model in principle: initialize from the effective
boolean, synchronize on changes, and allow local header toggles between changes.
No distinction between static and dynamic provenance or disabled header toggles
is required. Verify unrelated rerenders and replacement option objects with the
same boolean do not reset local expansion. Changes from either static options or
shared dynamic resolution must synchronize; header clicks never write back.
Review nonboolean configuration diagnostics (the current === true check silently
treats other values as false), undefined/default behavior, and disabling dynamic
resolution. Localize the literal Contains data accessible label. Cover hidden
Controls, array-item paths, accessible expansion, and validation while collapsed.

Sources: packages/jsonforms-svelte/src/lib/groupState.svelte.ts and its tests,
plus all three renderer families' layouts/GroupRenderer.svelte. Vuetify bare
and alignLeft remain renderer-specific options, not portable Group variants.

## Array choices: multi-select and chips

The agreed catalog retains automatic enum-array checkboxes without a checkbox-group
variant. Multi-select and chips are explicit project extensions, not claims of
existing JSON Forms renderer support. The inspected Svelte EnumArrayRenderer
entries implement automatic checkbox selection; dedicated extension selection and
behavior require implementation review/additions.

Implement multi-select for finite unique choices and chips for string arrays,
using schema choices to distinguish finite selection from free token entry.
Preserve values versus labels, duplicate occurrences when uniqueItems is absent,
and invalid incoming data. Check minItems/maxItems handler guards under restrict,
batch changes, item validation, disabled/read-only behavior, and keyboard-accessible
token removal. UI-library chip or combobox components alone do not establish this
renderer contract or tester support.

## Exclusive-choice presentation scope

The portable catalog uses options.format: "radio" for exclusive radio choices
and does not require a dedicated segmented variant. No implementation gap or
new tester is implied solely by the absence of joined-button styling. Any editor
entry for this appearance must depend on an advertised, documented renderer-specific
styling capability; do not assume that a UI-library component establishes a
supported JSON Forms option. Portable visual options may be reconsidered later.

## ImageView sources and shared dynamic resolution

The target retains type ImageView but requires top-level alt and uses top-level
src with scope fallback. The inspected Svelte ImageViewRenderer components and
Vue extension read options.src/options.alt instead. Migrate their contracts and
examples; any legacy-option compatibility is outside the portable spec. Add
Control-style scoped schema/data resolution at the current item path. Defined
src wins, including an empty string; undefined src permits scope fallback.
Diagnose incompatible types and apply URL policy to all source paths.

Dynamic resolution belongs to the shared dispatch/binding layer. Renderers receive
updated effective UI elements without reading $dynamic or tracking provenance.
Verify top-level src/alt updates, static fallbacks, context/item changes, nested
and generated UI schemas, and preservation of local state when renderer selection
is unchanged. Test both sources together, missing/empty values, invalid values,
and data URL policy. The scoped value is displayed without data mutation.

## Monaco: optional diagnostic propagation

The target adds options.propagateErrors (default true). Qualify earlier Monaco
publication requirements by this option. False keeps language diagnostics local
and excludes this editor's summary and pending language analysis from combined
form validity. Preserve schema/host/other-renderer errors. Effective option changes
must clear or restore the editor-owned contribution, including asynchronous results.

String-storage mode must still commit source containing language errors so the
host can collect intentionally invalid code. JSON-value mode must still preserve
invalid drafts locally rather than corrupting committed data; collection of
malformed JSON text requires string/text storage. Verify toggling propagation,
multiple editors, pending/stale diagnostics, and schema errors independently.
This option is separate from restrict and does not disable language services.

## Separator orientation

The agreed portable extension retains type Separator and adds
options.vertical: false (horizontal/default) or true (vertical). Do not add an
orientation alias. No Divider runtime alias
is required. The inspected Svelte SeparatorRenderer entries already select
Separator; the components and Vue extension currently provide horizontal
separation without handling the portable vertical option. Add vertical
presentation and appropriate accessible orientation semantics, accounting for
available height in the parent layout. This is not an interactive splitter and
must not introduce drag handles, resizing, or keyboard focus for resizing.

Sources: the three Svelte families' additional/SeparatorRenderer files and
../jsonforms-vue-renderers/packages/jsonforms-vue-extended-renderers/src/renderers/SeparatorRenderer.vue.

## Spacer intrinsic size

The target uses top-level size (shared Dimension, default 32), independently of
parent layout support. Current Svelte and Vue extension SpacerRenderer components
read options.height as a finite number, clamp negatives to zero, default to 32,
and render fixed vertical height with flex-shrink: 0. Migrate to size, shared
Dimension validation, and intrinsic width inside HorizontalLayout; otherwise use
intrinsic height, including standalone/top-level and unknown parent contexts.
Legacy options.height compatibility is outside the portable authoring contract.

Verify parent options.layout overrides, weighted flexible space, surrounding
gaps, and fallback when the parent does not implement layout hints. Preserve
noninteractive aria-hidden presentation. Do not require a supporting parent
merely to render explicit spacing.

## Button appearance versus navigation

The portable catalog does not require a Button link variant. The inspected
Svelte Button renderers do not interpret that portable variant, and its absence
is not an implementation gap. Link-like command styling may use a documented
renderer-specific option while retaining button interaction, disabled and pending
behavior. Editor styling choices require advertised support. Button remains the
command element; Link with href remains the navigation element.

## Button script execution contract

The spec now matches the existing string-body execution model in all three
Svelte extended ButtonRenderer components and the inspected Vuetify extension:
await new AsyncFunction(script).call(source), where source is the ActionEvent.
No function-expression evaluation or direct function-valued script support is
required. Preserve this binding, top-level await, pending-state cleanup, and
duplicate-activation prevention. Function-expression examples must not be used
as body examples: they construct a function without invoking it.

The inspected handlers execute script strings directly; review enforcement of
the target jsonformsExtended.security.allowScriptEvaluation gate before
compilation/execution, including the disabled default and diagnostic behavior.
Keep named action dispatch separate and preserve the agreed mutually exclusive
action/script contract.

## Object editing and historical property-path limitations

Document and verify the extended object contract: detail dispatch at the current
object path, allowAdditionalPropertiesIfMissing (default false), propertyNames,
patternProperties, schema-valued additionalProperties, and restricted property
counts over all keys. Rename must preserve values atomically, reject collisions,
reselect the applicable value schema, and respect required keys and readonly.
Check overlapping pattern schemas rather than assuming a single match.

The current packages/jsonforms-svelte/src/lib/additionalPropertyName.ts trims
names and rejects dots and square brackets. The character restriction originated
as a JSON Forms core path-addressing limitation; it must be revisited against
the currently used core version, not assumed to remain necessary. This review
has not established that the limitation is fixed. Check literal-key resolution,
update/delete/rename paths, nested object/array dispatch, and error paths against
the installed dependency and candidate upstream core before removing the guard.
Include keys such as a.b, a[b], names with surrounding whitespace, and keys
containing JSON Pointer escape characters. Ensure operations target the exact
key and cannot accidentally modify a nested sibling. Keep this compatibility
constraint outside the portable schema contract; do not remove the runtime guard
without verifying end-to-end addressing.

## Combinator presentation and oneOf preservation

Default target UI: oneOf dropdown plus selected form, anyOf tabs over shared
data, allOf enclosing properties plus sequential branch forms or a registered
combined UI schema. These match the inspected Svelte/Vuetify presentation patterns.
The inspected Vuetify oneOf tab variant is family-specific, not a portable addition.

Svelte OneOfRenderer initializes a new branch with createDefaultValue and restores
values for properties declared alongside oneOf in the enclosing schema. The
inspected MaterialOneOfRenderer replaces the scoped value with generated defaults
without this enclosing-property preservation; record this as a behavior difference,
not the target policy. Verify all Svelte families preserve outer properties,
confirm destructive changes, cancel without mutation, and never reset data during
mount/remount or initial branch selection. Check no-match and multiple-match data,
external data changes, same-branch selection, and readonly handler guards.

AnyOf tab navigation must not clear the shared value. AllOf forms must address
the same data path without dropping overlapping constraints. Defaults are explicit
initialization behavior on confirmed oneOf changes, not proof of schema validity.
Sources: Svelte complex/{OneOf,AnyOf,AllOf}Renderer components, neighboring
jsonforms/packages/vue-vuetify/src/complex counterparts, and
jsonforms/packages/material-renderers/src/complex/MaterialOneOfRenderer.tsx.

## Shared clear affordance and oneOf deselection

The target makes editable value controls clearable by default via options.clearable.
Review all renderer families, including string, integer/number, temporal, choices,
and oneOf, for consistent X visibility: only with a clearable value/selection and
focus-within or pointer hover. Check false/zero, empty branch forms, disabled and
readonly states, keyboard focus entering the clear button, localized accessible
names, and opt-out. Required fields remain clearable with normal validation.

OneOf clearing must leave no selected branch and must not automatically select
another branch or generate its defaults. Preserve enclosing properties, confirm
before discarding branch data, and keep cancellation nonmutating. Distinguish
selection presence from remaining enclosing data when hiding the clear icon.
Verify reset/default infrastructure and reactive fitting-schema selection do not
undo explicit clearing. No runtime behavior was changed by this documentation.

## Mixed renderer: delegation and deep-structure workspace

The target documents type selection without routine type-change confirmation,
primitive input alignment, and a searchable tree/detail splitter for complex
values. Primitive tree leaves are hidden by default and can be toggled. Nested
complex View actions synchronize tree selection with the right panel, which
exposes a full-width type selector above the delegated form (root duplication
may be omitted). These are library-independent contracts.

Review schemaUtils/createMixedRenderInfos and jsonTypeUtils/cleanSchema: preserve
caller schemas while narrowing type, retain applicable constraints and reference
context, support compatible defaults (including integer defaults under number),
and avoid broadening constrained/false item schemas. Verify per-type detail
options, enclosing-schema substitution, and effective-UI dispatch.

Audit tree path handling, all matching pattern schemas, required-key guards,
readonly handlers, minProperties/minItems on deletion, max bounds on insertion,
and rename parity with additional-property validation. Current helper paths and
schema lookup shortcuts need the same core literal-key review as additional
properties. Verify focus-accessible actions, search/primitive toggles, nonempty
container deletion confirmation, aligned primitive editors, null versus absence,
and selected-node reconciliation after structural/external changes.

Sources: renderer-family complex/MixedRenderer components and util/schemaUtils,
jsonTypeUtils, and treeBuilder helpers. Do not infer portable component props or
fixed splitter percentages from implementation defaults.

## Additional-property interactions and key-preserving clearing

Svelte and the inspected Vuetify integration already expose dynamic-property
context and determineClearValue(defaultValue), which returns the supplied clear
value in dynamic context and undefined otherwise. AdditionalProperties sets the
context true; ObjectRenderer resets it for declared children. Preserve and audit
this distinction across ordinary input conversion and clear-button handlers, not
only StringRenderer. Empty strings must remain stored as key: "" so data-derived
rows do not disappear. Prefer centralized context-aware conversion; require all
delegated renderers to honor it until centralization is complete. This is runtime
context, not $dynamic or an authored option.

The inspected Svelte rename dialog validates on submit and its submit button has
no error-dependent disabled binding. The target requires live name validation,
visible errors, and disabled submission while invalid, plus handler revalidation.
The inspected Vuetify component has a different rename UI; align behavior with the
dialog contract independently of component library. Audit Add/Delete/Rename handler
guards as well as disabled buttons for restrict, readonly, required and name rules.

Test loaded and newly added properties, typing a string to empty, clear X, JSON
serialization retaining the key, explicit Delete removing it, and nested declared
properties not accidentally inheriting key-preservation semantics. Review each
non-string clear value explicitly; do not assume a helper argument named
"defaultValue" is a schema default or universally appropriate empty value.
Sources: family util/composition and inject helpers, AdditionalProperties and
ObjectRenderer components, and delegated control conversions in Svelte/Vuetify.

## Expandable array-item layout and options

The spec now defines the toolbar, item header/actions, delegated panel content,
empty state, and option defaults independently of UI-library components. Verify
all families against initCollapsed/collapseNewItems, elementLabelProp, detail,
showSortButtons, hideAvatar, hideArraySummaryValidation, and restrict. Existing
childLabelProp is a compatibility spelling in inspected Svelte helpers; the
portable entry uses elementLabelProp, without introducing another authoring alias.

Current array components track expansion with index-derived keys. Review preservation
of logical item expansion during reordering/deletion and targeting a pending deletion
after external array changes. Audit readonly and restriction guards in handlers,
not just disabled buttons. Verify new-item expansion after dispatch timing,
keyboard-accessible actions separate from disclosure, and item-error visibility
when hideAvatar is true. Renderer-specific multiple-open props do not change the
portable default: at most one open panel, with all panels allowed closed.
Sources: Svelte layouts/ArrayLayoutRenderer components and shared array bindings,
and neighboring jsonforms/packages/vue-vuetify/src/layouts/ArrayLayoutRenderer.vue.

## ListWithDetail selection and mutation behavior

The target adds auto-selection after Add and deletion confirmation consistent
with expandable arrays. Inspected Svelte/Vuetify handlers append without selecting
and remove immediately. Index-based selection must preserve the logical item
through reorder/deletion, clear when the selected item is deleted, and reconcile
external changes. Verify original-path detail dispatch, keyboard navigation,
readonly/restrict handler guards, and pending deletion targets. The shared
confirmation configuration is under review; do not assume an upstream option
exists merely because renderers implement dialogs.

## Shared configurable confirmation policy

The agreed project contract adds config.jsonformsExtended.confirmation.default and
config.jsonformsExtended.confirmation.renderers[catalogId][operation], overridden by element
options.confirmation[operation]. Policies are always/never/complex; operations
are typeChange/branchChange/delete. This supersedes earlier unconditional dialog
requirements and the earlier no-confirmation mixed-type target: mixed typeChange
now falls back to complex, other covered operations to always. Explicit global
configuration takes precedence over those fallbacks.

No shared option was found in the inspected Material/Vuetify/Svelte sources.
Material oneOf confirms existing non-undefined data; its table deletion opens a
dialog, while expandable-array and ListWithDetail removal invoke deletion directly.
disableRemove prevents mutation and is not confirmation configuration. Implement
a shared resolver rather than different per-family option names. Verify local,
per-renderer, and global precedence; old-value complex classification; preserved
outer properties; batch confirmation; cancellation; stale targets; readonly and
restrict rechecks. Dynamic-property clearing must still preserve the key.

## Array disableAdd / disableRemove coverage

The target adopts existing Material disableAdd/disableRemove option names for
array tables, expandable arrays, ListWithDetail, and AG Grid. Both default false;
per-element options override global config.disableAdd/config.disableRemove.
Preserve independent core, readonly/disabled, and restrict-based prohibitions.
Do not move these established config names under jsonformsExtended.

MaterialArrayLayout, MaterialTableControl, and MaterialListWithDetailRenderer
merge config/UI options and combine them with core-derived action restrictions.
The inspected Svelte/Vuetify array paths did not establish equivalent explicit
option coverage; audit all families and add missing guards. Check alternate
keyboard/menu/paste/batch insertion and deletion paths, not merely buttons.
Existing-item editing and reorder remain separate capabilities. Review pending
confirmation guards when options change before the user confirms.

## Numeric entry, stepping, and bounds

The target uses options.step then schema.multipleOf then 0.1/1, with integer-safe
increment handling. Shadcn and Skeleton number/integer inputs use this order
but copy fractional multipleOf directly; review the integer fallback and explicit
step validation. Flowbite number/integer inputs now use the same stepping precedence and resolved
schema bounds, covered by the same browser regression cases. Inspected Vuetify uses options.step then 0.1/1; Material inputs
start with 0.1/1. Do not claim identical existing option coverage.

Audit typed/pasted commits and step handlers for restrict and inclusive/exclusive
bounds; native input min/max alone do not enforce this contract. Verify incomplete
local drafts, fractional integer input without truncation, decimal arithmetic,
invalid incoming values, and dynamic-property clearing. Native step base must not
replace JSON Schema multipleOf semantics. Keep Vuetify precision renderer-specific
until display versus committed rounding is explicitly specified.

## Multiline rows and resizing; excluded trim sizing

The portable contract excludes trim: width is controlled by common layout sizing.
Inspected Material uses trim as a compact-width hint, and the Vuetify textarea
uses it with maxLength for size; it is not whitespace normalization or auto-grow.
Keep this upstream comparison separate from the target authoring contract.

For multi: true string controls, implement rows (positive integer, default 3)
and resizable (boolean, default true) consistently across families. Current
component-specific prop forwarding does not establish portable support. False
prevents manual textarea resizing while allowing overflow scrolling; true allows
vertical resizing where supported, within layout bounds. Explicit layout height
constraints override initial row sizing. Automatic growth is not required.
Verify multiline whitespace preservation, maxLength/restrict, accessible labels
and errors outside the row count, and dynamic-property empty-string retention.

## Shared description and required-marker presentation

The spec records existing showUnfocusedDescription and hideRequiredAsterisk
options, both default false, with per-control overrides over global config.
Inspected Svelte/Vuetify helpers and Material controls use these conventions.
Audit wrappers for simultaneous description/error presentation and accessible
required-state information when the visual asterisk is hidden. Ensure wrapper
suppression preserves accessible naming and help/error associations. No new
label: false requirement was agreed; leave that topic for separate review.

## Password reveal/hide interaction

The target requires an initially obscured password control with a localized,
keyboard-accessible Show password / Hide password action. Inspected Svelte and
Vuetify password controls already provide a local reveal toggle. The inspected
Material text input uses password masking without the equivalent built-in toggle;
record this as a target interaction difference, not a universal upstream feature.

Verify toggling does not dispatch value changes, change validity, or mark data
dirty, and reveal state remains local. Keep clear and reveal actions distinct,
audit accessible names/localization, and retain normal string constraints and
dynamic-property empty-string preservation. No reveal-disable option is required.

## Boolean values, missing state, and required semantics

The target distinguishes true, false, and missing data without writing a value
on mount. Inspect checkbox indeterminate behavior and provide an accessible Not
set indication for switches without a third visual state. Svelte/Material paths
using !!data can show invalid truthy values such as "false" as checked; replace
that interpretation without silently converting the input data. Some inspected
checkbox/Vuetify paths expose undefined as indeterminate, whereas switch support
varies. Keep JSON null distinct and subject to schema applicability.

Verify explicit boolean commits, shared clear affordances for false, dynamic-key
preservation, readonly, and accessible state/error information. Audit native
required attributes: HTML checkbox required must not turn JSON Schema presence
requirements into true-only validation. Cover required false as valid, missing
required data as invalid, and explicitly required const true as agreement.
No runtime implementation change accompanies this documentation.

## Radio orientation and interaction coverage

The target uses options.vertical false/default for a horizontal wrapping group,
true for vertical stacking, with one group label and individually labelled radios.
Inspected Svelte radio components explicitly handle vertical; the inspected Vuetify
radio controls delegate orientation to component defaults/props rather than reading
this portable option. Audit Material and all families for target orientation,
keyboard behavior, group labelling, shared clear support, and initial no-selection
behavior. Radio format takes precedence over autocomplete presentation hints.

Preserve schema order and typed values; avoid String(value) identity collisions
or mapping missing/null data onto an empty-string choice. Activating a selected
radio retains its selection; clearing uses the dedicated shared action. These
requirements supplement the existing choice-identity review.

## Slider value display and valid positions

The target preserves the existing multipleOf-or-1 slider increment and range
tester, while requiring explicit missing/invalid display semantics. Material's
Number(data || schema.default) can replace valid zero; inspected Svelte conversion
can turn null/empty strings into zero. Avoid truthiness and indiscriminate Number
conversion. Verify no mount/default write, accessible Not set display, explicit
clear support, and preservation of invalid incoming values/dynamic keys.

Audit native step offsets: minimum 1 with multipleOf 2 must yield valid positions
2, 4, 6, not 1, 3, 5. Cover integer schemas with fractional multipleOf, exclusive
bounds, impossible ranges, keyboard operations, and schema bounds distinct from
first/last selectable values. UI options.step is not automatically inherited from
the numeric text-input contract. No runtime implementation was changed here.

## Shared table-cell behavioral parity

The target requires cells to preserve control conversion, validation, restriction,
readonly, clearing, and specialized-selection semantics without prescribing
component reuse. Svelte SpecializedCells.entries and DispatchRendererCell already
delegate several control testers/renderers through compact wrappers. Audit all
families and extended-grid paths for effective-option/dynamic resolution, root
schema context, and original row/property paths after sorting/filtering.

Verify password masking and other specialized behavior, dynamic-key clear values,
accessible column/row identification, per-cell errors independent of array summary,
and popup/dialog keyboard focus return. Current compact wrappers suppress ordinary
control chrome, so error/name association needs explicit review. This does not
introduce a general label: false requirement. Check missing specialized cell
registrations and document compatible fallbacks rather than silently using a
plain text editor with different value semantics.

## Read-only sources, precedence, and demo wiring

Preserve the existing distinction: component readonly true is the form-wide lock;
config readonly/readOnly remains an overridable default. The proposed change to
make config true unconditional was withdrawn and is not an implementation target.
Both UI-option spellings are resolved by core; schema uses readOnly only. Audit
renderer handling separately from name recognition and precedence.

The Svelte demo Settings switch updates appStore.jsonforms.readonly.value, stored
through the read-only history-hash setting. Example pages copy it to
jsonFormsProps.readonly and pass that property to native or web-component forms.
The extended JsonForms component forwards readonly; the base component updates
formReadonly and exposes it through form context. Config, UI options, and schema
annotations are not rewritten. Inspected Vuetify demos follow the same component-
property pattern; shared JSON Forms array examples toggle top-level props.readonly.

Check separateReadonlyFromDisabled compatibility against the core version and
renderer family. Svelte helpers and Vuetify controls support separate readonly
paths; Material often consumes enabled as disabled presentation. Verify nested
forms/cells, direct mutation handlers, and pending dialogs rather than assuming
recognition of both spellings guarantees full behavior parity. No unconditional
config lock or component-property removal is required.

## Rule effects and version-specific read-only support

The inspected installed core and neighboring checkout include READONLY/WRITABLE
alongside SHOW/HIDE/ENABLE/DISABLE. Verify the supported core version exposes
these effects and the shared read-only mapper; do not implement alternate rule
semantics in individual renderers. READONLY/WRITABLE explicitly determine both
true and false condition outcomes, ahead of element/config/schema readonly
sources, while the component-level readonly true takes precedence.

Cover undefined condition values with and without failWhenUndefined, nested
scope resolution, global readonly, separate enabled/readonly state, and hidden
controls retaining data and schema validation. AdditionalErrors and pending
editor diagnostics are not inputs to ordinary schema conditions; combined-validity
command guards need the separate integration contract.

## Rule scope and current-form schema alias

Documented the existing extended Vuetify example: condition.scope #/ selects the
current data context, while condition.schema.$ref /# resolves the registered form
schema. Root-level ENABLE buttons can reuse that schema without duplication;
nested contexts still select item data, not automatically fullData. Preserve core
scope composition and re-evaluate paths after reorder.

The Vue extension useResolvedJsonForms.ts registers a copy with schema ID /,
removes the prior alias, and watches schema/validator changes. Review initial
registration timing, original ID/reference-base preservation, external references,
and isolation for multiple forms sharing Ajv before reproducing this contract.
Audit Svelte native and web-component paths for equivalent alias availability;
do not assume example syntax alone establishes support. AdditionalErrors and
pending language diagnostics remain outside this schema-only condition.
Sources: ../jsonforms-vue-renderers/packages/jsonforms-vue-extended-renderers/src/webcomponent/useResolvedJsonForms.ts
and ../jsonforms-vue-renderers/apps/jsonforms-vue-vuetify-demo/src/examples/button/uischema.json.

## Function rules, cached validity, and schema fragments

Core ValidateFunctionContext exposes data/fullData/path/uischemaElement/config,
not errors/additionalErrors. The TypeScript example uses a host-owned closure over
current validation state, not invented core context fields. Verify reevaluation
when errors, pending state, or validation configuration changes without a data
edit; merely reading a closure is insufficient. No new VALIDATION condition type
is part of the target. Portable schema rules retain /# and fragment references;
these reuse schema definitions rather than guaranteeing cached validation results.

Svelte core/uischemas.ts and Vue util/uischema.ts adapt validate strings using
new Function and a complete function expression, passing config alongside the
core context. Audit enforcement of allowScriptEvaluation before compilation and
execution, sync boolean results, unsupported/error handling for both rule
polarities, and stale config captures. The inspected adapters returning false on
errors alone may activate inverse effects; do not assume false is universally a
safe fallback. Review nested/composed conditions and generated detail UI coverage.

## Function-context compatibility history and future extension

Config is now part of the inspected core ValidateFunctionContext. The Svelte/Vue
adapters' explicit config injection reflects compatibility history, not a distinct
project-only callback capability. Current adapters intentionally preserve the core
context shape and do not inject errors/additionalErrors. The richer FormContext
has those fields but is not automatically passed to condition.validate.

Validation-state injection through the existing adapter remains a possible future
extension without core changes, not a current implementation requirement. If later
adopted, define a read-only snapshot, freshness/pending semantics, and subscriptions
that reevaluate rules on error-only changes; cover direct functions as well as
serialized adapters. Until then retain schema $ref conditions and host-owned
TypeScript callbacks. Do not add new callback fields solely from this note.

## Shared detail selection and GENERATE

The spec records core findUISchema behavior: inline detail first; detail GENERATE
forces fallback generation without consulting the registry; otherwise choose the
highest-ranked applicable registered UI schema, then generate if none matches.
Audit object, array-layout, ListWithDetail, and mixed delegation paths for correct
schema/path/root context and consistent effective-UI dispatch. Verify GENERATE
bypasses a matching registered entry and does not write defaults on render.
Composite cells have a separate detail contract; do not infer support for the
GENERATE string there without an explicit decision.
Source: neighboring jsonforms/packages/core/src/reducers/reducers.ts and
reducers/uischemas.ts, plus renderer call sites using findUISchema.

## Template registry, slots, and engine profiles

The spec now covers structural Template/Slot and technology-specific TemplateLayout,
replacing the broad Template deferral. Svelte TemplateRenderer and Vue shared
resolveTemplateUISchema use first matching uischema.name without tester ranking.
Slot resolves inherited/local content with first-child fallback, not the registry.
Registry normalization still requires function/string testers; verify named-only
entries using NOT_APPLICABLE and avoid executing tester strings unnecessarily.

Both default web TemplateLayout paths use Ractive; Vue additionally offers lang vue.
Check defaultTemplateLang, unknown-language diagnostics, named/indexed child slots,
context and core-error bindings, reactive refresh, and resource cleanup. Review
missing/duplicate names and recursive references for diagnostics. Ractive partial
placeholders and Vue compiler slots are distinct from structural Slot elements.

Audit executable-template trust/security gating, two-way bindings and mutation
paths, readonly/restrict, repeated slot instances, and context/error updates.
RactiveTemplateController currently enables twoway; that alone does not establish
compliant form writes. Do not claim Ractive is native-portable or Vue syntax works
in non-Vue web renderer sets. No new Kotlin engine is implied.
Sources: Svelte extended layouts/TemplateRenderer, SlotRenderer, TemplateLayoutRenderer,
core/ractiveTemplateController and uischemas; Vue shared core/template and Vuetify
extended TemplateLayout/VueTemplateLayout renderer entries.

## UI-schema registry tester signature and serialized inputs

Documented the core (schema, schemaPath, path) signature, highest-rank/first-tie
selection, and NOT_APPLICABLE. Verify adapters enforce finite nonnegative ranks
or -1, synchronous results, and diagnostic/nonapplicable handling for invalid
inputs. Inspected adapters test typeof number, which alone admits NaN/infinity.
Core selection may invoke a tester multiple times; avoid side effects.

Both Svelte and Vue adapters compile complete tester function expressions with
NOT_APPLICABLE available. Audit allowScriptEvaluation and CSP handling before
compilation/execution, including named-only template registrations that should
not execute testers during lookup. Native direct tester registration does not
imply JavaScript-string support. Sources: extended core/uischemas.ts, Vue shared
util/uischema.ts, and core reducers/uischemas.ts.

## Validation modes versus rules and cached validity

The spec records ValidateAndShow, ValidateAndHide, and NoValidation separately
from additional-error publication, rule evaluation, and restrict. Core error
selectors retain additionalErrors under ValidateAndHide; NoValidation bypasses
automatic form validation, while runtime schema conditions still call Ajv.

Verify mode changes update controls and host validity consumers without a data
edit. Cached validity must not classify NoValidation's empty errors array as
proof of schema success, and hidden errors must remain available to validity
consumers under ValidateAndHide. Check Monaco propagation/pending state and host
additionalErrors independently. Preserve restriction and readonly/action guards
regardless of validationMode. Sources: core reducers/core.ts,
store/jsonFormsCore.ts, and util/runtime.ts.

## Extended validator defaults and rule-mutation isolation

Documented Ajv defaults: core allErrors true, verbose true, strict false,
addUsedSchema false; extended useDefaults true, $data true, discriminator true.
Sources: Svelte extended core/validate.ts; Vue shared core/validate.ts; Vuetify
extended core/index.ts (its factory builds on the Vuetify validator); core
util/validator.ts. Inventory plugin/custom format and keyword coverage separately.
These settings are validator-specific, not jsonforms.config options.

Retain the existing extended default-assignment behavior. Review clearing a
property with a schema default, empty-string retention, root versus nested
assignment, combinator/discriminator limitations, and state/change notifications.
Rule conditions currently share the supplied Ajv and can validate live scoped
objects; isolate their evaluation from useDefaults, transform/dynamic-default
keywords, and any host-enabled mutation features. Verify /# reference registration
and other validator capabilities remain available in the isolated rule path.
Other UI technologies should use equivalent validator capabilities/defaults where
possible and report unsupported behavior rather than silently claiming parity.

## Optional mutating validator keywords and computed-default providers

The extended Svelte and shared Vue validator integrations register ajv-keywords,
replace transform with the project implementation (including capitalize and
startCase), and register custom dynamicDefaults providers. These are optional
schema extensions enabled by validator setup, not renderer options or portable
JSON Schema guarantees. Keep their capability inventory separate from the UI
model; preserve the distinction from the excluded renderer sizing option trim.

The custom date, time, datetime, dateUnit, and searchParams providers compute
values when their provider factory is called, then return a closure holding the
result. Review that timing against schema compilation/caching and subsequent
initializations before promising a fresh current time or URL parameter value for
every new value. searchParams directly reads window.location; document the
browser dependency and handling in environments without window. These findings
do not establish a new portable timing contract.

The dynamic provider constructs a function from args.func with new Function and
invokes it from the returned closure. No allowScriptEvaluation check is present
in that provider. Ensure the existing security policy is enforced before both
compilation and execution, including when these keywords arrive through a schema
rather than a UI element. Record unsupported execution or compilation failures
through appropriate diagnostics. This is an implementation gap against the
agreed policy, not a new permission or UI-model option.

Review transform/computed-default mutation through ordinary form validation and
rule evaluation together with the isolation requirements above. Confirm form
state and change notifications reflect permitted normalization. No runtime
changes are made by this documentation update.

Sources: Svelte extended src/lib/core/keywords.ts, transform.ts, and
dynamicDefaults.ts; Vue shared extended src/core/keywords.ts, transform.ts, and
dynamicDefaults.ts.

## Error-message precedence and locale refresh

The spec records the existing core combined error.custom override, per-error
field/keyword translations, message translation, and fallback behavior. Verify
all renderer sets use the mapped control errors consistently, including compact
cells and renderer-generated additionalErrors. A translated message must not
remove underlying errors or change validity.

Both extended Svelte and shared Vue adapters localize validator errors, leave
ajv-errors wrapper messages out of generic localization, and unwrap those
wrappers onto the original errors with the custom message translated through
error.errorMessage.<message>. Core translations may subsequently override that
text. Check multiple underlying errors assigned the same message: review repeated
visible messages without dropping structured errors or changing their paths.
This is separate from Monaco's agreed single additionalError summary.

Audit locale changes with unchanged data, including errors whose messages were
already localized during validation, errorMessage translations, and owned
renderer additionalErrors. Confirm readable fallbacks for missing translations
and unsupported locales. Additional errors do not automatically run through the
Ajv localization wrapper; their producers and presentation adapters must support
refresh without stale translated summaries. Avoid unnecessary live-data
revalidation solely to translate messages, especially with mutating keywords.

Sources: JSON Forms core src/i18n/i18nUtil.ts, mappers/renderer.ts, and
store/jsonFormsCore.ts; Svelte extended src/lib/core/ajv-i18n/index.ts and
core/validate.ts; Vue shared extended src/i18n/ajv-i18n/index.ts.

## Choice-label translation and locale refresh

The catalog now records the existing core enum/oneOf label helpers: enum labels
use the control prefix plus the value's textual representation; named choices
prefer an exact branch i18n key, otherwise prefix plus title (or constant text).
Multi-choice mapping uses the same helpers with the array control's prefix.
These are existing JSON Forms conventions, not new portable UI options.

Verify single-choice, radio, searchable-choice, and supported multi-choice
renderers refresh both available and selected labels on locale changes without
a data edit. Check fallback titles, missing translations, explicit branch keys,
and array item choices. Keep duplicate translated labels as separate choices;
translation must not change stored values or selection. Exercise this together
with the existing typed-value identity review rather than using labels or
translation keys as widget identifiers. Declaring core mapper support does not
establish complete reactive coverage in each renderer family.

Sources: JSON Forms core src/mappers/renderer.ts (enumToEnumOptionMapper,
oneOfToEnumOptionMapper, and enum/oneOf/multi-enum state mappers) and
src/i18n/i18nUtil.ts; Svelte Flowbite and Shadcn EnumControlRenderer and
OneOfEnumControlRenderer; official Vuetify enum controls consume control.options.

## Schema-aware array item labels

The shared catalog contract now requires enum/named-choice display labels for
array item headings and ListWithDetail entries selected through elementLabelProp.
Material uses core computeChildLabel, which resolves the label property's schema
and maps enum or constant-based oneOf values through the choice-label helpers.
The inspected Svelte family childLabelForIndex helpers instead resolve the data
value and convert it directly to text. The inspected official Vuetify helper
also converts directly to text and reads childLabelProp; Svelte accepts
elementLabelProp with childLabelProp as a compatibility fallback. Keep the
contract's existing elementLabelProp authoring name.

Align schema resolution, choice translation, and readable fallback behavior.
Core computeChildLabel can return an empty label; the renderer must provide the
agreed readable fallback where appropriate. Preserve 0/false, update labels on
property edits and locale changes, and preserve item selection/expansion through
those updates. Review nested dotted paths and referenced property schemas;
literal dotted/bracketed property-name support remains a separate core-path
audit. Do not translate arbitrary data strings or use labels as item identifiers.

Sources: JSON Forms core src/mappers/renderer.ts (computeChildLabel), Material
layouts/ExpandPanelRenderer.tsx and additional/MaterialListWithDetailRenderer.tsx;
Svelte Flowbite, Shadcn, and Skeleton util/composition.svelte.ts; official
Vuetify src/util/composition.ts (childLabelForIndex).

## Renderer reference resolution versus validator resolution

The spec now separates renderer schema lookup from validator reference support,
with a local referenced date-schema example. Audit referenced versus inline
schemas for equivalent renderer eligibility and supported behavior, including
formats and bounds. Confirm nested object/array/detail/cell dispatch retains
root-schema context and the original scoped data path.

The inspected core resolver follows references and falls back to lookup on the
schema itself when needed. This is not evidence of complete $ref sibling-keyword
handling for every dialect. Its combinator/conditional fallback searches for a
resolvable path; it does not determine the active branch or merge all applicable
constraints. Review conflicting or additional constraints before assuming the
resolved editing schema captures whole-form validation semantics.

Check external schemas registered only with Ajv versus schemas available to
renderer resolution, nested reference bases/IDs, supported anchors, chained
references, and recursive schemas. Core has a resolution-cycle guard, but this
alone does not establish safe recursive form generation or nested dispatch.
Verify unresolved/cyclic unsupported cases produce diagnostics without data
mutation or silently falling back to unconstrained editing. Keep supported
reference forms and dialects explicit per integration.

Sources: JSON Forms core src/util/resolvers.ts and src/testers/testers.ts;
Svelte src/lib/components/DispatchRenderer.svelte passes rootSchema in tester
context. Validator schema registration is a separate path from these helpers.

## Array initialization versus item validity

The spec now documents explicit Add initialization separately from Ajv useDefaults,
including primitive placeholders, collected object property defaults, and current
temporal values selected by schema format. Svelte, Material, and Vuetify array
layouts call the core createDefaultValue helper. Adding an incomplete item remains
permitted when structural/action guards allow it; full item validity is not an
Add prerequisite. Subsequent editing still follows restrict.

Review explicit defaults that violate their schemas, numeric zero outside bounds,
and current temporal defaults outside permitted ranges. Verify UI-only temporal
selection does not accidentally imply schema-format initialization. Check nested
object/array defaults are copied independently for each item and initialization
is not repeated merely on rendering or locale changes. Distinguish subsequent
validator mutation from renderer initialization.

Audit combinator initialization and unsupported schema shapes. The inspected
core helper takes the first usable combinator initialization result and its
public wrapper falls back to {} if no value can be determined; neither behavior
establishes whole-schema validity. Do not advertise generic constraint-solving or
complete recursive default extraction. Check required-property errors on newly
added incomplete objects, structural maxItems/action guards, and correction of
invalid initial values through restricted controls.

Sources: JSON Forms core src/mappers/renderer.ts (createDefaultValue,
doCreateDefaultValue, extractDefaults); Svelte Flowbite
layouts/ArrayLayoutRenderer.svelte; Material layouts/MaterialArrayLayout.tsx;
Vuetify layouts/ArrayLayoutRenderer.vue.

## Required-state inference versus validation and clearing

The spec distinguishes JSON Schema required presence, the core required flag,
visual/accessibility presentation, and clearing. The inspected core isRequired
helper resolves the containing schema from the control scope and checks its
required array. It does not independently evaluate all conditional/composed
requirements. Audit references, nested object/item controls, allOf requirements,
and active if/then/else or branch requirements before claiming complete marker
coverage. The documented conditional example deliberately requires the switch
property within if so its absence does not activate then.

Verify actual schema errors are presented even when marker inference is limited.
Keep hideRequiredAsterisk separate from validation and accessible required state;
review native input required behavior against JSON Schema presence semantics.
Do not introduce UI required as a parallel validation source. Test ordinary
required-control clearing separately from dynamic string clearing: the latter
retains key: "", while explicit Delete/Rename must obey applicable required-key
restrictions under restrict. Conditional required-key protection needs its own
coverage review; the marker flag alone is not proof of all applicable constraints.

Sources: JSON Forms core src/mappers/renderer.ts (isRequired and
mapStateToControlProps); Svelte Flowbite/Shadcn StringControlRenderer and official
Vuetify StringControlRenderer pass the mapped required state to their inputs.

## Conditional validation versus generated presentation

The spec now includes a paired if/then schema and explicit SHOW-rule example.
The inspected core UI generator traverses declared properties and delegates
combinators; it does not translate conditional/dependency validation into
SHOW/HIDE rules. Keep validator support separate from automatic UI-generation
and scoped-schema-resolution capabilities.

Audit properties declared only in then/else or dependency schemas, including
nested objects and array item detail generation. Determine when explicit UI
schemas can resolve those scopes and when generated UI omits them. Do not infer
active-branch semantics from the resolver's fallback search or claim complete
conditional generation from successful validator compilation.

Verify the paired example for true, false, and missing contactByEmail. Hiding
email must preserve its existing data; an empty email still fails the separately
declared minLength constraint while hidden. Check error aggregation/host validity
retain such failures and document a usable error-resolution path without silently
clearing hidden data. Conditional required-marker coverage remains the separate
audit above. No automatic conditional-layout option is introduced.

Sources: JSON Forms core src/generators/uischema.ts, src/util/resolvers.ts, and
src/util/runtime.ts; shared rule/visibility mappings in src/mappers/renderer.ts.

## Container visibility and empty categories

The spec now distinguishes an element's own visibility from descendant visibility.
Core isVisible evaluates the element's rule rather than recursively testing whether
its children are visible. Material filters categories through that helper;
Svelte and Vuetify category renderers filter mapped category visibility. Preserve
this convention instead of automatically hiding containers with no visible fields.

Verify a child-only SHOW rule leaves its Category available when the child hides,
while the same rule on Category suppresses its entire panel/navigation entry.
Check Groups retain their own permitted presentation and hidden immediate children
leave no gaps or sizing allocation. Categorization containing presentation-only
elements must not depend on the presence of data-bound controls.

Audit selected-category fallback when visibility changes for tabs, stepper, and
accordion, including no visible categories, later reappearance, and a visible but
empty category. Avoid stale active panels or navigation targets. Visibility and
selection updates must not clear data or remove validation failures. No
hideWhenEmpty option is introduced.

Sources: JSON Forms core src/util/runtime.ts (isVisible) and layout mappings;
Material layouts/MaterialCategorizationLayout.tsx; Svelte Shadcn
layouts/CategorizationRenderer.svelte and CategorizationStepperRenderer.svelte;
Vuetify layouts/CategorizationRenderer.vue.

## Existing focus option and renderer coverage

The spec identifies options.focus as an existing JSON Forms renderer convention,
not a new extension or a core-managed universal focus mechanism. It defines a
false default and an initial focus request, distinct from a repeated or imperative
focus command. Verify support per renderer instead of inferring it from shared
option merging.

Inspected Flowbite string, number, enum, and named-choice controls forward focus
to widget autofocus. Shadcn string/number controls do likewise, but the inspected
Shadcn EnumControlRenderer and OneOfEnumControlRenderer do not explicitly forward
the shared focus option to their select trigger. Material and Vuetify use widget
autofocus properties in many controls; their coverage is renderer-specific.

Audit initial mounting, hidden/disabled controls, readonly-but-focusable inputs,
category/panel activation, new array items, and actual remounts. Ordinary updates
must not repeatedly steal focus, and the option must not navigate into hidden
containers or open pickers/dialogs. Check effective $dynamic.options.focus updates
without treating them as an imperative focus API. Multiple requests have no
portable winner; preserve independent dialog focus and focus-return behavior.

Sources: Svelte Flowbite/Shadcn controls/StringControlRenderer,
NumberControlRenderer, EnumControlRenderer, and OneOfEnumControlRenderer;
Material mui-controls/MuiInputText.tsx, MuiInputNumber.tsx, and MuiSelect.tsx;
Vuetify controls/StringControlRenderer.vue and EnumControlRenderer.vue.

## Placeholder support and fallback localization

The spec now defines options.placeholder as a renderer convention with explicit
per-renderer coverage, rather than a core-managed universal feature. Inspected
Svelte and Vuetify controls commonly pass the option directly to widgets;
temporal controls commonly use placeholder ?? effectiveDisplayFormat. No explicit
placeholder handling was found in the inspected Material renderer source; verify
coverage rather than claiming equivalent support based on option merging alone.

Audit explicit empty-string suppression of fallback hints, meaningful input or
empty-selection presentation, and independence from stored values, defaults,
parsing, and masking. Forwarding placeholder to a checkbox or another widget
without hint presentation does not prove useful support. Preserve accessible
labels and persistent instructions independently of placeholder visibility.

Shadcn EnumControlRenderer and OneOfEnumControlRenderer use the literal fallback
"Select an option". Review localization and locale refresh for that prompt.
The inspected controls pass authored placeholder text directly; do not invent an
implicit control-i18n placeholder key convention. Verify host-localized text and
effective $dynamic.options.placeholder updates without changing data, selection,
or focus. The masked-input fallback difference is recorded separately above.

Sources: Svelte Flowbite/Shadcn controls/StringControlRenderer,
EnumControlRenderer, OneOfEnumControlRenderer, and temporal renderers;
Vuetify controls/StringControlRenderer.vue and temporal renderers; inspected
Material src renderer sources, including mui-controls/MuiInputText.tsx.

## Applied-option merging versus tester selection

The spec now centralizes the distinction between global renderer defaults, local
UI options, and registry selection. Inspected Svelte and Vuetify composition
helpers and Material controls use Lodash merge with config followed by local
options. Core optionIs reads UI-schema options; config is separately available
in tester context. Do not infer config-driven selection from applied-option
support. Review multi/format/variant selection paths without changing their
canonical UI-schema encodings.

Verify explicit false, zero, and empty-string overrides for options that accept
those values, and ensure merging leaves source objects unchanged. Audit nested
objects and arrays: Lodash's index-based array merging can retain global entries
when a local array is shorter or empty. This is especially relevant to the agreed
agGridOptions contract, which requires whole-array replacement. Record policies
per structured option instead of silently imposing a new global merge algorithm.

Keep readonly and namespaced confirmation precedence separate, and do not move
validator construction settings into renderer config. Check effective UI-schema
options after generic $dynamic processing reach testers and renderers as required,
without claiming unsupported dynamic targets or implicit config selection.

Sources: Svelte Shadcn src/lib/util/composition.svelte.ts; Vuetify
src/util/composition.ts; Material src/controls/MaterialInputControl.tsx;
JSON Forms core src/testers/testers.ts (optionIs and TesterContext).

## Pre-touch error filtering and summary consistency

The spec adopts the existing enableFilterErrorsBeforeTouch and
filterErrorKeywordsBeforeTouch names with filtering disabled by default. The
inspected Svelte and Vuetify helpers mark a control touched on blur. A nonempty
keyword array filters matching messages; an absent/empty array suppresses all
control error text before touch. No equivalent option names were found in the
inspected Material sources; do not claim universal core or renderer coverage.

The granular control path rebuilds messages from core.errors at the control path.
When it actually removes a matching error, that reconstruction can omit mapped
additionalErrors. Preserve the complete eligible set, then filter by keyword,
without losing unrelated host or renderer errors. Check validationMode at this
boundary so rebuilding messages cannot reveal core errors that should remain
hidden. Filtering must never remove structured errors or change host validity.

Array filteredChildErrors filters keywords without consulting individual child
touch state. Review summaries after a child blurs: matching errors may remain
suppressed even when the child's control displays them. Verify summary consistency
for nested detail forms and document unsupported touch tracking explicitly.

Audit blur wiring across widget types, composite-control focus transitions,
remounts, item reorder/deletion, and external data replacement. Establish a
consistent runtime lifecycle without storing touched flags in form data. Verify
false default, local overrides, absent versus empty/nonempty keyword arrays,
additional errors, and mode changes. The Svelte demo config explicitly disables
filtering and supplies ['required']; that list is an example configuration, not
the universal default keyword list.

Sources: Svelte Flowbite/Shadcn src/lib/util/composition.svelte.ts
(filteredErrors, handleBlur, filteredChildErrors); Vuetify src/util/composition.ts;
Svelte demo-common src/lib/store/index.svelte.ts.

## Pending edit queues, cancellation, and host notifications

Source inspection found separate renderer edit queues and host notification
scheduling. These are code-path findings and potential races, not browser-tested
reproductions. No runtime fixes are included in this documentation update.

| Layer | Inspected behavior and gap |
| --- | --- |
| Svelte shared Flowbite/Shadcn/Skeleton control helpers | Selected controls use Lodash debounce. handleBlur marks touched but does not flush. No debounce cancellation on disposal or rebinding is present in the inspected helpers. |
| Vuetify shared control helper | Flushes its debounced change emitter on blur. No cancellation on disposal or rebinding is present in the inspected helper. |
| Material useDebouncedChange | Defaults to 300 ms and supports flushOnBlur; inspected text/numeric callers enable it. No cancellation cleanup in the helper. New callback dependencies do not themselves cancel an older timer. |
| React JsonFormsContext | Separately debounces host onChange notification by 10 ms after core changes, to handle rapid controlled-data feedback. No cancellation cleanup is present alongside the inspected emitter. |
| Svelte/Vue form bindings | Core dispatch is applied through middleware; host notification occurs through reactive effects/watchers. No equivalent explicit notification debounce was found in those paths. Reactive scheduling still separates dispatch from host observation. |
| JSON Forms core | UPDATE_DATA applies the updater at its supplied path and validates synchronously. Core has no renderer timer cancellation, draft registry, or target-generation check for stale edits. |

Svelte string Clear goes through the same debounced function as typing, replacing
pending typing arguments rather than immediately dispatching a separate clear.
This avoids that same timer later committing the older text, but clearing itself
is delayed. Material onClear dispatches undefined immediately without canceling
a pending debounced edit. Source-level sequence: type schedules a value, Clear
removes it, then the pending callback can restore it. Actual widget event/blur
ordering must be tested before reporting a reproduced user-visible bug.

Svelte/Vuetify queue the path and adapted value supplied at edit time; Material
callbacks capture the path. Review deletion/reorder, rebinding, unmount, external
data replacement, and permission changes while an edit is pending. Core applies
a late action to current state and cannot infer the old item identity. Svelte's
readonly check occurs when scheduling; it does not recheck at timer execution.
The base Svelte/Vue binding cleanup removes generated IDs, not renderer timers.

Existing specialized cancellation should be retained and extended where needed:
Svelte color controls cancel pending picker work on text input, Clear, and destroy,
and flush on picker blur. Extended Vuetify color controls use a committer with
schedule/flush/cancel, flush on blur, and cancel on unmount; the inspected text
update path does not explicitly cancel pending picker work. Svelte file controls
abort the active FileReader on Clear and replacement selection. Audit in-flight
completion, rebinding, and disposal separately from timer cancellation.

Implement the shared commit/cancel lifecycle without blindly flushing on unmount
or discarding edits on ordinary host feedback. Test action activation by pointer
and keyboard, including actions reading host state before a delayed notification.
No existing form-wide flush API was found in the inspected paths. A shared pending
edit service is a possible integration-layer solution, not an existing core API
or an approved new UI-schema option. Preserve incomplete drafts and explicit
picker OK/Cancel semantics while synchronizing committable ordinary edits.

Sources: Svelte family src/lib/util/composition.svelte.ts and StringControlRenderer;
base src/lib/components/JsonForms.svelte and jsonFormsCompositions.svelte.ts;
Vuetify src/util/composition.ts; Material src/util/debounce.ts and its callers;
React src/JsonFormsContext.tsx; Vue src/components/JsonForms.vue and
jsonFormsCompositions.ts; core src/reducers/core.ts and mappers/renderer.ts;
Svelte extended ColorControlRenderer/FileControlRenderer; Vue extended core/color.ts
and Vuetify extended renderers/ColorRenderer.vue.

## Input composition and Unicode length restrictions

The spec now requires composition-safe editing and schema-compatible stored-string
length checks without introducing a new option. No explicit compositionstart,
compositionend, or isComposing handling was found in the inspected renderer/core
source search. This alone does not establish broken behavior: underlying widgets
or framework bindings may already handle composition. Verify actual integration
behavior before reporting a reproduced bug.

Inspected Svelte string and multiline controls directly forward schema maxLength
to native maxlength when restriction is enabled. HTML measures UTF-16 code units,
whereas JSON Schema length counts Unicode code points. Test maxLength: 1 with a
single supplementary-plane character such as an emoji; direct forwarding may
reject a schema-valid value. Review other renderer families and widgets for the
same mismatch rather than assuming a native attribute provides full parity.

Exercise typing, paste, replacement selections, combining sequences, and input-
method composition across text, multiline, masked, and formatted inputs. Check
stored versus displayed length and avoid splitting Unicode characters. Verify
reactive updates, normalization, debounce completion, blur, and action activation
do not overwrite intermediate composition or commit it as finalized data. Check
completion/cancellation ordering and duplicate callbacks in actual widgets.

Preserve overlong incoming values for correction without mount-time truncation.
Coordinate these checks with the pending-edit lifecycle audit and declare any
validator string-length compatibility limitations explicitly.

Sources: Svelte Shadcn/Flowbite StringControlRenderer, MultiStringControlRenderer,
and StringMaskControlRenderer; searches across Svelte renderer sources and
JSON Forms Material, Vuetify, and core sources; JSON Schema string model and
HTML maxlength references linked in the spec.

## Numeric parsing and representable values

The spec strengthens the existing no-truncation requirement with whole-input
parsing, finite numeric commits, and declared range/precision capabilities.
It does not introduce a numeric option, require arbitrary precision everywhere,
or authorize changing numeric values to strings or adding implicit schema bounds.

Inspected Svelte Shadcn IntegerControlRenderer and Material MuiInputInteger use
parseInt. Shadcn blocks decimal/exponent keystrokes and rejects paste text outside
its signed-digit pattern, but audit all input paths rather than assuming these
handlers guarantee complete conversion safety. Material MuiInputNumber uses
parseFloat. Vuetify's integer/number controls delegate entry to VNumberInput;
verify the widget's conversion and precision behavior, including options.precision
where applicable, instead of inferring it from wrapper code alone.

A direct JavaScript conversion check produced the following results. These verify
parser behavior, not reproduced end-to-end renderer failures:

| Input text | Checked conversion | Result |
| --- | --- | --- |
| 1.9 | parseInt(text, 10) | 1 |
| 1e3 | parseInt(text, 10) | 1 |
| 9007199254740993 | Number(text), also parseInt(text, 10) | 9007199254740992 |
| 1e309 | Number(text) | Infinity |

Test full-input parsing across typing, paste, composition/autofill where supported,
and widget event paths. Verify integer syntax rejection does not reinterpret the
input, and unsupported precision/range produces feedback before a changed value
is committed. Finite checks alone do not catch rounded integers. Coordinate
local drafts with pending-edit and action-validity handling; do not commit NaN,
infinity, or invented fallback numbers. Document incoming values already rounded
by host parsing as unrecoverable from the received numeric value.

Sources: Svelte Shadcn controls/IntegerControlRenderer.svelte; Material
mui-controls/MuiInputInteger.tsx and MuiInputNumber.tsx; Vuetify
controls/IntegerControlRenderer.vue and NumberControlRenderer.vue.

## Multi-choice tester domains and safe removal

The spec now requires tester applicability to agree with supported choice value
types, consistent identity through selection/mutation, and no unrelated change
when a removal target is absent. Structured constants require schema-compatible
structural comparison if supported; this is not a mandate to support them in
every checkbox widget.

The inspected Svelte Shadcn EnumArray tester accepts item oneOf branches with
const present without limiting the constants to strings. Inspected Svelte,
Vuetify, and Material checkbox-array selected-state logic uses data.includes,
which does not establish structural equality for object/array constants. Review
actual tester domains against each renderer's supported values and fallback.

Core mapDispatchToMultiEnumProps.removeItem uses data.indexOf(toDelete) followed
by data.splice(indexInData, 1) without guarding a missing result. If lookup returns
-1, splice removes the last item. Object identity mismatches are a concern, as
are stale removal requests after another update. These are source-level findings;
no end-to-end widget failure was reproduced in this review. Check the reducer's
cloning behavior when assessing structured-value identity during removal.

The inspected Material EnumArray checkbox handler uses newValue truthiness to
choose Add versus Remove. Verify false and zero constants, along with empty
strings and other supported values. Do not equate a selected value's truthiness
with the checkbox state. Keep numeric/string identities and translated duplicate
labels distinct.

Audit absent-target removal, structured constants loaded from JSON, concurrent
updates, and selected-state consistency. General editable object arrays require
separate uniqueItems prevention coverage; preserve validation and invalid incoming
duplicates without automatic deduplication. Coordinate repairs with existing
array restrictions and pending-edit target handling.

Sources: Svelte Shadcn complex/EnumArrayRenderer.entry.ts and
EnumArrayRenderer.svelte; Vuetify complex/EnumArrayRenderer.vue; Material
complex/MaterialEnumArrayRenderer.tsx; JSON Forms core src/mappers/renderer.ts
(mapDispatchToMultiEnumProps) and src/reducers/core.ts.

## Array error aggregation and item-path boundaries

The reason for Svelte's getErrorAt lookup is the mapped prop types: core supplies
array-level errors as an already translated/combined errors string, not as a
separate array of structured error objects. childErrors supplies structured
objects for descendants only. The summary component consumes structured errors,
so Svelte retrieves the array-level objects through getErrorAt and prepends them
to childErrors. This is not recovery of missing validation results; it provides
the structured representation absent from the mapped array-level props. Do not
attempt to reconstruct error objects by parsing the formatted errors string.

| Inspected integration/layer | Array-level and descendant error handling |
| --- | --- |
| Core mapStateToArrayControlProps | Keeps the array's errors string separate from descendant childErrors. |
| Svelte useJsonFormsArrayControl | Prepends structured array-level errors to childErrors before renderer-family helpers consume it. |
| Core mapStateToArrayLayoutProps / Material array-layout path | Combines translated array-level and descendant messages in errors. |
| Installed Vue 3.8.0 useJsonFormsArrayControl | Uses the separate-collection core array-control mapping directly. |
| Installed Vuetify 3.8.0 useVuetifyArrayControl | Filters the incoming childErrors; does not combine them with array-level errors. |
| Extended Vuetify AG Grid renderer | Imports the Vue/Vuetify bindings above and displays childErrors in its summary; no additional aggregation was found. |

The Vue/Vuetify dependency check used the packages installed in the neighboring
jsonforms-vue-renderers workspace, including the Vuetify compiled helper, as well
as the neighboring source checkout. These findings describe the inspected paths,
not every renderer or historical release. The portable spec permits combined or
separate presentation while requiring array-level feedback to remain available
when the optional child summary is hidden, subject to the agreed error-display
policies.

Correction to the initial component-only inspection: Svelte useJsonFormsArrayControl
wraps mapStateToArrayControlProps, obtains getErrorAt(mapping.path, mapping.schema),
and prepends those control errors to mapping.childErrors. Consequently the shared
Svelte array bindings expose a combined collection, and the inspected Shadcn
summary can include array-level failures. Do not report those errors as universally
missing simply because the component renders childErrors instead of control.errors.

The narrower Svelte gap is that hideArraySummaryValidation hides that combined
summary. Verify an alternative array-level explanation remains, particularly for
empty-array minItems errors. Review pre-touch filtering of the combined collection
as well, and avoid duplicating errors when adding another presentation.

Core mapStateToArrayLayoutProps separately combines the translated array error
string and descendant error string into errors; the Material array-layout path
uses this mapping. Core mapStateToArrayControlProps instead leaves control errors
and childErrors separate. The inspected neighboring Vue useJsonFormsArrayControl
uses the latter directly, and useVuetifyArrayControl filters childErrors without
adding control errors. Extended Vuetify AgGridArrayControlRenderer imports those
bindings and renders control.childErrors in its summary; no local combination
was found in that path. Follow-up inspection also checked the Vue renderer
workspace's installed @jsonforms/core, @jsonforms/vue, and @jsonforms/vue-vuetify
3.8.0 sources: the core array-control mapper keeps the collections separate,
Vue delegates directly to it, and the Vuetify composition helper filters the
received childErrors without prepending control errors. The installed Vuetify
compiled helper likewise exposes filteredChildErrors. The local extended
Vuetify util/composition.ts supplies Button/context helpers, not an alternate
array aggregator. This verifies the inspected dependency chain; other builds or
historical versions may differ.

Svelte Shadcn ArrayLayoutRenderer filters item errors using an unbounded startsWith
on the normalized item path. employees.10.name therefore also matches employees.1.
Audit the corresponding family/list/Vuetify item filters and use exact-or-descendant
segment matching. Include root arrays, nested paths, index 1 versus 10, required
property errors, additionalErrors, and reorder/deletion. These are source-level
findings; no browser reproduction was performed in this review.

Sources: Svelte src/lib/jsonFormsCompositions.svelte.ts (useJsonFormsArrayControl),
Shadcn layouts/ArrayLayoutRenderer.svelte and util/composition.svelte.ts;
core src/mappers/renderer.ts and store/jsonFormsCore.ts; Vue
src/jsonFormsCompositions.ts; Vuetify src/util/composition.ts; extended Vuetify
renderers/AgGridArrayControlRenderer.vue; Material layouts/MaterialArrayLayout.tsx.

Related binding clarification for the earlier multi-choice audit: Svelte uses its
own mapDispatchToSafeMultiEnumProps rather than the core dispatcher directly.
That helper guards non-array/missing data, but its array branch still uses
indexOf followed by splice without checking for -1; the missing-target concern
therefore remains applicable to the inspected Svelte binding.

## Additional-error lifecycle across array and path changes

Core UPDATE_DATA recalculates schema errors and retains additionalErrors through
the state spread; it does not remap their instancePath or delete entries belonging
to removed data. Array dispatch helpers attach ADD/REMOVE/MOVE context, but the
inspected reducer does not use it to maintain additional-error identity. The
extended Svelte/Vue form integrations expose or forward additionalErrors; that
alone does not establish an ownership/remapping service.

The spec now generalizes the existing Monaco path/version requirements to all
renderer-owned errors. Audit item reorder/deletion, property rename, control
rebinding, disposal, and external data replacement. Example: deleting item 0 must
not leave the former item 1 editor's error attached to /items/1/code when its known
target now resides at /items/0/code. Removed targets must lose only their owned
errors. Unknown identity after replacement requires invalidation and reevaluation,
not a guessed path rewrite.

Check late asynchronous callbacks cannot republish errors for obsolete targets
or versions. Maintain participating pending/current validity during reevaluation,
including propagation opt-outs. Keep host-error ownership separate and document
producer refresh/invalidation responsibilities for server errors. A renderer must
not delete unrelated host errors while cleaning up its own diagnostics.

Array action context may support integration-level tracking but does not cover
all replacement/custom mutation paths. No new UI option or business-data ID is
introduced. These are lifecycle coverage requirements; no runtime remapping
implementation was added in this documentation review.

Sources: JSON Forms core src/reducers/core.ts (UPDATE_DATA),
src/mappers/renderer.ts (array dispatch helpers), and src/actions/actions.ts
(UpdateArrayContext); Svelte extended components/JsonForms.svelte and core/types.ts;
Vue extended form-context/web-component additionalErrors forwarding.

## Change-event errors versus extended-context additionalErrors

The spec now distinguishes three interfaces: base change events carry core.errors;
extended contexts expose errors and additionalErrors separately; control selectors
combine applicable collections subject to display mode. Do not report the extended
integrations as lacking additional-error access simply because their event payload
is not aggregated.

Inspected Svelte JsonForms emits core.data/core.errors. Its extended handleChange
stores event.errors and forwards the event unchanged, while context getters expose
errorsToUse and the separate additionalErrors prop. The inspected Svelte family
web-component wrappers likewise forward the change event. Vue's base component
emits core.errors; extended useResolvedJsonForms.onChange forwards that event and
its context exposes core errors and additionalErrors separately. The Vue workspace's
installed @jsonforms/vue 3.8.0 base component confirms the same event payload.
React's inspected binding also emits core.data/core.errors, through its separate
notification debounce.

Audit host consumers that infer full validity solely from changeEvent.errors.
Check additional-error-only updates, async diagnostic pending/completion, ownership
cleanup, validationMode changes, and unchanged-data transitions. Combined-validity
consumers need updates independently of data edits; whether a framework emits a
change event during such a transition is not a guarantee that its errors payload
contains additional errors. Preserve existing event semantics and avoid silently
adding host errors to a field previously containing only schema errors.

Verify no display-filtered or translated control error string is used as the full
validity source. NoValidation's empty errors array is not proof of schema success.
Context access to two error collections alone does not establish current/pending
validation or pending-edit synchronization. No new event/API or implicit core
validate-function context fields were introduced by this clarification.

Sources: Svelte base components/JsonForms.svelte and extended
components/JsonForms.svelte; Svelte family webcomponent JsonFormsWebComponent.svelte;
Vue components/JsonForms.vue (neighboring source and installed 3.8.0);
Vue extended webcomponent/useResolvedJsonForms.ts; React JsonFormsContext.tsx;
core store/jsonFormsCore.ts.

## Object-level errors and errors without rendered targets

The spec now requires accessible object-level feedback and discovery of eligible
errors whose target has no rendered control. Exact summary styling remains
renderer-specific; no new UI option or automatic data repair is introduced.

Inspected Svelte Shadcn, Vuetify, and Material ObjectRenderer components primarily
delegate to generated/registered detail layouts. No explicit object-error display
was found in those components or the inspected Svelte/Vuetify Group components.
Verify the complete rendered integration before reporting a reproduced missing
message. AdditionalProperties name-entry and rename errors are separate from
full validation errors on the edited object.

Audit an empty object violating minProperties while its declared fields remain
optional, as well as maxProperties and other object-level errors. Verify root and
nested object paths, registered detail layouts, and presentation without redundant
copies of every descendant error. Do not turn a minProperties failure into a false
required marker on an arbitrary property.

Core getControlPath associates additionalProperties errors with the offending
property via params.additionalProperty. That path may have no generated control
when additionalProperties is false. Verify an enclosing/form summary still makes
the eligible error discoverable, with a useful affected-data label even when
there is no input to focus. Include missing required properties without controls,
hidden controls, and mapped additionalErrors.

Respect validationMode and pre-touch filtering while retaining underlying errors
for validity consumers. Check host correction flows for uneditable invalid data;
do not add implicit deletion or schema/data rewriting as an error-display fix.
These findings are from source inspection, not browser-tested failures.

Sources: Svelte Shadcn complex/ObjectRenderer.svelte,
complex/components/AdditionalProperties.svelte, and layouts/GroupRenderer.svelte;
Vuetify complex/ObjectRenderer.vue and layouts/GroupRenderer.vue; Material
complex/MaterialObjectRenderer.tsx; core src/util/errors.ts (getControlPath and
invalid-property mapping).

## Temporal timezone conversion and unchanged-value preservation

**Status: provisional timezone design; not finalized.** Earlier references to an
adopted/agreed target below record the design discussion, not a final implementation
requirement. Review against the spec's provisional timezone examples and change-mode
proposal before implementing.

The spec now adopts explicit timezone/saveTimezone options as an extended target
contract, keeping the existing display/save format names. MUI picker timezone
support establishes feasibility and terminology, not existing shared JSON Forms
wiring. No corresponding shared option wiring was found in the inspected
Svelte/Vuetify temporal controls or Material wrapper paths. Implement global
config defaults/local overrides without changing absent-option behavior silently.

Inspected Svelte and Vuetify date-time picker handlers rebuild date/time parts and
format the result with dateTimeSaveFormat. Seconds interaction depends on display
format. Their parseDateTime helper calls dayjs(data, format); installing UTC and
timezone plugins alone does not select a conversion policy. Material serializes
through its save-format helpers. Audit source parsing, display conversion, edited
wall-clock interpretation, and conversion before storage separately.

Check unchanged blur, picker open/close/Cancel, locale changes, and display-zone
changes preserve the original data exactly. Test offset-bearing values with
seconds/fractions absent from display, UTC literal suffix versus offset token,
invalid zone names, midnight rollover, and daylight-saving gaps/overlaps. Confirm
bounds and serialization agree about the represented time and no callback
rewrites a value solely because its formatted display differs.

Time-only named/system-zone conversion requires an explicit reference date; its
input encoding is still to be specified. Do not claim full support by silently
using today. Offset-free stored strings also need a declared source interpretation
before instant conversion. Preserve date-only semantics and wall-clock strings
where conversion is undefined. No savedDateTimeFormat alias or schema-format
compliance toggle is introduced. No runtime timezone changes were made here.

Sources: Svelte Shadcn controls/DateTimeControlRenderer.svelte and util/datejs.ts;
Vuetify controls/DateTimeControlRenderer.vue and util/datejs.ts; Material
controls/MaterialDateTimeControl.tsx and util/datejs.tsx; MUI and Day.js official
documentation linked in the spec.

## Temporal value-zone editing versus display conversion

**Status: provisional timezone design; not finalized.** Earlier references to an
adopted/agreed target below record the design discussion, not a final implementation
requirement. Review against the spec's provisional timezone examples and change-mode
proposal before implementing.

Recorded the agreed first-version direction: a time-only value editor can offer
fixed offsets, including UTC, while a date-time value editor may also offer named
zones using the entered date. Changing the value's association preserves entered
clock fields (and date for date-time), rather than converting the old instant.
This is target behavior; existing format or timezone-plugin support does not
establish that the renderer already implements a zone-editing affordance.

Test 02:00:00Z changed to +02:00 becomes 02:00:00+02:00 before explicit storage
normalization, rather than 04:00:00+02:00. With saveTimezone UTC, that newly
associated value serializes as 00:00:00Z. Audit offset-preserving serialization
when normalization is not requested; do not let a local-zone formatter silently
replace the selected offset. Verify seconds/fractions and staged cancellation,
readonly, restrictions, and error handling.

Keep options.timezone/$dynamic changes presentation-only and distinct from explicit
value edits. Check named-zone date-time reassociation against daylight-saving gaps
and overlaps without silently changing entered fields. Named-zone time-only
association is possible metadata, but resolving an offset requires the still-to-be-
defined reference-date input. Do not substitute today or confuse a fixed offset
with a geographic timezone. The saved offset alone does not retain its IANA name;
host schemas must explicitly provide separate storage if needed.

The subsequent showTimezoneSelector contract defines selector enablement; a
complete reference-date API remains unspecified. Preserve the distinction from
implemented renderer support and avoid inventing aliases or implicit data properties.

## Timezone-selector enablement and visible closed-state indication

**Status: provisional timezone design; not finalized.** Earlier references to an
adopted/agreed target below record the design discussion, not a final implementation
requirement. Review against the spec's provisional timezone examples and change-mode
proposal before implementing.

The spec adopts options.showTimezoneSelector (false by default) as a project
extension, with global defaults/local overrides. No existing equivalent enabling
option was found in the inspected temporal renderer source. Implement fixed-offset
selection for time and supported offset/named-zone selection for date-time under
the agreed wall-clock-preserving edit semantics. This is not a new variant.

Verify the selected zone/offset remains visibly identifiable when the picker is
closed. A suffix/dropdown within or beside the input should read as one control;
showing it in formatted text is also acceptable when sufficient. The leading
picker icon and trailing zone/Clear arrangement is a recommendation, not a fixed
library-specific layout. Check keyboard access, compact layouts, clear-button
focus/hover behavior, and nonoverlapping action targets. Do not force users to
open the picker or rely solely on a tooltip to discover the selected zone.

Test showActions commits/cancels zone and temporal changes together, selecting a
zone on an empty control does not write midnight, and hiding the selector retains
data. Selector-based edits without explicit saveTimezone preserve the selected
offset; explicit normalization may change the serialized clock representation.
Check incompatible offset-free/literal-suffix save formats produce diagnostics
instead of silently losing or mislabeling the association. Preserve configured
text formatting by supplying a separate zone indicator when needed.

Distinguish displayed/edited zone from normalized storage zone, especially when
options.timezone is also configured. The visible clock and zone indication must
agree. Named-zone persistence still requires an explicit host field if needed;
showTimezoneSelector introduces neither implicit data properties nor a reference-
date input. These are target requirements, not confirmed current renderer support.

## Provisional timezone change modes and examples

The entire timezone-support proposal is now explicitly marked not finalized in
the spec, including timezone/saveTimezone/showTimezoneSelector and the newly
proposed timezoneChangeMode. The proposed default keepLocalTime preserves clock
fields during user selector changes; keepInstant preserves the instant or, for
time-only fixed offsets, the UTC relationship on an implied day. No runtime
support or finalized API is claimed.

Recorded examples starting from 10:00:33+02:00 distinguish offset-preserving
editing, UTC display conversion, and UTC serialization after actual edits. The
format token Z is not inherently the system offset; literal Z in stored text
means UTC. saveTimezone does not rewrite data on load. Candidate selector-state
precedence must retain a coherent clock/zone pair across saved-value feedback
without confusing programmatic display changes with explicit value mutations.

Further review is required for option defaults, fixed-offset encoding/range,
time-only reference-date semantics, offset-free strings, daylight-saving resolution,
external replacements, active drafts, and persistence. Treat the earlier timezone
sections as research and design notes rather than settled gaps against a final
contract. No renderer changes were made.


## Tuple control implemented across Svelte renderer sets

Shadcn, Skeleton, and Flowbite register TupleControlRenderer, backed by shared
TupleFields/TupleField components in the Svelte binding package. Positional items
and prefixItems select automatically (rank 25); uniform arrays require variant
tuple and equal non-negative minItems/maxItems. Unsupported explicit configurations
show a translated diagnostic. Ordinary uniform-array selection is unchanged.

Fixed fields use their own resolved schemas and original root-schema context.
They render horizontally with wrapping or vertically, with translated position
fallbacks and schema i18n labels. Complex values open live detail dialogs using
the ranked UI-schema registry/detail fallback. Readonly prevents mutations.
Tail fields support typed or mixed values, Add/Delete, disableAdd/disableRemove,
and minItems/maxItems when the effective restrict option is true. Existing excess
values are preserved and can be removed explicitly.

Missing positions are not initialized on mount. Editing a later position commits
its value and preceding unambiguous defaults atomically. Explicit defaults are
cloned and object property defaults follow core extractDefaults. Empty string
clears retain their slot; numeric clears retain the committed value with local
feedback. Edits blocked by an ambiguous preceding position resume when that
position receives data. These local drafts do not implement a new form-wide
pending-edit service; host action coordination remains the shared integration gap.

Coverage includes six schema/initialization unit cases and browser suites in all
three sets for selection, defaults, string/numeric clearing, vertical fields,
invalid configuration, excess-tail correction, count restrictions and overrides,
disabled actions, readonly, live complex dialogs, translations, root references,
pending-edit resumption, and prefixItems with an Ajv2020 instance. Supporting
prefixItems in the renderer does not switch the host's default validator dialect.

The shared Tuples (coordinates & positional records) example is available in all
Svelte demos: localized X/Y labels, uniform dimensions, an initially empty record,
typed and mixed tails, complex dialogs, and an overlong array. It uses draft-07
schemas and explicitly enables restrict because core config defaults can otherwise
supply restrict false. The original renderer-set comparison does not imply
official Material/Vuetify tuple support.

Further integration checks: localized feedback during an already-pending draft,
form-wide pending-action policy, and cancellation of queued child edits when a
tail deletion changes paths. Those lifecycle services are shared concerns, not
new tuple options.

## Array contains and matching-count restrictions

The spec now distinguishes contains/minContains/maxContains validation from item
renderer selection and total-array-size restrictions. Violations need accessible
array-level feedback even with no items. The preferred extended behavior under
restrict prevents discrete deletion of the last required match where matching can
be evaluated reliably, while retaining incomplete item editing and validation
feedback. It does not require automatic matching-item creation, value rewriting,
or deletion of excess matches.

Targeted searches of Svelte Shadcn/Flowbite/extended, neighboring Material, and
neighboring Vue Vuetify renderer sources found no explicit contains/minContains/
maxContains matching-count action guards. Svelte and Vuetify mixed-type schema
utilities mention contains among array keywords; retaining a keyword there is not
matching-count prevention. This source inspection does not establish missing
validator support or reproduce an interaction failure.

Implement or verify array-level error presentation and reliable current-data
matching before destructive actions, with the configured dialect and reference
resolution. Use non-mutating evaluation; invoking a validator configured with
defaults/transforms must not alter data merely to decide whether Delete is enabled.
Document a validation-only fallback where prevention is unsupported. Verify that
users can correct incoming invalid arrays and transfer a matching designation
between entries without an editing dead end. Existing uniqueItems findings remain
separate. No runtime changes or UI tests were made for this documentation update.


## Verified behavior: pattern-derived errors on declared properties

This is a verified validation/mapping behavior, not an implementation gap. The
price_total example in the spec declares a number property and applies minimum 0
through patternProperties ^price_ and maximum 1000 through _total$. The existing
property control owns its error display; additional-property creation must not
introduce another control for the declared name.

An executable check using installed JSON Forms core 3.8.0 and AJV 8.20.0
(allErrors true, verbose true, strict false) validated values -1, 1001, and 500,
then called mapStateToControlProps for #/properties/price_total. Results were,
respectively, "must be >= 0", "must be <= 1000", and an empty control error string.
Both failures had instancePath /price_total although schemaPath pointed into
patternProperties. Core's data-path mapping correctly attached those errors to
the existing control.

Correction to the initial interpretation: choosing the declared property's schema
for rendering is not itself evidence that pattern-derived validation errors are
lost, and merging the pattern schemas is not necessary for this tested error
routing. This check did not exercise browser rendering, special combinator error
filtering, or every renderer family's presentation/touch settings. No runtime code
was changed, and no gap is asserted for the tested ordinary declared-property case.


## Verified behavior: additional-property name validation

The useful propertyNames renderer behavior is validation of the proposed dynamic
key during Add/Rename. This is existing behavior, not a newly identified gap.
The spec includes a lowercase-name example: customer_code passes, while
Customer Code fails, independently of the additional property's string value.

Svelte Shadcn AdditionalProperties.svelte derives propertyNameSchema through
createAdditionalPropertyNameSchema and supplies it to a nested JsonForms instance
for the new-name input. Its errors and separate collision/reservation errors
participate in disabling Add. Declared property names are reserved separately.
Both addProperty and commitRename call validateAdditionalPropertyName with AJV
before mutation. The shared helper is in jsonforms-svelte/src/lib/
additionalPropertyName.ts; Flowbite and Skeleton also import that helper.

The neighboring Vue Vuetify util/dynamicProperties.ts getPropertyNameSchema builds
a string schema incorporating propertyNames and, when additionalProperties is
false, a pattern-admission constraint. validateDynamicPropertyName validates the
proposed key with AJV and checks data collisions. Exact declared-name reservation
and UI handler wiring should not be inferred solely from that utility.

These are source-verified name-input behaviors; no new browser interaction test
was run. They are distinct from full-form errors for already-present invalid keys.
A schema declaring a name that violates its own propertyNames constraint is legal
schema syntax, but that property's presence cannot satisfy those constraints;
that example is not evidence of an additional-properties renderer defect.


## Fixed: scoped constraints in Svelte input controls

Browser regressions reproduced direct incoming-schema reads that missed field
constraints under a Control scope into an enclosing object. Core correctly resolves
the field schema in binding.control.schema; raw props.schema remains the enclosing
schema on this dispatch path.

Corrected Shadcn and Skeleton Number/Integer inputs to read minimum, maximum,
and multipleOf from binding.control.schema. Corrected String, Password,
MultiString, StringMask, and AnyOfStringOrEnum inputs in Shadcn, Skeleton, and
Flowbite to read maxLength from that resolved schema. This changes the source of
existing widget constraints, not the shared restriction policy or validator rules.
Flowbite's numeric stepping/bounds omission was subsequently fixed: its inputs now
map resolved minimum/maximum and use options.step, then multipleOf, then 0.1/1.
The same numeric regression cases failed before that fix and cover parity with
Shadcn/Skeleton. Numeric inputs no longer receive the inapplicable string maxLength
attribute. Mapped numeric constraints take precedence over widget-specific props,
matching the other families.

Each family's tests/controls/ResolvedConstraints.svelte.spec.ts mounts actual
controls through JsonForms with an object schema and a scoped field. Regression
assertions inspect the rendered input constraints. All 19 affected-control cases
were observed failing before their fixes; four further cases verify that explicit
numeric step overrides retain precedence. Password cases use schema format
password to match the existing testers. No core mapping changes are needed.


## Fixed: scoped temporal picker bounds across Svelte families

Date, Time, and DateTime controls in Shadcn, Skeleton, and Flowbite now read
formatMinimum, formatMaximum, formatExclusiveMinimum, and formatExclusiveMaximum
from binding.control.schema. Previously they read incoming props.schema, which
can be the enclosing object rather than the scoped field. This affected picker
restrictions independently of full-form validation.

Browser regressions open the real calendars and time pickers through JsonForms
with scoped object properties. Inclusive and exclusive calendar cases check both
disabled outside dates and enabled boundary dates. Time cases attempt stepping
above and below the permitted time; the final fixtures use second 30 to test the
lower bound independently of minute rollover. The eight cases per family cover
all nine affected controls. Before fixing the reads, all 24 cases reproduced
selectable out-of-range dates or time stepping past a bound. Tests use a fixed
calendar date and await picker setup; Flowbite uses real browser clicks because
its popover trigger listens for mouse-down.

The first post-fix run also exposed Flowbite DateTime conversion errors: derived
date-only bounds were reparsed with date-time formats, and pickerValue.date (a
Date object) was parsed with a string format. Those conversions now use YYYY-MM-DD
for date-only bounds and no string format for Date objects. The same regression
cases failed until those corrections were made.

Final targeted browser validation: 54 passing tests across the three families,
including the 24 new cases in tests/controls/TemporalConstraints.svelte.spec.ts.
This verifies the covered picker restrictions, not complete typed-input prevention,
provisional timezone semantics, or additional-error propagation; their separately
recorded requirements remain unchanged.


## Fixed: Flowbite DateTime limits follow the pending date

Flowbite DateTime now computes minimum/maximum time limits from selectedDate
while its picker is open, and from the committed pickerValue.date when closed.
This matches the active-date approach in the inspected Shadcn and Skeleton
controls and the spec's existing requirement for uncommitted date selections.

Two additional browser regressions with showActions true reproduced the defect:
starting on an interior date, selecting the minimum boundary date still allowed
12:00 to step down to 11:00; selecting the maximum boundary date allowed 14:00 to
step up to 15:00. Both failed before the fix. They now also verify that returning
to an interior date releases the restriction and that these staged interactions
do not change the committed form data. All 13 targeted Flowbite temporal/DateTime
tests pass. No new UI options or timezone semantics were introduced.


## Fixed: DateTime Apply rejects an out-of-range staged value

All three Svelte families now compare the complete selected date/time against
supported string-valued formatMinimum, formatMaximum, formatExclusiveMinimum, and
formatExclusiveMaximum constraints when restrict is enabled. A boundary-date
change may invalidate an otherwise unchanged draft time. The picker retains that
draft, displays translated dateTime.outOfRange feedback, disables Apply, and guards
both its handler and the explicit commit path. Correction re-enables Apply; Cancel
preserves committed data. restrict false permits the commit without changing the
validator configuration. This does not add dynamic $data-bound support or broaden
typed-input prevention.

Each family's tests/controls/DateTimeApply.svelte.spec.ts reproduced four failures
before fixing the controls (one for each bound keyword). The tests also cover a
corrected draft being committed, Cancel/reopen behavior, and restrict false.
Calendar accessibility announcements have their own alert role, so the feedback
assertion identifies the range message specifically. No automatic time clamping
or new timezone behavior was introduced.

## TODO: examples coverage for the recent renderer fixes

When updating the shared examples project, add examples for the cases below and
make them available in the Shadcn, Skeleton, and Flowbite demos. This is deferred
example work; the regression tests already added do not replace these examples.

- [ ] Scoped numeric constraints: number and integer fields inside an object,
  demonstrating minimum/maximum, multipleOf-derived stepping, and an explicit
  options.step override. Include Flowbite parity with the other renderer families.
- [ ] Scoped string constraints: maxLength with restrict enabled for ordinary
  string, password (using the currently supported schema format), multiline,
  masked, and free-entry enum/string controls. Show restrict false separately.
- [ ] Scoped temporal constraints: Date, Time, and DateTime with inclusive and
  exclusive format bounds. Show selectable boundary values, disabled outside
  dates, and time stepping that cannot cross the bounds; include DateTime bounds
  crossing midnight. Exercise Flowbite's date-only bound and Date-object handling.
- [ ] DateTime boundary-day switching: with showActions true, start on an interior
  date, select the minimum or maximum boundary date, and show time restrictions
  changing before Apply. Return to an interior date to show those limits release.
- [ ] DateTime invalid-draft Apply: start at June 16 at 09:00 with a minimum of
  June 15 at 12:00, then select June 15. Show preserved draft time, translated range
  feedback, disabled Apply, correction and successful Apply, and Cancel/reopen
  preserving committed data. Include maximum and exclusive-bound counterparts.
- [ ] The same out-of-range draft with restrict false: allow Apply while showing
  the distinction between preventive UI behavior and validator feedback. Configure
  the example's validator to support the demonstrated format-bound keywords;
  disabling restrict must not disable validation.

Use shared schemas/UI schemas and data across the renderer demos so behavior is
comparable. Include concise expected-behavior notes and resettable initial data;
show the resulting model so staged edits and committed changes can be distinguished.
Keep provisional timezone scenarios explicitly separate from these settled fixes.


## Temporal draft feedback with and without confirmation buttons

The agreed contract distinguishes local temporal draft explanations from validation
of committed form data. An unapplied Apply/Cancel draft may show error-styled
feedback explaining disabled Apply without automatically adding a form-level
additionalError. Cancel discards the feedback with the draft. Host actions must
explicitly resolve confirmation drafts or intentionally consume committed data;
they must not silently accept a draft.

Feedback is also required for rejected or unresolved temporal edits without
confirmation buttons, including text entry. Those ordinary unresolved edits must
remain visible to the shared pending-edit mechanism so local-only feedback does
not permit submission of an unnoticed stale value. Invalid committed data still
uses normal validation/error propagation.

The implemented DateTime dateTime.outOfRange feedback covers both confirmation
and immediate picker editing and uses the translator. The no-button path validates
the complete proposed date/time before writing data, retains a rejected draft in
the open picker, and commits a valid correction. Flowbite displays its pending date
and time; Shadcn commits before closing so closing cannot discard the selected time.
Explicit restrict: false still permits an out-of-range commit.

DateTimeImmediate.svelte.spec.ts in each family covers all four range keywords,
correction, restrict: false, and translated local feedback without committed-data
errors. Before the fix, the four rejected-draft regressions failed in every family;
Shadcn also failed the restrict-false case because closing lost the selected time.

Remaining work: equivalent text-input feedback, accessible association with the
edited input, live locale changes, dismissal policy, and shared pending-edit
integration. These picker regressions do not establish those capabilities.

Examples TODO: demonstrate translated temporal draft feedback both with and without
Apply/Cancel, showing that committed data remains unchanged while an edit is pending
and distinguishing pending-edit action policy from committed-data validation.


## Fixed: intersect temporal bounds at picker precision

Date, Time, and DateTime in all three Svelte renderer families now use
resolveTemporalBounds in their date utilities to intersect inclusive and exclusive
format bounds. The previous if/else-if handling ignored an exclusive constraint
whenever its inclusive counterpart was present. Twelve browser cases reproduced
that defect before the fix; the complementary cases with tighter inclusive bounds
already passed.

The calculation rounds lower bounds up and upper bounds down to representable
days, minutes, or seconds, respecting exclusivity without unnecessarily excluding
a representable value. For example, a minute-resolution exclusive maximum of
10:30:30 permits 10:30; an inclusive minimum of 09:30:30 starts at 09:31. DateTime
rounding can move a bound across midnight. Time-only bounds outside the clock's
representable day produce an empty range rather than wrapping to a valid-looking
time. Existing invalid values are preserved; picker mutation paths guard empty
ranges, and empty time ranges disable the TimePicker. Existing DateTime
restrict-false Apply behavior remains intact.

Coverage: CombinedTemporalBounds.svelte.spec.ts checks stricter inclusive and
exclusive bounds plus empty date/time/date-time ranges in each family.
temporalBounds.spec.ts covers minute and fractional-second rounding, midnight
transitions, competing bounds, and empty clock/date ranges. Existing temporal,
pending-date, and Apply/Cancel browser suites also pass. These checks do not assert
new timezone semantics, dynamic $data-bound support, or arbitrary text-entry
prevention.

Examples TODO: add competing inclusive/exclusive temporal constraints, bounds that
round across midnight, minute-resolution rounding, and empty ranges that preserve
existing data without offering an invalid replacement.

## Temporal text entry: permitted range errors and checked parsing

The DateTime text-input handlers in Shadcn, Skeleton, and Flowbite do not use
the picker candidate-range check. A completed masked value or an unmasked value
is parsed, formatted when parsing succeeds, and sent to binding.onChange.
Allowing a typed June 15 at 09:00 value with a June 15 at 12:00 minimum is
intentional, even when restrict is enabled, matching number/integer text entry.
This is not a range-prevention gap: the entered value may reach the model and
must show a range validation error until corrected. TemporalTextRange.svelte.spec.ts
now verifies this existing behavior for Date, Time, and DateTime across all three
families: all four range keywords produce errors at /value, their messages appear
on the rendered control, and correction clears both the form errors and displayed
message. All 36 browser cases pass with restrict true and masking disabled using
the default JSON Forms validator. Time/date-time fixtures use explicit literal Z
formats; these tests do not establish timezone conversion behavior.
No runtime fix or additionalErrors fallback was needed for these tested schemas.
Restricted picker commits remain preventive.
Incomplete masked input returns early without the translated explanation required
by the temporal draft contract.

The shared parseDateTime implementation in each family uses Day.js custom-format
parsing without strict parsing. Before the text-entry fix, a direct check against the installed dependency
confirmed that 2026-02-31 with YYYY-MM-DD becomes 2026-03-03, and 25:00:00
with HH:mm:ss becomes 01:00:00. A complete mask therefore does not establish
calendar/clock validity. Silent normalization hid the original invalid entry
from subsequent schema validation.

Fixed: Date, Time, and DateTime text handlers and input display now use a separate
parseTemporalText helper. It checks that parsing and formatting reproduce the
entered text, comparing offset-bearing values in their entered offset. Invalid
text remains unchanged rather than being formatted into a different valid value,
and ordinary schema validation can report it. Existing picker and bound parsing
still uses parseDateTime. This does not introduce new timezone conversion policy.

TemporalTextParsing.svelte.spec.ts reproduces the nine normalization failures
before the fix and verifies unchanged model text, unchanged displayed text,
format errors, and successful correction in all three families. The new
temporalText.spec.ts adds 17 cases per family for overflow rejection, leap dates,
locale and 12-hour formats, literal Z, numeric offsets (including +00:15),
and alternate display/storage formats.

Follow-up: extend browser regressions to masked text entry, incomplete input,
clearing, and restrict false, and verify errors when UI format selection is used
without a corresponding schema format.
The completed range tests establish that parseable out-of-range text commits,
displays validation errors, and clears those errors on correction.
Do not add picker-style range rejection to text entry. Provide feedback for incomplete or rejected text. Keep typed-input
parsing separate from parsing existing stored values and schema bounds: changing
the shared parser globally requires coverage for locale formats, offset-bearing
strings, and existing save formats. Integrate unresolved text drafts with the
shared pending-edit contract; local feedback alone does not solve submission
using an older committed value.

Examples TODO: include typed range violations and impossible dates/times, showing
both the visible draft and committed model and explaining correction/clear behavior.

## Composite cells: dedicated edit trigger and empty/remove actions

Implemented across Shadcn, Skeleton, and Flowbite: selectable summary text,
a separate edit icon, and an eligible clear X. Summary clicks do not open the
dialog. The themed detail dialog provides Empty contents ({} / []), Remove value
(unset property), and Done. Empty/remove actions respect enabled state,
disableRemove, structural restrictions, and dynamic-property/array-element
contexts. Integration with the shared confirmation policy remains to be completed.

Tuple additional items now use a separate AdditionalItems component in each
renderer set, with framework-specific containers and translated plus/trash icon
buttons with tooltips. Only mutation and constraint logic is shared. Tuple labels
sit above the whole type/value row, and complex positions use the framework's
themed detail dialog.

Browser regressions cover all three renderer families: summary clicks do not
open a dialog; clearing targets the row property; parent minProperties prevents
removal under restrict; Empty contents retains an empty array property. Tuple
tests verify icon actions, themed dialog editing, and mixed selector/value alignment.

Regression follow-up: keyboard activation, readonly, dynamic-property and
array-element contexts, and AG Grid event propagation and row paths.

Examples TODO: extend Table cells (scalar & composite), using address.summary
scoped to street and its existing detail layout, plus phoneNumbers. Demonstrate
selecting street text independently of editing, {} versus absent address, [] versus
absent phoneNumbers, and disabled actions when restrictions apply.

### Composite array summaries: per-item preview implemented

The earlier count-only decision is superseded: summary is supported for both
object and array cells. Shadcn, Skeleton, and Flowbite resolve array summary.scope
relative to each item, using # for primitive items. They display up to two usable
scalar values and a translated remaining count, or fall back to the item count.
Empty and absent arrays remain distinct. The fallback count/details/unset labels
also use the translator.

CompositeSummary browser tests cover object-relative text, primitive array
previews, object-item scopes, translated remaining counts, missing-summary
fallback, and empty versus absent arrays. Table cells and AG Grid examples now
configure phoneNumbers.summary with scope # and include three phone numbers to
demonstrate overflow. Detail dispatch remains independent.

The neighboring Vue implementations were renamed previously but still ignore
summary on arrays. Per-item array preview parity there remains a follow-up;
this change updates the Svelte implementation and shared Svelte examples.

### Composite summary option rename implemented

Svelte Shadcn, Skeleton, and Flowbite now read cells.<property>.summary instead
of display. This is a rename, not an additional alias. Shared Table cells and
AG Grid examples use summary. Object summaries resolve their scope relative to
the cell value; arrays now follow the per-item preview contract above.
Earlier comparisons mentioning display describe the previously inspected code.
The subsequent cross-project audit also updated the neighboring Vue repository:
Vuetify extended, Ant Design Vue, PrimeVue, and Shadcn composite cells now read
summary, ignore it for arrays, and retain detail dispatch. The shared Vue table
example was migrated. No matching composite display-option consumer or example
was found in the neighboring React renderer repository, so no React rename was
needed. This rename does not implement the separately recorded edit-button or
empty/remove-action changes.

## Scalar allOf with annotation-only branches

Fixed in Shadcn, Skeleton, and Flowbite: a scalar allOf containing one scalar
definition (including referenced/nested definitions) plus annotation-only branches
delegates to one scalar control while retaining the outer label, UI options,
translation metadata, data path, and original root-schema context. A matching
registered UI schema retains precedence. The original schema remains in core for
validation; the presentation projection does not rewrite it.

The JSON Schema demo's nonNegativeIntegerDefault0/minLength case now displays
"Min Length" over its integer input and retains minimum 0. The same definition
also serves minItems and minProperties. The regression failed for the missing
label in all three sets before the fix. Coverage also exercises translated and
custom labels, readonly options, nested data updates, and existing object allOf
forms.

The annotation projection remains conservative for conflicting annotations and
dialect-dependent reference siblings. The subsequent validation-only scalar
composition support below handles a separate, restricted set of assertion
branches; neither projection is arbitrary combinator flattening.

Examples TODO: use the existing JsonSchema example to verify minLength, minItems,
and minProperties labels, and add an explicit validation-only scalar composition
case when extending the examples catalog.


## Validation-only scalar compositions

Implemented across Shadcn, Skeleton, and Flowbite for allOf, anyOf, and oneOf:
a shared presentation projection recognizes unambiguous scalar types with
validation-only branches. It retains the enclosing schema's options/constraints
for the delegated input, while the unchanged original schema supplies validation.
Alternative bounds and multipleOf values are not copied into native min/max/step.
Outer labels and UI options are retained through the same scalar delegation path.

Supported branch assertions include scalar type, numeric bounds/multipleOf,
string length/pattern, nested supported combinators, and pure resolvable references.
Types may be explicitly declared on the enclosing schema or conservatively
inferred from agreeing immediate branches. Choices, branch formats or semantic
annotations, named branches, structural schemas, custom keywords, ambiguous types,
and reference siblings retain existing specialized/combinator presentation.
Inferring more complex equivalent presentations remains a follow-up.

Browser regressions failed before the fix in each family. They now cover one
input without branch UI, anyOf's disjoint numeric ranges, oneOf's exclusive
multipleOf matching, validation-only allOf, committed edits and validation
recovery. Existing object branch forms remain covered by their regression suites.

Shared example added: Scalar composition (validation without branch forms), available
in all three demos. It covers referenced annotation-only allOf, disjoint anyOf
ranges, exclusive oneOf multiples, invalid incoming data, enclosing bounds,
validation-only allOf bounds, and inferred string alternatives. Field descriptions
and the example README list valid/invalid edits; the demo's data/error views expose
committed values and full-schema validity.

## Scalar composition error presentation

Fixed in all three Svelte sets: delegated scalar compositions use scoped error
presentation that retains same-path validator failures which core's branch-form
filtering can suppress. Failed anyOf/oneOf alternatives produce a localized
summary; nested alternative details do not appear as simultaneous requirements.
Independent enclosing constraints and ordinary allOf failures remain visible.
Core errors and additionalErrors are not mutated or duplicated.

The browser regression reproduced missing visible anyOf/oneOf feedback before
the fix. All three sets now cover accessible invalid state, visible summary text,
correction, translation, ValidateAndHide, and preservation/removal of host errors.
Message fallbacks use composition.noMatch and composition.multipleMatches;
existing core error translation/custom-message hooks remain applicable.

## dependentRequired error routing

Verified against the installed @jsonforms/core getControlPath: an error at
/order with params.missingProperty billingAddress maps to order.billingAddress
for keyword dependencies, but only order for dependentRequired. The inspected
core getInvalidProperty switch handles dependencies and does not include
dependentRequired. This is distinct from validator support for the newer dialect.

Follow-up: add draft-2019-09/2020-12 integration tests and normalize routing in an
appropriate adapter or upstream core change. Verify missing-field feedback,
object-level fallback, nested paths, and unchanged structured validator errors.
The scalar-composition fix does not change dependency routing.

### Scalar error localization and overrides verified

Scalar composition feedback preserves prelocalized AJV and ajv-errors messages
unless explicitly overridden. The explanatory English fallback replaces only
stock AJV English text, not custom/localized validator messages.

Tests cover combined control error.custom, field-specific error.oneOf,
global error.oneOf, message-text translation, composition summary keys, and a
host translateError callback. Integration tests use the extended createAjv
profile with bg-BG language fallback and translated ajv-errors errorMessage,
then verify that control catalog overrides still take precedence without
mutating the validator's errors. Browser regressions cover all three sets.

## Mixed array-item type clearing

Fixed across Shadcn, Skeleton, and Flowbite: the type selector cannot clear an
array item's type. The renderer detects the containing array from the current
data path, hides the clear affordance, and guards both explicit clear and empty
selection callbacks. Normal type replacement and explicit null values remain
supported; array deletion stays with the owning array action.

Previously the clear callback wrote undefined at the item path. Unsetting an
index could leave a sparse slot that serializes as null but is not actual null;
validation rejected it and tree iteration skipped it. The fix prevents that
invalid state without interpreting clearing as implicit item deletion.

Regressions cover selecting an actual null leaf with primitive nodes visible,
retained null type selection and data, and absence of an item clear-type button.
Existing mixed-renderer suites cover the surrounding editing and tree behavior.

Tuple presentation update: all three Svelte sets provide a default outer boundary
with `showBorder: false` for compact embedding, and an inner Additional Items
section. Tuple headings/errors no longer use the scalar wrapper whose styling
can mark nested valid labels as erroneous. Browser regressions cover boundary
containment, borderless rendering, and child validity.

Tuple registry summaries implemented in shared TupleField for all three Svelte
sets: per-position Control options.summary/options.detail, object previews,
array previews/count fallback, and selectable non-opening summary text. Existing
registry layouts remain dialog details. The tuple demo includes registry entries;
browser tests cover previews, detail selection, and no writes on display/open.


## Tuple detail-dialog Empty contents action

Implemented in shared TupleField for all three Svelte sets via the themed
dialog actions snippet, reusing the existing Empty contents action, translations,
and composite restriction helper. Tuple options flow to each position; selected
registry Control options may override the defaults.
Objects become {}, arrays become []; never remove a fixed position or write
undefined. Whole-tail deletion stays with Additional Items.

Regression coverage includes both value types, unchanged array length and neighboring
positions, absent/already-empty values, readonly/disabled and disableRemove,
position-level required/minProperties/minItems/contains restrictions, and
restrict false allowing validation errors. Verify opening alone performs no
write and that Empty contents remains a live edit when Done closes the dialog.
The tuple example includes unrestricted and restricted complex positions.


## Composite and tuple dialogs: opt-in actions and cancellable drafts

Supersedes earlier live-editing findings for the three Svelte sets. Shared
useDetailDialog provides a private core/data context, local validation, and a
single scoped update on Done. Cancel and dismissal discard edits. Empty/Remove
are hidden unless showEmptyButton/showRemoveButton is true. Contextual removal
and restriction checks still apply. UI labels use okLabel/cancelLabel/emptyLabel/
removeLabel with translator fallback; default keys use composite.*.
Tests cover cancelled typing, optional actions, emptying/removal commit versus
discard, translated label overrides, and unchanged acceptance. Other framework
implementations require separate parity work; these changes do not modify them.


## Composite-dialog action wording and tooltips implemented

The spec now uses Apply/Cancel and optional Clear/Remove, retaining okLabel,
cancelLabel, emptyLabel, and removeLabel. All three Svelte sets now use composite.apply/Apply and Clear/Remove labels,
with localized composite.applyTooltip, cancelTooltip, emptyTooltip, and
removeTooltip guidance. Tooltips appear on hover and keyboard focus and are
associated with buttons via aria-describedby. Remove has destructive styling.
Browser tests verify translated tooltip text, focus/hover visibility, and the
existing draft lifecycle with the updated button names.

The shared dialog implementation already flushes registered debounced changes
before acceptance and cancels them on dismissal or explicit empty/remove actions.
The spec now spells out the portable lifecycle and further conformance scenarios,
including asynchronous completion, nested cancellation, and reopening sessions.


## Mixed-tree deletion selection fixed

All three Svelte deletion handlers now use shared selectionAfterDelete.
Descendant matching requires a dot-segment boundary, preventing item/itemCode
and index 1/index 10 collisions. Removing an earlier array item rebases the
selected surviving item and descendant path; deleting the selected subtree
selects its surviving parent. Search and leaf visibility remain unchanged.
Browser regression tests reproduce the prefix-property failure and verify edits
continue on the retained target. Shared unit cases cover array shifts, nested
descendants, root arrays, selected-subtree deletion, and unrelated paths.
External replacement identity tracking is not inferred by this helper.


## Mixed tree ambiguous keys and inherited readonly: reproduced and fixed

Confirmed both reported Vuetify failure modes in Shadcn, Flowbite, and Skeleton
with browser regressions before editing production code: deleting literal a.b
modified nested a.b, bracketed keys also misaddressed data, and deleting a child
under a readOnly object succeeded with restrict either true or false.
Four new safety cases failed in each set before the fix.

Unsupported names now receive opaque tree identities, retain their labels, and
have no edit/rename/delete path. Selecting one shows localized
mixed.unsupportedPath guidance. Containing complex detail editors are readonly
when their subtree contains unsupported keys; safe nodes remain independently
editable. This remains a safe fallback for literal dots. Brackets are now
supported using core 3.9.0-alpha.1 or newer (see below).

Shared permission resolution propagates readOnly through ancestors, refs,
allOf, array items, and matching property schemas. Tree controls and actions
respect it, and mutation handlers recheck current permissions, including after
a delete confirmation was opened. Tests cover preserved data, disabled child
editing, guidance, delayed confirmation, and shared schema/path cases.


## Literal bracketed additional-property names: fixed

The dependency catalog now requires JSON Forms core 3.9.0-alpha.1 or newer,
including the literal dot-segment update handling from dc02a1c7. Add/Rename
accept brackets while retaining schema propertyNames validation and duplicate
checks. Brackets no longer trigger the mixed-tree unsupported-path fallback.
Mixed-tree parent/key extraction and data lookups, tuple updates, and composite
dialog lookups use literal path segments. Literal dots still need the fallback.
Regression tests reproduce rejected names and misaddressed nested edits before
the fix, and cover Add, Rename, nested edits, numeric object keys, and mixed-tree
deletion without touching a similarly named array item in all three sets.


## Literal dotted and empty additional-property names: implemented

All three sets use an isolated root editor for dotted and empty dynamic keys,
then update the parent object with the exact key. Add/Rename preserve whitespace
and allow any name permitted by the schema, subject to collision checks. Safe
own-property creation also supports `__proto__`. Add flushes debounced name
changes before reading the name. Other direct-path callers retain their safety
restrictions. The former mixed-tree view-only limitation is superseded by the
literal-node editing implementation below.

Five dotted-name browser regressions failed before implementation. Verification
passes 75 structural/browser cases per set and 77 shared tests, including nested
literal edits and clearing, Add/Rename/Delete, empty and whitespace names,
Unicode and special keys, reference validation and readonly behavior. Shared
and all three renderer package type checks pass. The literal-properties demo
includes dotted and empty keys alongside the bracketed and numeric examples.


## Mixed tree literal-key editing: implemented

Shadcn, Flowbite, and Skeleton now distinguish exact key segments with internal
encoded node IDs. Dotted/empty descendants use isolated selected-node editors;
editing, type changes, Rename, and Delete update exact parent keys through the
mixed renderer root. Empty names display as `""`. Selection survives rename and
filtering. Readonly inheritance and restricted parent-size checks use decoded
segments and the actual parent schema. Prototype-named own properties are copied
safely, and missing ancestors are never recreated by obsolete value updates.

The user's nested empty-key case and dotted-key collision tests reproduced
three failures before the fix. Regression coverage includes the supplied schema,
name-preserving rename, type changes, schema-declared literal nodes, readonly
ancestors, parent minProperties, and ordinary mixed-tree navigation. Aggregate
forms that delegate declared literal scopes to ordinary Controls remain
view-only; selecting each tree node provides safe editing instead.

## Dynamic properties matching multiple patterns: implemented

Flowbite, Shadcn, and Skeleton now use the shared additionalPropertySchema resolver.
It evaluates all patterns, preserves their conjunction, and uses additionalProperties
only when no pattern matches. Compatible scalar constraints form one editor;
structural or conflicting schemas retain allOf. Referenced matching schemas are
resolved against the root, without mutating the original validation schema.

Three regression cases failed in each renderer set before the fix. Browser coverage
now checks both pattern orders, true/false/schema fallbacks, native numeric bounds,
validation routing, rename reselection without coercion, and incompatible incoming
values. Shared unit coverage checks strongest bounds, empty regexes, references,
number/integer intersections, and conservative conjunction fallback. The shared
Additional properties (overlapping patterns) demo is available in all demo apps.

## Rename to an incompatible numeric schema: implemented

Integer and Number controls in Flowbite, Shadcn, and Skeleton preserve and show
incompatible non-null values as JSON in a compact tooltip beside the native
numeric input. Hover or focus the hint icon to inspect the stored value. Native
input display behavior is preserved; there is no extra message row. The JSON
representation distinguishes numeric-looking strings from numbers.
The hint is linked through aria-describedby; type errors use normal validation.
Readonly values remain visible. Explicit numeric replacement updates the value
and clears the hint.

The explanation uses numeric.incompatibleValue; Flowbite's incompatible-value
clear action uses numeric.clearValue. Both use the standard translation callback.
RenameVisibility.svelte.spec.ts covers rename/error routing, visible raw data,
correction, readonly numeric strings, and translated explanations in every set.
The three visibility regressions failed before the fix and now pass.
