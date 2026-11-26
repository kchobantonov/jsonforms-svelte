# Svelte renderer capabilities

This page records the declared Svelte support for Flowbite, shadcn and Skeleton
against `@chobantonov/jsonforms-extended-spec@0.2.0`. The
[specification](https://github.com/kchobantonov/jsonforms-extended-spec/blob/v0.2.0/docs/spec.md)
defines portable behavior. A registered renderer is not proof that every schema,
option and host combination has been tested.

## Families and registration

| Capability                                                  | Flowbite               | shadcn                 | Skeleton               |
| ----------------------------------------------------------- | ---------------------- | ---------------------- | ---------------------- |
| Base scalar controls, choice controls and cells             | Base package           | Base package           | Base package           |
| Object, array, composition and layout renderers             | Base package           | Base package           | Base package           |
| Button, color, cron, duration, file, null and code controls | Extended package       | Extended package       | Extended package       |
| Link, markup label, slot, template and split layout         | Extended package       | Extended package       | Extended package       |
| AG Grid array/table                                         | Extended package, lazy | Extended package, lazy | Extended package, lazy |
| Web Component host                                          | Separate package       | Separate package       | Separate package       |

Install an extended package and append its entries to the renderer and cell
registries to enable those controls. A missing applicable renderer or cell shows
a localized status, emits `renderer.unsupported` or `cell.unsupported` with path
and scope, and preserves form data. The [source inventory](../renderer-source-inventory.md)
lists registered entries and their tester files. Selection uses the highest
applicable tester score; the host's registry order resolves ties.

The three families use their native UI components. Their finite-choice search
defaults differ:

| Family   | Single choice | Multi-select |
| -------- | ------------- | ------------ |
| Flowbite | Off           | On           |
| shadcn   | Off           | Off          |
| Skeleton | On            | On           |

`options.autocomplete: true` enables search and `false` disables it across
families. The [migration guide](../migration-and-release-notes.md) documents
portable option precedence and Svelte vendor bags. The
[demo configuration](../demo-configuration.md) shows host settings.

## Runtime and host limits

- JSON Forms uses Ajv Draft-07 by default. A host may register external schemas
  in its own Ajv instance before mounting. The renderer resolves local pointers,
  anchors, nested absolute `$id` resources and registered absolute references.
  It does not fetch reference URLs. `$dynamicRef` rendering is unsupported.
  See the [base package reference contract](../../packages/jsonforms-svelte/README.md#schema-references).
- Monaco and AG Grid require browser runtimes. Their workers and styles must be
  available to the host. AG Grid Enterprise behavior and arbitrary editor/grid
  option combinations are unverified.
- Shared templates support Ractive, compiled native Svelte and lazy JSX with
  Sucrase. String execution requires host script permission.
- Native and Web Component hosts need their own renderer/cell setup and callback
  props. Each Web Component owns a ShadowRoot; portal and worker behavior must
  be verified in the intended host.
- A native runtime may supply an equivalent editor or grid without claiming
  Monaco or AG Grid compatibility.

The [shadcn upstream review](../shadcn-upstream-review.md) describes native
component ownership. The [example-to-test map](../spec-example-evidence-map.md)
links imported spec examples to production browser tests. Canonical JSON assets
are supplemented with EN/BG labels and host adapters; translated labels do not
become stored enum values or stable `name` identities.

## Verify current support

Run `pnpm run audit:renderer-inventory` for registration and
`pnpm run audit:spec-examples` for imported fixture provenance. For behavior,
run the relevant package tests and built-demo browser tests. Run
`pnpm run lint`, `pnpm run check-format`, and the full build and test gates before
a release. The [development checks](../linting-and-formatting.md) list commands
and prerequisites. Historical run counts do not certify a new spec release or
untested host combinations.
