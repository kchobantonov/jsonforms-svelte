import { isObjectControl, rankWith, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import controlRenderer from './ObjectRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isObjectControl),
};
