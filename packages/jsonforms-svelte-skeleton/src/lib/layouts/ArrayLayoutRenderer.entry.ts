import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { arrayLayoutTester } from '@chobantonov/jsonforms-svelte-renderer-common';
import controlRenderer from './ArrayLayoutRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: arrayLayoutTester,
};
