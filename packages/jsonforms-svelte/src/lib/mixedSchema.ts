import {
  resolveSchema,
  type JsonSchema,
  type Scopable,
  type TesterContext,
  type UISchemaElement,
} from '@jsonforms/core';

// Annotation-only schemas allow every JSON value. Validation keywords must not
// let this rank-20 renderer displace an enum, composition, or specialized editor.
const annotations = new Set([
  '$schema',
  '$id',
  '$comment',
  '$defs',
  'definitions',
  'title',
  'i18n',
  'description',
  'default',
  'examples',
  'readOnly',
  'writeOnly',
  'deprecated',
]);

export function isMixedSchema(
  uischema: UISchemaElement & Scopable,
  rawSchema: JsonSchema,
  context: TesterContext,
): boolean {
  let schema: JsonSchema | boolean | undefined = rawSchema;
  if (uischema.scope && typeof rawSchema === 'object' && rawSchema !== null) {
    try {
      schema = resolveSchema(rawSchema, uischema.scope, context?.rootSchema ?? rawSchema);
      // Core's resolver returns undefined for an empty root schema.
      if (schema === undefined && uischema.scope === '#') schema = rawSchema;
    } catch {
      return false;
    }
  }
  if (typeof schema === 'boolean') return schema;
  if (!schema || typeof schema !== 'object') return false;
  if (Array.isArray(schema.type) && schema.type.length > 1) return true;
  if (['enum', 'const', 'allOf', 'anyOf', 'oneOf'].some((key) => Object.hasOwn(schema, key))) {
    return false;
  }
  if (Array.isArray(schema.type)) return false;
  return Object.keys(schema).every((key) => annotations.has(key));
}

export type MixedStructuredLayout = 'tree' | 'nested' | 'code';

/** Presentation options never change the bound schema or JSON value. */
export function resolveMixedStructuredLayout(
  options: Record<string, unknown> | undefined,
  config: Record<string, unknown> | undefined,
): MixedStructuredLayout {
  const extended = config?.jsonformsExtended;
  const mixed =
    extended && typeof extended === 'object' && 'mixed' in extended ? extended.mixed : undefined;
  const configured =
    mixed && typeof mixed === 'object' && 'structuredLayout' in mixed
      ? mixed.structuredLayout
      : undefined;
  for (const value of [options?.structuredLayout, configured]) {
    if (value === 'tree' || value === 'nested' || value === 'code') return value;
  }
  return 'tree';
}
