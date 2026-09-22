import {
  Resolve,
  isControl,
  extractDefaults,
  type JsonSchema,
  type RankedTester,
} from '@jsonforms/core';
import cloneDeep from 'lodash/cloneDeep';

export type TupleSchema = JsonSchema | boolean;
type PositionalSchema = JsonSchema & { prefixItems?: TupleSchema[] };
export function tupleDefinition(schema: JsonSchema, explicit = false) {
  const s = schema as PositionalSchema;
  if (s?.type !== 'array') return undefined;
  if (Array.isArray(s.prefixItems))
    return { prefix: s.prefixItems, tail: (s.items ?? true) as TupleSchema };
  if (Array.isArray(s.items))
    return { prefix: s.items as TupleSchema[], tail: (s.additionalItems ?? true) as TupleSchema };
  if (explicit && Number.isInteger(s.minItems) && s.minItems! >= 0 && s.minItems === s.maxItems)
    return {
      prefix: Array.from({ length: s.minItems! }, () => (s.items ?? true) as TupleSchema),
      tail: false as TupleSchema,
    };
  return undefined;
}
export const tupleTester: RankedTester = (ui, schema, context) => {
  if (!isControl(ui)) return -1;
  const resolved = Resolve.schema(schema, ui.scope, context.rootSchema);
  const explicit = ui.options?.variant === 'tuple';
  return explicit || (resolved && tupleDefinition(resolved)) ? 25 : -1;
};
export function resolveTupleSchema(schema: TupleSchema, root: JsonSchema): TupleSchema {
  return typeof schema === 'object' && schema.$ref
    ? (Resolve.schema(root, schema.$ref, root) ?? schema)
    : schema;
}
export function tupleInitialValue(
  schema: TupleSchema,
  root: JsonSchema,
  seen = new Set<TupleSchema>(),
): unknown {
  schema = resolveTupleSchema(schema, root);
  if (typeof schema !== 'object' || seen.has(schema)) return undefined;
  if (schema.default !== undefined) return cloneDeep(schema.default);
  switch (schema.type) {
    case 'string':
      return '';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'array':
      return [];
    case 'object':
      return extractDefaults(schema, root);
    default:
      return undefined;
  }
}
export function tupleEmptyValue(schema: TupleSchema, root: JsonSchema): unknown {
  schema = resolveTupleSchema(schema, root);
  if (typeof schema !== 'object') return undefined;
  if (schema.type === 'string') return '';
  if (schema.type === 'array') return [];
  if (schema.type === 'object') return {};
  if (schema.type === 'null' || (Array.isArray(schema.type) && schema.type.includes('null')))
    return null;
  return undefined;
}
export function tupleRenderSchema(schema: TupleSchema): JsonSchema {
  if (schema === true || (typeof schema === 'object' && Object.keys(schema).length === 0))
    return { type: ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'] };
  return schema as JsonSchema;
}
