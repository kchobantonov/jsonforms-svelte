import { isOneOfControl, rankWith, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import controlRenderer from './OneOfRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, isOneOfControl),
};
