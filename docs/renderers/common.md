# Common renderer contract

## Inputs and responsibilities

A form consists of a JSON Schema describing data, a UI schema describing
presentation, and a data value. A host may also supply renderer registrations,
validation, locale/translation services, configuration, and enabled/read-only
state. These are logical inputs, not requirements for a particular API shape.

Renderers must interpret their UI-schema element in the current schema and data
context. A Control's scope identifies its schema location; nested object and
array contexts determine the corresponding data location. Container nesting
must not accidentally change a control's binding.

Data controls may emit changes to their bound data. Layout and presentation
renderers must not create, delete, or modify form data merely by rendering,
resizing, changing tabs, collapsing, or expanding. Renderers must not rewrite
the supplied JSON Schema or UI schema.

Renderer selection should be deterministic when registrations overlap. A set
must document its precedence and fallback behavior. Unsupported element types
should produce a diagnosable fallback instead of silently losing content.

## Options and compatibility

Portable element options are supplied in the element's `options` object.
Each renderer specification lists the options it supports and their defaults.
Host-wide defaults may be supported, but explicit element options should take
precedence. Placement options such as horizontal columns have the exact scope
specified by their layout contract.

Unknown options must not be removed or rewritten. A renderer may ignore options
outside its supported contract. Invalid known options should produce a diagnostic
and use a documented fallback where one exists. Toolkit-specific overrides may
be offered as separate extensions; they must not be necessary to implement the
portable behavior.

Changing runtime view state must not serialize incidental details, such as
layout rows, measurements, focus state, or widget identifiers, into form models.

## Rules and interaction state

Renderers must honor applicable JSON Forms visibility and interaction rules in
the current data context. Rule conditions use schema validation semantics,
including the condition's handling of undefined data; implementations should
not substitute language truthiness checks.

Visibility effects are SHOW and HIDE. Interaction effects include ENABLE and
DISABLE, and READONLY and WRITABLE where supported by the host's JSON Forms
rule contract. A renderer set must declare which effects it supports.

Hidden elements must not expose operable controls. Disabled and read-only
elements must prevent user changes to bound data; a visually disabled widget
with a still-active change handler is insufficient. Ancestor and host
restrictions must be respected. Read-only content should remain available for
reading and selection where the platform permits it.

Layout-specific rules define whether hidden children retain any space.
HorizontalLayout explicitly releases hidden children's allocation. State
changes must be reevaluated when the relevant data or host configuration changes.

## Validation, labels, and localization

Controls should show their resolved label, required status, and validation
feedback according to the host's validation policy. A missing value alone must
not justify changing the schema or inserting a default value.

Labels, descriptions, validation messages, and accessible action names should
participate in the host's translation mechanism. Runtime locale changes should
refresh displayed translations without rewriting data or model keys.
Identifiers, scopes, and option values retain their stable serialized meaning.

## Accessibility and presentation

Use suitable platform semantics for controls, groups, tabs, separators, images,
and disclosure actions. Interactive elements must have accessible names and
support keyboard or equivalent non-pointer operation. Focus must be visible.

Hiding or collapsing content must remove its descendants from the active
interaction order. If focus would otherwise remain in unavailable content,
move it to a suitable visible control. Collapse and tab actions should expose
their current state to assistive technology.

Theme changes should preserve readable text, discoverable interactive controls,
and visible focus indicators. Color alone must not convey required status,
errors, or interaction state.

## Common conformance scenarios

A conforming implementation should verify:

1. Editing one control updates the correct nested data location.
2. A layout or presentation update does not alter data, schema, or UI schema.
3. Rule-driven visibility and interaction state respond to data changes.
4. Disabled and read-only controls cannot emit unauthorized user changes.
5. Locale and theme changes preserve the model and interaction state.
6. Unknown options survive unchanged, and invalid known options are diagnosable.
7. Keyboard and assistive-technology users can identify and operate the form.
