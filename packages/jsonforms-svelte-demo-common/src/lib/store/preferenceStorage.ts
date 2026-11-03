const preferenceVersion = 1;

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readStoredPreference<T>(
  storage: PreferenceStorage | undefined,
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  try {
    const raw = storage?.getItem(key);
    if (raw == null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'value' in parsed) {
      const record = parsed as { version: unknown; value: unknown };
      if (record.version !== preferenceVersion) return fallback;
      if (isValid(record.value)) return record.value;
      return fallback;
    }
    return fallback;
  } catch {
    // Browsers may deny access to storage entirely, including the getter.
    return fallback;
  }
}

export function writeStoredPreference<T>(
  storage: PreferenceStorage | undefined,
  key: string,
  value: T | null | undefined,
): void {
  try {
    if (value == null) storage?.removeItem(key);
    else storage?.setItem(key, JSON.stringify({ version: preferenceVersion, value }));
  } catch {
    // Keep the reactive in-memory preference usable when storage is blocked.
  }
}

export function preferenceTypeGuard<T>(fallback: T): (value: unknown) => value is T {
  return (value): value is T =>
    typeof value === typeof fallback &&
    (typeof value !== 'number' || Number.isFinite(value)) &&
    (fallback === null ||
      typeof fallback !== 'object' ||
      (value !== null && !Array.isArray(value)));
}

export function isDemoLocale(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return Intl.getCanonicalLocales(value).length === 1;
  } catch {
    return false;
  }
}
