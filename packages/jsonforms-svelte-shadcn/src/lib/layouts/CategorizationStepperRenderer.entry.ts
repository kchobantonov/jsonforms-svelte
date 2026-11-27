import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { categorizationStepperTester } from '@chobantonov/jsonforms-svelte-renderer-common';
import layoutRenderer from './CategorizationStepperRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: layoutRenderer,
  tester: categorizationStepperTester,
};
