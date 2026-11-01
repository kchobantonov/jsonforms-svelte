import { getControlPath } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import { dataPathToPointer } from './dataPath';

const empty: ErrorObject[] = [];
const indices = new WeakMap<ErrorObject[], WeakMap<ErrorObject[], Map<string, ErrorObject[]>>>();

/** Index direct targets once per validation result; required children and property
 * names retain their own feedback locations. No descendant summary is added. */
export function directObjectErrors(primary = empty, additional = empty, path: string) {
  let secondary = indices.get(primary);
  if (!secondary) indices.set(primary, (secondary = new WeakMap()));
  let index = secondary.get(additional);
  if (!index) {
    index = new Map();
    for (const error of [...primary, ...additional]) {
      if (
        error.keyword === 'propertyNames' ||
        ('propertyName' in error && error.propertyName !== undefined)
      )
        continue;
      const target = getControlPath(error);
      const errors = index.get(target) ?? [];
      errors.push(error);
      index.set(target, errors);
    }
    secondary.set(additional, index);
  }
  return index.get(path) ?? empty;
}

const rejectedIndices = new WeakMap<
  ErrorObject[],
  WeakMap<ErrorObject[], Map<string, ErrorObject[]>>
>();

/** Rejected keys belong to the additional-properties heading, including literal
 * empty/dotted/slashed names. Only the owning object path selects this list. */
export function rejectedPropertyErrors(primary = empty, additional = empty, path: string) {
  let secondary = rejectedIndices.get(primary);
  if (!secondary) rejectedIndices.set(primary, (secondary = new WeakMap()));
  let index = secondary.get(additional);
  if (!index) {
    index = new Map();
    for (const error of [...primary, ...additional]) {
      if (error.keyword !== 'additionalProperties') continue;
      const owner = getControlPath({ ...error, params: {} });
      const errors = index.get(owner) ?? [];
      errors.push(error);
      index.set(owner, errors);
    }
    secondary.set(additional, index);
  }
  return index.get(path) ?? empty;
}

/** Keep propertyNames feedback on the imported key, not on its value editor. */
export function propertyNameErrors(primary = empty, additional = empty, path: string) {
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
