<script lang="ts">
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    DispatchRenderer,
    useJsonFormsCategorization,
    useCategorySelection,
    useRendererMessages,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Tabs from '@jsonforms-svelte-shadcn-ui/tabs';
  import { useShadcnLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsCategorization(props));
  const selection = useCategorySelection({
    get categories() {
      return binding.categories;
    },
    get initial() {
      return binding.layout.uischema.options?.initial;
    },
  });
  const message = useRendererMessages();
  const categories = $derived(selection.categories);
  const step = $derived(selection.index);
</script>

{#if binding.layout.visible && categories.length}
  <div class={binding.styles.categorization.root}>
    <Tabs.Root
      orientation={binding.appliedOptions.vertical ? 'vertical' : 'horizontal'}
      value={selection.key}
      onValueChange={selection.selectKey}
      class="w-full"
      {...binding.shadcnProps('Tabs')}
    >
      <Tabs.List
        class="grid h-auto w-full"
        style={`grid-template-columns: repeat(${binding.appliedOptions.vertical ? 1 : Math.max(categories.length, 1)}, minmax(0, 1fr));`}
      >
        {#each selection.entries as entry, index (entry.key)}
          {@const category = entry.category}
          <Tabs.Trigger value={entry.key} class="h-auto gap-2 py-2">
            <span
              class="bg-muted text-muted-foreground group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs"
            >
              {index + 1}
            </span>
            {category.label}
            <SectionIndicators uischema={category.uischema} path={binding.layout.path} />
          </Tabs.Trigger>
        {/each}
      </Tabs.List>

      {#each selection.entries as entry (entry.key)}
        {@const category = entry.category}
        <Tabs.Content value={entry.key}>
          <DispatchRenderer
            schema={binding.layout.schema}
            uischema={category.uischema}
            path={binding.layout.path}
            enabled={binding.layout.enabled}
            renderers={binding.layout.renderers}
            cells={binding.layout.cells}
          />
        </Tabs.Content>
      {/each}

      {#if binding.appliedOptions.showNavButtons}
        <div class="mt-8 flex items-center justify-between gap-2">
          <Button variant="outline" disabled={step <= 0} onclick={() => selection.select(step - 1)}>
            {message('categorization.previous')}
          </Button>
          <Button
            disabled={step >= categories.length - 1}
            onclick={() => selection.select(step + 1)}
          >
            {message('categorization.next')}
          </Button>
        </div>
      {/if}
    </Tabs.Root>
  </div>
{/if}
