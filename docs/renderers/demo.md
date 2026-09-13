# Renderer demo project specification

## Ownership and example source

The demo is a consumer of renderer and web-component projects. Dependencies flow
from demo to packages; packages must never import demo source, configuration,
or styles. Framework-neutral examples belong to a shared example package.

In this repository the source is `packages/jsonforms-svelte-demo-common/src/lib/examples`.
Its `createDemoExamples` combines `getExamples()` from `@jsonforms/examples`
with repository examples. Entries are keyed by stable `name`; custom examples
replace upstream entries with the same name, then the result is sorted by label.
Each renderer demo consumes this factory rather than copying schemas or maintaining
an independent list. A new platform should consume equivalent shared fixtures
and keep toolkit-specific options in an explicit adapter.

Examples include schema, UI schema, initial data, optional detail UI-schema
registrations/configuration, and optional translations/action handlers. Treat
fixtures as immutable: clone editable state and keep originals for Reload.
Callbacks are runtime integrations, not JSON. Unsupported profile-specific
examples should be clearly identified instead of silently misrendered.

## Workspace layout

Use a fixed top header with navigation/brand at the start and compact actions at
the end. Provide a searchable example sidebar below it. Desktop navigation shifts
the workspace; on narrow screens it overlays with a dismissible backdrop. Give
the sidebar independent scrolling, active-example indication, wrapping labels,
and an accessible empty search result.

The main workspace shows the example title, then a form card with tabs for the
rendered demo, JSON Schema, UI Schema, UI Schemas, Internationalization, Config,
and Data when data is not alongside the form. Display validation error count
without mutating the example. Example action controls belong beside the form
heading. A form-and-data view uses a resizable split, initially approximately
75% form and 25% data, with usable minimum sizes and a stacked narrow-screen view.

Header actions should include form-only mode, native/web-component integration
selection, repository link, and settings. Native integration is the default.
Switching integration preserves the working schema, UI schema, data, locale,
configuration, and errors. Form-only mode hides navigation, source tabs, and
auxiliary panes while retaining form state and an accessible way to return.

Use real toolkit controls for menus, tabs, drawers, dialogs, scroll areas, and
resize handles where available. UI-library-specific styling belongs to an
implementation profile rather than this portable layout contract.

## JSON and settings

JSON panes are editable drafts with explicit Apply and Reload actions. Apply
parses/validates the relevant document before replacing its active counterpart.
Invalid JSON remains visible with diagnostics and does not overwrite valid
state. Reload restores the example's draft; it does not implicitly apply it.
Form data changes update the data view, and schema/UI changes update the form
after Apply. Code panes must have language-aware diagnostics and theme support.

Settings use an accessible end-side drawer with independent scrolling, focus
management, backdrop, and close control. Expose mode (System/Light/Dark),
direction, locale, readonly, validation mode, form/data layout, and applicable
renderer configuration. Validation modes are `ValidateAndShow`,
`ValidateAndHide`, and `NoValidation`. Distinguish renderer options from
UI-toolkit design-system settings. Native and wrapped integrations receive the
same effective settings.

Prefer durable storage for mode, locale, workspace layout, and design-system
preferences. Scope keys by demo and version; recover from malformed storage.
Keep example data and validation/configuration experimentation session-local
unless a separate save feature is explicitly provided.

## Navigation profile for browser demos

Example names are stable route identifiers. Preserve encoded names, unrelated
URL parameters, and browser back/forward behavior. The shared browser profile
uses `read-only`, `form-only`, `active-tab`, `use-webcomponent`, and `drawer`.
Boolean flags recognize literal `true`. Supported tab identifiers are `demo`,
`schema`, `uiSchema`, `uiSchemas`, `internationalization`, `config`, and `data`.
Where both normal and hash queries are accepted, hash values take precedence;
write a canonical route and omit default values. A navigation change must not
silently reset the current working data unless the selected example changes.

## Acceptance scenarios

1. Every shared example can be selected through navigation and a direct route.
2. Equivalent edits produce the same data in native and wrapped integration.
3. JSON Apply, invalid drafts, and Reload have distinct observable behavior.
4. Dark/light/system modes and supported locales work in inputs and overlays.
5. Form-only mode, responsive navigation, and splitter resizing preserve state.
6. New horizontal-sizing, presentation, selection, and extension fixtures appear
   through the shared example source without duplicated demo definitions.
7. Built deployment works under a subpath with working assets and code workers.

Tests should cover host wiring and user-visible behavior rather than retesting
all internals of the UI toolkit. This specification defines the target demo
contract; each implementation must track unmet scenarios explicitly.
