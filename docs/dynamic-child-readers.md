# Dynamic child readers

`$dynamic` resolution remains shared infrastructure. A parent that inspects a
child before dispatch must use its effective properties; a parent that only
dispatches children does not need a second evaluation implementation.

The Svelte `useDynamicTreeResolver` and React hook of the same name produce a
structural view at an explicit dispatch path. React's `useDynamicElements` also
stabilizes the child array. Static branches retain their references. The view
walks `elements`, never arbitrary option objects or reusable `options.detail`.
Object, tuple and composite detail consumers resolve those details at their actual
bound path. Array item contexts remain occurrence-specific.

Updated readers include:

- Object detail type/conditional filtering and composite detail error scopes.
- Section data/validation indicators and root error-summary labels/scopes.
- Tuple position layouts and choice-card content type checks.
- JSX and native/TypeScript template inputs. Slot lookup names remain authored;
  effective properties are available to template code. React JSX also forwards
  the enclosing path to dispatched children.

Presentation metadata is internal. It retains authored identities and prevents
redispatch from undoing conditional filtering or applying an overlay twice.
Renderers receive ordinary effective UI schemas, not a new expression API.

## Coverage and limits

Regression tests cover scope changes before filtering, validation counts, stable
instances on label changes, reused details in distinct item contexts, unchanged
branch references, filtered-root redispatch, template child-property access,
authored slot names, and nested React template paths. Existing renderer tests
cover objects, groups, tuples and cards. These focused checks are not a claim that
every possible custom renderer reads children correctly.

Normal renderer and cell dispatch now resolve structural children **before tester
selection**. This includes parents without their own `$dynamic`: a categorization
tester sees the effective child types, and a custom renderer receives effective
structural children without calling a helper. React's internal redispatch marker
prevents aspect re-entry without disabling independently dispatched descendants.

A custom parent that creates or retrieves a separate detail and inspects it before
dispatch still needs the shared helper, at that detail's actual path. Arbitrary
option objects remain opaque; they are not assumed to be child UI schemas.

## Static fast path

An immutable UI object's structural metadata-presence result is cached weakly.
Static trees are scanned once and then require only a constant-time presence
check, with no overlay evaluation, JSON snapshots or repeated tree traversal.
Replacing the UI schema with a new object computes its own presence result.
Svelte allocates resolution caches lazily and does not subscribe a static tree to
external data through the resolver. Disabled dynamic trees never evaluate leaves.
The transparent boundary is retained for trees that carry metadata so activation
can preserve editor instances.

A local Node microbenchmark of a 2,000-child static tree measured approximately
0.61 ms for the initial scan and 0.013 microseconds per cached check (median of ten
100,000-check batches). This measures the presence check, not a complete form
render or a guarantee of literally zero overhead. Reproduce with
`pnpm --dir packages/jsonforms-svelte exec vp test run tests/src/lib/dynamicTree.benchmark.spec.ts --disableConsoleIntercept`.
