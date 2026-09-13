# JSON Forms Svelte Monorepo

A pnpm monorepo providing JSON Forms for Svelte 5 with Flowbite, Skeleton, and shadcn-svelte renderer sets. Each renderer family includes core renderers, extended renderers, a demo application, and a web-component distribution.

## Packages

| Package                                               | Purpose                                 |
| ----------------------------------------------------- | --------------------------------------- |
| `@chobantonov/jsonforms-svelte`                       | Shared Svelte 5 JSON Forms integration  |
| `@chobantonov/jsonforms-svelte-extended`              | Shared extended renderers and utilities |
| `@chobantonov/jsonforms-svelte-flowbite`              | Flowbite renderer set                   |
| `@chobantonov/jsonforms-svelte-flowbite-extended`     | Extended Flowbite renderers             |
| `@chobantonov/jsonforms-svelte-flowbite-webcomponent` | Flowbite custom element                 |
| `@chobantonov/jsonforms-svelte-skeleton`              | Skeleton renderer set                   |
| `@chobantonov/jsonforms-svelte-skeleton-extended`     | Extended Skeleton renderers             |
| `@chobantonov/jsonforms-svelte-skeleton-webcomponent` | Skeleton custom element                 |
| `@chobantonov/jsonforms-svelte-shadcn`                | shadcn-svelte renderer set              |
| `@chobantonov/jsonforms-svelte-shadcn-extended`       | Extended shadcn-svelte renderers        |
| `@chobantonov/jsonforms-svelte-shadcn-webcomponent`   | shadcn-svelte custom element            |

The demos live in `apps/jsonforms-svelte-{flowbite,skeleton,shadcn}-demo`. The pages shell combines their static builds for deployment.

The Shadcn renderer follows Shadcn's app-ownership model: generated UI primitives live in the
consuming demo or web-component project, not in the renderer package. See the
[`@chobantonov/jsonforms-svelte-shadcn` setup guide](packages/jsonforms-svelte-shadcn/README.md)
for the required component list and alias configuration.

## Using the Web Components

Embed a JSON Forms renderer in a plain HTML page using an npm CDN, or install
its npm package and self-host the browser bundle. Each guide includes
version-pinned jsDelivr and UNPKG URLs, a complete HTML page, properties and
attributes, events, themes, and self-hosting instructions:

| Renderer      | Usage guide and API                                                               | Complete HTML sample                                                                                |
| ------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Flowbite      | [Web Component README](packages/jsonforms-svelte-flowbite-webcomponent/README.md) | [CDN HTML example](packages/jsonforms-svelte-flowbite-webcomponent/README.md#complete-html-example) |
| Skeleton      | [Web Component README](packages/jsonforms-svelte-skeleton-webcomponent/README.md) | [CDN HTML example](packages/jsonforms-svelte-skeleton-webcomponent/README.md#complete-html-example) |
| shadcn-svelte | [Web Component README](packages/jsonforms-svelte-shadcn-webcomponent/README.md)   | [CDN HTML example](packages/jsonforms-svelte-shadcn-webcomponent/README.md#complete-html-example)   |

Flowbite and Skeleton `1.0.1` are available on npm. The Shadcn guide documents
the expected CDN paths and the self-hosted alternative while its npm publication
is pending (checked 2026-09-07).

## Developer documentation

Use Node 22.x and pnpm.

### Initial setup

- Install dependencies: `pnpm i --frozen-lockfile`
- Install Playwright Chromium for browser tests: `pnpm exec playwright install --with-deps chromium`

### Tests

- Run all package tests: `pnpm run test`
- Run test coverage: `pnpm run test:coverage`

### Build commands

- Build the complete pages/demo shell: `pnpm run build`
- Build all libraries and web components: `pnpm run build:libs`
- Build all libraries and demos: `pnpm run build:demo`
- Build one renderer family: `pnpm run build:flowbite`, `pnpm run build:skeleton`, or `pnpm run build:shadcn`

Demo builds are relocatable: serve any demo's `build` directory directly, or copy it
under another URL path without rebuilding. `pnpm run build:pages` assembles the three
demos into a selector shell; the shell copies their artifacts unchanged and can also
be served under any directory path. No deployment-prefix environment variable is needed.

Each demo uses hash navigation and a shared static-adapter wrapper that makes the
entry HTML's asset URLs relative during the demo build. SvelteKit resolves runtime
assets against the directory where the demo is loaded. Development uses Vite normally.
Serve directory URLs with a trailing slash (standard static servers redirect to it).

After building, run `pnpm --filter jsonforms-svelte-pages-shell test` to verify artifact
copies, standalone serving, relocated demos, and SPA navigation in relocated shells.

### Demo applications

- Flowbite: `pnpm run example:flowbite:dev`
- Skeleton: `pnpm run example:skeleton:dev`
- shadcn-svelte: `pnpm run example:shadcn:dev`

Replace `dev` with `build` or `preview` to build or preview an individual demo.

### Web-component playgrounds

- Flowbite: `pnpm run wc:flowbite:dev`
- Skeleton: `pnpm run wc:skeleton:dev`
- shadcn-svelte: `pnpm run wc:shadcn:dev`

Replace `dev` with `build` or `preview` to build or preview an individual web component.

### Renderer development

Each renderer package has `watch` and `build` commands. For example:

- `pnpm run renderers:shadcn:watch`
- `pnpm run renderers:shadcn:build`
- `pnpm run renderers-extended:shadcn:watch`
- `pnpm run renderers-extended:shadcn:build`

The equivalent `flowbite` and `skeleton` commands are also available.

## Releasing from GitHub

This repository uses Changesets and GitHub Actions for automated releases.

### Create a release

1. Run `pnpm run changeset` and select the packages and bump type.
2. Commit the generated file under `.changeset/`.
3. Merge to `master`.
4. The `Release Packages` workflow opens or updates a `chore: release packages` pull request.
5. Merge that pull request to publish to npm.
6. During publishing, the workflow pushes Git tags and creates GitHub Releases.

### GitHub's “Create new release” action

Creating a release and new tag directly in the GitHub UI does not run the Changesets publishing flow. Use the workflow above for npm releases; use GitHub's release UI only for manual, tag-only releases.

### Required npm publishing setup

1. Ensure the publishing account owns or can publish under the `@chobantonov` npm scope.
2. Create an npm automation token with publish permissions.
3. Add it as `NPM_TOKEN` under the repository's GitHub Actions secrets.
4. Allow GitHub Actions to create and approve pull requests and give `GITHUB_TOKEN` read/write permissions.
5. If `master` is protected, allow the release pull request to pass through the normal required checks.

## Keeping shadcn components current

Shadcn components are copied source files: updating the `shadcn-svelte` CLI or
`bits-ui` dependency does **not** update those files. The official registry is
style-specific and changes independently of CLI releases. See the
[CLI documentation](https://www.shadcn-svelte.com/docs/cli).

This repository provides an upstream audit and synchronized source update tool:

```sh
# Read-only check; exit 1 means source drift or missing/extra files.
pnpm shadcn:check --stage /tmp/shadcn-review

# Download a reviewable snapshot without modifying live components.
pnpm shadcn:sync --stage /tmp/shadcn-review

# After reviewing report.json, use its upstreamRevision for a reproducible update.
pnpm shadcn:sync --ref <FULL_UPSTREAM_COMMIT_SHA> --stage /tmp/shadcn-review --write
```

The tool compares every installed component folder in both copies: the
Shadcn renderer web component and Shadcn demo. It fetches
all entries at one immutable upstream revision and retains registry JSON,
dependencies, generated source and per-file hashes in the staging directory.
The default comparison style is **Nova**, the closest match to the existing
rounded-lg / h-8 component styling; use `--style` to deliberately choose another
style. Legacy `components.json` files do not record that style, so this is an
explicit sync-tool choice, not a recovered installation manifest.

`--write` updates generated component files in both locations together.
Only formatting and repository import-alias substitutions are applied; there
are no visual or behavioral patches. Repository-owned `ui/index.ts` and
`ui/utils.ts` remain intact. Local files no longer present upstream are reported
and retained for manual review. Do not run a whole-directory deletion/copy that
would remove these repository integration helpers.

Before adopting a snapshot:

1. Review the source diff and the report's dependency and registry-dependency
   lists. Add newly required component dependencies and update the consuming
   packages' dependencies and lockfile. The sync tool deliberately does not run
   package installation or migrate theme CSS.
2. Review upstream theme/utility CSS changes and import/export changes. A source
   sync is not a theme migration and does not replace custom wrapper components.
3. Run `pnpm example:shadcn:build` and the renderer browser tests. Check focus,
   dialogs, selection, resizing, scrolling, and light/dark mode.
4. Run the pinned upstream check again and review remaining drift. Commit the
   source changes, dependency updates, and upstream revision together.

For automation, `.github/workflows/shadcn-audit.yml` runs a weekly read-only check
and can be dispatched manually. It uploads the comparison snapshot when upstream
changes are detected. Component changes do not have a dependable per-component
npm release event, so polling the registry catches changes a dependency updater
alone misses. Apply the pinned snapshot in a reviewed update branch; the workflow
does not automatically merge component or theme changes.

The [current audit](docs/shadcn-component-audit.md) records the comparison result
and known differences. Matching our local copies alone is not proof of matching
upstream.



## Renderer specifications

[Renderer specifications](docs/renderers/README.md) define framework-neutral behavior,
options and conformance scenarios for implementing compatible renderer sets.
Start with the common contract, then the layout and presentation specifications.
