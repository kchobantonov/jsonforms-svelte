# Web-component project specification

## Boundary

This project adapts the native renderer API to a browser custom element. It uses
the same base and selected extended registries; it must not implement a second
set of visually approximate controls. It depends on renderer packages, never on
demo applications. This browser contract is separate from the platform-neutral
UI-schema language; non-browser renderer sets need not supply a custom element.

## Inputs and events

Expose data, schema, optional uischema, optional uischemas registry, configuration,
readonly state, validation mode, locale, translations, and additional errors as
properties. Object-valued property assignment must work without stringification.
Document JSON attribute support, attribute/property name mappings, defaults, and
malformed-input behavior; do not assume browser attribute casing preserves camelCase.

Theme/mode, direction, custom styling, and toolkit design-system configuration
are host presentation settings. Changing them must preserve data. Missing
uischema permits generated presentation. Public API documentation must identify
which registries/functions can only be passed as properties, not serialized JSON.

The current wrappers dispatch `change` with the form change payload (data and
validation errors), and `handle-action` for the action extension. Events bubble
and cross shadow boundaries (`composed: true`). Consumers must not need a
framework-specific event subscription. A conformance test must cover an element
upgraded after insertion and listeners attached before its initial change.
Action callbacks/context are runtime values, not a JSON serialization contract.

## Styling and lifecycle

Install real toolkit styles and theme tokens inside the rendering boundary.
Shadow-root dialogs, menus, tooltips, pickers, and portals must retain theme,
stacking, focus behavior, and readable foreground/background colors. Set native
color-scheme appropriately. Host custom styles must not inadvertently replace
required component styles. Global styles must not leak from one instance to another.

Support multiple instances, property updates, removal/reconnection, theme and
locale changes, and resizing. Dispose observers and engine resources on teardown.
Code workers and other assets must resolve after production deployment at a
non-root base path. Native and wrapped forms must produce equivalent data and
validation outcomes for the same schema, UI schema, configuration, and input.

## Verification and delivery

Ship a documented registration entry, public property/event contract, and
standalone consumption example. Test the built artifact in a plain browser host
as well as the demo: nested data edits, generated UI, readonly, custom errors,
localization, theme/RTL, overlays, multiple instances, and extended controls.
Do not use a development-only stylesheet or app alias to make these tests pass.
