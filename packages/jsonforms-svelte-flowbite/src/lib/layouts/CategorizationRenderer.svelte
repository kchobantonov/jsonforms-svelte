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

  const layout = useFlowbiteLayout(useJsonFormsCategorization(props));

  let activeCategory = $state(0);

  const visibleCategoriesWithIndex = $derived(
    layout.categories
      .map((category, originalIndex) => ({
        category,
        originalIndex,
      }))
      .filter((e) => e.category.visible),
  );
</script>

{#if layout.layout.visible}
  <div class={layout.styles.categorization.root}>
    <Tabs {...layout.flowbiteProps('Tabs')}>
      {#each visibleCategoriesWithIndex as entry, index (entry.originalIndex)}
        <TabItem
          open={index === activeCategory}
          onclick={() => (activeCategory = index)}
          title={entry.category.label}
          {...layout.flowbiteProps('TabItem')}
        >
          <DispatchRenderer
            schema={layout.layout.schema}
            uischema={entry.category.uischema}
            path={layout.layout.path}
            enabled={layout.layout.enabled}
            renderers={layout.layout.renderers}
            cells={layout.layout.cells}
          />
        </TabItem>
      {/each}
    </Tabs>
  </div>
{/if}
