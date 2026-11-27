import type { RankedTester, JsonSchema, UISchemaElement, TesterContext } from '@jsonforms/core';

/** Select the first highest-ranked applicable entry, for both renderer and cell registries. */
export function selectRegistryEntry<T extends { tester: RankedTester }>(
  entries: readonly T[],
  {
    uischema,
    schema,
    rootSchema,
    config,
  }: TesterContext & { uischema: UISchemaElement; schema: JsonSchema },
): T | undefined {
  let selected: T | undefined;
  let bestRank = -1;
  const context = { rootSchema, config };
  for (const entry of entries) {
    const rank = entry.tester(uischema, schema, context);
    if (rank > bestRank) {
      selected = entry;
      bestRank = rank;
    }
  }
  return selected;
}
