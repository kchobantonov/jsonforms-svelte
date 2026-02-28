import {
  and,
  rankWith,
  schemaMatches,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
} from '@jsonforms/core';
import controlRenderer from './FileControlRenderer.svelte';
import type { JsonSchemaWithContent } from './fileSchema';

const isStringFileSchema = (schema: JsonSchema): boolean => {
  const typedSchema = schema as JsonSchemaWithContent;

  if (schema.type !== 'string') {
    return false;
  }

  // Match only explicit binary/base64 markers for now.
  return (
    typedSchema.contentEncoding === 'base64' ||
    schema.format === 'binary' ||
    schema.format === 'byte'
  );
};

const fileControl = and(uiTypeIs('Control'), schemaMatches(isStringFileSchema));

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, fileControl),
};
