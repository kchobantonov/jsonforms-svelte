<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsCategorization,
    useTranslator,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { Button, ProgressStepper, type ProgressStep } from 'flowbite-svelte';
  import { useFlowbiteLayout } from '../util';

  let props: RendererProps<Layout> = $props();

  const layout = useFlowbiteLayout(useJsonFormsCategorization(props));
  const t = useTranslator();

  let current = $state(1);
  let activeCategory = $derived(current - 1);

  const categories = $derived(layout.categories.filter((e) => e.visible));

  const steps: ProgressStep[] = $derived(
    categories.map((category, index) => ({
      id: index + 1,
      label: category.label,
      status:
        index === activeCategory ? 'current' : index < activeCategory ? 'completed' : 'pending',
    })),
  );

  const handleStep = (step: number) => {
    current = step + 1;
  };
</script>

{#if layout.layout.visible}
  <div class={layout.styles.categorization.root}>
    <ProgressStepper bind:current {steps} {...layout.flowbiteProps('ProgressStepper')}
    ></ProgressStepper>

    {#if categories[activeCategory]}
      {#key activeCategory}
        <DispatchRenderer
          schema={layout.layout.schema}
          uischema={categories[activeCategory].uischema}
          path={layout.layout.path}
          enabled={layout.layout.enabled}
          renderers={layout.layout.renderers}
          cells={layout.layout.cells}
        />
      {/key}
    {/if}

    {#if layout.appliedOptions.showNavButtons}
      <div class="mt-8 flex justify-between">
        <Button onclick={() => handleStep(activeCategory - 1)} disabled={activeCategory <= 0}
          >{t.value('Previous', 'Previous')}</Button
        >

        <Button
          onclick={() => handleStep(activeCategory + 1)}
          disabled={activeCategory >= categories.length - 1}>{t.value('Next', 'Next')}</Button
        >
      </div>
    {/if}
  </div>
{/if}
