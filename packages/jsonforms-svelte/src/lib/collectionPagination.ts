import type { JsonFormsCore } from '@jsonforms/core';
import { dataPathToPointer } from './dataPath';
import { containerErrorIndex } from './containerValidation';
import { errorsForSummaryIndex } from './errorSummary';
export type PaginationOption = boolean | { pageSize?: number; pageSizeOptions?: number[] };
export type CollectionKind = 'array' | 'additionalProperties' | 'additionalItems';

/** Find the first new logical item after a collection grows, regardless of insertion position. */
export function firstAddedCollectionIndex(
  previous: readonly (string | number)[],
  current: readonly (string | number)[],
): number {
  const oldKeys = new Set(previous);
  return current.findIndex((key) => !oldKeys.has(key));
}

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};

/** Resolve the entire scoped option; page-size fields never leak across levels. */
export function resolvePagination(
  local: unknown,
  config: unknown,
  kind: CollectionKind,
  defaultEnabled = true,
) {
  const option =
    local ?? record(record(record(config).jsonformsExtended)[kind]).pagination ?? defaultEnabled;
  const settings = record(option);
  const size =
    typeof settings.pageSize === 'number' &&
    Number.isInteger(settings.pageSize) &&
    settings.pageSize > 0
      ? settings.pageSize
      : 5;
  const candidates = Array.isArray(settings.pageSizeOptions)
    ? settings.pageSizeOptions
    : [5, 10, 25, 50];
  const choices = [
    ...new Set<number>([
      ...candidates.filter(
        (value): value is number =>
          typeof value === 'number' && Number.isInteger(value) && value > 0,
      ),
      size,
    ]),
  ].sort((a, b) => a - b);
  return { enabled: option !== false, size, choices };
}

/** Error positions remain relative to the full view, before paging. */
export function collectionErrorPositions(
  core: JsonFormsCore | undefined,
  path: string | readonly string[],
  keys: readonly (string | number)[],
) {
  const hidden =
    core?.validationMode === 'NoValidation' || core?.validationMode === 'ValidateAndHide';
  const errors = containerErrorIndex(
    errorsForSummaryIndex(hidden ? undefined : core?.errors),
    core?.additionalErrors,
  );
  const owner = dataPathToPointer(path);
  // The ancestor index includes one entry for each affected immediate child.
  // Decode those few entries once instead of rebuilding a pointer per row.
  if (!errors.get(owner)) return [];
  const prefix = `${owner}/`;
  const rowCounts = new Map<string, number>();
  for (const [pointer, count] of errors) {
    if (!pointer.startsWith(prefix)) continue;
    const encodedKey = pointer.slice(prefix.length);
    if (encodedKey.includes('/')) continue;
    rowCounts.set(encodedKey.replaceAll('~1', '/').replaceAll('~0', '~'), count);
  }
  return keys.flatMap((key, index) => {
    const count = rowCounts.get(String(key)) ?? 0;
    return count ? [{ index, count }] : [];
  });
}
