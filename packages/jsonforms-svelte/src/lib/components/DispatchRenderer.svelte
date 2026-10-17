<script lang="ts">
  import { scopeDataSegments } from '../schemaScope';
  import { isControl, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
  import LiteralControl from './LiteralControl.svelte';
  import { untrack, type Snippet } from 'svelte';
  import { useJsonFormsRenderer, type RendererProps } from '../jsonFormsCompositions.svelte';
  import UnknownRenderer from './UnknownRenderer.svelte';

  export interface DispatchRendererProps extends RendererProps {
    // For forwarding snippets
    [key: string]: Snippet | unknown;
  }

  let props: DispatchRendererProps = $props();
  const { schema, uischema, path, enabled, renderers, cells, rootSchema, config, ...rest } =
    $derived(props);

  let snippets = $state(
    untrack(() =>
      Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v === 'function')),
    ),
  );
  let initializedSnippets = false;

  $effect(() => {
    void rest; // track dependency

    if (!initializedSnippets) {
      initializedSnippets = true;
      return;
    }

    const next = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => typeof v === 'function'),
    );

    // Only update if keys or references changed
    const changed =
      Object.keys(next).length !== Object.keys(snippets).length ||
      Object.keys(next).some((k) => next[k] !== snippets[k]);

    if (changed) snippets = next;
  });

  const binding = useJsonFormsRenderer(props);

  // Determine which renderer to use
  const DeterminedRenderer = $derived.by(() => {
    const { schema, uischema, renderers, rootSchema, config } = binding.renderer;
    const testerContext = {
      rootSchema: rootSchema,
      config: config,
    };

    let bestScore = -1;
    let bestRenderer: JsonFormsRendererRegistryEntry | undefined;

    for (const renderer of renderers) {
      const score = renderer.tester(uischema, schema, testerContext);
      if (score > bestScore) {
        bestScore = score;
        bestRenderer = renderer;
      }
    }

    return bestScore === -1 || bestRenderer === undefined ? UnknownRenderer : bestRenderer.renderer;
  });
</script>

{#if (binding.rendererProps.uischema.type === 'Control' || binding.rendererProps.uischema.type === 'ListWithDetail') && isControl(binding.rendererProps.uischema) && scopeDataSegments(binding.rendererProps.uischema.scope).some((key) => key === '' || key === '#' || key.includes('~') || key.includes('.') || key.includes('\0'))}
  <LiteralControl {...binding.rendererProps} {...snippets} />
{:else}
  <DeterminedRenderer {...binding.rendererProps} {...snippets}></DeterminedRenderer>
{/if}
