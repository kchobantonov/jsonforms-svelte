# Maintaining shadcn components

Shadcn components are copied source files: updating the `shadcn-svelte` CLI or
`bits-ui` dependency does **not** update those files. The official registry is
style-specific and changes independently of CLI releases. See the
[CLI documentation](https://www.shadcn-svelte.com/docs/cli).
The CLI version used in this workspace is recorded in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml)
and resolved in the lockfile.

This repository provides an upstream audit and synchronized source update tool:

```sh
# Read-only check; exit 1 means source drift or missing/extra files.
pnpm shadcn:check --stage /tmp/shadcn-review

# Download a reviewable snapshot without modifying live components.
pnpm shadcn:sync --stage /tmp/shadcn-review

# After reviewing report.json, use its upstreamRevision for a reproducible update.
pnpm shadcn:sync --ref <FULL_UPSTREAM_COMMIT_SHA> --stage /tmp/shadcn-review --write
```

The official-registry tool compares the installed shadcn-svelte component folders
in both copies: the Shadcn renderer web component and Shadcn demo. The Stepper
comes from the separate **shadcn-svelte-extras** registry and is audited by the
commands below. The official tool fetches
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

For automation, `.github/workflows/shadcn-audit.yml` runs a monthly read-only check
for both upstreams and can be dispatched manually. It uploads comparison snapshots when upstream
changes are detected. Component changes do not have a dependable per-component
npm release event, so polling the registry catches changes a dependency updater
alone misses. Apply the pinned snapshot in a reviewed update branch; the workflow
does not automatically merge component or theme changes.

The [official-registry audit](shadcn-upstream-review.md) and
[extras audit](shadcn-extras-upstream-review.md) record source provenance
and known differences. Matching our local copies alone is not proof of matching
either upstream.

The copied UI source in the demo, Web Component and sketch UI package is excluded from
Fallow analysis through [`.fallowrc.json`](../.fallowrc.json), including duplicate-code
and unused-code reports. The upstream audits above still check the official and extras copies.

The extras Stepper and Tags Input are copied sources under the same two UI roots, not runtime
`shadcn-svelte-extras` npm dependencies. The Stepper's adopted revision, MIT attribution, and
required `runed`/`svelte-toolbelt` versions are recorded in
[`scripts/shadcn-extras-upstream.json`](../scripts/shadcn-extras-upstream.json); Tags Input has its own
[`manifest`](../scripts/shadcn-extras-tags-input-upstream.json).
Updating `shadcn-svelte`, `bits-ui`, or the extras website does not refresh these
extras files. Audit, stage, and update each component separately when refreshing Shadcn:

```sh
# Read-only comparison against the latest extras commit.
pnpm shadcn-extras:check --stage /tmp/shadcn-extras-review
pnpm shadcn-extras:check --component tags-input --stage /tmp/shadcn-extras-tags-review

# Stage raw and adapted Stepper source without changing either live copy.
pnpm shadcn-extras:sync --stage /tmp/shadcn-extras-review

# After reviewing report.json, update both copies at the exact reported SHA.
pnpm shadcn-extras:sync --ref <FULL_EXTRAS_COMMIT_SHA> --stage /tmp/shadcn-extras-review --write
pnpm shadcn-extras:sync --component tags-input --ref <FULL_EXTRAS_COMMIT_SHA> --stage /tmp/shadcn-extras-tags-review --write
```

The extras sync preserves the repository alias, attribution, license, and the
documented Stepper item-ID and Tags Input removal-label adapters. It stops for review if an upstream adapter
location changes. It does not install new dependencies or migrate theme CSS;
review the staged source, dependency imports, styles, and license before applying
an update. Then build the renderer, Web Component, and demo and run the stepper
component and production-demo tests.
