import type { JsonFormsCore } from '@jsonforms/core';
import { dataPathSegments } from './dataPath';
import { containerErrorIndex } from './containerValidation';
export type PaginationOption = boolean | { pageSize?: number; pageSizeOptions?: number[] };
export type CollectionKind = 'array' | 'additionalProperties' | 'additionalItems';

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
  path: string,
  keys: readonly (string | number)[],
) {
  const hidden =
    core?.validationMode === 'NoValidation' || core?.validationMode === 'ValidateAndHide';
  const errors = containerErrorIndex(hidden ? undefined : core?.errors, core?.additionalErrors);
  const segments = dataPathSegments(path);
  return keys.flatMap((key, index) => {
    const pointer =
      '/' +
      [...segments, String(key)]
        .map((part) => part.replaceAll('~', '~0').replaceAll('/', '~1'))
        .join('/');
    const count = errors.get(pointer) ?? 0;
    return count ? [{ index, count }] : [];
  });
}
