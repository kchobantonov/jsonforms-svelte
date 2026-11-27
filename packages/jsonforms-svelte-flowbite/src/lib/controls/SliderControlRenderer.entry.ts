import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { controlTesters } from '@chobantonov/jsonforms-svelte-renderer-common';
import renderer from './SliderControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = { renderer, tester: controlTesters.slider };
