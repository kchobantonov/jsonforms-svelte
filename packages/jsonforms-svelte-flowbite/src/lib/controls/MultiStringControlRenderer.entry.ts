import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { controlTesters } from '@chobantonov/jsonforms-svelte-renderer-common';
import renderer from './MultiStringControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer,
  tester: controlTesters.multiString,
};
