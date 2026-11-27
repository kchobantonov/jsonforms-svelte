import { Resolve, type JsonSchema } from '@jsonforms/core';

export function schemaAtDataPath(root: JsonSchema, segments: string[]): JsonSchema | undefined {
  let schema: JsonSchema | undefined = root;
  for (const segment of segments) {
    if (!schema) return undefined;
    if (schema.$ref) schema = Resolve.schema(root, schema.$ref, root);
    if (!schema) return undefined;
    if (schema.type === 'array') {
      const positional: JsonSchema[] | undefined = (
        schema as JsonSchema & { prefixItems?: JsonSchema[] }
      ).prefixItems;
      schema =
        positional?.[Number(segment)] ??
        ((Array.isArray(schema.items) ? schema.items[Number(segment)] : schema.items) as
          | JsonSchema
          | undefined);
    } else {
      const declared =
        schema.properties && Object.hasOwn(schema.properties, segment)
          ? schema.properties[segment]
          : undefined;
      schema =
        declared ??
        (typeof schema.additionalProperties === 'object' ? schema.additionalProperties : undefined);
    }
  }
  return schema?.$ref ? Resolve.schema(root, schema.$ref, root) : schema;
}
export function preventsEmpty(schema: JsonSchema, array: boolean): boolean {
  if (schema.allOf?.some((part) => preventsEmpty(part, array))) return true;
  if (array)
    return (
      (schema.minItems ?? 0) > 0 ||
      (!!(schema as JsonSchema & { contains?: unknown }).contains &&
        ((schema as JsonSchema & { minContains?: number }).minContains ?? 1) > 0)
    );
  return (schema.minProperties ?? 0) > 0 || !!schema.required?.length;
}
