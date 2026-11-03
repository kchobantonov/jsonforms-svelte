<script lang="ts">
  import { tick } from 'svelte';
  import {
    DispatchRenderer,
    InitialFocusView,
    useJsonFormsCategorization,
    useCategorySelection,
    categoryFocusWasLost,
    useRendererMessages,
    useJsonForms,
    sectionValidation,
    dataPathSegments,
    groupHasData,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import {
    Button,
    DetailedStepper,
    VerticalStepper,
    type DetailedStepperProps,
  } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
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
  const form = useJsonForms();

  const activeCategory = $derived(selection.index);
  const current = $derived(activeCategory + 1);

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

  const steps: NonNullable<DetailedStepperProps['steps']> = $derived(
    categories.map((category, index) => {
      const validation = sectionValidation(
        form.core,
        binding.layout.pathSegments ?? dataPathSegments(binding.layout.path),
        category.uischema,
        form.config,
      );
      const extended = form.config?.jsonformsExtended as Record<string, unknown> | undefined;
      const showData =
        (category.uischema.options?.showDataIndicator ?? extended?.showDataIndicator) === true;
      const hasData =
        showData &&
        groupHasData(
          category.uischema,
          form.core?.data,
          binding.layout.pathSegments ?? dataPathSegments(binding.layout.path),
        );
      const feedback = validation.show
        ? message(
            validation.count === undefined
              ? 'validation.containerHasErrors'
              : validation.count === 1
                ? 'validation.containerError'
                : 'validation.containerErrors',
            { count: validation.count },
          )
        : '';
      const dataLabel = hasData ? message('group.dataIndicator') : '';
      const description = [feedback, dataLabel].filter(Boolean).join(' · ');
      const vertical = binding.layout.uischema.options?.vertical === true;
      return {
        id: index + 1,
        label: vertical
          ? [category.label ?? '', feedback, dataLabel ? `● ${dataLabel}` : '']
              .filter(Boolean)
              .join(' · ')
          : (category.label ?? '') + (hasData ? ' ●' : ''),
        description,
        icon: validation.show ? ExclamationCircleOutline : undefined,
        iconClass: validation.show ? 'text-red-500 dark:text-red-400' : undefined,
        status:
          index === activeCategory ? 'current' : index < activeCategory ? 'completed' : 'pending',
      };
    }),
  );

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
    {#if binding.layout.uischema.options?.vertical === true}
      <VerticalStepper
        {steps}
        showCheckmarkForCompleted={false}
        {current}
        onStepClick={({ current }) => selectStep(current - 1)}
      />
    {:else}
      <DetailedStepper
        {steps}
        showCheckmarkForCompleted={false}
        {current}
        onStepClick={({ current }) => selectStep(current - 1)}
      />
    {/if}

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
