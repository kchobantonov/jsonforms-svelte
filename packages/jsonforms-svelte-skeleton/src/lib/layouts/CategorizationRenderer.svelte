<script lang="ts">
  import {
    type RendererProps,
    DispatchRenderer,
    useJsonFormsCategorization,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import { useSkeletonLayout } from '../util';

  let props: RendererProps<Layout> = $props();

  const binding = useSkeletonLayout(useJsonFormsCategorization(props));

  // Use the first visible category's index as the default value
  const visibleCategoriesWithIndex = $derived(
    binding.categories
      .map((category, originalIndex) => ({ category, originalIndex }))
      .filter((e) => e.category.visible),
  );

  let activeCategory = $state('0');
</script>

{#if binding.layout.visible}
  <div class={binding.styles.categorization.root}>
    <Tabs
      value={activeCategory}
      onValueChange={(e) => (activeCategory = e.value)}
      {...binding.skeletonProps('Tabs')}
    >
      <Tabs.List>
        {#each visibleCategoriesWithIndex as entry, index (entry.originalIndex)}
          <Tabs.Trigger value={index.toString()}>
            {entry.category.label}
          </Tabs.Trigger>
        {/each}
        <Tabs.Indicator />
      </Tabs.List>

      {#each visibleCategoriesWithIndex as entry, index (entry.originalIndex)}
        <Tabs.Content value={index.toString()}>
          <DispatchRenderer
            schema={binding.layout.schema}
            uischema={entry.category.uischema}
            path={binding.layout.path}
            enabled={binding.layout.enabled}
            renderers={binding.layout.renderers}
            cells={binding.layout.cells}
          />
        </Tabs.Content>
      {/each}
    </Tabs>
  </div>
{/if}