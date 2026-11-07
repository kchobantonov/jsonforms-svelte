import { Generate, type JsonSchema, type UISchemaElement } from '@jsonforms/core';

/** Use core's generated layout except for root schemas requiring a root control. */
export function generateRootUISchema(schema: JsonSchema | boolean): UISchemaElement {
  if (typeof schema === 'boolean') return { type: 'Control', scope: '#' };
  if (Object.keys(schema).length === 0) return { type: 'Control', scope: '#' };
  return Generate.uiSchema(schema, undefined, undefined, schema);
}
