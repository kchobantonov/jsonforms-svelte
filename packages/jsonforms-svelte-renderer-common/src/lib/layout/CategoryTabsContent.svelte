<script lang="ts">
  import type { Component, ComponentProps, Snippet } from 'svelte';
  import CategoryPanel from './CategoryPanel.svelte';
  type Panel = ComponentProps<typeof CategoryPanel>;
  const {
    entries,
    selected,
    layout,
    Content,
  }: Omit<Panel, 'entry'> & {
    entries: Panel['entry'][];
    Content: Component<{ value: string; children: Snippet }>;
  } = $props();
</script>

{#each entries as entry (entry.key)}
  <Content value={entry.key}><CategoryPanel {entry} {selected} {layout} /></Content>
{/each}
