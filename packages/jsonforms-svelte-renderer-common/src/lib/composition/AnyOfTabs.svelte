<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { CombinatorSubSchemaRenderInfo } from '@jsonforms/core';
  import type { useAnyOfSelection } from './anyOfSelection.svelte';
  const {
    selection,
    path,
    List,
    Trigger,
    Content,
    indicator,
    branch,
  }: {
    selection: ReturnType<typeof useAnyOfSelection>;
    path: string;
    List: Component<{ children: Snippet }>;
    Trigger: Component<{ value: string; children: Snippet }>;
    Content: Component<{ value: string; children: Snippet }>;
    indicator?: Snippet;
    branch: Snippet<[CombinatorSubSchemaRenderInfo, boolean]>;
  } = $props();
  const entries = $derived(
    selection.anyOfRenderInfos.map((info, index, list) => ({
      info,
      index,
      value: String(index),
      key: `${path}-${list.length}-${index}`,
    })),
  );
</script>

<List>
  {#each entries as entry (entry.key)}<Trigger value={entry.value}>{entry.info.label}</Trigger
    >{/each}
  {@render indicator?.()}
</List>
{#each entries as entry (entry.key)}
  <Content value={entry.value}
    >{@render branch(entry.info, selection.selectedIndex === entry.index)}</Content
  >
{/each}
