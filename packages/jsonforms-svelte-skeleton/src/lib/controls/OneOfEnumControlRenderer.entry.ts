import {
  type JsonFormsRendererRegistryEntry,
  rankWith,
  isOneOfEnumControl,
} from '@jsonforms/core';
import controlRenderer from './OneOfEnumControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(5, isOneOfEnumControl),
};
