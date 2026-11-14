<script lang="ts">
  import { usePendingControlChanges } from '../../src/lib/detailDialog.svelte';
  import type { CollectionPage } from '../../src/lib/collectionPagination.svelte';
  import PaginationHarness from './PaginationHarness.svelte';

  let {
    capture,
    blockSecond = false,
    onFlush,
  }: {
    capture: (index: number, page: CollectionPage) => void;
    blockSecond?: boolean;
    onFlush?: (index: number) => void;
  } = $props();
  usePendingControlChanges();
  const keys = [0, 1, 2, 3];
</script>

<PaginationHarness
  {keys}
  local={{ pageSize: 2 }}
  onFlush={() => onFlush?.(0)}
  capture={(page) => capture(0, page)}
/>
<PaginationHarness
  {keys}
  local={{ pageSize: 2 }}
  blocked={blockSecond}
  onFlush={() => onFlush?.(1)}
  capture={(page) => capture(1, page)}
/>
