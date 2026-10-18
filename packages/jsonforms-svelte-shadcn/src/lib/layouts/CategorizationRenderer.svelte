<script lang="ts">
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    type RendererProps,
    DispatchRenderer,
    useJsonFormsCategorization,
    useCategorySelection,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import * as Tabs from '@jsonforms-svelte-shadcn-ui/tabs';
  import { useShadcnLayout } from '../util';

  let props: RendererProps<Layout> = $props();

  const binding = useShadcnLayout(useJsonFormsCategorization(props));
  const selection = useCategorySelection({
    get categories() {
      return binding.categories;
    },
    get initial() {
      return binding.layout.uischema.options?.initial;
    },
  });
</script>

{#if binding.layout.visible && selection.entries.length}
  <div class={`category-tabs ${binding.styles.categorization.root ?? ''}`}>
    <Tabs.Root
      orientation={binding.appliedOptions.vertical ? 'vertical' : 'horizontal'}
      value={selection.key}
      onValueChange={selection.selectKey}
      {...binding.shadcnProps('Tabs')}
    >
      <div class="category-tabs-scroll">
        <Tabs.List class={binding.appliedOptions.vertical ? 'h-auto w-max flex-col' : 'w-max'}>
          {#each selection.entries as entry (entry.key)}
            <Tabs.Trigger value={entry.key}>
              {entry.category.label}<SectionIndicators
                uischema={entry.category.uischema}
                path={binding.layout.path}
              />
            </Tabs.Trigger>
          {/each}
        </Tabs.List>
      </div>

      {#each selection.entries as entry (entry.key)}
        <Tabs.Content value={entry.key}>
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
