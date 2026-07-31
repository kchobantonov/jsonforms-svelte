import type { Component } from 'svelte';
import type { AgGridRendererProps } from './types.js';

let rendererPromise: Promise<{ default: Component<AgGridRendererProps> }> | undefined;

/** Loads the Skeleton implementation only after its tester wins. */
export const loadAgGridArrayRenderer = () => {
  rendererPromise ??= import('./runtime/AgGridArrayControlRenderer.svelte');
  return rendererPromise;
};

export const isAgGridRendererRuntimeRequested = () => rendererPromise !== undefined;
