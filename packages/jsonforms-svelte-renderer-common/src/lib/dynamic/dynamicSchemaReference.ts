import type { JsonSchema } from '@jsonforms/core';

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const maps = ['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'];
const singles = [
  'additionalProperties',
  'additionalItems',
  'contains',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
];
const arrays = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];

/** Dynamic scope cannot be preserved by JSON Forms' root-pointer resolver. */
export function dynamicSchemaReference(schema: JsonSchema): string | undefined {
  const seen = new WeakSet<object>();
  const find = (value: unknown): string | undefined => {
    if (!object(value) || seen.has(value)) return undefined;
    seen.add(value);
    if (typeof value.$dynamicRef === 'string') return value.$dynamicRef;
    for (const key of maps) {
      if (!object(value[key])) continue;
      for (const child of Object.values(value[key])) {
        const found = find(child);
        if (found !== undefined) return found;
      }
    }
    for (const key of singles) {
      const found = find(value[key]);
      if (found !== undefined) return found;
    }
    for (const key of arrays) {
      if (!Array.isArray(value[key])) continue;
      for (const child of value[key]) {
        const found = find(child);
        if (found !== undefined) return found;
      }
    }
    for (const child of Array.isArray(value.items) ? value.items : [value.items]) {
      const found = find(child);
      if (found !== undefined) return found;
    }
    if (object(value.dependencies))
      for (const child of Object.values(value.dependencies)) {
        if (Array.isArray(child)) continue;
        const found = find(child);
        if (found !== undefined) return found;
      }
    return undefined;
  };
  return find(schema);
}
