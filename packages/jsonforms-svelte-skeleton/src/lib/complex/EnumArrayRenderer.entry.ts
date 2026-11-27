import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { enumArrayTester } from '@chobantonov/jsonforms-svelte-renderer-common';
import controlRenderer from './EnumArrayRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: enumArrayTester,
};
