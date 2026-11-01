import { resolveRestrict } from './options';

/** Temporal pickers use the shared flat/local restriction default. */
export function temporalRestrict(
  options: Record<string, unknown> | undefined,
  config: Record<string, unknown> | undefined,
): boolean {
  return resolveRestrict(options, config);
}

/** Resolve an Ajv absolute or relative instance pointer without following inherited properties. */
export function resolveTemporalDataPointer(
  pointer: string,
  path: string | readonly string[],
  data: unknown,
): unknown {
  const absolute = pointer === '' || pointer.startsWith('/');
  const match = absolute ? undefined : /^(0|[1-9]\d*)(?:\/(.*))?$/.exec(pointer);
  if (!absolute && !match) return undefined;
  const segments = absolute ? [] : typeof path === 'string' ? (path ? path.split('.') : []) : path;
  const up = match ? Number(match[1]) : 0;
  if (up > segments.length) return undefined;
  const tail = absolute ? pointer.slice(1) : match?.[2];
  const rest =
    tail === undefined || pointer === ''
      ? []
      : tail.split('/').map((key) => key.replace(/~1/g, '/').replace(/~0/g, '~'));
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
  path: string | readonly string[],
  data: unknown,
): Record<string, unknown> {
  const resolved = { ...schema };
  for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
    const branches = schema[keyword];
    if (Array.isArray(branches)) {
      resolved[keyword] = branches.map((branch) =>
        branch && typeof branch === 'object' && !Array.isArray(branch)
          ? resolveTemporalDataBounds(branch as Record<string, unknown>, path, data)
          : branch,
      );
    }
  }
  if (schema.format !== undefined && !['date', 'time', 'date-time'].includes(String(schema.format)))
    return resolved;
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

type TimeFormatBounds = Partial<
  Record<
    'formatMinimum' | 'formatExclusiveMinimum' | 'formatMaximum' | 'formatExclusiveMaximum',
    unknown
  >
>;

/** Match ajv-formats' time ordering: each offset-bearing clock is anchored to one calendar date. */
export function timeValueWithinOffsetBounds(
  value: string,
  bounds: TimeFormatBounds,
): boolean | undefined {
  const entries = [
    ['formatMinimum', true, false],
    ['formatExclusiveMinimum', true, true],
    ['formatMaximum', false, false],
    ['formatExclusiveMaximum', false, true],
  ] as const;
  if (
    !entries.some(
      ([key]) => typeof bounds[key] === 'string' && /(?:Z|[+-]\d{2}:?\d{2})$/i.test(bounds[key]),
    )
  )
    return undefined;
  const candidate = Date.parse(`2020-01-01T${value}`);
  if (!Number.isFinite(candidate)) return undefined;
  for (const [key, lower, exclusive] of entries) {
    const raw = bounds[key];
    if (typeof raw !== 'string') continue;
    const bound = Date.parse(`2020-01-01T${raw}`);
    if (!Number.isFinite(bound)) continue;
    if (
      lower
        ? exclusive
          ? candidate <= bound
          : candidate < bound
        : exclusive
          ? candidate >= bound
          : candidate > bound
    )
      return false;
  }
  return true;
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

/** The finest requested date view wins; otherwise the display format selects the mode. */
export function temporalDateMode(views: unknown, displayFormat: string): 'date' | 'month' | 'year' {
  if (Array.isArray(views)) {
    if (views.includes('day') || views.includes('date')) return 'date';
    if (views.includes('month')) return 'month';
    if (views.includes('year')) return 'year';
  }
  return displayFormat.includes('D') ? 'date' : displayFormat.includes('M') ? 'month' : 'year';
}
