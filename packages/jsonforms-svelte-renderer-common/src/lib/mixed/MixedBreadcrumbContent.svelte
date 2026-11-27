<script lang="ts">
  import type { Component } from 'svelte';
  import type { useMixedTreeView } from './mixedTreeView.svelte';
  const {
    segment,
    activePath,
    JsonTypeIcon,
  }: {
    segment: ReturnType<typeof useMixedTreeView>['breadcrumbSegments'][number];
    activePath: string;
    JsonTypeIcon: Component<{ type: 'object' | 'array'; active: boolean }>;
  } = $props();
</script>

{#if segment.iconType}
  <JsonTypeIcon type={segment.iconType} active={activePath === segment.path} />
{:else}
  {segment.label}
{/if}
