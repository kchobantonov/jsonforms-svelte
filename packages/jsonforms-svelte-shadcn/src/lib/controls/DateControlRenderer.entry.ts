import {
  type JsonFormsRendererRegistryEntry,
  and,
  isStringControl,
  rankWith,
  isDateControl,
} from '@jsonforms/core';
import controlRenderer from './DateControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, and(isStringControl, isDateControl)),
};
