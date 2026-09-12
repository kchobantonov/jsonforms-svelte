import { rankWith, uiTypeIs, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import renderer from './ImageViewRenderer.svelte';
export const entry: JsonFormsRendererRegistryEntry = {
  renderer,
  tester: rankWith(1, uiTypeIs('ImageView')),
};
