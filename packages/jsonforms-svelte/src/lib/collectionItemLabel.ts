import {
  Resolve,
  enumToEnumOptionMapper,
  getFirstPrimitiveProp,
  getI18nKeyPrefix,
  oneOfToEnumOptionMapper,
  type JsonSchema,
  type Translator,
} from '@jsonforms/core';
import isEqual from 'lodash/isEqual';
import { dataPathSegments } from './dataPath';

/** Follow an item reference before choosing its first primitive display field. */
export function collectionItemDefaultLabelPath(
  itemSchema: JsonSchema,
  rootSchema: JsonSchema | undefined,
): string | undefined {
  try {
    const resolved = Resolve.schema(itemSchema, '#', rootSchema ?? itemSchema);
    if (!resolved || typeof resolved !== 'object') return undefined;
    const properties = Object.fromEntries(
      Object.entries(resolved.properties ?? {}).map(([name, property]) => {
        try {
          return [name, Resolve.schema(property, '#', rootSchema ?? itemSchema) ?? property];
        } catch {
          return [name, property];
        }
      }),
    );
    return getFirstPrimitiveProp({ ...resolved, properties });
  } catch {
    return undefined;
  }
}

/** Resolve the selected item's choice title without changing its stored value. */
export function collectionItemChoiceLabel(
  itemSchema: JsonSchema,
  labelPath: string,
  value: unknown,
  rootSchema: JsonSchema | undefined,
  translate: Translator | undefined,
  dataPath: string,
): string | undefined {
  const segments = dataPathSegments(labelPath);
  if (segments.length === 0) return undefined;
  const scope =
    '#/' +
    segments
      .map((segment) => `properties/${segment.replaceAll('~', '~0').replaceAll('/', '~1')}`)
      .join('/');
  let schema: ReturnType<typeof Resolve.schema>;
  try {
    schema = Resolve.schema(itemSchema, scope, rootSchema ?? itemSchema);
  } catch {
    return undefined;
  }
  if (!schema || typeof schema === 'boolean') return undefined;
  const prefix = getI18nKeyPrefix(schema, { type: 'Control', scope }, dataPath);

  const branch = schema.oneOf?.find(
    (candidate) =>
      typeof candidate === 'object' &&
      candidate !== null &&
      Object.hasOwn(candidate, 'const') &&
      isEqual(candidate.const, value),
  );
  if (branch && typeof branch === 'object')
    return oneOfToEnumOptionMapper(branch, translate, prefix).label;

  if (schema.enum?.some((candidate) => isEqual(candidate, value)))
    return enumToEnumOptionMapper(value, translate, prefix).label;
  return undefined;
}
