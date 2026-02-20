<script lang="ts">
  import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
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
      Object.fromEntries(Object.entries(rest).filter(([_, v]) => typeof v === 'function')),
    ),
  );
  let initializedSnippets = false;

  $effect(() => {
    rest; // track dependency

    if (!initializedSnippets) {
      initializedSnippets = true;
      return;
    }

    const next = Object.fromEntries(
      Object.entries(rest).filter(([_, v]) => typeof v === 'function'),
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
    const testerContext = {
      rootSchema: binding.rootSchema,
      config: binding.renderer.config,
    };

    let bestScore = -1;
    let bestRenderer: JsonFormsRendererRegistryEntry | undefined;

    for (const renderer of binding.renderer.renderers) {
      const score = renderer.tester(
        binding.renderer.uischema,
        binding.renderer.schema,
        testerContext,
      );
      if (score > bestScore) {
        bestScore = score;
        bestRenderer = renderer;
      }
    }

    return bestScore === -1 || bestRenderer === undefined ? UnknownRenderer : bestRenderer.renderer;
  });
</script>

<DeterminedRenderer {...binding.renderer} {...snippets}></DeterminedRenderer>
