import {
  isObjectArrayWithNesting,
  rankWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import controlRenderer from './ArrayLayoutRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(4, isObjectArrayWithNesting),
};
