import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { objectTester } from '@chobantonov/jsonforms-svelte-renderer-common';
import controlRenderer from './ObjectRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: objectTester,
};
