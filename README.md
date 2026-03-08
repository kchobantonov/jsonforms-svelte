# JSON Forms Svelte Monorepo

A pnpm monorepo containing JSON Forms implementation for Svelte 5 with Flowbite styling.

## Developer documentation

Use Node 22.x

### Initial setup

- Install dependencies: `pnpm i --frozen-lockfile`

### Scripts

- Build (all packages): `pnpm run build`
- Run example app: `pnpm run example:dev`
- Run example webcomponent: `pnpm run wc:dev`

## Releasing From GitHub

This repo uses Changesets + GitHub Actions for automated releases.

### Create a release

1. Run `pnpm run changeset` and select the packages + bump type.
2. Commit the generated file under `.changeset/`.
3. Merge to `master`.
4. The `Release Packages` workflow opens/updates a `chore: release packages` PR.
5. Merge that PR to publish to npmjs.

### Required one-time setup for npmjs deployment

1. npm account/scope:
   - Ensure you can publish under `@chobantonov` on npmjs (user or org scope ownership).
2. npm token:
   - In npmjs, create an Automation token with publish permissions.
3. GitHub secret:
   - In repo settings, add `NPM_TOKEN` in `Settings > Secrets and variables > Actions`.
4. GitHub Actions permissions:
   - In repo `Settings > Actions > General`, allow workflows to create and approve pull requests.
   - Keep `GITHUB_TOKEN` with read/write permissions (needed for the release PR).
5. Branch protection:
   - If branch protection is enabled for `master`, allow the release workflow/PR to merge through your normal checks.
