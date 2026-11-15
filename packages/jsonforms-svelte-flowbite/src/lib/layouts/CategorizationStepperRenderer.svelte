<script lang="ts">
  import { tick } from 'svelte';
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
  import { Button } from 'flowbite-svelte';
  import SectionIndicators from './SectionIndicators.svelte';
  import { useFlowbiteLayout } from '../util';

  let props: RendererProps<Layout> = $props();

  const binding = useFlowbiteLayout(useJsonFormsCategorization(props));
  const selection = useCategorySelection({
    get categories() {
      return binding.categories;
    },
    get initial() {
      return binding.layout.uischema.options?.initial;
    },
  });
  const message = useRendererMessages();

  const activeCategory = $derived(selection.index);
  const vertical = $derived(binding.layout.uischema.options?.vertical === true);

  const categories = $derived(selection.categories);
  let visited = $state<string[]>([]);
  let root = $state<HTMLDivElement>();
  let focusedElement: HTMLElement | undefined;
  let focusedCategoryKey: string | undefined;
  let previousKey = selection.key;
  $effect(() => {
    const key = selection.key;
    if (key === previousKey) return;
    previousKey = key;
    void tick().then(() => {
      const focusedNodeReused =
        focusedElement &&
        focusedCategoryKey &&
        !selection.entries.some((entry) => entry.key === focusedCategoryKey) &&
        (root?.getRootNode() as Document | ShadowRoot | undefined)?.activeElement ===
          focusedElement;
      if (categoryFocusWasLost(root, focusedElement) || focusedNodeReused)
        root?.querySelectorAll<HTMLElement>(':scope > ol > li > button')[selection.index]?.focus();
    });
  });

  const selectStep = (index: number) => {
    const currentKey = selection.entries[selection.index]?.key;
    if (currentKey && !visited.includes(currentKey)) visited = [...visited, currentKey];
    selection.select(index);
  };

  const handleStep = (step: number) => {
    selectStep(step);
  };
</script>

{#if binding.layout.visible && categories.length}
  <div
    bind:this={root}
    onfocusin={(event) => {
      if (!(event.target instanceof HTMLElement)) return;
      focusedElement = event.target;
      const buttons = Array.from(root?.querySelectorAll(':scope > ol > li > button') ?? []);
      const index = buttons.findIndex(
        (button) => button === event.target || button.contains(event.target as Node),
      );
      focusedCategoryKey = index < 0 ? selection.key : selection.entries[index]?.key;
    }}
    class={binding.styles.categorization.root}
  >
    <ol class={vertical ? 'w-72 space-y-4' : 'flex w-full items-center gap-2 overflow-x-auto pb-1'}>
      {#each selection.entries as entry, index (entry.key)}
        {@const category = entry.category}
        {@const selected = index === activeCategory}
        <li
          class={vertical
            ? `flex items-center gap-1 rounded-lg border p-4 ${selected ? 'border-primary-600 dark:border-primary-500' : 'border-gray-200 dark:border-gray-700'}`
            : 'flex min-w-fit flex-1 items-center gap-1 last:flex-none'}
        >
          <button
            type="button"
            aria-current={selected ? 'step' : undefined}
            onclick={() => selectStep(index)}
            class="flex min-w-0 items-center gap-2 text-left"
          >
            <span
              data-step-number
              class={`flex size-8 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-primary-600 dark:bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
              >{index + 1}</span
            >
            <span
              class={selected
                ? 'text-primary-600 dark:text-primary-500 font-medium'
                : 'font-medium'}>{category.label}</span
            >
          </button>
          <SectionIndicators
            uischema={category.uischema}
            path={binding.layout.path}
            pathSegments={binding.layout.pathSegments}
          />
          {#if !vertical && index < categories.length - 1}
            <span aria-hidden="true" class="mx-2 h-px min-w-4 flex-1 bg-gray-200 dark:bg-gray-700"
            ></span>
          {/if}
        </li>
      {/each}
    </ol>

    {#each selection.entries as entry, index (entry.key)}
      {#if index === activeCategory || visited.includes(entry.key)}
        <div hidden={index !== activeCategory} inert={index !== activeCategory}>
          <InitialFocusView active={selection.key === entry.key}>
            <DispatchRenderer
              schema={binding.layout.schema}
              uischema={entry.category.uischema}
              path={binding.layout.path}
              pathSegments={binding.layout.pathSegments}
              enabled={binding.layout.enabled}
              renderers={binding.layout.renderers}
              cells={binding.layout.cells}
            />
          </InitialFocusView>
        </div>
      {/if}
    {/each}

    {#if binding.appliedOptions.showNavButtons}
      <div class="mt-8 flex justify-between">
        <Button onclick={() => handleStep(activeCategory - 1)} disabled={activeCategory <= 0}
          >{message('categorization.previous')}</Button
        >

        <Button
          onclick={() => handleStep(activeCategory + 1)}
          disabled={activeCategory >= categories.length - 1}
          >{message('categorization.next')}</Button
        >
      </div>
    {/if}
  </div>
{/if}
