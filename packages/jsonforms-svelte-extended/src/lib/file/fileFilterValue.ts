import { Resolve, type JsonSchema } from '@jsonforms/core';
import { fileItemSchema, fileNameFromValue, isFileStringSchema } from './fileOptions';

/** Default grid search/sort text. Undefined means the column is not a file;
 * nameless or invalid attachments contribute no encoded payload to search.
 * Cell editors continue binding to the original value in the form store.
 */
export function fileFilterValue(
  value: unknown,
  schema: JsonSchema,
  rootSchema: JsonSchema,
): string | undefined {
  let resolved: JsonSchema | undefined;
  try {
    resolved = schema.$ref ? Resolve.schema(rootSchema, schema.$ref, rootSchema) : schema;
  } catch {
    return undefined;
  }
  if (!resolved) return undefined;
  if (isFileStringSchema(resolved)) return fileNameFromValue(value) ?? '';
  if (fileItemSchema(resolved, rootSchema)) {
    return Array.isArray(value)
      ? value
          .map(fileNameFromValue)
          .filter((name): name is string => !!name)
          .join(' ')
      : '';
  }
  return undefined;
}
