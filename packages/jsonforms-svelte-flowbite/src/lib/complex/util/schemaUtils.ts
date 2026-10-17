import { findDetailUISchema, narrowMixedComposition } from '@chobantonov/jsonforms-svelte';
import {
  createControlElement,
  type ControlElement,
  type JsonFormsUISchemaRegistryEntry,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';
import { getJsonDataType, getSchemaTypesAsArray, resolveSchema } from './jsonTypeUtils';

export interface SchemaRenderInfo {
  schema: JsonSchema;
  resolvedSchema: JsonSchema;
  uischema: UISchemaElement;
  label: string;
}

export function createMixedRenderInfos(
  _parentSchema: JsonSchema,
  schema: JsonSchema,
  rootSchema: JsonSchema,
  control: ControlElement,
  path: string,
  uischemas: JsonFormsUISchemaRegistryEntry[],
): SchemaRenderInfo[] {
  const resolvedSchemas: JsonSchema[] = [];
  schema = resolveSchema(schema, rootSchema);

  if (typeof schema.type === 'string') {
    const narrowed = narrowMixedComposition(schema, schema.type);
    resolvedSchemas.push(typeof narrowed === 'boolean' ? { type: schema.type, not: {} } : narrowed);
  } else {
    const types = getSchemaTypesAsArray(schema);

    types.forEach((type) => {
      const narrowed = narrowMixedComposition(schema, type);
      resolvedSchemas.push({
        ...(typeof narrowed === 'boolean' ? { not: {} } : narrowed),
        type,
        default:
          schema.default !== undefined &&
          (type === getJsonDataType(schema.default) ||
            (type === 'number' && typeof schema.default === 'number'))
            ? schema.default
            : undefined,
      });
    });
  }

  return resolvedSchemas.map((resolvedSchema) => {
    // Keep validation keywords and child schemas intact in the delegated view.
    const cleanedSchema = resolvedSchema;

    const detailsForSchema = control.options
      ? control.options[cleanedSchema.type + '-detail']
      : undefined;

    const schemaControl = detailsForSchema
      ? {
          ...control,
          options: { ...control.options, detail: detailsForSchema },
        }
      : control;

    const uischema = findDetailUISchema(
      uischemas,
      cleanedSchema,
      control.scope,
      path,
      () => createControlElement('#'),
      schemaControl,
      rootSchema,
    );

    return {
      schema: cleanedSchema,
      resolvedSchema: resolvedSchema,
      uischema,
      label: `${resolvedSchema.type}`,
    };
  });
}

/** Boolean schemas need an object view for JSON Forms controls; validation stays equivalent. */
function childSchemaView(schema: JsonSchema | boolean, root: JsonSchema): JsonSchema {
  const resolved = typeof schema === 'boolean' ? schema : resolveSchema(schema, root);
  return typeof resolved === 'boolean' ? (resolved ? {} : { not: {} }) : resolved;
}

/** Same-value allOf clauses contribute constraints to the same child editor. */
function childIntersection(
  schema: JsonSchema,
  root: JsonSchema,
  own: (schema: JsonSchema) => JsonSchema | undefined,
  seen = new Set<JsonSchema>(),
): JsonSchema | undefined {
  const resolved = childSchemaView(schema, root);
  if (seen.has(resolved)) return undefined;
  const nextSeen = new Set(seen).add(resolved);
  const children = [
    own(resolved),
    ...(resolved.allOf ?? []).map((branch) => childIntersection(branch, root, own, nextSeen)),
  ].filter((child): child is JsonSchema => child !== undefined);
  return children.length > 1 ? ({ allOf: children } as JsonSchema) : children[0];
}

export function findPropertySchema(
  parentSchema: JsonSchema,
  propName: string,
  rootSchema: JsonSchema,
): JsonSchema | undefined {
  return childIntersection(parentSchema, rootSchema, (schema) => {
    const matches: JsonSchema[] = [];
    if (schema.properties && Object.hasOwn(schema.properties, propName)) {
      matches.push(childSchemaView(schema.properties[propName], rootSchema));
    }
    for (const [pattern, child] of Object.entries(schema.patternProperties ?? {})) {
      if (new RegExp(pattern).test(propName)) matches.push(childSchemaView(child, rootSchema));
    }
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) return { allOf: matches } as JsonSchema;
    const additional = schema.additionalProperties;
    return additional === undefined ? undefined : childSchemaView(additional, rootSchema);
  });
}

export function getArrayItemSchema(
  parentSchema: JsonSchema,
  index: number,
  rootSchema: JsonSchema,
): JsonSchema | undefined {
  return childIntersection(parentSchema, rootSchema, (schema) => {
    const items = schema.items;
    if (items === undefined) return undefined;
    const item = Array.isArray(items) ? (items[index] ?? schema.additionalItems) : items;
    return item === undefined ? undefined : childSchemaView(item, rootSchema);
  });
}
