<script lang="ts">
  import type { LayoutProps } from '../../src/lib/index.js';
  import { useJsonFormsLayout } from '../../src/lib/index.js';
  import { useLayoutSizing } from '../../src/lib/layout/layoutSizing.svelte.ts';
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
