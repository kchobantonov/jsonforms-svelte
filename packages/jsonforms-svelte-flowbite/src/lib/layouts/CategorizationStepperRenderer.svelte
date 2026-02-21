<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsCategorization,
    useTranslator,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { Button } from 'flowbite-svelte';
  import { useFlowbiteLayout } from '../util';

  let props: RendererProps<Layout> = $props();

  const binding = useFlowbiteLayout(useJsonFormsCategorization(props));
  const t = useTranslator();
  type StepStatus = 'completed' | 'current' | 'pending';

  let current = $state(1);
  let activeCategory = $derived(current - 1);

  const categories = $derived(binding.categories.filter((e) => e.visible));

  const steps: Array<{ id: number; label: string; status: StepStatus }> = $derived(
    categories.map((category, index) => ({
      id: index + 1,
      label: category.label,
      status:
        index === activeCategory ? 'current' : index < activeCategory ? 'completed' : 'pending',
    })),
  );

  const lineStart = $derived(steps.length <= 1 ? '0' : `${(1 / steps.length) * 50}%`);
  const lineWidth = $derived(steps.length <= 1 ? '0' : `${100 - (1 / steps.length) * 100}%`);
  const progressLineWidth = $derived(
    steps.length <= 1 || lineWidth === '0'
      ? '0'
      : `${((current - 1) / (steps.length - 1)) * parseFloat(lineWidth)}%`,
  );

  const getCircleClass = (status: 'completed' | 'current' | 'pending') => {
    if (status === 'completed' || status === 'current') {
      return 'bg-primary-600 text-white dark:bg-primary-500';
    }
    return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  };

  const getLabelClass = (status: 'completed' | 'current' | 'pending') => {
    if (status === 'completed' || status === 'current') {
      return 'text-primary-700 dark:text-primary-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  const handleStep = (step: number) => {
    current = step + 1;
  };
</script>

{#if binding.layout.visible}
  <div class={binding.styles.categorization.root}>
    <div class="relative mb-6 w-full">
      <div
        class="pointer-events-none absolute top-4 h-1 bg-gray-200 dark:bg-gray-700"
        style={`left: ${lineStart}; width: ${lineWidth};`}
      ></div>
      <div
        class="pointer-events-none absolute top-4 h-1 bg-primary-600 transition-all duration-200 dark:bg-primary-500"
        style={`left: ${lineStart}; width: ${progressLineWidth};`}
      ></div>

      <ol class="relative z-10 flex w-full items-start">
        {#each steps as step, index (step.id)}
          <li class="flex-1">
            <button
              type="button"
              class="relative h-8 w-full cursor-pointer"
              aria-current={step.status === 'current' ? 'step' : undefined}
              onclick={() => handleStep(index)}
            >
              <span
                class={`absolute top-0 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full text-sm font-semibold ${getCircleClass(step.status)}`}
              >
                {#if step.status === 'completed'}
                  <svg aria-hidden="true" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M16.704 5.29a1 1 0 0 1 .006 1.414l-8.25 8.333a1 1 0 0 1-1.42.002l-3.75-3.75a1 1 0 0 1 1.414-1.414l3.04 3.039 7.543-7.621a1 1 0 0 1 1.417-.003Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                {:else}
                  {step.id}
                {/if}
              </span>
              <span
                class={`absolute top-1/2 left-1/2 z-20 ms-6 -translate-y-1/2 truncate bg-white px-1 text-sm font-medium dark:bg-gray-800 ${getLabelClass(step.status)}`}
              >
                {step.label}
              </span>
            </button>
          </li>
        {/each}
      </ol>
    </div>

    {#if categories[activeCategory]}
      <DispatchRenderer
        schema={binding.layout.schema}
        uischema={categories[activeCategory].uischema}
        path={binding.layout.path}
        enabled={binding.layout.enabled}
        renderers={binding.layout.renderers}
        cells={binding.layout.cells}
      />
    {/if}

    {#if binding.appliedOptions.showNavButtons}
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
