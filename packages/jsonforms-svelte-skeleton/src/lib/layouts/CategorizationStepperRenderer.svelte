<script lang="ts">
  import { tick } from 'svelte';
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    DispatchRenderer,
    InitialFocusView,
    useJsonFormsCategorization,
    useCategorySelection,
    categoryFocusWasLost,
    useRendererMessages,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import { Steps } from '@skeletonlabs/skeleton-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';

  let props: RendererProps<Layout> = $props();

  const binding = useSkeletonLayout(useJsonFormsCategorization(props));
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

  // 0-based. count={N-1} caps navigation at the last real category (index N-1).
  // count={categories.length - 1} means valid step range is 0..N-1,
  const step = $derived(selection.index);
  let root = $state<HTMLDivElement>();
  let focusedElement: HTMLElement | undefined;
  let previousKey = selection.key;
  $effect(() => {
    const key = selection.key;
    if (key === previousKey) return;
    previousKey = key;
    void tick().then(() => {
      if (categoryFocusWasLost(root, focusedElement))
        root
          ?.querySelectorAll<HTMLElement>('[data-scope="steps"][data-part="trigger"]')
          [selection.index]?.focus();
    });
  });
</script>

{#if binding.layout.visible && categories.length}
  <div
    bind:this={root}
    onfocusin={(event) => {
      if (event.target instanceof HTMLElement) focusedElement = event.target;
    }}
    class={binding.styles.categorization.root}
  >
    <Steps
      orientation={binding.layout.uischema.options?.vertical === true ? 'vertical' : 'horizontal'}
      {step}
      onStepChange={(details) => selection.select(details.step)}
      count={categories.length - 1}
      class="w-full"
    >
      <!-- Step indicators -->
      <Steps.List>
        {#each selection.entries as entry, index (entry.key)}
          {@const category = entry.category}
          <Steps.Item {index}>
            <Steps.Trigger>
              <Steps.Indicator>{index + 1}</Steps.Indicator>
              {category.label}
              <SectionIndicators uischema={category.uischema} path={binding.layout.path} />
            </Steps.Trigger>
            {#if index < categories.length - 1}
              <Steps.Separator />
            {/if}
          </Steps.Item>
        {/each}
      </Steps.List>

      <!-- One content panel per category. The last category is the final state —
           no separate "done" panel, which would add an unwanted extra Next click. -->
      {#each selection.entries as entry, index (entry.key)}
        {@const category = entry.category}
        <Steps.Content {index}>
          <InitialFocusView active={selection.key === entry.key}>
            <DispatchRenderer
              schema={binding.layout.schema}
              uischema={category.uischema}
              path={binding.layout.path}
              enabled={binding.layout.enabled}
              renderers={binding.layout.renderers}
              cells={binding.layout.cells}
            />
          </InitialFocusView>
        </Steps.Content>
      {/each}

      <!-- Navigation -->
      {#if binding.appliedOptions.showNavButtons}
        <div class="mt-8 flex items-center justify-between gap-2">
          <Steps.PrevTrigger class="btn preset-outlined disabled:opacity-50">
            {message('categorization.previous')}
          </Steps.PrevTrigger>
          <Steps.NextTrigger class="btn preset-filled disabled:opacity-50">
            {message('categorization.next')}
          </Steps.NextTrigger>
        </div>
      {/if}
    </Steps>
  </div>
{/if}
