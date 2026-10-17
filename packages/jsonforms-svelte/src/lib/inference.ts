import { Generate, type JsonSchema, type UISchemaElement } from '@jsonforms/core';

/** JSON Forms 3.9.0-alpha.1 only infers object roots directly. Its property
 * generator supports every JSON type. Keep this adapter until an installed
 * upstream release supports root inference, then retain these regression tests.
 * Adapted from React demoSchema.ts at 150fd688ae09f0f3b28e989649f3daf1d9f6d91d.
 */
export function inferJsonSchema(data: unknown): JsonSchema {
  return data === undefined ? {} : Generate.jsonSchema({ value: data }).properties!.value;
}

/** Core returns null for an unrestricted schema; dispatch its whole value. */
export function generateRootUISchema(schema: JsonSchema | boolean): UISchemaElement {
  if (typeof schema === 'boolean') return { type: 'Control', scope: '#' };
  return Generate.uiSchema(schema, undefined, undefined, schema) ?? { type: 'Control', scope: '#' };
}
