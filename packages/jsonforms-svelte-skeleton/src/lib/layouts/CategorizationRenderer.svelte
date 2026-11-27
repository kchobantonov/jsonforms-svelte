<script lang="ts">
  import { useNativeCategoryFocus } from './categoryFocus.svelte';
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    type RendererProps,
    CategoryLabel,
    CategoryTabsContent,
    useJsonFormsCategorization,
    useLayoutCategorySelection,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import { useSkeletonLayout } from '../util';
  import { observeInheritedDirection, type TextDirection } from '../util/inheritedDirection';

  let props: RendererProps<Layout> = $props();

  const binding = useSkeletonLayout(useJsonFormsCategorization(props));
  let inheritedDirection = $state<TextDirection>('ltr');
  const selection = useLayoutCategorySelection(binding);
  let root = $state<HTMLDivElement>();
  const focus = useNativeCategoryFocus(selection, () => root, false);
  const { nativeEntries, nativeKey, renderEntries, retainedEntries } = $derived(focus);
</script>

{#if binding.layout.visible && renderEntries.length}
  <div
    bind:this={root}
    hidden={!nativeEntries.some((entry) => entry.category.visible)}
    use:observeInheritedDirection={(direction) => (inheritedDirection = direction)}
    onfocusin={focus.onfocusin}
    class={`category-tabs ${binding.styles.categorization.root ?? ''}`}
  >
    <Tabs
      orientation={binding.layout.uischema.options?.vertical === true ? 'vertical' : 'horizontal'}
      value={nativeKey || retainedEntries[0]?.key || ''}
      onValueChange={(e) => {
        if (!e.value || !selection.entries.some((entry) => entry.key === e.value)) return;
        focus.nativeKey = e.value;
        selection.selectKey(e.value);
      }}
      {...binding.skeletonProps('Tabs')}
      dir={inheritedDirection}
    >
      <div class="category-tabs-scroll">
        <Tabs.List
          class={binding.layout.uischema.options?.vertical === true
            ? 'h-auto w-max flex-col'
            : 'w-max'}
        >
          {#each renderEntries as entry (entry.key)}
            {@const retired =
              nativeEntries.length > 0 &&
              !nativeEntries.some((current) => current.key === entry.key)}
            <Tabs.Trigger
              value={entry.key}
              data-category-key={entry.key}
              hidden={retired || !entry.category.visible}
              disabled={retired || !entry.category.visible}
            >
              {#if selection.allEntries.some((current) => current.key === entry.key && current.category.visible)}
                <CategoryLabel
                  category={entry.category}
                  layout={binding.layout}
                  {SectionIndicators}
                />
              {/if}
            </Tabs.Trigger>
          {/each}
          <Tabs.Indicator />
        </Tabs.List>
      </div>

      <CategoryTabsContent
        Content={Tabs.Content}
        entries={nativeEntries.length
          ? nativeEntries.filter((entry) => entry.category.visible)
          : retainedEntries.filter((entry) => entry.category.visible)}
        selected={selection.key}
        layout={binding.layout}
      />
    </Tabs>
  </div>
{/if}

<style>
  .category-tabs {
    min-width: 0;
    max-width: 100%;
  }
  .category-tabs-scroll {
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
  }
</style>
