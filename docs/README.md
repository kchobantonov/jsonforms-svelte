# Documentation guide

This workspace consumes `@chobantonov/jsonforms-extended-spec@0.2.0`. The
[release specification](https://github.com/kchobantonov/jsonforms-extended-spec/blob/v0.2.0/docs/spec.md)
and its [implementation guide](https://github.com/kchobantonov/jsonforms-extended-spec/blob/v0.2.0/docs/implementation-guide.md)
define portable behavior. The manifests and lockfile record the consumed version.

## Use and maintain the Svelte renderers

- [Renderer capabilities](renderers/README.md) records Flowbite, Skeleton and
  shadcn support, runtime requirements and platform limits.
- [Demo configuration](demo-configuration.md) and
  [migration and release notes](migration-and-release-notes.md) cover host setup
  and Svelte-specific options.
- [Development checks](linting-and-formatting.md) cover local build, test, lint
  and format commands.
- [Shadcn maintenance](shadcn-maintenance.md), the
  [upstream review](shadcn-upstream-review.md), and
  [adapted source provenance](adapted-source-provenance.md) record component
  ownership and update requirements.
- [Renderer-owned validation](renderer-owned-validation.md) and
  [translation catalogs](i18n-catalogs.md) describe local integration APIs.

## Verification inputs

- [Renderer source inventory](renderer-source-inventory.md) is checked against
  package entries by `pnpm run audit:renderer-inventory`.
- [Example-to-test map](spec-example-evidence-map.md) links imported spec
  examples to production tests. Run current tests before claiming a pass.

Completed upgrade ledgers and component review notes remain in Git history.
Their dated acceptance counts are not current test results.
