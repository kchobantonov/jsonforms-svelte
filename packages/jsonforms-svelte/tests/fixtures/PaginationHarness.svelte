<script lang="ts">
  import { onMount } from 'svelte';
  import {
    useCollectionPagination,
    type CollectionPage,
  } from '../../src/lib/collectionPagination.svelte';
  import { registerDetailDialogChange } from '../../src/lib/detailDialog.svelte';
  let {
    keys,
    local,
    config = {},
    blocked = false,
    onFlush,
    capture,
  }: {
    keys: number[];
    local?: unknown;
    config?: unknown;
    blocked?: boolean;
    onFlush?: () => void;
    capture: (page: CollectionPage) => void;
  } = $props();
  const page = useCollectionPagination({
    get keys() {
      return keys;
    },
    get local() {
      return local;
    },
    get config() {
      return config;
    },
    kind: 'additionalItems',
  });
  registerDetailDialogChange({ isBlocked: () => blocked, flush: () => onFlush?.() });
  onMount(() => capture(page));
</script>

<span>{page.current}/{page.pages}</span>
