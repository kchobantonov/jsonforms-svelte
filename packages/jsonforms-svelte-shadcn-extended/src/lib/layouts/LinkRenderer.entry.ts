import { rankWith, uiTypeIs, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import renderer from './LinkRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer,
  tester: rankWith(1, uiTypeIs('Link')),
};
