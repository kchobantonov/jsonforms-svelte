import { getControlPath } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';

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
