# Rules editor and canvas indicator

Status: initial implementation now includes the Rules Group, inspector-only custom renderer registry, all six effects, single-field visual predicates, explicit JSON Apply/Revert, remove/undo, and the branch marker. The sections below retain the broader target design. Existence operators, compound visual condition trees, a searchable scope tree, and nested array-detail evaluation remain follow-up work; advanced schema conditions can be edited losslessly as JSON now.

The current section opens expanded. Marker activation reopens/focuses it, even after manual collapse. The initial visual predicates are equals, one of, pattern, minimum and maximum. Match status uses the installed core evaluator for root form context and its default AJV; Preview is authoritative for inherited state and host-specific validation configuration. Source mode always preserves advanced JSON. Runtime control bindings now guard read-only dispatch and text-input props expose the read-only state without treating it as disabled.

## Properties section

Add a **Rules** collapsible Group to Properties for a selected UI element, including Controls, layouts, Categories and presentation elements. Place it after Appearance/Layout and before Validation/Translations. Use the shared native JSON Forms inspector and the existing Group renderer with `collapsible` and `showDataIndicator`. The section's dot means an authored `rule` exists, not that its condition currently matches. Keep this dot visible when expanded or collapsed.

A schema field with no UI occurrence has no Rules section. For a field used several times, edit only the selected UI occurrence's rule. Its other occurrences and shared JSON Schema remain unchanged.

With no rule, show a localized **Add rule** action. Opening the section or pressing Add starts a local draft; it must not save a default rule automatically. With a rule, show a short summary such as “Show when Country equals Bulgaria”, the visual editor, a JSON toggle, and a trash icon with a Remove rule tooltip. Removing a rule supports Undo/Redo as one document command. Incomplete drafts offer Discard/Keep editing through a shadcn dialog.

JSON Forms stores one `rule` per UI element, with one effect and a condition. Do not imply that several independent effects can be added to the same element. The supported effects are SHOW, HIDE, ENABLE, DISABLE, READONLY and WRITABLE; a schema-based condition validates data at its scope. A missing scoped value can match unless `failWhenUndefined` is true. The installed `@jsonforms/core` 3.8.0 declares all six effects and implements `evalReadonly`; the [upstream RuleEffect definition](https://github.com/eclipsesource/jsonforms/blob/master/packages/core/src/models/uischema.ts) agrees. The prose rules guide omits READONLY/WRITABLE, so use the installed enum and runtime as the implementation contract.

## Visual controls

Use JSON Schema/UI schema definitions for the inspector controls, with registered native Svelte editor renderers only where the scope picker or condition tree requires them. Compose those specialized controls from shared shadcn components. Do not create an independent handwritten property form.

| Control | Behavior |
| --- | --- |
| Effect | Required single select: Show, Hide, Enable, Disable, Read only, Writable. Display the stored effect as the summary verb. |
| Field/context | Searchable schema-tree picker, including objects and arrays, plus “Entire form”. Display friendly names and retain an escaped schema pointer. |
| Condition | Type-aware operator and value controls; an explicit JSON option handles arbitrary schema conditions. |
| Missing values | Checkbox “Do not match when the field is missing”, mapped to `failWhenUndefined`. Default true for new field conditions; preserve imported omission or false. |
| Preview result | Separate read-only status: Matches, Does not match, or Cannot evaluate. Never confuse matching with visibility/enabled state. |

The initial visual operators are equals (`const`), one of (`enum`), string pattern, and numeric minimum/maximum with inclusive/exclusive bounds. Values retain their JSON types: false is a boolean, zero is numeric, and null is distinct from an absent value. For union-typed properties, provide an explicit value-type choice. Restrict operators to compatible types without silently changing existing conditions.

Add “exists” and “does not exist” using the containing object scope and `required`, with a defined policy for missing ancestors. Do not serialize an existence check as a test against null or an undefined JSON value. Array contains and length conditions follow after the first slice. Form-wide AND/OR/NOT conditions compile to `allOf`/`anyOf`/`not` within a root-scoped condition schema. Include required ancestors for predicates that demand presence. Do not place full form-data predicates inside a field-scoped condition accidentally.

Use the pinned JSON Forms evaluator and the same AJV instance/options and data context as Preview for result status. SHOW/HIDE, ENABLE/DISABLE and READONLY/WRITABLE have opposite outcomes when their condition does not match; the result display must report both the match and the resulting local effect. Ancestor rules and read-only state can still affect the final rendered state.

READONLY prevents value changes while allowing applicable interactions such as focus, selection and copying; it is distinct from DISABLE. WRITABLE applies the inverse read-only condition. Reuse core `evalReadonly` and renderer read-only propagation rather than treating either effect as enablement. Verify actual behavior for text, selection, object and array renderers; declaring the enum alone does not prove each renderer honors it. Do not override a disabled ancestor or host constraint merely because a rule evaluates to writable.

## Inspector custom renderer registry

The rule editor is a native Svelte custom JSON Forms renderer registered specifically with the JsonForms instance used by Properties. Establish `editor/inspector/renderers/index.ts` as the registration point for editor-specific renderers, including the rule editor and scope/condition controls. Each registration exports a component and a ranked tester, following the existing renderer conventions.

Compose that instance's `renderers` from the editor-specific registrations and the shared `shadcnRenderers`; retain shared `shadcnCells`. Give specialized testers an explicit inspector-only UI-schema option (for example `options.editorControl: "rule"`) and a higher rank than the generic matching control. Testers must not claim ordinary form controls. Inspector UI-schema options are metadata for the inspector's own form and never leak into the user's authored UI schema.

The custom renderer binds to the selected element's rule draft through the normal JSON Forms data/change flow. It receives schema context, scope resolution, localization and draft commands through editor context. Reuse native shadcn components supplied by the same host as the rest of Properties. Do not embed the renderer web component inside this custom inspector renderer. Preview and canvas runtime registries remain separate from the inspector registry.

Split registration, draft state, condition conversion and visual components into their respective modules. Other editor-specific inspector widgets can register here without adding special-case rendering branches to PropertyPanel or modifying shared shadcn sources.

## JSON and synchronization

The Rules JSON view edits the whole `rule` object in Monaco, with schema-aware completion for effect, condition, scope and condition schema. Use explicit Apply/Revert icon actions and translated tooltips at its top, consistent with JSON Model.

Use one local rule draft for visual and JSON modes. Visual edits update its JSON projection immediately; Apply validates and commits the complete rule as one undoable command. Revert restores the last committed rule. The explicit draft boundary prevents half-entered conditions changing Preview. Follow the existing editor draft lock: keep selection/navigation available, but require resolving the draft before other model mutations or changing the selected rule target.

Switching to JSON never drops unsupported keywords. Switching back offers visual editing only if the complete condition can be represented losslessly. Otherwise show a read-only summary and keep JSON editing available; do not simplify automatically. Preserve unknown rule/condition fields when changing supported properties. Recognize imported non-schema condition forms only when an adapter supports their exact semantics.

Invalid JSON or an invalid rule shape cannot apply. Imported unresolved scopes or unsupported conditions remain in the document, have diagnostics, and can be repaired in JSON. The marker still indicates their presence. External schemas resolve only through host-supplied resources.

## Marker in Form Definition

Use a small **GitBranch** icon beside the element label/title, distinct from the required asterisk. Example: `Address * [branch icon]`. If there is no visible label, put it in the element's authoring toolbar. It appears whenever that UI element owns a `rule`, including imported rules, whether selected or hovered or neither.

Make it an icon button with a translated tooltip (“Rule: Show when …”; fallback “Edit rule”) and accessible name. Activating it selects that exact occurrence, opens Rules in Properties and focuses its first control. Stop event propagation so it does not select an ancestor or start dragging. Use normal theme foreground/muted-foreground contrast rather than color as the sole signal. A diagnostic icon/state can additionally indicate a broken rule.

This is editor chrome only: never save the icon or a marker flag in the UI schema, and do not add it to the public form renderers or normal Preview. Design keeps rule-hidden/disabled elements selectable and draggable, including inactive Categories. The marker is not a substitute for actually evaluating rules in Preview.

Do not show an inherited-rule marker as if a child owns a rule. An optional tooltip/status can separately explain that an ancestor controls it. The marker must not increase field width or obscure the delete action.

## Modules and implementation order

1. `editor/rules/types.ts`, `validation.ts`, `conditions.ts`: rule types, validation, lossless visual projection and compilation. Add the SetRule/RemoveRule document commands and unit tests first.
2. `editor/inspector/rules.ts`: JSON Forms definitions for rule properties and operator/value applicability. Reuse inspector registration and context conventions.
3. `editor/components/Inspector/RulesSection.svelte`, `RuleConditionEditor.svelte`, `RuleSource.svelte`: small components for section, condition editing and Monaco draft controls. Reuse existing Group and source/draft machinery.
4. `editor/components/Canvas/RuleIndicator.svelte`: presence marker, localized summary and precise occurrence selection. Keep rule evaluation out of CanvasNode.
5. `editor/rules/evaluation.ts`: context-aware Preview status using the runtime evaluator; add nested/detail and registry scope tests before claiming those contexts supported.
6. Extend operators and form-wide combinations only after simple conditions, advanced JSON preservation and all six effects pass end-to-end tests.

## Acceptance tests

- Create, apply, edit, revert, remove, undo and redo a rule. Monaco and the saved model agree after each commit.
- Exercise all six effects with both matching and nonmatching Preview data, including false, zero, null and absent fields.
- Required asterisk and rule marker coexist; markers work on unlabeled elements and layouts, remain visible without hover, and open the correct inspector occurrence by mouse and keyboard.
- Duplicate a field in two places; adding a rule to one affects only that UI occurrence. Unplaced schema fields expose no rule editor.
- Rule-hidden Controls and Categories remain editable in Design while Preview obeys the rule.
- Apply advanced condition JSON, visit visual mode, and return without losing keywords or changing semantics. Syntax failures preserve the committed rule and draft text.
- Rename a condition field, including escaped names and nested scopes; update known references atomically. Diagnose unresolved or opaque references rather than guessing.
- Run browser tests in native and web-component integrations, light/dark themes and a non-English editor locale. Check tooltips, focus restoration, disabled draft-lock actions and actual Preview outcomes.
