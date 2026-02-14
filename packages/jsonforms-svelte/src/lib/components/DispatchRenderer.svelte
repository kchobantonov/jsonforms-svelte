<script lang="ts">
  import maxBy from 'lodash/maxBy';
  import { type Component, type Snippet } from 'svelte';
  import { useJsonFormsRenderer, type RendererProps } from '../jsonFormsCompositions.svelte';
  import UnknownRenderer from './UnknownRenderer.svelte';

  export interface DispatchRendererProps extends RendererProps {
    // For forwarding snippets
    [key: string]: Snippet | unknown;
  }

  let props: DispatchRendererProps = $props();
  const { schema, uischema, path, enabled, renderers, cells, rootSchema, config, ...rest } =
    $derived(props);

  const snippets = $derived(
    Object.fromEntries(Object.entries(rest).filter(([_, value]) => typeof value === 'function')),
  );

  const binding = useJsonFormsRenderer(props);

  // Determine which renderer to use
  const DeterminedRenderer = $derived.by(() => {
    const testerContext = {
      rootSchema: binding.rootSchema,
      config: binding.renderer.config,
    };

    const bestRenderer = maxBy(binding.renderer.renderers, (r) =>
      r.tester(binding.renderer.uischema, binding.renderer.schema, testerContext),
    );

    if (
      bestRenderer === undefined ||
      bestRenderer.tester(binding.renderer.uischema, binding.renderer.schema, testerContext) === -1
    ) {
      return UnknownRenderer;
    }

    return bestRenderer.renderer;
  });
</script>

<DeterminedRenderer {...binding.renderer} {...snippets}></DeterminedRenderer>
