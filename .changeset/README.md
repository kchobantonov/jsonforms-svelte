# Changesets

This repository uses [Changesets](https://github.com/changesets/changesets) for versioning and npm publishing.

## Create a release entry

```bash
pnpm run changeset
```

Commit the generated markdown file from `.changeset/`.

## Release flow

- Merge changesets into `master`.
- GitHub Actions opens/updates a "chore: release packages" PR with version bumps/changelogs.
- Merge that PR to publish packages to npmjs.
