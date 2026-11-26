# Changesets

This repository uses [Changesets](https://github.com/changesets/changesets) for versioning and npm publishing.

## Create a release entry

```bash
pnpm run changeset
```

Commit the generated markdown file from `.changeset/`.

## Release flow

- The 13 public `@chobantonov/jsonforms-svelte*` packages form one Changesets
  fixed group. A changeset for any member bumps and publishes every member at
  the same version, using the highest bump level in the group. Private demos
  and tooling packages are outside that group.
- When adding a public package, add it to the fixed group in `config.json`
  before releasing it. `pnpm run check:release-group` checks this in CI and the
  release workflow.
- Merge changesets into `master`.
- GitHub Actions opens/updates a "task: release" PR with version bumps/changelogs.
- Merge that PR to publish packages to npmjs.

## Test the pending release before publishing

Run `pnpm release:pack /tmp/jsonforms-release-packs` (or build libraries and run
`node scripts/pack-release.mjs /tmp/jsonforms-release-packs`). The pack script uses
pending Changesets versions in temporary copies, validates every public package,
and writes tarballs plus `overrides.json`. It never publishes or versions the checkout.

In jsonforms-editor, run `pnpm test:packed /tmp/jsonforms-release-packs` to install
those tarballs in an isolated consumer and exercise both native and browser integrations.

Run `pnpm test:packed` to smoke-test all three packed web components in Chromium.
CI runs package validation and packed browser checks after building.
