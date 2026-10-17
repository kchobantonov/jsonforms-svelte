<script lang="ts">
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    DispatchRenderer,
    useJsonFormsCategorization,
    useCategorySelection,
    useJsonForms,
    resolveCollapsed,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';
  import { ChevronDown } from '@lucide/svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  const props: RendererProps<Layout> = $props();
  const binding = useSkeletonLayout(useJsonFormsCategorization(props));
  const form = useJsonForms();
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
</script>

{#if binding.layout.visible && selection.entries.length}
  <Accordion
    {...binding.skeletonProps('Accordion')}
    multiple={false}
    collapsible
    value={selection.key ? [selection.key] : []}
    onValueChange={(event) => selection.selectKey(event.value[0])}
  >
    {#each selection.entries as entry (entry.key)}
      <Accordion.Item value={entry.key}>
        <Accordion.ItemTrigger class="flex w-full items-center justify-between p-4"
          >{entry.category.label}<SectionIndicators
            class="ms-auto"
            uischema={entry.category.uischema}
            path={binding.layout.path}
          /><Accordion.ItemIndicator
            ><ChevronDown size={16} aria-hidden="true" /></Accordion.ItemIndicator
          ></Accordion.ItemTrigger
        >
        <Accordion.ItemContent class="p-4">
          <DispatchRenderer
            schema={binding.layout.schema}
            uischema={entry.category.uischema}
            path={binding.layout.path}
            enabled={binding.layout.enabled}
            renderers={binding.layout.renderers}
            cells={binding.layout.cells}
          />
        </Accordion.ItemContent>
      </Accordion.Item>
    {/each}
  </Accordion>
{/if}
