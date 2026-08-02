<script lang="ts">
  import { DispatchCell } from '@chobantonov/jsonforms-svelte';
  import { untrack } from 'svelte';
  import type { AgGridCellHostProps } from '../types.js';

  let { initialProps }: { initialProps: AgGridCellHostProps } = $props();
  let current = $state(untrack(() => initialProps));

  export function refresh(next: AgGridCellHostProps) {
    current = next;
  }
</script>

<DispatchCell {...current} />
