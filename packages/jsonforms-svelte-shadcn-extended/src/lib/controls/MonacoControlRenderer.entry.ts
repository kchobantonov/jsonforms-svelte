import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { monacoControlTester } from '@chobantonov/jsonforms-svelte-extended';
import controlRenderer from './MonacoControlRenderer.svelte';
export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: monacoControlTester,
};
