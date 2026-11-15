import { isCategorization, rankWith, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import layoutRenderer from './CategorizationRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: layoutRenderer,
  tester: rankWith(2, isCategorization),
};
