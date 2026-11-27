import { additionalRegistry } from '@chobantonov/jsonforms-svelte-renderer-common';
import * as entries from './entries';

export { default as LabelRenderer } from './LabelRenderer.svelte';
export { default as ListWithDetailRenderer } from './ListWithDetailRenderer.svelte';
export { default as SeparatorRenderer } from './SeparatorRenderer.svelte';
export { default as SpacerRenderer } from './SpacerRenderer.svelte';
export { default as ImageViewRenderer } from './ImageViewRenderer.svelte';
export * from './entries';

export const additionalRenderers = additionalRegistry(entries);
