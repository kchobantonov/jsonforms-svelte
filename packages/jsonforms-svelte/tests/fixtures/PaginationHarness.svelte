<script lang="ts">
  import { onMount } from 'svelte';
  import {
    useCollectionPagination,
    type CollectionPage,
  } from '../../src/lib/collectionPagination.svelte';
  let {
    keys,
    local,
    config = {},
    capture,
  }: {
    keys: number[];
    local?: unknown;
    config?: unknown;
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
  onMount(() => capture(page));
</script>

<span>{page.current}/{page.pages}</span>
