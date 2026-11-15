<script lang="ts">
  import { tick } from 'svelte';
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    type RendererProps,
    DispatchRenderer,
    InitialFocusView,
    useJsonFormsCategorization,
    useCategorySelection,
    categoryFocusWasLost,
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
  let root = $state<HTMLDivElement>();
  let focusedElement: HTMLElement | undefined;
  let previousKey = selection.key;
  $effect(() => {
    const key = selection.key;
    if (key === previousKey) return;
    previousKey = key;
    void tick().then(() => {
      if (categoryFocusWasLost(root, focusedElement))
        root?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
    });
  });
</script>

{#if binding.layout.visible && selection.entries.length}
  <div
    bind:this={root}
    onfocusin={(event) => {
      if (event.target instanceof HTMLElement) focusedElement = event.target;
    }}
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
              {entry.category.label}<SectionIndicators
                uischema={entry.category.uischema}
                path={binding.layout.path}
                pathSegments={binding.layout.pathSegments}
              />
            </Tabs.Trigger>
          {/each}
        </Tabs.List>
      </div>

      {#each selection.entries as entry (entry.key)}
        <Tabs.Content value={entry.key}>
          <InitialFocusView active={selection.key === entry.key}>
            <DispatchRenderer
              schema={binding.layout.schema}
              uischema={entry.category.uischema}
              path={binding.layout.path}
              enabled={binding.layout.enabled}
              renderers={binding.layout.renderers}
              cells={binding.layout.cells}
            />
          </InitialFocusView>
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
