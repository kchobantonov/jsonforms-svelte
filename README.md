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
