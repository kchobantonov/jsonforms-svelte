# UI-schema language reference

## Document and binding

A UI schema is a tree of JSON objects. Each element has a case-sensitive `type`.
A JSON Schema describes allowed data; the UI schema describes presentation and
binding. They are separate models. A host may omit the UI schema and request
JSON Forms' generated presentation. Rendering must not persist the generated
layout back into the supplied model without an explicit host operation.

| Member | Meaning |
| --- | --- |
| `type` | Renderer discriminator; required |
| `scope` | Control's schema reference, e.g. `#/properties/address/properties/street` |
| `label` | Display label on elements that support it; Controls also accept `false` |
| `text` | Label element's presentation text |
| `elements` | Ordered children for layouts and supported composition elements |
| `options` | Renderer options; names and JSON types are significant |
| `rule` | Conditional visibility or interaction behavior |
| `i18n` | Translation key/prefix consumed by the host translation service |

Scopes identify schema locations, not arbitrary data paths. Escape JSON Pointer
segments (`~` as `~0`, `/` as `~1`). Array detail controls operate in the current
item context. Reusing a scope in two Controls shares data while retaining each
Control's independent presentation options. A scope containing `$ref` must be
resolved with the host's schema context; do not fetch resources inside widgets.

## Element vocabulary

| Type | Members beyond common fields | Classification / reference |
| --- | --- | --- |
| `Control` | `scope`, optional `label` | [Base controls](base-renderer-set.md) |
| `VerticalLayout` | `elements` | [Layouts](layouts.md); no visible label contract |
| `HorizontalLayout` | `elements` | Layouts; placement widths are an extension |
| `Group` | `label`, `elements` | Layouts; collapse/indicator options are extensions |
| `Categorization` | Category children | Layouts; tabs or supported stepper variant |
| `Category` | `label`, `elements` | Child of Categorization, not a data property |
| `Label` | `text` | [Presentation](presentation.md) |
| `ListWithDetail` | `scope`, optional detail options | Bound array with list/detail navigation |
| `Separator`, `Spacer`, `ImageView` | See presentation options | Additional presentation vocabulary |
| `Button` | `label`, `action`, `params`, optional `icon`, `color`, `script` | [Extensions](extended-renderer-set.md) |
| `TemplateLayout`, `Template`, `Slot` | Template-specific members | Extensions; declared template-engine profile |

A renderer implementation class name is not automatically a valid `type`.
In particular the portable splitter spelling is an existing horizontal/vertical
layout with `options.variant: "splitter"`, not an assumed `SplitLayout` type.
Unknown extension elements must produce a diagnosable fallback without changing
the source model.

## Control options

These are the shared option vocabulary and applicability rules. A renderer set
must publish supported subsets and defaults; toolkit-specific overrides are not
portable. Options do not replace JSON Schema validation constraints.

| Option | Value / applicability | Omitted behavior |
| --- | --- | --- |
| `multi` | Boolean; string input | Single-line input |
| `toggle` | Boolean; boolean input | Checkbox |
| `format` | `"radio"` for enum/titled choices; `"code"` in code extension | Normal schema-selected renderer |
| `slider` | Boolean; bounded numeric input | Numeric input |
| `mask` | Mask configuration; string only, grammar must be declared | Unmasked input |
| `clearable` | Boolean; controls supporting optional-value clearing | True; interaction state still applies |
| `readonly` | Boolean | Inherit host/schema/rules |
| `placeholder` | String | No explicit placeholder |
| `focus` | Boolean | No requested initial focus |
| `showUnfocusedDescription` | Boolean | Follow host description policy |
| `hideRequiredAsterisk` | Boolean | Show required indicator |
| `detail` | Inline detail UI schema or supported generation mode | Registry/generation fallback |
| `elementLabelProp` | Property used for array item labels | Generated item labels |
| `showSortButtons` | Boolean; arrays | Renderer default ordering UI |
| `collapseNewArrayItems` | Boolean; array detail presentation | Follow host expansion policy |
| `initiallyCollapse` | Boolean; collapsible array/object presentation | Follow renderer expansion policy |
| `hideArrayItemAvatar` | Boolean; array item decoration | Show supported item decoration |
| `hideArraySummaryValidation` | Boolean; arrays | Show applicable summary feedback |
| `variant` | `"stepper"` on Categorization; `"splitter"` on layouts; `"ag-grid"` on arrays | Standard renderer |
| `restrict` | Boolean; constrained array operations | Host restriction policy |
| `dateFormat`, `timeFormat`, `dateTimeFormat` | Display format strings; temporal controls | Renderer-documented format |
| `dateSaveFormat`, `timeSaveFormat`, `dateTimeSaveFormat` | Serialization format strings where supported | Renderer-documented canonical format |
| `columns` | `"auto"`, null, or integer 2–16; direct HorizontalLayout children | Auto; see exact allocation contract |

`enum`, `oneOf`, `minimum`, `maximum`, `minLength`, `maxLength`, `pattern`,
`required`, `items`, and `type` belong in JSON Schema. For example multiline is
an independent UI option; it must not be offered as a boolean-control feature.
Type unions such as `["string", "number"]` are JSON Schema, not a Control type.

```json
{
  "type": "HorizontalLayout",
  "elements": [
    { "type": "Control", "scope": "#/properties/name", "options": { "columns": 4 } },
    { "type": "Control", "scope": "#/properties/notes", "options": { "multi": true } }
  ]
}
```

## Rules

A schema-based rule has an `effect` and `condition` containing a `scope` and a
JSON Schema in `schema`. `failWhenUndefined: true` makes an undefined scoped
value fail the condition. Otherwise validation of undefined follows the host's
JSON Forms contract. Evaluate conditions as schemas, not truthiness expressions.

```json
{
  "type": "Control",
  "scope": "#/properties/notes",
  "rule": {
    "effect": "SHOW",
    "condition": {
      "scope": "#/properties/enabled",
      "schema": { "const": true },
      "failWhenUndefined": true
    }
  }
}
```

SHOW/HIDE control visibility; ENABLE/DISABLE control interaction. READONLY and
WRITABLE require a runtime that declares those effects. They must not be
silently treated as equivalent to disabled/enabled, nor override host restrictions.
A single `rule` is not an array of independent effects. Compound schema conditions
may use `allOf`, `anyOf`, `not`, and other supported schema keywords. Additional
condition representations require a separately declared compatibility profile.

## Localization and extension boundaries

The host owns supported locales, translation catalogs, and fallback policy.
Changing locale changes display strings, not scopes, keys, enum values, or data.
Missing translations fall back to meaningful labels rather than internal keys.
A UI schema's `i18n` prefix is distinct from the host's catalog storage format.

Dynamic expressions such as `:language`, script bodies, template markup, and
namespaced widget options belong to explicit extensions. A Kotlin/native set
can implement the portable language without claiming JavaScript or DOM template
execution. Preserve unrecognized fields; never serialize runtime widget state
into the UI schema.
