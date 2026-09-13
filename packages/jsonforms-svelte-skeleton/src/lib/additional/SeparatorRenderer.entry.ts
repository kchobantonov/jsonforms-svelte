import { rankWith, uiTypeIs, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import renderer from './SeparatorRenderer.svelte';
export const entry: JsonFormsRendererRegistryEntry = {
  renderer,
  tester: rankWith(1, uiTypeIs('Separator')),
};
