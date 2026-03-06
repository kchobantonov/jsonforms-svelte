<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsCategorization,
    useTranslator,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import { Steps } from '@skeletonlabs/skeleton-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';

  let props: RendererProps<Layout> = $props();

  const binding = useSkeletonLayout(useJsonFormsCategorization(props));
  const t = useTranslator();

  const categories = $derived(binding.categories.filter((e) => e.visible));

  // 0-based. count={N-1} caps navigation at the last real category (index N-1).
  // count={categories.length - 1} means valid step range is 0..N-1,
  let step = $state(0);
</script>

{#if binding.layout.visible}
  <div class={binding.styles.categorization.root}>
    <Steps
      {step}
      onStepChange={(details) => (step = details.step)}
      count={categories.length - 1}
      class="w-full"
    >
      <!-- Step indicators -->
      <Steps.List>
        {#each categories as category, index}
          <Steps.Item {index}>
            <Steps.Trigger>
              <Steps.Indicator>{index + 1}</Steps.Indicator>
              {category.label}
            </Steps.Trigger>
            {#if index < categories.length - 1}
              <Steps.Separator />
            {/if}
          </Steps.Item>
        {/each}
      </Steps.List>

      <!-- One content panel per category. The last category is the final state —
           no separate "done" panel, which would add an unwanted extra Next click. -->
      {#each categories as category, index}
        <Steps.Content {index}>
          <DispatchRenderer
            schema={binding.layout.schema}
            uischema={category.uischema}
            path={binding.layout.path}
            enabled={binding.layout.enabled}
            renderers={binding.layout.renderers}
            cells={binding.layout.cells}
          />
        </Steps.Content>
      {/each}

      <!-- Navigation -->
      {#if binding.appliedOptions.showNavButtons}
        <div class="mt-8 flex items-center justify-between gap-2">
          <Steps.PrevTrigger class="btn preset-outlined disabled:opacity-50">
            {t.value('Previous', 'Previous')}
          </Steps.PrevTrigger>
          <Steps.NextTrigger class="btn preset-filled disabled:opacity-50">
            {t.value('Next', 'Next')}
          </Steps.NextTrigger>
        </div>
      {/if}
    </Steps>
  </div>
{/if}