import {
  type JsonFormsRendererRegistryEntry,
  rankWith,
  isDateTimeControl,
} from '@jsonforms/core';
import controlRenderer from './DateTimeControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isDateTimeControl),
};
