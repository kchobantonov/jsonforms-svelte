<script lang="ts">
  import {
    type RendererProps,
    DispatchRenderer,
    useJsonFormsCategorization,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { Tabs, TabItem } from 'flowbite-svelte';
  import { useFlowbiteLayout } from '../util';

  let props: RendererProps<Layout> = $props();

  const binding = useFlowbiteLayout(useJsonFormsCategorization(props));

  let activeCategory = $state(0);

  const visibleCategoriesWithIndex = $derived(
    binding.categories
      .map((category, originalIndex) => ({
        category,
        originalIndex,
      }))
      .filter((e) => e.category.visible),
  );
</script>

{#if binding.layout.visible}
  <div class={binding.styles.categorization.root}>
    <Tabs {...binding.flowbiteProps('Tabs')}>
      {#each visibleCategoriesWithIndex as entry, index (entry.originalIndex)}
        <TabItem
          open={index === activeCategory}
          onclick={() => (activeCategory = index)}
          title={entry.category.label}
          {...binding.flowbiteProps('TabItem')}
        >
          <DispatchRenderer
            schema={binding.layout.schema}
            uischema={entry.category.uischema}
            path={binding.layout.path}
            enabled={binding.layout.enabled}
            renderers={binding.layout.renderers}
            cells={binding.layout.cells}
          />
        </TabItem>
      {/each}
    </Tabs>
  </div>
{/if}
