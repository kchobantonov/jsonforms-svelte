import {
  type JsonFormsRendererRegistryEntry,
  and,
  isStringControl,
  rankWith,
  isDateTimeControl,
} from '@jsonforms/core';
import controlRenderer from './DateTimeControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, and(isStringControl, isDateTimeControl)),
};
