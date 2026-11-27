import type { JsonSchema, UISchemaElement } from '@jsonforms/core';

export function controlFixture(
  propertySchema: JsonSchema,
  value: unknown,
  options: Record<string, unknown> | undefined,
  required: boolean,
) {
  const schema = {
    type: 'object',
    properties: {
      // JsonForms' JsonSchema type is a union of draft-04 and draft-07,
      // while `properties` is draft-specific. Keep the test utility draft-agnostic.
      value: propertySchema as unknown as JsonSchema,
    },
    ...(required ? { required: ['value'] } : {}),
  } as JsonSchema;

  const uischema: UISchemaElement = {
    type: 'Control',
    scope: '#/properties/value',
    ...(options ? { options } : {}),
  };

  const data = value === undefined ? {} : { value };
  return { schema, uischema, data };
}
