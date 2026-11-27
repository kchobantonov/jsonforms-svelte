import { layoutRegistry } from '@chobantonov/jsonforms-svelte-renderer-common';
import * as entries from './entries';

export { default as CategorizationAccordionRenderer } from './CategorizationAccordionRenderer.svelte';
export { default as ArrayLayoutRenderer } from './ArrayLayoutRenderer.svelte';
export { default as CategorizationRenderer } from './CategorizationRenderer.svelte';
export { default as CategorizationStepperRenderer } from './CategorizationStepperRenderer.svelte';
export { default as GroupRenderer } from './GroupRenderer.svelte';
export { default as LayoutRenderer } from './LayoutRenderer.svelte';
export * from './entries';

export const layoutRenderers = layoutRegistry(entries);
