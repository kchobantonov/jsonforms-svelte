import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { passwordTester } from '@chobantonov/jsonforms-svelte-renderer-common';
import controlRenderer from './PasswordControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: passwordTester,
};
