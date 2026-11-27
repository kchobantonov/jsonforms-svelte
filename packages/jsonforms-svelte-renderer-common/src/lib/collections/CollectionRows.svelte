<script lang="ts">
  import { composePaths } from '@jsonforms/core';
  import type { Snippet } from 'svelte';
  import type { ArrayCollectionBinding } from './arrayCollection.svelte';
  import CollectionItem from './CollectionItem.svelte';
  let {
    indices,
    control,
    children,
  }: {
    indices: readonly number[];
    control: ArrayCollectionBinding['control'];
    children: Snippet<[number]>;
  } = $props();
</script>

{#each indices as index (control.rowKeys[index])}
  <CollectionItem
    identity={control.rowKeys[index]}
    path={composePaths(control.path, String(index))}
    sourceItem={control.data[index]}
  >
    {@render children(index)}
  </CollectionItem>
{/each}
