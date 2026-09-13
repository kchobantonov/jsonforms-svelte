# Base renderer-set specification

## Project boundary and compatibility

The base project supplies controls, layouts, presentation labels, array/object
renderers, and table cells. It must work without a demo or a web-component
wrapper. Use the chosen UI toolkit's real components where available, with
focused renderer implementations and separately defined selection registrations.

The minimum coverage target is the official JSON Forms Vuetify renderer family,
not just primitive inputs. The upstream [controls registry](https://github.com/eclipsesource/jsonforms/blob/master/packages/vue-vuetify/src/controls/index.ts),
[complex registry](https://github.com/eclipsesource/jsonforms/blob/master/packages/vue-vuetify/src/complex/index.ts),
and [layouts registry](https://github.com/eclipsesource/jsonforms/blob/master/packages/vue-vuetify/src/layouts/index.ts)
were consulted on 2026-09-12. These are moving references: each implementation
must record its tested JSON Forms version/revision and coverage exceptions.
A local fork's extra behavior must not be described as upstream behavior.

This is a target contract for new sets, not certification that every existing
set implements every requirement. The UI language is defined in
[UI schema](ui-schema.md), [layouts](layouts.md), and
[presentation](presentation.md). Repository additions such as column sizing
and collapsible Groups are explicitly extensions even when shipped in a base
package. Packaging location does not make an option part of upstream JSON Forms.

## Required coverage

All data-bound entries below use `type: "Control"`; their bound JSON Schema and
options select the renderer. Display names such as Textarea are not additional
UI-schema discriminators.

| Family | Required variants and selection |
| --- | --- |
| Text | String, multiline (`options.multi: true`), password (schema format), masked string (`options.mask`) |
| Boolean | Checkbox; toggle with `options.toggle: true` |
| Numeric | Integer, number; range/slider with `options.slider: true` and applicable numeric bounds |
| Temporal | String schemas with `date`, `time`, or `date-time` format |
| Single selection | `enum`, titled `oneOf` constant choices; radio variants with `options.format: "radio"` |
| Suggested text | String-or-enumeration `anyOf`, allowing free text as well as suggestions |
| Multiple selection | Arrays whose items define enum/constant choices, preserving an array of typed values |
| Structured data | Objects, arrays, array detail/list/table presentations, ListWithDetail |
| Composition | `allOf`, `anyOf`, `oneOf`, including tab presentation where supported |
| Mixed data | Multiple allowed types and unconstrained schemas, with an explicit type choice when needed |
| Layouts | VerticalLayout, HorizontalLayout, Group, Categorization, Category, stepper variant |
| Presentation | Label |
| Cells | Primitive, boolean/toggle, temporal, enumeration and titled-choice editing in tables |

Publish a coverage table including tester conditions, priority, supported options,
examples, and tests. Specific registrations must win over generic fallbacks;
adding a mixed renderer must not intercept ordinary object or enum forms.
Array layout renderers are implementations of a Control, not necessarily a new
serialized `ArrayLayout` element. See the vocabulary reference before inventing types.

## Control behavior

A control presents a resolved label, required indicator, input, description, and
validation feedback. `label: false` hides the visible label while retaining an
accessible name. Required status comes from the parent schema's `required`
array. Clear and selection actions must preserve JSON types: numeric enum values
remain numbers, and `false` and `0` are populated values.

Clearing an optional scalar should report absence through the host's normal
update mechanism, not insert an empty string during model mapping. Dynamic
object keys require the explicit retention behavior below. An absent value must
not select the first enumeration entry or composition branch merely because it
is required. Schema defaults may be applied by the host's documented defaulting
policy; rendering is not permission to mutate data.

Date/time controls must distinguish display formatting from saved formatting.
Locale changes must not change the serialized value, timezone, or precision.
Document accepted date/time formats and invalid-draft handling. Use an actual
picker where the toolkit supplies one. Masks and numeric input formatting must
not silently change the schema's value type.

## Objects, arrays, and composition

Object children resolve against their own schema and data contexts, including
local references. Generate an appropriate detail layout when none is supplied;
explicit detail UI schemas and matching detail registrations take precedence.
Normal objects should show their fields without an unnecessary second form frame.

Array operations must use stable item paths, typed values, and the host's
restriction policy for minimum/maximum item counts. Adding an item may create a
type-appropriate initial value; do not claim that this necessarily satisfies
arbitrary schema constraints. Reordering must preserve item data. Empty arrays,
primitive items, object items, and unconstrained items need meaningful views.
List/detail selection must remain valid after deletion and external updates.

Composition renderers must resolve references and preserve applicable sibling
constraints. `allOf` does not mean that a value has multiple competing types.
`oneOf` and `anyOf` must not discard existing data on initial rendering. User
branch changes need a documented data-retention policy and validation feedback.
Mixed controls should dispatch the selected concrete type through normal
renderers. Never duplicate the label or replace specialized object, selection,
or composition renderers with a generic type selector.

## Dynamic object properties and mixed-type views

This repository's richer dynamic-property behavior is an additional compatibility
requirement, not a claim that every upstream release supplies the same UI.

- Add/rename validates duplicate names, `propertyNames`, matching
  `patternProperties`, and `additionalProperties` using the host schema validator.
- A rename preserves the value and updates the key atomically. It does not coerce
  data to a newly matching pattern; validation reports incompatibility.
- Explicit delete removes a key. Clearing its value retains a dynamic key using
  the declared default/type policy; it must not accidentally perform deletion.
- Existing extra keys remain visible even when creation of new keys is restricted.
- External updates preserve usable selection and focus wherever possible.

For deeply structured mixed data, a searchable tree and a detail pane are the
recommended layout. Keep selection distinct from expansion; retain ancestor
paths when filtering; show the concrete type; provide breadcrumbs and accessible
add/rename/delete actions. A nested object opens in the existing detail view
instead of recursively creating another entire tree workspace. Primitive mixed
values should use a compact type selector and the normal input with one label.

## Conformance

Test through the complete renderer registry: renderer precedence, typed enum
values, optional clearing, readonly/disabled interaction, translated labels,
reference resolution, array mutations, dynamic key constraints, and external
updates. Include keyboard and browser/native UI tests for interactions that
cannot be proved by model-only tests. The layout specification supplies exact
geometry cases for horizontal sizing.
