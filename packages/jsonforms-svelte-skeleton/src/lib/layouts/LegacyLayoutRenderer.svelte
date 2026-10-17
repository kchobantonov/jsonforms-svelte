<script lang="ts">
  import type { RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import LayoutRenderer from './LayoutRenderer.svelte';
  const props: RendererProps<Layout> = $props();
</script>

<LayoutRenderer {...props} legacyColumns />
