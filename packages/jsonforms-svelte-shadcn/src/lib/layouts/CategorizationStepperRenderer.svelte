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
  import type { Layout } from '@jsonforms/core';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Stepper from '@jsonforms-svelte-shadcn-ui/stepper';
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
  const vertical = $derived(binding.layout.uischema.options?.vertical === true);
  const uid = $props.id();
  let visited = $state<string[]>([]);
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
          ?.querySelectorAll<HTMLElement>('[data-slot="stepper-trigger"]')
          [selection.index]?.focus();
    });
  });

  function selectStep(index: number) {
    const currentKey = selection.entries[selection.index]?.key;
    if (currentKey && !visited.includes(currentKey)) visited = [...visited, currentKey];
    selection.select(index);
  }
</script>

{#if binding.layout.visible && categories.length}
  <div
    bind:this={root}
    onfocusin={(event) => {
      if (event.target instanceof HTMLElement) focusedElement = event.target;
    }}
    class={binding.styles.categorization.root}
  >
    <Stepper.Root bind:step={() => step + 1, (value) => selectStep(value - 1)}>
      <div class="mx-auto w-full max-w-3xl overflow-x-auto pb-1">
        <Stepper.Nav
          orientation={vertical ? 'vertical' : 'horizontal'}
          class="w-full"
          style={vertical ? undefined : `min-width: ${categories.length * 6}rem`}
          role="tablist"
          {...binding.shadcnProps('Stepper')}
        >
          {#each selection.entries as entry, index (entry.key)}
            {@const category = entry.category}
            <Stepper.Item id={entry.key} class={vertical ? 'py-1' : 'min-w-24'}>
              <Stepper.Trigger
                type="button"
                id={`${uid}-trigger-${index}`}
                role="tab"
                aria-controls={`${uid}-panel-${index}`}
                class={vertical
                  ? 'min-w-0 items-center text-left'
                  : 'min-w-0 items-center text-center'}
              >
                <Stepper.Indicator>{index + 1}</Stepper.Indicator>
                <Stepper.Title class="flex items-center gap-1 text-sm">
                  {category.label}
                  <SectionIndicators uischema={category.uischema} path={binding.layout.path} />
                </Stepper.Title>
              </Stepper.Trigger>
              <Stepper.Separator />
            </Stepper.Item>
          {/each}
        </Stepper.Nav>
      </div>

      {#each selection.entries as entry, index (entry.key)}
        {#if index === step || visited.includes(entry.key)}
          {@const category = entry.category}
          <div
            id={`${uid}-panel-${index}`}
            role="tabpanel"
            aria-labelledby={`${uid}-trigger-${index}`}
            hidden={index !== step}
            inert={index !== step}
            class="mt-4 min-w-0"
          >
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
          </div>
        {/if}
      {/each}

      {#if binding.appliedOptions.showNavButtons}
        <div class="mt-8 flex items-center justify-between gap-2">
          <Button variant="outline" disabled={step <= 0} onclick={() => selectStep(step - 1)}>
            {message('categorization.previous')}
          </Button>
          <Button disabled={step >= categories.length - 1} onclick={() => selectStep(step + 1)}>
            {message('categorization.next')}
          </Button>
        </div>
      {/if}
    </Stepper.Root>
  </div>
{/if}
