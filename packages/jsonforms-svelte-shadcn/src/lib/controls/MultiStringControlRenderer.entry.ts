import {
  and,
  isMultiLineControl,
  isStringControl,
  rankWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import controlRenderer from './MultiStringControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, and(isStringControl, isMultiLineControl)),
};
