import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { extendedControlTesters } from '@chobantonov/jsonforms-svelte-extended';
import renderer from './FileControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer,
  tester: extendedControlTesters.file,
};
