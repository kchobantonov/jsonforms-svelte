import { rankWith, uiTypeIs, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import controlRenderer from './ButtonRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(1, uiTypeIs('Button')),
};
