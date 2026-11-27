import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { stringSuggestionsTester } from '@chobantonov/jsonforms-svelte-renderer-common';
import controlRenderer from './AnyOfStringOrEnumControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: stringSuggestionsTester,
};
