import { Resolve, type JsonSchema } from '@jsonforms/core';
import isEqual from 'lodash/isEqual';

const annotations = new Set([
  'title',
  'description',
  'default',
  'examples',
  'readOnly',
  'writeOnly',
  'deprecated',
  '$comment',
  'i18n',
]);
const scalarTypes = new Set(['string', 'integer', 'number', 'boolean', 'null']);

/**
 * Presentation only: unwrap one scalar schema accompanied by annotations.
 * Never merge independent validation branches or alter the validator's schema.
 * Unsupported/ambiguous composition retains normal combinator rendering.
 */
export function scalarAllOfSchema(
  schema: JsonSchema,
  rootSchema: JsonSchema,
  seen = new Set<JsonSchema>(),
): JsonSchema | undefined {
  if (seen.has(schema)) return undefined;
  const visited = new Set(seen).add(schema);
  if (schema.$ref) {
    // Do not guess dialect-dependent $ref sibling semantics.
    if (Object.keys(schema).some((key) => key !== '$ref')) return undefined;
    const resolved = Resolve.schema(rootSchema, schema.$ref, rootSchema);
    return resolved ? scalarAllOfSchema(resolved, rootSchema, visited) : undefined;
  }
  if (!schema.allOf) {
    return typeof schema.type === 'string' &&
      scalarTypes.has(schema.type) &&
      !schema.oneOf &&
      !schema.anyOf
      ? schema
      : undefined;
  }
  const { allOf, ...outer } = schema;
  if (Object.keys(outer).some((key) => !annotations.has(key))) return undefined;
  let scalar: JsonSchema | undefined;
  const metadata: Record<string, unknown> = {};
  for (const part of allOf) {
    if (!part || typeof part !== 'object') return undefined;
    if (Object.keys(part).every((key) => annotations.has(key))) {
      for (const [key, value] of Object.entries(part)) {
        if (key in metadata && !isEqual(metadata[key], value)) return undefined;
        metadata[key] = value;
      }
    } else {
      if (scalar) return undefined;
      scalar = scalarAllOfSchema(part, rootSchema, visited);
      if (!scalar) return undefined;
    }
  }
  if (!scalar) return undefined;
  for (const [key, value] of Object.entries(metadata)) {
    if (key in scalar && !isEqual((scalar as Record<string, unknown>)[key], value))
      return undefined;
  }
  return { ...scalar, ...metadata, ...outer } as JsonSchema;
}
