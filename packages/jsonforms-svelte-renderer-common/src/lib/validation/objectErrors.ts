import type { ErrorObject } from 'ajv';
import { dataPathSegments, dataPathToPointer } from '../core/dataPath.js';
import { errorTargetSegments } from './errorSummary.js';

const empty: ErrorObject[] = [];
function indexObjectErrors(target: (error: ErrorObject) => readonly string[] | undefined) {
  const indices = new WeakMap<ErrorObject[], WeakMap<ErrorObject[], Map<string, ErrorObject[]>>>();
  return (primary = empty, additional = empty, path: string | readonly string[]) => {
    let secondary = indices.get(primary);
    if (!secondary) indices.set(primary, (secondary = new WeakMap()));
    let index = secondary.get(additional);
    if (!index) {
      index = new Map();
      for (const error of [...primary, ...additional]) {
        const segments = target(error);
        if (!segments) continue;
        const key = JSON.stringify(segments);
        const errors = index.get(key) ?? [];
        errors.push(error);
        index.set(key, errors);
      }
      secondary.set(additional, index);
    }
    return (
      index.get(JSON.stringify(typeof path === 'string' ? dataPathSegments(path) : path)) ?? empty
    );
  };
}

/** Index direct targets once per validation result, leaving property-name feedback with the key. */
export const directObjectErrors = indexObjectErrors((error) => {
  if (
    error.keyword === 'propertyNames' ||
    ('propertyName' in error && error.propertyName !== undefined)
  )
    return undefined;
  return errorTargetSegments(error);
});

/** Rejected keys belong to the heading at the exact path of the owning object. */
export const rejectedPropertyErrors = indexObjectErrors((error) =>
  error.keyword === 'additionalProperties'
    ? errorTargetSegments({ ...error, params: {} })
    : undefined,
);

/** Keep propertyNames feedback on the imported key, not on its value editor. */
export function propertyNameErrors(
  primary = empty,
  additional = empty,
  path: string | readonly string[],
) {
  const owner = dataPathToPointer(path);
  const matches = [...primary, ...additional].filter(
    (error) =>
      error.instancePath === owner &&
      (error.keyword === 'propertyNames' ||
        ('propertyName' in error && typeof error.propertyName === 'string')),
  );
  const specificNames = new Set(
    matches
      .filter((error) => error.keyword !== 'propertyNames')
      .map((error) => ('propertyName' in error ? error.propertyName : undefined)),
  );
  const result = new Map<string, ErrorObject[]>();
  for (const error of matches) {
    const name = 'propertyName' in error ? error.propertyName : error.params.propertyName;
    if (typeof name !== 'string') continue;
    if (error.keyword === 'propertyNames' && specificNames.has(name)) continue;
    result.set(name, [...(result.get(name) ?? []), error]);
  }
  return result;
}
