<script lang="ts" generics="Size extends string | number">
  import type { Component } from 'svelte';
  import type { SectionIndicatorProps } from './sectionIndicators.svelte';
  import type { useGroupState } from './groupState.svelte';
  const {
    group,
    label,
    titleClass,
    SectionIndicators,
    right,
    down,
    size,
  }: {
    group: ReturnType<typeof useGroupState>;
    label?: string;
    titleClass: string;
    SectionIndicators: Component<SectionIndicatorProps>;
    right: Component<{ size: Size }>;
    down: Component<{ size: Size }>;
    size: Size;
  } = $props();
  const Chevron = $derived(group.collapsed ? right : down);
</script>

{#if !group.regions.header?.length}<span class={titleClass}>{label}</span>{/if}
<span class="flex items-center gap-2">
  <SectionIndicators {...group.indicatorProps} />
  {#if group.collapsible}<Chevron {size} />{/if}
</span>
