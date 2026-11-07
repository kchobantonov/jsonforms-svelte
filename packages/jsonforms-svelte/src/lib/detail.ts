// Adapted from React common detail.ts at 150fd688ae09f0f3b28e989649f3daf1d9f6d91d.
import {
  type ControlElement,
  type JsonSchema,
  type UISchemaElement,
  findUISchema,
} from '@jsonforms/core';

/** An absent `items` schema validates any value, but an editor still needs a type. */
export const unconstrainedArrayItem = (
  schema: JsonSchema,
  value: unknown,
): { schema: JsonSchema; uischema?: UISchemaElement } => {
  if (Object.keys(schema).length > 0) return { schema };
  const type =
    value === null
      ? 'null'
      : Array.isArray(value)
        ? 'array'
        : typeof value === 'number' && Number.isInteger(value)
          ? 'integer'
          : typeof value;
  if (!['string', 'number', 'integer', 'boolean', 'null', 'array', 'object'].includes(type))
    return { schema };
  return {
    schema: { type: type as JsonSchema['type'] },
    uischema: { type: 'Control', scope: '#' },
  };
};

/** Editor details use upstream mode semantics and retain their caller's scope
 * and fallback. An inline UI schema must have a type. */
export const findDetailUISchema: typeof findUISchema = (
  registry,
  schema,
  schemaPath,
  path,
  fallback = 'VerticalLayout',
  control,
  rootSchema,
) => {
  const detail = control?.options?.detail;
  const generate = typeof detail === 'string' && detail.toUpperCase() === 'GENERATE';
  const guardedFallback =
    typeof fallback === 'function'
      ? () => {
          const result = fallback();
          // A fallback Control delegates again. Carry generation intent through that
          // dispatch so its object/array editor cannot pick the registry back up.
          return generate && result.type === 'Control'
            ? { ...result, options: { ...result.options, detail: 'GENERATE' } }
            : result;
        }
      : fallback;
  return findUISchema(registry, schema, schemaPath, path, guardedFallback, control, rootSchema);
};

/** Explicit editor option; absence preserves the host's existing fallback.
 * Tuple-field layouts and recursive-node defaults may already come from a registry. */
export const resolveEditorDetail = (
  detail: unknown,
  registry: Parameters<typeof findUISchema>[0],
  schema: Parameters<typeof findUISchema>[1],
  schemaPath: string,
  path: string,
  rootSchema: Parameters<typeof findUISchema>[6],
  fallback: UISchemaElement,
): UISchemaElement =>
  detail === undefined
    ? fallback
    : findDetailUISchema(
        registry,
        schema,
        schemaPath,
        path,
        () => fallback,
        {
          type: 'Control',
          scope: schemaPath,
          options: { detail },
        } as ControlElement,
        rootSchema,
      );
