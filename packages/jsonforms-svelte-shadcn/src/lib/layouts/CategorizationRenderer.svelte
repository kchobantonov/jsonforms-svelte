<script lang="ts">
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    type RendererProps,
    CategoryLabel,
    CategoryTabsContent,
    useJsonFormsCategorization,
    useLayoutCategorySelection,
    useCategoryFocus,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import * as Tabs from '@jsonforms-svelte-shadcn-ui/tabs';
  import { useShadcnLayout } from '../util';

  let props: RendererProps<Layout> = $props();

  const binding = useShadcnLayout(useJsonFormsCategorization(props));
  const selection = useLayoutCategorySelection(binding);
  let root = $state<HTMLDivElement>();
  const onfocusin = useCategoryFocus(selection, () => root);
</script>

{#if binding.layout.visible && selection.entries.length}
  <div
    bind:this={root}
    {onfocusin}
    class={`category-tabs ${binding.styles.categorization.root ?? ''}`}
  >
    <Tabs.Root
      orientation={binding.layout.uischema.options?.vertical === true ? 'vertical' : 'horizontal'}
      value={selection.key}
      onValueChange={selection.selectKey}
      {...binding.shadcnProps('Tabs')}
    >
      <div class="category-tabs-scroll">
        <Tabs.List
          class={binding.layout.uischema.options?.vertical === true
            ? 'h-auto w-max flex-col'
            : 'w-max'}
        >
          {#each selection.entries as entry (entry.key)}
            <Tabs.Trigger value={entry.key}>
              <CategoryLabel
                category={entry.category}
                layout={binding.layout}
                {SectionIndicators}
              />
            </Tabs.Trigger>
          {/each}
        </Tabs.List>
      </div>

      <CategoryTabsContent
        Content={Tabs.Content}
        entries={selection.entries}
        selected={selection.key}
        layout={binding.layout}
      />
    </Tabs.Root>
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
    overflow-y: hidden;
    padding: 2px;
  }
</style>
