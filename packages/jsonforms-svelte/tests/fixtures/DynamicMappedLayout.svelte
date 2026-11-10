<script lang="ts">
  import type { LayoutProps } from '../../src/lib/jsonFormsCompositions.svelte';
  import { useJsonFormsLayout } from '../../src/lib/jsonFormsCompositions.svelte';
  import { useLayoutSizing } from '../../src/lib/layoutSizing.svelte';
  const props: LayoutProps = $props();
  const binding = useJsonFormsLayout(props);
  const sizing = useLayoutSizing(() => binding.layout);
  const gap = $derived((binding.layout.uischema.options as { gap?: number } | undefined)?.gap);
</script>

<div
  data-testid="dynamic-mapped-layout"
  data-gap={gap}
  data-sized-gap={sizing.container.gap}
  data-child-count={sizing.items.length}
></div>
