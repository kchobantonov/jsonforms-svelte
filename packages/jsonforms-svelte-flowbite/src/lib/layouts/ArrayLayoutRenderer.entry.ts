import {
  and,
  hasType,
  isObjectArrayControl,
  isObjectArrayWithNesting,
  isPrimitiveArrayControl,
  rankWith,
  resolveSchema,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import controlRenderer from './ArrayLayoutRenderer.svelte';

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
const isNestedArrayControl = and(
  uiTypeIs('Control'),
  and(
    schemaMatches((schema) => hasType(schema, 'array') && !Array.isArray(schema.items)),
    schemaSubPathMatches('items', (schema, rootSchema) =>
      hasType(
        schema.$ref ? (resolveSchema(rootSchema, schema.$ref, rootSchema) ?? schema) : schema,
        'array',
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

const wantsArrayLayout = (
  uischema: Parameters<typeof isObjectArrayControl>[0],
  schema: Parameters<typeof isObjectArrayControl>[1],
  context: Parameters<typeof isObjectArrayControl>[2],
) => {
  if (
    isNestedArrayControl(uischema, schema, context) ||
    (isComposedArrayControl(uischema, schema, context) &&
      uischema.options?.table !== true &&
      uischema.options?.format !== 'table')
  )
    return true;
  if (
    !isObjectArrayControl(uischema, schema, context) &&
    !isPrimitiveArrayControl(uischema, schema, context) &&
    !isNullArrayControl(uischema, schema, context)
  )
    return false;
  if (isObjectArrayWithNesting(uischema, schema, context)) return true;
  const detail = uischema.options?.detail;
  return (
    uischema.options?.table === false ||
    (detail != null && !(typeof detail === 'string' && detail.toUpperCase() === 'DEFAULT'))
  );
};

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(4, wantsArrayLayout),
};
