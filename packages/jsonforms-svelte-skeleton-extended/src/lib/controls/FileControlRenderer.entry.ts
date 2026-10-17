import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { fileControlTester } from '@chobantonov/jsonforms-svelte-extended';
import controlRenderer from './FileControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: fileControlTester,
};
