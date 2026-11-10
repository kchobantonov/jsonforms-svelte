# Dynamic resolution performance

Measured locally on 2026-11-09 with Node 22.23.4 on arm64. These are resolver
microbenchmarks and an emitted-bundle inspection, not browser interaction timings.

## Resolution reuse

The form owns a weak cache with one latest result per authored UI element. Its key
includes the immutable roots actually read, the trust setting, and evaluator
readiness. Parent consumers and dispatch can reuse a result with identical inputs.
Distinct items, paths (when read), data roots, and forms cannot reuse each other's
results. Each mounted consumer still stabilizes its own effective element identity.
The cache retains no history of old input generations.

The benchmark performs 20 warm-up updates and reports the median of 500 updates.
Each update uses a fresh external object and three dynamic leaves. Both paths run
in the same process with the same compiled expressions and snapshot validation.

| Consumers of the same authored UI and inputs | Isolated resolution |      Form cache |
| -------------------------------------------- | ------------------: | --------------: |
| 2                                            |      14.2 µs/update |  10.3 µs/update |
| 50                                           |     239.2 µs/update | 126.7 µs/update |

Repeated runs of the 50-consumer case ranged from 237–239 µs isolated and
120–127 µs shared. This measures repeated identical consumers; unrelated elements
or different input roots do not get that reuse. One-consumer differences are too
small and sensitive to warm-up to attribute to the cache.

Run:

```sh
pnpm --dir packages/jsonforms-svelte exec vp test run \
  tests/src/lib/dynamicUi.benchmark.spec.ts --disableConsoleIntercept --reporter=verbose
```

Snapshots remain validated and frozen. The existing weak snapshot cache already
shares validation across occurrences: a fresh 2,000-field data root took roughly
258 µs for one binding and 272 µs for 50 bindings in the baseline run. Removing
those safety checks would change the contract, rather than merely remove duplicate
work. Namespace-level invalidation remains; this is not field-level tracking.

## Lazy CEL loading

The evaluator is a separate dynamically imported module. Disabled forms do not
request it. The first enabled form prepares it once, and concurrent forms share
the import. Initial editors are held back until their effective UI can be resolved.
For an already mounted form, activation keeps the editor mounted but makes the
form noninteractive during preparation. Failure is reported; disabling and
reenabling retries loading. Cleanup ignores completion for an obsolete activation.

Public form adapters prepare CEL automatically. Callers of the low-level synchronous
resolver must `await loadDynamicUiExpressions()` before resolving CEL expressions.
Bindings and literal/template descriptors do not themselves need CEL preparation.

The shared web-component chunk policy separates both the dynamic evaluator and
the Label interpolation evaluator from their eager library chunks. Without this
rule, package-oriented chunk merging made the dynamic import ineffective.

For the built Shadcn web component, walking only static ES imports from its entry
and inspecting source-map module lists showed:

| Initial static JavaScript graph    |    Before |     After |
| ---------------------------------- | --------: | --------: |
| Raw bytes                          | 8,952,836 | 8,839,899 |
| Sum of individually gzipped chunks | 2,025,037 | 1,997,408 |
| CEL library in initial graph       |       Yes |        No |

That defers about 110 KiB raw / 27 KiB gzipped. The evaluator remains available as
an async chunk; total shipped code is not reduced by that amount. These numbers
include the bundle's other libraries and do not claim a measured page-load speedup.
React's emitted `dynamicRuntime.esm.js` likewise imports `dynamicCel.esm.js`
dynamically; its resolver no longer statically imports the CEL package.
