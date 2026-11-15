import {
  type JsonFormsRendererRegistryEntry,
  and,
  isStringControl,
  rankWith,
  isTimeControl,
} from '@jsonforms/core';
import controlRenderer from './TimeControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, and(isStringControl, isTimeControl)),
};
