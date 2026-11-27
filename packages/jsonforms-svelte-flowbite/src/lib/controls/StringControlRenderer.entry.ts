import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { controlTesters } from '@chobantonov/jsonforms-svelte-renderer-common';
import renderer from './StringControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = { renderer, tester: controlTesters.string };
