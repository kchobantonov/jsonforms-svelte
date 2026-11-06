import { Generate, type JsonSchema, type UISchemaElement } from '@jsonforms/core';

/** Use core's generated layout for JSON schemas; retain boolean-root dispatch. */
export function generateRootUISchema(schema: JsonSchema | boolean): UISchemaElement {
  if (typeof schema === 'boolean') return { type: 'Control', scope: '#' };
  return Generate.uiSchema(schema, undefined, undefined, schema);
}
