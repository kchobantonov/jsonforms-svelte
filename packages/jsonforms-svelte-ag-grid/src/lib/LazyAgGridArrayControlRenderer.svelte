<script lang="ts">
  import { onMount, type Component } from 'svelte';
  import { loadAgGridArrayRenderer } from './lazy-loader.js';
  import type { AgGridRendererProps } from './types.js';

  let { appearance = 'neutral', ...rendererProps }: AgGridRendererProps = $props();

  let Renderer = $state<Component<AgGridRendererProps> | null>(null);
  let loadError = $state<unknown>(null);

  onMount(() => {
    let active = true;

    loadAgGridArrayRenderer()
      .then((module) => {
        if (active) Renderer = module.default;
      })
      .catch((error) => {
        if (active) loadError = error;
      });

    return () => {
      active = false;
    };
  });
</script>

{#if Renderer}
  <Renderer {...rendererProps} {appearance} />
{:else if loadError}
  <div class="jsonforms-ag-grid-load-error" role="alert">Unable to load the AG Grid renderer.</div>
{:else}
  <div class="jsonforms-ag-grid-loading" aria-busy="true" aria-live="polite">
    Loading data grid…
  </div>
{/if}

<style>
  .jsonforms-ag-grid-loading,
  .jsonforms-ag-grid-load-error {
    box-sizing: border-box;
    min-height: 4rem;
    width: 100%;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
    border-radius: 0.5rem;
    color: color-mix(in srgb, currentColor 70%, transparent);
    font: inherit;
  }

  .jsonforms-ag-grid-load-error {
    color: #dc2626;
  }
</style>
