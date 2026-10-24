# Linting, formatting, and verification

The workspace uses Vite+ 1.4.0, migrated with the official `vp migrate` CLI.
Vite/Vitest commands and imports use Vite+; the pnpm catalog pins its Vite alias
and matching Vitest/browser/coverage packages. Library output still uses
`svelte-package` and `publint`; type checks still use `svelte-check` and TypeScript.

Oxfmt owns repository formatting. Oxlint owns ordinary JS/TS linting, including
integration tests and tooling. ESLint remains scoped to `.svelte`, `.svelte.ts`
and `.svelte.js`, preserving Svelte-aware script, template, accessibility and rune
checks that Oxlint cannot replace. Shared fallback configuration lives in
`scripts/eslint-config.js`, with each package's own Svelte config and TS root.

The official migrator translated the existing root lint rules. The reviewed root
`vite.config.ts` extends those rules to package/app JS/TS and preserves the base
shadcn exceptions. New default advisory categories are disabled so migration does
not silently add unrelated lint policy; the explicitly migrated rules remain
active. Vite+'s generic type checking is disabled because it does not replace
SvelteKit-aware `svelte-check`; `pnpm check` remains mandatory.

## Commands

| Command                                              | Scope                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm lint`                                          | Tooling and all workspaces, including integration tests.                           |
| `pnpm check-format`                                  | Repository formatting, excluding generated output and copied native UI components. |
| `pnpm format`                                        | Apply formatting.                                                                  |
| `pnpm check`                                         | Workspace type checks, including strict TypeScript integration tests.              |
| `pnpm test`                                          | All workspace unit, component, demo wrapper and integration suites.                |
| `pnpm --filter <package-name> test <file> -t <name>` | Select tests using the workspace runner's ordinary filters.                        |
| `pnpm build:pages`                                   | All libraries, demos and aggregate Pages shell.                                    |
| `node scripts/pack-release.mjs`                      | Prepare and validate release artifacts after building.                             |

See [integration test instructions](../tests/README.md) for artifact prerequisites
and examples of focused runs. Tests live in TypeScript test files; CI uses the same
workspace test command as local verification.

Run `pnpm exec vp lint .` for ordinary JS/TS and `pnpm lint:svelte` for the
Svelte fallback. Package `lint` scripts run formatter, Oxlint and Svelte ESLint.
`pnpm check-format` / `pnpm format` use Oxfmt. Root `vite.config.ts` owns format
settings and generated/copied-source exclusions; package `.prettierrc` files and
standalone Prettier dependencies have been removed. CI keeps the same root gates.

## Rules and exceptions

Recommended semantic, accessibility and Svelte rules remain enabled. TypeScript
checks undefined names in TS/Svelte; plain JavaScript retains ESLint's `no-undef`.
Playwright harness files explicitly allow browser globals used inside `evaluate`
callbacks. The base shadcn package retains its existing open-ended JSON Schema and
component-prop typing exception. Other packages keep their existing stricter
`no-explicit-any` behavior. Reusable shadcn Button components retain the existing
app-route-resolution exception.

Unused-variable checks allow destructured properties that are deliberately excluded
from a forwarded rest object (`ignoreRestSiblings`). Other unused bindings are still
reported. Effect dependency reads use `void` so first-run guards and asynchronous
callbacks retain their subscriptions. Monaco's temporary ancestor set and AG Grid's
memoization maps have line-scoped reactivity exceptions: they do not represent UI
state, and reactive cache writes would invalidate the derived computations that
populate them. Pending detail-dialog edits also use an imperative registry: adding a
flush/cancel callback does not change rendered state. The unused dispatch generic in
the core hook retains its existing public type-argument position. Both exceptions
are scoped to their declarations. Group collapse state retains its state/effect
synchronization because the shared core peer range starts at Svelte 5.20;
[writable derived state requires Svelte 5.25](https://svelte.dev/docs/svelte/$derived#Overriding-derived-values).
The compiler minimum gate verifies the declared floors. The shared core still requires this exception; family packages may retain the same state/effect synchronization for consistency.
Flowbite and Skeleton additional-property editor state uses the same compatibility
exception. Their group renderers retain the existing public `children` prop with a
line-scoped unused-prop exception; this cleanup does not introduce snippet rendering.
Flowbite's tree DOM-reference map is used by focus handlers only. Its match map is
rebuilt by a derived computation. Both retain plain maps with scoped reactivity
exceptions because map mutations are not independent rendering inputs.

Skeleton's example sidebar uses a hash-relative `goto` target so navigation works in
standalone and embedded demos. Its line-scoped route-resolution exception preserves
that behavior; Pages navigation tests cover relocated hosting.

Generated builds, dependencies and coverage are excluded from lint. Copied native
UI files remain linted but are excluded from the root formatting command; compare
and normalize those through the pinned `shadcn:check`/sync workflow. Handwritten
renderer adapters remain included.

Oxfmt retains two spaces, single quotes and 100 columns. Its Svelte formatter is
enabled with the installed Svelte compiler; Oxfmt currently bundles a Prettier-backed
markup formatter internally. Tailwind sorting remains enabled only for packages
that previously configured it. Copied native UI remains excluded from formatting.
Inventory generation and upstream shadcn normalization use `vite-plus/fmt`, check
format errors and preserve the read-only default of upstream comparison.

Official references: [Vite+ migration](https://viteplus.dev/guide/migrate),
[Oxfmt language support](https://oxc.rs/docs/guide/usage/formatter/language-support),
[Oxlint compatibility](https://oxc.rs/compatibility), and
[Svelte ESLint setup](https://svelte.dev/docs/cli/eslint).

## Renderer option types

Flowbite and Skeleton expose `AppliedOptions`, `MaskTokenOptions` and `VendorProps`.
Directly consumed options are typed; extension keys remain `unknown`. Vendor paths
still forward their existing property bags. Consumers inspecting a vendor field can
narrow it or use `VendorProps<Pick<ComponentProps<typeof NativeComponent>, 'field'>>`
when its native component is known. These types do not validate configuration at
runtime or change merge precedence. The legacy temporal boolean `mask` option and
Maska mask form remain separate uses of the same option; the string-mask adapter
retains its existing forwarding behavior.

CI runs the full workspace type gate after the dependency-ordered build. Workspace
package exports point to `dist` declarations, which a fresh checkout does not yet
have; each package build still runs its own Svelte check before bundling.

## Svelte minimums

| Package family                     | Svelte peer minimum | Reason                                                    |
| ---------------------------------- | ------------------- | --------------------------------------------------------- |
| Core, shared extended, demo-common | 5.20.0              | Core uses `$props.id()`, introduced in 5.20.              |
| Flowbite base/extended             | 5.40.0              | Flowbite Svelte 1.33.1 peer requirement.                  |
| shadcn base/extended               | 5.33.0              | Bits UI 2.19.5 peer requirement; PaneForge requires 5.29. |
| Skeleton base/extended             | 5.29.0              | Skeleton Svelte 4.12.1 peer requirement.                  |

`pnpm check:svelte-minimums` installs exact compiler versions in an owned temporary directory with lifecycle scripts disabled, compiles all library Svelte components and rune modules for client and server, and removes that directory. It does not modify workspace dependencies. `--compiler-dir <directory>` reuses an explicitly prepared directory with the version aliases declared in the script. This is a compiler compatibility gate; the full runtime/browser suites currently run on Svelte 5.50.1. A minimum-version browser matrix remains part of P0.1.

`pnpm audit:spec-examples` checks canonical JSON hashes and complete provenance for the eight imported fixtures. Pass `--source <spec-checkout>` to compare the current source checkout. Updating the manifest requires `--write --source <spec-checkout>`, unchanged source JSON in the demo, and a clean tracked source examples directory; the manifest records that checkout's full revision. Formatting changes do not affect the canonical hashes. The check also compares merged English/Bulgarian message keys and supported interpolation parameter names.

## Focused development checks

Batch related fixes, then run the affected tests and package checks. Use the package's `prepack` script when a consumer needs refreshed library output without a production demo build. Do not call `svelte-package` directly for shadcn packages: their scripts set `SHADCN_PRESERVE_UI_IMPORTS=true`, preserving consumer UI aliases.

The file, code-editor and color scripts accept family arguments (for example `shadcn`), `JSONFORMS_DEMO_LOCALE=bg` and `JSONFORMS_DEMO_NATIVE_ONLY=1` for focused checks. Code-editor and color scripts also accept `JSONFORMS_DEMO_URL` for a running demo server. An unset URL exercises the built applications. Refresh affected library output before starting a development server; Web Component checks additionally require refreshed Web Component bundles.

Full demo matrices and packed-consumer checks remain integration and final acceptance gates. A passing development-server scenario does not replace production packaging evidence.
