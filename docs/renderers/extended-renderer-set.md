# Extended renderer-set specification

## Project boundary

The extended project adds optional capabilities to the base registry. Consumers
must be able to use the base set without loading a grid engine, code engine,
template engine, or action runtime. Extensions reuse base controls, cells,
validation, themes, and data update semantics. They must not depend on a demo.

The following catalog separates portable presentation from capabilities requiring
a declared runtime profile. It describes current vocabulary and target behavior;
it does not promise every extension on every platform. Publish an explicit
capability matrix and unsupported-feature diagnostics.

## Presentation and placement extensions

[Presentation](presentation.md) defines `Separator`, `Spacer` (`options.height`,
default 32 logical units), and `ImageView` (`options.src`, `options.alt`). These
are non-data elements. Current sets register them in base packages; they remain
additional vocabulary rather than upstream standard elements.

[Layouts](layouts.md) defines direct-child `options.columns` for horizontal
placement and Group options `collapsible`, `collapsed`, `showDataIndicator`.
All three Group options default to false. An enabled data indicator remains
visible in both disclosure states. These extensions are implemented by the
shared base layouts and must remain available when extended registries are added.

## Additional controls

| Renderer | Selection / values | Options and contract |
| --- | --- | --- |
| Color | String schema, `format: "color"` | Color widget; preserve declared string encoding, accept ordinary focus/placeholder options |
| Duration | String schema, `format: "duration"` | Duration editing; `showActions` defaults true, optional `okLabel`/`cancelLabel`; preserve serialized duration format |
| File | String with `contentEncoding: "base64"` or `format: "binary"`/`"byte"` | `accept` and schema content metadata; document encoding, size constraints, clear behavior; file choice must produce the declared data representation |
| Null | Schema `type: "null"` | Preserve JSON null; no conversion to the string `"null"` |
| Code | Control with `options.format: "code"` | See code profile below |
| Grid | Array Control with `options.variant: "ag-grid"` | Typed cell edits, array restrictions, validation; see grid profile below |

## Actions

`Button` is a presentation/action element, not a schema-bound input. Its
members are `label`, `icon` (literal glyph/text), `color`, `action`, `params`,
and optional `script`. Semantic colors are `primary`, `secondary`,
`alternative`, `success`, `warning`, and `error`; appearance follows the toolkit.

An action dispatches its name, parameters, originating element, and form context
to the host. Disabled/readonly restrictions must prevent unauthorized mutations.
Show pending state for asynchronous actions and avoid duplicate activation.
The host owns application effects. Inline script execution is a separate
JavaScript-runtime capability, not a portable requirement. Hosts must explicitly
choose a trust/execution policy for scripts and executable templates.

```json
{ "type": "Button", "label": "Submit", "action": "submit", "params": { "intent": "save" } }
```

## Splitter layout

Use `HorizontalLayout` or `VerticalLayout` with `options.variant: "splitter"`.
Children become resizable panes. Vertical splitters accept `height` and
`minHeight`; browser implementations may accept CSS lengths, while other
platforms must document equivalent units. Resizing is view state and must not
change form data. Handles need visible focus, keyboard operation, minimum sizes,
and suitable orientation semantics. A splitter's pane sizing is distinct from
the fixed 16-column horizontal contract; implementations must document precedence
rather than interpret pane drags as edits to `options.columns`.

## Code-engine profile

The browser profile uses a real Monaco instance. `language` selects its language;
`:language` resolves a data path against root data, taking precedence when it
resolves to a nonempty string. Selection requires a string Control and a string
`language` or `:language` option, or a Control with `language: "json"` and
`convertJson: true`. Language changes
update the existing model. With `convertJson`, parse successful edits into typed
JSON and preserve invalid text as draft instead of replacing valid data.

The portable configuration namespace is `monaco`, including `rows`, `autoGrow`,
`minRows`, `maxRows`, `options`, and `initActions`. A set must list defaults and
any legacy UI-toolkit aliases separately. Host theme changes must respect an
explicit custom theme. Layout changes must resize the engine; maximize/restore
must preserve text, selection, and focus. Dispose owned models/listeners/workers
without changing unrelated code-engine instances. Package workers and styles for
normal DOM and shadow-root hosting.

## Grid profile

An AG Grid integration uses the real grid and normal registered cells; an HTML
table is not an equivalent implementation of that profile. Shared options include
`agGridOptions`, `showSortButtons`, `hideArraySummaryValidation`, `gridHeight`
(default `"400px"`), and `gridWidth` (default `"100%"`). Runtime-specific grid
options are explicitly nonportable. Document the selection predicate and
precedence so enabling a grid registry does not unexpectedly replace all arrays.

## Templates and slots

| Type | Members | Meaning |
| --- | --- | --- |
| `TemplateLayout` | `template`, optional `lang`, `elements` | Layout markup in the declared engine; current implementation supports `ractive` |
| `Template` | `name`, optional named `elements` | Instantiate a registered named UI template |
| `Slot` | optional `name`, fallback `elements` | Place supplied slot content or fallback elements |

Template lookup belongs to the supplied UI-schema registry. Preserve the current
schema/data context when dispatching named children and slots. Missing templates
must be diagnosable. Template-engine syntax and script APIs need their own
versioned profile; they are not implied by base renderer compatibility.

## Verification

For each extension include an example and full-registry tests for selection,
data types, disabled/readonly behavior, localization, and dynamic updates.
Exercise overlays, splitters, grid/code layout, and cleanup in real browser tests
for the web profile. Test extended registries together with base registrations.
