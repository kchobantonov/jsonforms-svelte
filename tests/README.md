# Integration tests

These TypeScript Vitest tests exercise the built demos, relocated Pages site, and
packed Web Components. Component and unit tests remain beside their owning packages.
The root `pnpm test` command runs all workspace suites, including these tests and the
demo wrapper tests. `pnpm test:flowbite`, `pnpm test:shadcn`, and
`pnpm test:skeleton` run one complete renderer set: its base, extended, Web
Component and demo package suites, then every matching integration demo case.
Pass `--build` to build that family before testing it.

## Run a focused check

```sh
pnpm --filter @chobantonov/jsonforms-svelte-integration-tests test demos/button-actions.spec.ts
pnpm --filter @chobantonov/jsonforms-svelte-integration-tests test demos/button-actions.spec.ts -t 'flowbite.*en.*native'
pnpm --filter @chobantonov/jsonforms-svelte-integration-tests check
pnpm test:shadcn
pnpm test:shadcn -- --build
```

Vitest file and test-name filters select narrower cases.
Each demo suite reports family × locale × native/Web Component cases separately.
Browsers are shared within a suite; every case gets an isolated page and context.
For a native-component regression specific to one family, pass an explicit
`families` list to `demoTest`; the default matrix still includes all three families.
Do not silently return from unsupported family cases.
Failed demo cases save screenshots under `tests/test-results/`.

Use `demoEditorLabel(locale, name)` from `helpers/demo-labels.ts` for demo editor
tabs and headings. It resolves their accessible names from the shared JSON catalog.
Authored form labels use their example's own catalog. After changing the locale
inside a test, resolve subsequent editor names with the new locale.

## Prerequisites and batching

Build once with `pnpm build:pages` at an integration checkpoint. Install Chromium
with `pnpm exec playwright install chromium` if needed. Integration tests
themselves never rebuild the project; the family runner rebuilds only with
`--build`. The packed Web Component test packs current build output into the
packing utility's default temporary directory. `JSONFORMS_PACKED_ARTIFACTS`
can point to a prepacked artifact directory instead. Packed Web Component
tests reject stale tarballs before opening a browser.

During implementation, run the owning package's relevant unit/component tests.
Run only affected integration files against current artifacts. Run the complete
integration suite when its shared harness changes or at a release checkpoint.

`helpers/demo.ts` owns the shared runner setup and matrix. `helpers/demo-server.ts`
serves built artifacts. Build, release packing and source-sync utilities remain in
`scripts/` because they prepare artifacts rather than define test cases.

## Svelte component harness

The base and extended packages keep `tests/testUtils.ts` beside their tests.
`mountControl` and `mountForm` are async: await them (and direct `render` calls) before accessing their results. They render the actual Svelte form with the supplied
registries and return the mounted view and change spy. Use `view.rerender` for
host data, schema, UI schema, locale, config and permission replacements; do not
remount when the scenario is a live update. Use the full family registry when
checking renderer selection, and supply its cell registry for table tests.

Load the owning package's `tests/test.css` for native behavior. Extended helpers
already load it. Direct `render` tests must import styles explicitly. An unstyled
button can accept clicks that its production version cannot. Query portal content
through Vitest's page or the appropriate root, and call `cleanup` after each case.
Use real pointer/keyboard actions for popup triggers and clear buttons. Native
field events may be dispatched when testing platform color input serialization;
that does not replace pointer or geometry acceptance.

Examples include `TextCellEditing.svelte.spec.ts` (IME and host replacement),
`BooleanState.svelte.spec.ts` (typed values, permissions, hover/focus and cells),
`ColorControlRenderer.svelte.spec.ts` (portals, translation overrides and geometry),
and `TableRowDetailsSpec.svelte.spec.ts` (native dialogs and persistent details).
Keep tests in TypeScript; share fixture data and behavior expectations with React,
while using Svelte's own mounting and update lifecycle.
