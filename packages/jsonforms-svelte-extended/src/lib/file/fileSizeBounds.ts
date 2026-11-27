export const fileSizeBoundKeys = [
  'formatMaximum',
  'formatExclusiveMaximum',
  'formatMinimum',
  'formatExclusiveMinimum',
] as const;

export type FileSizeBoundKey = (typeof fileSizeBoundKeys)[number];
export type FileSizeBound = { keyword: FileSizeBoundKey; limit: number };

const nonNegativeNumber = (raw: unknown): number | undefined => {
  if (typeof raw !== 'number' && (typeof raw !== 'string' || raw.trim() === '')) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
};

/** A schema bound overrides the same UI key; distinct bounds all remain active. */
export function resolveFileSizeBounds(schema: object, options: object): FileSizeBound[] {
  const schemaBounds = schema as Record<FileSizeBoundKey, unknown>;
  const optionBounds = options as Record<FileSizeBoundKey, unknown>;
  return fileSizeBoundKeys.flatMap((keyword) => {
    const limit =
      nonNegativeNumber(schemaBounds[keyword]) ?? nonNegativeNumber(optionBounds[keyword]);
    return limit === undefined ? [] : [{ keyword, limit }];
  });
}

export function violatedFileSizeBound(
  size: number,
  bounds: readonly FileSizeBound[],
): FileSizeBound | undefined {
  return bounds.find(({ keyword, limit }) => {
    switch (keyword) {
      case 'formatMaximum':
        return size > limit;
      case 'formatExclusiveMaximum':
        return size >= limit;
      case 'formatMinimum':
        return size < limit;
      case 'formatExclusiveMinimum':
        return size <= limit;
    }
  });
}
