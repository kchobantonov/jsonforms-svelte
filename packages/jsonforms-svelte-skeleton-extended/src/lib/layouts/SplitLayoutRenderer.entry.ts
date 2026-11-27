import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { splitLayoutTester } from '@chobantonov/jsonforms-svelte-extended';
import splitLayoutRenderer from './SplitLayoutRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: splitLayoutRenderer,
  tester: splitLayoutTester,
};
