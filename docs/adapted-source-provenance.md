# Adapted source provenance

This inventory distinguishes the older source revision named in an adaptation
comment from the current behavioral comparison checkout. The local code is
adapted, so matching a source path and commit does not assert byte-for-byte
identity or current behavior parity. Both reference repositories use MIT
licenses and are adjacent checkouts in the local audit environment.

Run `node scripts/check-adapted-source-provenance.mjs` to verify each local
comment's full commit pin and the upstream file at that commit. The script
requires the adjacent reference checkouts; it does not fetch or mutate them.

React source commit: `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`.
The shared React helpers `combinators`, `conditionalFields`, `confirmation`,
`detail`, `mixedComposition`, and `recursiveTree` map from
`packages/jsonforms-svelte/src/lib/<name>.ts` to
`packages/jsonforms-react-renderer-common/src/<name>.ts`.
`inference.ts` maps to `packages/jsonforms-react-demo-common/src/app/demoSchema.ts`.

| Local source                                                         | React source at pinned commit                                                                |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `packages/jsonforms-svelte-extended/src/lib/core/colorProfile.ts`    | `packages/jsonforms-react-renderer-common/src/colorFormat.ts`                                |
| `packages/jsonforms-svelte-extended/src/lib/core/cron.ts`            | `packages/jsonforms-react-extended-renderers/src/util/cron.ts`                               |
| `packages/jsonforms-svelte-extended/src/lib/core/fileOptions.ts`     | `packages/jsonforms-react-renderer-common/src/FileArrayInput.tsx` (filename extraction only) |
| `packages/jsonforms-svelte-extended/src/lib/core/templateUrls.ts`    | `packages/jsonforms-react-extended-renderers/src/util/templateUrls.ts`                       |
| `packages/jsonforms-svelte-extended/tests/core/colorProfile.spec.ts` | `packages/jsonforms-react-renderer-common/test/colorFormat.test.ts`                          |

Spec source commit: `f0183923295c495c60024fddca58dbe99e82e816`.
The six adapted `uischemas.ts` modules under
`packages/jsonforms-svelte-demo-common/src/lib/examples/spec-<name>/` map to
`examples/<name>/uischemas.mjs` for `array-detail-modes`, `editor-details`,
`object-control`, `recursive-tree`, `tree-max-depth`, and `tuple-control`.
The imported JSON fixtures have a separate current-spec content audit in
[the reference refresh](reference-update-2026-10-29.md).

The demo and Web Component `stepper` and `tags-input` adaptations from
shadcn-svelte-extras are tracked in
[the extras review](shadcn-extras-upstream-review.md). Installed shadcn
components and their two local copies have completed the bounded
[P0.8 upstream classification](shadcn-upstream-review.md).
