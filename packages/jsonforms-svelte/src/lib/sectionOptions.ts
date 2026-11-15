type Options = Record<string, unknown>;
type SectionBooleanKey = 'collapsible' | 'showDataIndicator';

const record = (value: unknown): Options | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Options)
    : undefined;

/** Resolve local or namespaced section settings. */
export function resolveSectionBoolean(
  options: Options | undefined,
  config: unknown,
  key: SectionBooleanKey,
  fallback = false,
  policy: 'nullish' | 'boolean' = 'nullish',
): boolean {
  const root = record(config);
  const extended = record(root?.jsonformsExtended);
  const candidates = [options?.[key], extended?.[key]];
  const index = candidates.findIndex((value) =>
    policy === 'boolean' ? typeof value === 'boolean' : value != null,
  );
  return index < 0 ? fallback : candidates[index] === true;
}
