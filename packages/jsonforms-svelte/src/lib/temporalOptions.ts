/** Temporal option and $data semantics adapted from React common at
 * 150fd688ae09f0f3b28e989649f3daf1d9f6d91d, temporalBounds.ts. */
export function temporalRestrict(
  options: Record<string, unknown> | undefined,
  config: unknown,
): boolean {
  if (typeof options?.restrict === 'boolean') return options.restrict;
  const namespace = (config as { jsonformsExtended?: { restrict?: unknown } } | undefined)
    ?.jsonformsExtended;
  return typeof namespace?.restrict === 'boolean' ? namespace.restrict : true;
}

/** Resolve an Ajv relative instance pointer without following inherited properties. */
export function resolveTemporalDataPointer(pointer: string, path: string, data: unknown): unknown {
  const match = /^(0|[1-9]\d*)(?:\/(.*))?$/.exec(pointer);
  if (!match) return undefined;
  const segments = path === '' ? [] : path.split('.');
  const up = Number(match[1]);
  if (up > segments.length) return undefined;
  const rest =
    match[2] === undefined
      ? []
      : match[2].split('/').map((key) => key.replace(/~1/g, '/').replace(/~0/g, '~'));
  let current = data;
  for (const key of [...segments.slice(0, segments.length - up), ...rest]) {
    if (current === null || typeof current !== 'object' || !Object.hasOwn(current, key))
      return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function resolveTemporalDataBounds(
  schema: Record<string, unknown>,
  path: string,
  data: unknown,
): Record<string, unknown> {
  const resolved = { ...schema };
  for (const key of [
    'formatMinimum',
    'formatMaximum',
    'formatExclusiveMinimum',
    'formatExclusiveMaximum',
  ]) {
    const pointer = (schema[key] as { $data?: unknown } | undefined)?.$data;
    if (typeof pointer !== 'string') continue;
    const value = resolveTemporalDataPointer(pointer, path, data);
    if (typeof value === 'string') resolved[key] = value;
    else delete resolved[key];
  }
  return resolved;
}

/** Views select picker columns independently of display and storage formats. */
export function temporalTimeColumns(views: unknown) {
  if (!Array.isArray(views)) return undefined;
  const wanted = views.filter((view) => ['hours', 'minutes', 'seconds'].includes(view));
  if (wanted.length === 0) return undefined;
  return {
    hours: wanted.includes('hours'),
    minutes: wanted.includes('minutes'),
    seconds: wanted.includes('seconds'),
  };
}

// Probe shapes match the RFC 3339 formats accepted by ajv-formats in full mode.
const temporalProbePatterns: Record<string, RegExp> = {
  date: /^\d{4}-[0-1]\d-[0-3]\d$/,
  time: /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d{2}(?::?\d{2})?)$/i,
  'date-time':
    /^\d{4}-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d{2}(?::?\d{2})?)$/i,
};
export function temporalSaveFormatIsValid(schemaFormat: unknown, serializedProbe: string): boolean {
  const pattern =
    typeof schemaFormat === 'string' && Object.hasOwn(temporalProbePatterns, schemaFormat)
      ? temporalProbePatterns[schemaFormat]
      : undefined;
  return !pattern || pattern.test(serializedProbe);
}
const warnedSaveFormats = new Set<string>();
/** Developer diagnostic only: an invalid save format cannot be fixed by the form user. */
export function warnTemporalSaveFormat(
  schemaFormat: unknown,
  saveFormat: string,
  serializedProbe: string,
): void {
  if (temporalSaveFormatIsValid(schemaFormat, serializedProbe)) return;
  const key = `${String(schemaFormat)}|${saveFormat}`;
  if (warnedSaveFormats.has(key)) return;
  warnedSaveFormats.add(key);
  console.warn(
    `temporal.saveFormatInvalid: the save format ${JSON.stringify(saveFormat)} produces values rejected by format ${JSON.stringify(schemaFormat)}. Use a compatible save format or select the renderer through options.format without a schema format.`,
  );
}

/** The finest requested date view wins; storage is only the legacy fallback. */
export function temporalDateMode(views: unknown, saveFormat: string): 'date' | 'month' | 'year' {
  if (Array.isArray(views)) {
    if (views.includes('day') || views.includes('date')) return 'date';
    if (views.includes('month')) return 'month';
    if (views.includes('year')) return 'year';
  }
  return saveFormat.includes('D') ? 'date' : saveFormat.includes('M') ? 'month' : 'year';
}
