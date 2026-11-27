<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { useGroupState } from './groupState.svelte';
  import type { ComponentProps } from 'svelte';
  import GroupHeaderFields from './GroupHeaderFields.svelte';
  const {
    group,
    layout,
    heading,
    trigger,
    detailColor,
    detailOpacity,
  }: {
    group: ReturnType<typeof useGroupState>;
    layout: ComponentProps<typeof GroupHeaderFields>['layout'];
    heading: Snippet;
    trigger: Snippet;
    detailColor?: string;
    detailOpacity?: string;
  } = $props();
</script>

{#if group.showHeading}
  <header
    class={group.regions.header?.length
      ? 'flex flex-row-reverse items-start justify-between gap-3 px-4 py-2'
      : 'px-4 py-2'}
  >
    {#if group.collapsible}
      <h3 class={group.regions.header?.length ? 'ml-auto shrink-0' : undefined}>
        {@render trigger()}
      </h3>
    {:else}
      <h3 class="flex items-center justify-between gap-2">{@render heading()}</h3>
    {/if}
    {#if group.regions.header?.length}
      <GroupHeaderFields
        {layout}
        elements={group.regions.header}
        --group-detail-color={detailColor}
        --group-detail-opacity={detailOpacity}
      />
    {/if}
  </header>
{/if}
