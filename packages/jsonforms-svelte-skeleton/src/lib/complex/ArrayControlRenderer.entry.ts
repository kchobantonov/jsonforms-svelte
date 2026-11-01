import {
  and,
  hasType,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  optionIs,
  or,
  rankWith,
  resolveSchema,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import controlRenderer from './ArrayControlRenderer.svelte';
const isNullArrayControl = and(
  uiTypeIs('Control'),
  and(
    schemaMatches((schema) => hasType(schema, 'array') && !Array.isArray(schema.items)),
    schemaSubPathMatches('items', (schema, rootSchema) =>
      hasType(
        schema.$ref ? (resolveSchema(rootSchema, schema.$ref, rootSchema) ?? schema) : schema,
        'null',
      ),
    ),
  ),
);
const isComposedArrayControl = and(
  uiTypeIs('Control'),
  and(
    schemaMatches((schema) => hasType(schema, 'array') && !Array.isArray(schema.items)),
    schemaSubPathMatches('items', (schema, rootSchema) => {
      const item = schema.$ref
        ? (resolveSchema(rootSchema, schema.$ref, rootSchema) ?? schema)
        : schema;
      return [item.oneOf, item.anyOf, item.allOf].some(
        (alternatives) => Array.isArray(alternatives) && alternatives.length > 0,
      );
    }),
  ),
);
const supported = or(
  or(isObjectArrayControl, isPrimitiveArrayControl),
  or(isNullArrayControl, isComposedArrayControl),
);
const normal = rankWith(3, supported);
const forced = rankWith(5, or(optionIs('table', true), optionIs('format', 'table')));

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: (u, s, c) => (supported(u, s, c) ? Math.max(normal(u, s, c), forced(u, s, c)) : -1),
};
