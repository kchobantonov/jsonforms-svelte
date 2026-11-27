<script lang="ts">
  import { selectRegistryEntry } from '../registry.js';
  import type { Snippet } from 'svelte';
  import { useJsonFormsRenderer, type RendererProps } from '../jsonFormsCompositions.svelte';
  import UnknownRenderer from './UnknownRenderer.svelte';

  export interface DispatchRendererProps extends RendererProps {
    // For forwarding snippets
    [key: string]: Snippet | unknown;
  }

  let props: DispatchRendererProps = $props();
  const snippets = $derived(
    Object.fromEntries(Object.entries(props).filter(([, value]) => typeof value === 'function')),
  );

  const binding = useJsonFormsRenderer(props);

  // Determine which renderer to use
  const DeterminedRenderer = $derived(
    selectRegistryEntry(binding.renderer.renderers, binding.renderer)?.renderer ?? UnknownRenderer,
  );
</script>

<DeterminedRenderer {...binding.rendererProps} {...snippets}></DeterminedRenderer>
