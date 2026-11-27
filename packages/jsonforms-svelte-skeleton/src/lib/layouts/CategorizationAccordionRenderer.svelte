<script lang="ts">
  import { useNativeCategoryFocus } from './categoryFocus.svelte';
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    CategoryLabel,
    CategoryPanel,
    useJsonFormsCategorization,
    type RendererProps,
    useLayoutCategorySelection,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';
  import { ChevronDown } from '@lucide/svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  const props: RendererProps<Layout> = $props();
  const binding = useSkeletonLayout(useJsonFormsCategorization(props));
  const selection = useLayoutCategorySelection(binding, true);
  let root = $state<HTMLDivElement>();
  const focus = useNativeCategoryFocus(selection, () => root, true);
  const { nativeEntries, nativeKey, renderEntries, retainedEntries } = $derived(focus);
</script>

{#if binding.layout.visible && renderEntries.length}
  <div bind:this={root} hidden={!selection.entries.length} onfocusin={focus.onfocusin}>
    <Accordion
      {...binding.skeletonProps('Accordion')}
      multiple={false}
      collapsible
      value={nativeEntries.length
        ? nativeKey
          ? [nativeKey]
          : []
        : retainedEntries[0]
          ? [retainedEntries[0].key]
          : []}
      onValueChange={(event) => selection.selectKey(event.value[0])}
    >
      {#each renderEntries as entry (entry.key)}
        {@const retired =
          selection.allEntries.length > 0 &&
          !selection.allEntries.some((current) => current.key === entry.key)}
        <Accordion.Item
          value={entry.key}
          data-category-key={entry.key}
          hidden={retired || !entry.category.visible}
        >
          <Accordion.ItemTrigger
            disabled={retired || !entry.category.visible}
            class="flex w-full items-center justify-between p-4"
          >
            <CategoryLabel
              category={entry.category}
              layout={binding.layout}
              {SectionIndicators}
              class="flex min-w-0 flex-1 items-center gap-2"
            />
            <Accordion.ItemIndicator>
              <ChevronDown size={16} aria-hidden="true" />
            </Accordion.ItemIndicator>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent class="p-4">
            {#if !retired && entry.category.visible}
              <CategoryPanel {entry} selected={selection.key} layout={binding.layout} />
            {/if}
          </Accordion.ItemContent>
        </Accordion.Item>
      {/each}
    </Accordion>
  </div>
{/if}
