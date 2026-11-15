import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { markupLabelRendererEntry as shared } from '@chobantonov/jsonforms-svelte-extended';
import renderer from './MarkupLabelRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = { ...shared, renderer };
