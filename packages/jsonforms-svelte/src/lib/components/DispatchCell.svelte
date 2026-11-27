<script lang="ts">
  import { selectRegistryEntry } from '../registry.js';
  import type { Snippet } from 'svelte';
  import { useJsonFormsDispatchCell, type ControlProps } from '../jsonFormsCompositions.svelte.js';
  import UnknownRenderer from './UnknownRenderer.svelte';

  export interface DispatchCellProps extends ControlProps {
    // For forwarding snippets
    [key: string]: Snippet | unknown;
  }

  let props: DispatchCellProps = $props();
  const snippets = $derived(
    Object.fromEntries(Object.entries(props).filter(([, value]) => typeof value === 'function')),
  );

  const binding = useJsonFormsDispatchCell(props);

  // Determine which cell to render
  const DeterminedCell = $derived(
    selectRegistryEntry(binding.cell.cells, binding.cell)?.cell ?? UnknownRenderer,
  );
</script>

<DeterminedCell {...binding.cell} {...snippets}></DeterminedCell>
