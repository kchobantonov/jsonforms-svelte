import type { JsonSchema, JsonSchema7 } from '@jsonforms/core';

/** Add catalog prefixes to schema copies; fixture data and source JSON stay intact. */
export function localizeDetailSchema(schema: JsonSchema): JsonSchema7 {
  const result = { ...schema } as JsonSchema7;
  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [
        key,
        { ...localizeDetailSchema(value), i18n: `detailExample.${key}` },
      ]),
    );
  }
  if (schema.items && !Array.isArray(schema.items))
    result.items = localizeDetailSchema(schema.items);
  return result;
}
