# JSON Forms Svelte renderers

A pnpm monorepo for JSON Forms on Svelte 5 with Flowbite, Skeleton, and
shadcn-svelte renderer sets. Each set has base and extended renderers, a demo
application, and a Web Component. The sketch presentation reuses the shadcn
renderers with its own UI components, demo, and Web Component. Shared packages
provide the Svelte integration and extended behavior.

The [JSON Forms Extended Specification](https://github.com/kchobantonov/jsonforms-extended-spec)
defines portable behavior and UI Schema options. This workspace consumes
`@chobantonov/jsonforms-extended-spec@0.2.0`; the manifests and lockfile record
the version used by the demos and conformance checks.

## Packages

| Family        | Base renderers                                                                                                                        | Extended renderers                                                                                         | Web Component                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Flowbite      | [`@chobantonov/jsonforms-svelte-flowbite`](packages/jsonforms-svelte-flowbite/README.md)                                              | [`@chobantonov/jsonforms-svelte-flowbite-extended`](packages/jsonforms-svelte-flowbite-extended/README.md) | [Flowbite guide](packages/jsonforms-svelte-flowbite-webcomponent/README.md)                  |
| Skeleton      | [`@chobantonov/jsonforms-svelte-skeleton`](packages/jsonforms-svelte-skeleton/README.md)                                              | [`@chobantonov/jsonforms-svelte-skeleton-extended`](packages/jsonforms-svelte-skeleton-extended/README.md) | [Skeleton guide](packages/jsonforms-svelte-skeleton-webcomponent/README.md)                  |
| shadcn-svelte | [`@chobantonov/jsonforms-svelte-shadcn`](packages/jsonforms-svelte-shadcn/README.md)                                                  | [`@chobantonov/jsonforms-svelte-shadcn-extended`](packages/jsonforms-svelte-shadcn-extended/README.md)     | [shadcn guide](packages/jsonforms-svelte-shadcn-webcomponent/README.md)                      |
| shadcn sketch | [shadcn renderers](packages/jsonforms-svelte-shadcn/README.md) with [sketch UI](packages/jsonforms-svelte-shadcn-sketch-ui/README.md) | [shadcn extended renderers](packages/jsonforms-svelte-shadcn-extended/README.md)                           | [sketch Web Component guide](packages/jsonforms-svelte-shadcn-sketch-webcomponent/README.md) |

[`@chobantonov/jsonforms-svelte`](packages/jsonforms-svelte/README.md) provides the form host, dispatch components, and Svelte bindings.
[`@chobantonov/jsonforms-svelte-renderer-common`](packages/jsonforms-svelte-renderer-common/README.md) provides the extension-aware `JsonForms` host, dispatchers, controls, layouts, and helpers used by the renderer families.
[`@chobantonov/jsonforms-svelte-extended`](packages/jsonforms-svelte-extended/README.md) provides shared extended renderers.
The demos are in `apps/`, and the Pages shell combines their static builds.

The shadcn renderer follows the consuming application's component ownership
model. Its [setup guide](packages/jsonforms-svelte-shadcn/README.md) lists the
required components and aliases.

## Get started

Use Node 22.18+ within Node 22 and the pinned pnpm version. Install
[Vite+](https://viteplus.dev/guide/) for the repository tooling, then run:

```sh
pnpm install --frozen-lockfile
pnpm run build:libs
pnpm run example:flowbite:dev
# Or: pnpm run example:skeleton:dev / pnpm run example:shadcn:dev
# Sketch: pnpm run example:shadcn:sketch:dev
```

Run `pnpm run build` for all libraries, demos, and the Pages selector. The demos
load the portable spec catalog. For a plain HTML host, use the Web Component
guide for your chosen presentation. The family guides document properties,
events, and self-hosting; the sketch guide includes its loading example and
links to the shared shadcn Web Component API.

## Sketch presentation

Run `pnpm run example:shadcn:sketch:dev` to try the sketch demo. A Svelte app can
use the regular shadcn renderer packages with
[`@chobantonov/jsonforms-svelte-shadcn-sketch-ui`](packages/jsonforms-svelte-shadcn-sketch-ui/README.md)
for the components, stylesheet, and outlines. The [sketch UI guide](packages/jsonforms-svelte-shadcn-sketch-ui/README.md)
shows the required alias and imports.

For a plain HTML host, build the libraries with `pnpm run build:libs` and follow
the sketch Web Component's
[loading and form example](packages/jsonforms-svelte-shadcn-sketch-webcomponent/README.md).
It registers `<jsonforms-svelte-shadcn-sketch>` and bundles the sketch styles.

## Documentation

- [Documentation guide](docs/README.md): current Svelte guidance and verification inputs.
- [Renderer capabilities](docs/renderers/README.md): supported features and platform limits.
- [Web Component guides](packages/jsonforms-svelte-flowbite-webcomponent/README.md): start with Flowbite; the other guides are linked in the package table.
- [Development checks](docs/linting-and-formatting.md): build, test, lint, format, and type checks.
- [Maintaining shadcn components](docs/shadcn-maintenance.md): upstream source audit and update procedure.
- [Release guide](.changeset/README.md): Changesets and package validation.
- [Renderer and demo contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/v0.2.0/docs/renderer-and-demo.md): acceptance requirements in the installed spec release.

## Development and releases

Run `pnpm run lint` and `pnpm run check-format` before reporting renderer work
complete. Run `pnpm run test` for the workspace tests and `pnpm run check` for
workspace type checks. See [development checks](docs/linting-and-formatting.md)
for focused commands and integration test prerequisites.

The public packages form one [fixed Changesets group](.changeset/config.json). Add a changeset for a
publishable package change with `pnpm run changeset`; private demos do not need
one. Merge to `master` to open or update the release pull request, then merge
that pull request to publish. The [release guide](.changeset/README.md)
explains the version policy and validation commands.
