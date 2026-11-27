import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { controlTesters } from '@chobantonov/jsonforms-svelte-renderer-common';
import renderer from './DateTimeControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = { renderer, tester: controlTesters.dateTime };
