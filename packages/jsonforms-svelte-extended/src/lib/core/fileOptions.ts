import {
  Resolve,
  and,
  rankWith,
  schemaMatches,
  uiTypeIs,
  type JsonSchema,
  type RankedTester,
} from '@jsonforms/core';

/** Picker hints do not establish MIME/content validity. An explicit empty UI
 * filter intentionally removes the schema-derived filter (spec §18.18.4).
 */
export function resolveFileAccept(accept: unknown, contentMediaType: unknown): string | undefined {
  if (typeof accept === 'string') return accept.trim();
  if (typeof contentMediaType !== 'string') return undefined;
  const mediaType = contentMediaType.split(';', 1)[0].trim();
  return /^[a-z0-9!#$&^_.+-]+\/(?:[a-z0-9!#$&^_.+-]+|\*)$/i.test(mediaType) ? mediaType : undefined;
}

/** The binary convention retains a URI-encoded filename in data-URL metadata.
 * Plain base64 does not retain names; callers provide a localized fallback.
 * Adapted from React FileArrayInput at 150fd688ae09f0f3b28e989649f3daf1d9f6d91d.
 */
export function fileNameFromValue(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('data:')) return undefined;
  const headerEnd = value.indexOf(',');
  if (headerEnd < 0) return undefined;
  const match = /(?:^|;)filename=([^;]*)/i.exec(value.slice(5, headerEnd));
  if (!match) return undefined;
  try {
    const name = decodeURIComponent(match[1]);
    return name.trim() ? name : undefined;
  } catch {
    return undefined;
  }
}

export function isFileStringSchema(schema: unknown): schema is JsonSchema {
  if (!schema || typeof schema !== 'object') return false;
  const value = schema as JsonSchema & { contentEncoding?: unknown };
  return (
    value.type === 'string' &&
    (value.contentEncoding === 'base64' || value.format === 'byte' || value.format === 'binary')
  );
}

/** Homogeneous file arrays only; tuple and boolean items keep their normal
 * collection renderer. Resolve item references against the document root.
 */
export function fileItemSchema(schema: JsonSchema, rootSchema: JsonSchema): JsonSchema | undefined {
  if (
    schema.type !== 'array' ||
    !schema.items ||
    typeof schema.items !== 'object' ||
    Array.isArray(schema.items)
  )
    return undefined;
  try {
    const item = schema.items.$ref
      ? Resolve.schema(rootSchema, schema.items.$ref, rootSchema)
      : schema.items;
    return isFileStringSchema(item) ? item : undefined;
  } catch {
    return undefined;
  }
}
const scalarFileTester = rankWith(2, and(uiTypeIs('Control'), schemaMatches(isFileStringSchema)));
const arrayFileTester = rankWith(
  7,
  and(
    uiTypeIs('Control'),
    schemaMatches((schema, rootSchema) => fileItemSchema(schema, rootSchema) !== undefined),
  ),
);
export const fileControlTester: RankedTester = (ui, schema, context) =>
  Math.max(scalarFileTester(ui, schema, context), arrayFileTester(ui, schema, context));
