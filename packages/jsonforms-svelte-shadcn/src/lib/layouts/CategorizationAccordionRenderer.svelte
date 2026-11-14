<script lang="ts">
  import { tick } from 'svelte';
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    DispatchRenderer,
    InitialFocusView,
    useJsonFormsCategorization,
    useCategorySelection,
    categoryFocusWasLost,
    useJsonForms,
    resolveCollapsed,
    useCollapsedOptionDiagnostic,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useShadcnLayout } from '../util';
  import * as Accordion from '@jsonforms-svelte-shadcn-ui/accordion';
  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsCategorization(props));
  const form = useJsonForms();
  useCollapsedOptionDiagnostic(
    () => binding.layout.uischema.options,
    () => form.config,
    'accordion',
  );
  const selection = useCategorySelection(
    {
      get categories() {
        return binding.categories;
      },
      get initial() {
        return binding.layout.uischema.options?.initial;
      },
      get collapsed() {
        return resolveCollapsed(binding.layout.uischema.options, form.config, 'accordion');
      },
    },
    true,
  );
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
          ?.querySelectorAll<HTMLElement>('[data-slot="accordion-trigger"]')
          .item(selection.index)
          ?.focus();
    });
  });
</script>

{#if binding.layout.visible && selection.entries.length}
  <div
    bind:this={root}
    onfocusin={(event) => {
      if (event.target instanceof HTMLElement) focusedElement = event.target;
    }}
  >
    <Accordion.Root
      {...binding.shadcnProps('Accordion')}
      type="single"
      value={selection.key}
      onValueChange={selection.selectKey}
    >
      {#each selection.entries as entry (entry.key)}
        <Accordion.Item value={entry.key}>
          <Accordion.Trigger class="hover:no-underline">
            <span class="flex min-w-0 flex-1 items-center gap-2">
              <span>{entry.category.label}</span>
              <SectionIndicators
                class="ms-auto"
                uischema={entry.category.uischema}
                path={binding.layout.path}
                pathSegments={binding.layout.pathSegments}
              />
            </span>
          </Accordion.Trigger>
          <Accordion.Content forceMount hidden={selection.key !== entry.key}>
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
          </Accordion.Content>
        </Accordion.Item>
      {/each}
    </Accordion.Root>
  </div>
{/if}
