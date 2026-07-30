import type { Component } from 'svelte';
import type { AgGridRendererProps } from './types.js';

let rendererPromise: Promise<{ default: Component<AgGridRendererProps> }> | undefined;

/**
 * Loads the renderer implementation once. Native dynamic-import caching also
 * ensures that AG Grid's runtime is shared by every renderer instance.
 */
export const loadAgGridArrayRenderer = () => {
  rendererPromise ??= import('./runtime/AgGridArrayControlRenderer.svelte');
  return rendererPromise;
};

/** Indicates whether an AG Grid renderer has actually won renderer selection. */
export const isAgGridRendererRuntimeRequested = () => rendererPromise !== undefined;
