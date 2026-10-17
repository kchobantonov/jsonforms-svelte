# Canonical conformance results

Pinned spec: `f0183923295c495c60024fddca58dbe99e82e816`. Results below were executed on October 10, 2026.

## Behavior vectors

All 21 canonical inputs and expectations are imported from `conformance/behavior.json`. Tests consume those values directly. Shared contracts run against production helpers or Svelte lifecycle harnesses; UI contracts run against every native family. The adapter links for family cases point to Flowbite; matching files exist in shadcn and Skeleton.

| Vector                       | Result | Executed scope                      | Evidence                                                                                            |
| ---------------------------- | ------ | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `span-gap`                   | Passed | Flowbite, shadcn, Skeleton native   | [Adapter](../packages/jsonforms-svelte-flowbite/tests/conformance/Behavior.svelte.spec.ts)          |
| `visible-children`           | Passed | Flowbite, shadcn, Skeleton native   | [Adapter](../packages/jsonforms-svelte-flowbite/tests/conformance/Behavior.svelte.spec.ts)          |
| `expression-own-constructor` | Passed | Shared presentation                 | [Adapter](../packages/jsonforms-svelte-extended/tests/conformance/behavior.spec.ts)                 |
| `url-script`                 | Passed | Shared core                         | [Adapter](../packages/jsonforms-svelte/tests/conformance/behavior.spec.ts)                          |
| `script-default-closed`      | Passed | Flowbite, shadcn, Skeleton extended | [Adapter](../packages/jsonforms-svelte-flowbite-extended/tests/conformance/Behavior.svelte.spec.ts) |
| `markdown-substitution`      | Passed | Shared presentation                 | [Adapter](../packages/jsonforms-svelte-extended/tests/conformance/behavior.spec.ts)                 |
| `outside-enum`               | Passed | Flowbite, shadcn, Skeleton native   | [Adapter](../packages/jsonforms-svelte-flowbite/tests/conformance/Behavior.svelte.spec.ts)          |
| `tuple-fill-prefix`          | Passed | Flowbite, shadcn, Skeleton native   | [Adapter](../packages/jsonforms-svelte-flowbite/tests/conformance/Behavior.svelte.spec.ts)          |
| `confirmation-complex-old`   | Passed | Shared core                         | [Adapter](../packages/jsonforms-svelte/tests/conformance/behavior.spec.ts)                          |
| `array-error-boundary`       | Passed | Shared core                         | [Adapter](../packages/jsonforms-svelte/tests/conformance/behavior.spec.ts)                          |
| `duration-unchanged`         | Passed | Flowbite, shadcn, Skeleton extended | [Adapter](../packages/jsonforms-svelte-flowbite-extended/tests/conformance/Behavior.svelte.spec.ts) |
| `pending-delete`             | Passed | Flowbite, shadcn, Skeleton native   | [Adapter](../packages/jsonforms-svelte-flowbite/tests/conformance/Behavior.svelte.spec.ts)          |
| `dialog-cancel`              | Passed | Shared Svelte draft lifecycle       | [Adapter](../packages/jsonforms-svelte/tests/detailDialog.svelte.spec.ts)                           |
| `accordion-close`            | Passed | Flowbite, shadcn, Skeleton native   | [Adapter](../packages/jsonforms-svelte-flowbite/tests/conformance/Behavior.svelte.spec.ts)          |
| `port-choice-reload`         | Passed | Shared core                         | [Adapter](../packages/jsonforms-svelte/tests/conformance/behavior.spec.ts)                          |
| `port-literal-key`           | Passed | Flowbite, shadcn, Skeleton native   | [Adapter](../packages/jsonforms-svelte-flowbite/tests/conformance/Behavior.svelte.spec.ts)          |
| `port-pattern-intersection`  | Passed | Flowbite, shadcn, Skeleton native   | [Adapter](../packages/jsonforms-svelte-flowbite/tests/conformance/Behavior.svelte.spec.ts)          |
| `port-numeric-intent`        | Passed | Flowbite, shadcn, Skeleton native   | [Adapter](../packages/jsonforms-svelte-flowbite/tests/conformance/Behavior.svelte.spec.ts)          |
| `port-branch-feedback`       | Passed | Flowbite, shadcn, Skeleton native   | [Adapter](../packages/jsonforms-svelte-flowbite/tests/conformance/Behavior.svelte.spec.ts)          |
| `port-summary-search`        | Passed | Flowbite, shadcn, Skeleton extended | [Adapter](../packages/jsonforms-svelte-flowbite-extended/tests/conformance/Behavior.svelte.spec.ts) |
| `port-cell-error-placement`  | Passed | Flowbite, shadcn, Skeleton native   | [Adapter](../packages/jsonforms-svelte-flowbite/tests/conformance/Behavior.svelte.spec.ts)          |

### Adapter details

- `port-branch-feedback` adds branch titles to request identifiable branch views. Validation assertions remain unchanged. The test distinguishes ordinary branch-selection inference from extra displayed-branch validation and verifies the latter stops when disabled.
- `port-summary-search` supplies the described Label presentation through `options.markup`, enables dynamic values, and checks AG Grid's displayed text, filter result and retained row identity.
- Change counts exclude the initial JSONForms state notification. Data edits and actions are observed after mounting.
- Duration also runs in Bulgarian. Other behavioral vectors use English; wider EN/BG acceptance remains in the example matrix.
- These results establish the tested native profiles. They do not establish keyboard, visual, Web Component or all-option parity for every renderer.

## Authoring and intentional-invalid fixtures

[Authoring tests](../packages/jsonforms-svelte/tests/conformance/authoring.spec.ts) pass all 154 published authoring vectors and all 47 imported example authoring checks: 201 tests. They validate schema assets, config, UI schemas and registered UI schemas. The two declared invalid examples must fail at their declared locations; applying only the published replacements must make the surrounding examples valid. This tests authoring validation, not a runtime refusal by itself.

[Provenance checks](../tests/conformance.spec.ts) verify semantic SHA-256 hashes for the behavior, authoring, intentional-invalid and six schema assets. Whitespace formatting does not change provenance. The fixtures contain no modified validation or behavior assertions.

## Gaps found and fixed

- Declared dotted and empty property names aliased nested dot paths. A shared literal-key boundary now retains unrelated data, references, permissions and validation locations. Native aggregate mixed-object editors now use the same boundary without blanket readonly. Visible/searchable labels and all three template profiles use the current JSON Forms context. Literal editors are rooted at their selected value, matching React; dialog drafts copy that context without an additional data abstraction. Rule/error context and broader acceptance remain open. The preceding literal-property/duration batch passed all 24 production scenarios across hosts.
- Applying unchanged duration parts rewrote imported equivalent spellings such as `P0W`. It now preserves the original value; picker text uses JSON catalogs.
- Label summaries returned raw Markdown for filtering. They now use displayed text, escape substitutions and load the parser lazily.
