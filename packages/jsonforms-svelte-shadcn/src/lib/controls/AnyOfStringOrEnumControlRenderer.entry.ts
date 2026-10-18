import { stringSuggestions } from '@chobantonov/jsonforms-svelte';
import {
  and,
  rankWith,
  schemaMatches,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import controlRenderer from './AnyOfStringOrEnumControlRenderer.svelte';

const simpleAnyOf = and(
  uiTypeIs('Control'),
  schemaMatches((schema, rootSchema) => stringSuggestions(schema, rootSchema) !== undefined),
);

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(5, simpleAnyOf),
};
