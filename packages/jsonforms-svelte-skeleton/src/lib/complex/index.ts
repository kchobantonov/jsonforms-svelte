import { complexRegistry } from '@chobantonov/jsonforms-svelte-renderer-common';
import * as entries from './entries';

export { default as ConfirmationDialog } from './components/ConfirmationDialog.svelte';
export { default as RecursiveTreeRenderer } from './RecursiveTreeRenderer.svelte';
export { default as ArrayChoicesRenderer } from './ArrayChoicesRenderer.svelte';
export { default as ChoiceCardsRenderer } from './ChoiceCardsRenderer.svelte';
export { default as TupleControlRenderer } from './TupleControlRenderer.svelte';
export { default as AllOfRenderer } from './AllOfRenderer.svelte';
export { default as AnyOfRenderer } from './AnyOfRenderer.svelte';
export { default as ArrayControlRenderer } from './ArrayControlRenderer.svelte';
export { default as EnumArrayRenderer } from './EnumArrayRenderer.svelte';
export { default as ObjectRenderer } from './ObjectRenderer.svelte';
export { default as OneOfRenderer } from './OneOfRenderer.svelte';
// export { default as OneOfTabRenderer } from './OneOfTabRenderer.svelte';
export { default as MixedRenderer } from './MixedRenderer.svelte';
export * from './entries';

export const complexRenderers = complexRegistry(entries);
