import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { recursiveTreeTester } from '@chobantonov/jsonforms-svelte';
import renderer from './RecursiveTreeRenderer.svelte';
export const entry: JsonFormsRendererRegistryEntry = { renderer, tester: recursiveTreeTester };
