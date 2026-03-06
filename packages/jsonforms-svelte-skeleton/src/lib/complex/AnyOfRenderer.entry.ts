import { isAnyOfControl, rankWith, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import controlRenderer from './AnyOfRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, isAnyOfControl),
};
