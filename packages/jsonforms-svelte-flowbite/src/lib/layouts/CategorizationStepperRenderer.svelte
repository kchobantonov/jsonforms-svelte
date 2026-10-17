<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsCategorization,
    useCategorySelection,
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

  const steps: NonNullable<DetailedStepperProps['steps']> = $derived(
    categories.map((category, index) => {
      const validation = sectionValidation(
        form.core,
        dataPathSegments(binding.layout.path),
        category.uischema,
        form.config,
      );
      const extended = form.config?.jsonformsExtended as Record<string, unknown> | undefined;
      const showData =
        (category.uischema.options?.showDataIndicator ??
          extended?.showDataIndicator ??
          form.config?.showDataIndicator) === true;
      const hasData =
        showData && groupHasData(category.uischema, form.core?.data, binding.layout.path);
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
      return {
        id: index + 1,
        label: (category.label ?? '') + (hasData ? ' ●' : ''),
        description: [feedback, hasData ? message('group.dataIndicator') : '']
          .filter(Boolean)
          .join(' · '),
        icon: validation.show ? ExclamationCircleOutline : undefined,
        iconClass: validation.show ? 'text-red-500 dark:text-red-400' : undefined,
        status:
          index === activeCategory ? 'current' : index < activeCategory ? 'completed' : 'pending',
      };
    }),
  );

  const handleStep = (step: number) => {
    selection.select(step);
  };
</script>

{#if binding.layout.visible && categories.length}
  <div class={binding.styles.categorization.root}>
    {#if binding.appliedOptions.vertical}
      <VerticalStepper
        {steps}
        showCheckmarkForCompleted={false}
        {current}
        onStepClick={({ current }) => selection.select(current - 1)}
      />
    {:else}
      <DetailedStepper
        {steps}
        showCheckmarkForCompleted={false}
        {current}
        onStepClick={({ current }) => selection.select(current - 1)}
      />
    {/if}

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
