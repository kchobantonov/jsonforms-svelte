import {
  and,
  rankWith,
  schemaMatches,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
} from '@jsonforms/core';
import controlRenderer from './NullControlRenderer.svelte';

const isNullSchema = (schema: JsonSchema): boolean => {
  return schema.type === 'null';
};

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, and(uiTypeIs('Control'), schemaMatches(isNullSchema))),
};
