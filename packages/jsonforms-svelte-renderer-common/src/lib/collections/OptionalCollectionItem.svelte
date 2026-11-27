<script lang="ts">
  import type { Snippet } from 'svelte';
  import CollectionItem from './CollectionItem.svelte';
  const {
    item,
    children,
  }: {
    item?: { key: string; path: string; sourceItem?: unknown };
    children: Snippet;
  } = $props();
</script>

{#key item?.key}
  {#if item}
    <CollectionItem identity={item.key} path={item.path} sourceItem={item.sourceItem} {children} />
  {:else}
    {@render children()}
  {/if}
{/key}
