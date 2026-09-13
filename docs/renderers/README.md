# Renderer specifications

These documents define the observable behavior of compatible JSON Forms renderer
sets. They are implementation contracts, independent of programming language,
application framework, rendering engine, and UI toolkit. They describe what
users see and how the form model behaves, not which components or algorithms an
implementation must use.

A renderer set should implement the common contract and identify which renderer
contracts it supports. Support for a renderer includes its documented options,
interactions, and conformance scenarios. The project contracts define the target coverage for new implementations; they
are not an assertion that every existing implementation already passes every
conformance scenario. Toolkit-specific option bags require separate profiles.

| Specification | Scope |
| --- | --- |
| [Base renderer set](base-renderer-set.md) | Core project boundary, upstream coverage target, controls, structured data, and cells |
| [Extended renderer set](extended-renderer-set.md) | Additional controls, actions, splitters, templates, code and grid profiles |
| [Web component](web-component.md) | Browser properties/events, styles, assets, lifecycle, and native parity |
| [Demo](demo.md) | Workspace layout, shared examples, JSON drafts, settings, and navigation |
| [UI-schema language](ui-schema.md) | Element vocabulary, binding, options, rules, and extension boundaries |
| [Common contract](common.md) | Models, data binding, rules, configuration, accessibility, localization, and compatibility |
| [Layouts](layouts.md) | VerticalLayout, HorizontalLayout and column sizing, Group, Categorization, and Category |
| [Presentation](presentation.md) | Label, Separator, Spacer, and ImageView |

## Reading the specifications

- **Must** identifies behavior required to claim support for the contract.
- **Should** identifies a recommended default; deviations should be documented.
- **May** identifies optional behavior or an implementation choice.
- Options marked **extension** belong to this renderer contract rather than the
  standard JSON Forms UI-schema vocabulary.
- Defaults apply when no valid option is supplied unless a section states
  otherwise. Invalid values must not silently change the supplied model.

Native widgets, styling, layout mechanisms, and lifecycle management belong to
the implementation. Typography, colors, borders, and exact icon artwork may
follow the platform's design system. Model meaning, sizing semantics,
interaction outcomes, and accessibility requirements should remain consistent.

Each new renderer specification should contain its discriminator and purpose,
applicable schema shapes, supported options and defaults, data effects,
interaction and layout behavior, accessibility requirements, JSON examples,
and observable conformance scenarios. Implementation notes and build instructions
belong in package documentation rather than the specification.

## Provenance and maintenance

The project split adapts the renderer-set-and-demo specification maintained in
the sibling JSON Forms React renderer repository
(`jsonforms-react-renderers/docs/renderer-set-and-demo-specification.md`). Framework/tooling instructions
are intentionally excluded from the portable contracts. The base-set document
links the upstream coverage sources. Changes to serialized elements or options
must update these contracts, shared examples, and conformance tests together.
