import { tupleTester } from '@chobantonov/jsonforms-svelte-renderer-common';
import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import renderer from './TupleControlRenderer.svelte';
export const entry: JsonFormsRendererRegistryEntry = { renderer, tester: tupleTester };
