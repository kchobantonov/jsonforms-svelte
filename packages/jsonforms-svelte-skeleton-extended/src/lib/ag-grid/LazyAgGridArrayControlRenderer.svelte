<script lang="ts">
  import { LazyGrid } from '@chobantonov/jsonforms-svelte-extended';
  import { loadAgGridArrayRenderer } from './lazy-loader.js';
  import type { AgGridRendererProps } from './types.js';
  let rendererProps: AgGridRendererProps = $props();
</script>

<LazyGrid {rendererProps} load={loadAgGridArrayRenderer} radius="var(--radius-base, 0.5rem)" />
