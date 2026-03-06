import {
  and,
  hasType,
  rankWith,
  resolveSchema,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
} from '@jsonforms/core';
import controlRenderer from './EnumArrayRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(
    5,
    and(
      uiTypeIs('Control'),
      and(
        schemaMatches(
          (schema) =>
            hasType(schema, 'array') && !Array.isArray(schema.items) && schema.uniqueItems === true,
        ),
        schemaSubPathMatches('items', (schema, rootSchema) => {
          schema =
            typeof schema.$ref === 'string'
              ? (resolveSchema(rootSchema, schema.$ref, rootSchema) ?? schema)
              : schema;
          return hasOneOfItems(schema) || hasEnumItems(schema);
        }),
      ),
    ),
  ),
};

const hasOneOfItems = (schema: JsonSchema): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema: JsonSchema): boolean =>
  schema.type === 'string' && schema.enum !== undefined;
