# Code editor

**Example ID:** `code-editor` · **Domain:** Deployment assets

Covers the [portable UI model, the renderer contract — Monaco](../../docs/spec.md#1826-code-editor-profile): language selection, editor dimensions, initialization actions and JSON conversion.

## Files

| File                  | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `schema.json`         | Two strings and a structured deployment object.                  |
| `uischema.json`       | Growing and fixed editors, formatting actions and `convertJson`. |
| `data.json`           | Valid script, markup and deployment settings.                    |
| `translations.json`   | English and Bulgarian labels and guidance.                       |
| the host registration | Registers the example.                                           |

No global config or detail UI schema is required.

## What the form contains

```text
Startup script       JavaScript, grows from 2 to 10 rows
Status page          HTML, fixed 10 rows
Deployment settings  JSON, fixed 8 rows, stored as an object
```

`monaco.initActions` requests `editor.action.formatDocument` on editor mount.
An action can run only when the editor and its language service provide it.

## Validation state

The initial data has **no schema errors** under the demo validator. Schema
validation does not parse the JavaScript or HTML strings. Deployment settings
require `service` and `replicas`, with at least one replica.

## Expected behavior

Add lines to the startup script: `autoGrow`, `minRows` and `maxRows` control
its height. The status page keeps its configured row count. Formatting changes
the editor presentation without changing the chosen storage type.

Edit deployment settings and inspect the data pane: with `language: "json"`
and `convertJson: true`, valid JSON commits a structured value. Invalid JSON
remains an editor draft and must not replace the last committed object. A
syntactically valid object with `replicas: 0` commits and produces a schema
error; syntax validity and schema validity are separate.

See [Additional errors](../additional-errors) for dynamic `:language`,
`propagateErrors`, editor diagnostics and coexistence with server errors.
Those cases stay together because they demonstrate error ownership.

## Fallback behavior

Without `convertJson`, string editors store text. Without `autoGrow`, row
sizing is fixed. Unknown initialization actions cannot be assumed to run.
Without an editor renderer, a fallback form cannot demonstrate Monaco sizing
or diagnostics. Schema validation modes affect displayed schema errors, not
whether JSON can be parsed.

## Conformance scope

This walkthrough describes the portable contract. Renderer support must be checked
by a host adapter; the package validates the authored assets, not live UI behavior.

## Standalone host setup

Load the JSON assets listed in [the catalog](../catalog.json) into a host
with the relevant renderer capabilities. No framework registration module is
required by this package.

## Feature navigation

Explore one feature at a time using the tabs: **Script**, **Markup**, **Structured document**. Tab titles are localized in English and Bulgarian. The tabs share the existing form data.
