type RegistryEntry = { tester?: unknown };

/** Show trusted host testers as editable source instead of dropping them from JSON. */
export function serializeUISchemaRegistry(entries: readonly unknown[] | undefined): string {
  if (entries === undefined) return '';
  return JSON.stringify(
    entries,
    (key, value: unknown) =>
      key === 'tester' && typeof value === 'function' ? value.toString() : value,
    2,
  );
}

/** Retain an unchanged trusted tester without granting script evaluation to edited source. */
export function restoreTrustedUISchemaTesters<T extends RegistryEntry>(
  entries: readonly T[] | undefined,
  original: readonly RegistryEntry[] | undefined,
): T[] | undefined {
  if (!entries) return undefined;
  if (!original) return [...entries];
  const trusted = new Map(
    original
      .filter((entry) => typeof entry.tester === 'function')
      .map((entry) => [String(entry.tester), entry.tester]),
  );
  return entries.map((entry) => {
    if (typeof entry.tester !== 'string') return entry;
    const tester = trusted.get(entry.tester);
    return tester ? { ...entry, tester } : entry;
  }) as T[];
}
