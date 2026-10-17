import { resolveSchema, type JsonSchema } from '@jsonforms/core';
import isEqual from 'lodash/isEqual';
import type { ErrorObject } from 'ajv';

type Discriminator = { key: string; values: unknown[] };
const cache = new WeakMap<
  JsonSchema,
  WeakMap<JsonSchema, Map<'oneOf' | 'anyOf', Discriminator[]>>
>();

function discriminators(schema: JsonSchema, root: JsonSchema, keyword: 'oneOf' | 'anyOf') {
  let roots = cache.get(schema);
  if (!roots) cache.set(schema, (roots = new WeakMap()));
  let keywords = roots.get(root);
  if (!keywords) roots.set(root, (keywords = new Map()));
  const cached = keywords.get(keyword);
  if (cached) return cached;
  const alternatives = schema[keyword];
  if (!alternatives?.length) return [];
  try {
    const branches = alternatives.map((branch) =>
      branch.$ref ? resolveSchema(root, branch.$ref, root) : branch,
    );
    const result: Discriminator[] = Object.keys(branches[0]?.properties ?? {}).flatMap((key) => {
      const properties = branches.map((branch) => branch?.properties?.[key]);
      if (
        !branches.every((branch) => branch?.required?.includes(key)) ||
        !properties.every((property) => property && Object.hasOwn(property, 'const'))
      )
        return [];
      const values = properties.map((property) => property!.const);
      if (
        values.some((value, index) => values.slice(0, index).some((other) => isEqual(value, other)))
      )
        return [];
      return [{ key, values }];
    });
    keywords.set(keyword, result);
    return result;
  } catch {
    // Unresolved references provide no selection hint.
    return [];
  }
}

/** An editing hint for invalid branches, never a replacement for document validation. */
export function discriminatorBranch(
  schema: JsonSchema,
  root: JsonSchema,
  keyword: 'oneOf' | 'anyOf',
  data: unknown,
): number | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  for (const { key, values } of discriminators(schema, root, keyword)) {
    if (!Object.hasOwn(data, key)) continue;
    const index = values.findIndex((value) =>
      isEqual(value, (data as Record<string, unknown>)[key]),
    );
    if (index >= 0) return index;
  }
  return undefined;
}

/** Route a missing branch discriminator to the selector which creates it. */
export function missingDiscriminatorError(
  schema: JsonSchema,
  root: JsonSchema,
  path: string,
  errors: ErrorObject[],
): boolean {
  if ((schema.oneOf?.length ?? 0) < 2) return false;
  const keys = discriminators(schema, root, 'oneOf').map(({ key }) => key);
  const pointer = path
    ? '/' +
      path
        .split('.')
        .map((part) => part.replaceAll('~', '~0').replaceAll('/', '~1'))
        .join('/')
    : '';
  return errors.some(
    (error) =>
      error.keyword === 'required' &&
      error.instancePath === pointer &&
      keys.includes(error.params.missingProperty),
  );
}

export function initialOneOfBranch(
  data: unknown,
  fitting: number | undefined,
  count: number,
): number | null {
  if (data === undefined) return null;
  if (fitting !== undefined && fitting >= 0 && fitting < count) return fitting;
  if (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0)
    return null;
  return count > 0 ? 0 : null;
}
