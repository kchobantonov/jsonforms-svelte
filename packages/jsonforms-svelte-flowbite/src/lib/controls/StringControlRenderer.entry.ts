import { isStringControl, rankWith, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import controlRenderer from './StringControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(1, isStringControl),
};
