# Integration tests

These TypeScript Vitest tests exercise the built demos, relocated Pages site, and
packed Web Components. Component and unit tests remain beside their owning packages.
The root `pnpm test` command runs all workspace suites, including these tests and the
demo wrapper tests. There are no per-renderer executable test scripts.

## Run a focused check

```sh
pnpm --filter @chobantonov/jsonforms-svelte-integration-tests test demos/button-actions.spec.ts
pnpm --filter @chobantonov/jsonforms-svelte-integration-tests test demos/button-actions.spec.ts -t 'flowbite.*en.*native'
pnpm --filter @chobantonov/jsonforms-svelte-integration-tests check
```

Vitest file and test-name filters select cases without maintaining another command.
Each demo suite reports family × locale × native/Web Component cases separately.
Browsers are shared within a suite; every case gets an isolated page and context.
Failed demo cases save screenshots under `tests/test-results/`.

Use `demoEditorLabel(locale, name)` from `helpers/demo-labels.ts` for demo editor
tabs and headings. It resolves their accessible names from the shared JSON catalog.
Authored form labels use their example's own catalog. After changing the locale
inside a test, resolve subsequent editor names with the new locale.

## Prerequisites and batching

Build once with `pnpm build:pages` at an integration checkpoint. Prepare release
artifacts with `node scripts/pack-release.mjs` after the build, and install Chromium
with `pnpm exec playwright install chromium` if needed. The tests never rebuild the
project. Packed tests use the packing utility's default temporary output directory;
`JSONFORMS_PACKED_ARTIFACTS` can point to a different artifact directory.

During implementation, run the owning package's relevant unit/component tests.
Run only affected integration files against current artifacts. Run the complete
integration suite when its shared harness changes or at a release checkpoint.

`helpers/demo.ts` owns the shared runner setup and matrix. `helpers/demo-server.ts`
serves built artifacts. Build, release packing and source-sync utilities remain in
`scripts/` because they prepare artifacts rather than define test cases.
