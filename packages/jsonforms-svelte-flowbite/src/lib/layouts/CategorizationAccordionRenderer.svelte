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
  import { useFlowbiteLayout } from '../util';
  import { Accordion, AccordionItem } from 'flowbite-svelte';
  const props: RendererProps<Layout> = $props();
  const binding = useFlowbiteLayout(useJsonFormsCategorization(props));
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
  <!-- Shared identity state enforces single expansion; native multiple avoids a second selection owner.
       Disabling transitions keeps closed panels mounted. -->
  <Accordion {...binding.flowbiteProps('Accordion')} multiple transitionType="none">
    {#each selection.entries as entry (entry.key)}
      <AccordionItem
        transitionType="none"
        bind:open={
          () => selection.key === entry.key,
          (open) => {
            if (open) selection.selectKey(entry.key);
            else if (selection.key === entry.key) selection.close();
          }
        }
      >
        {#snippet header()}<span class="flex flex-1 items-center gap-2"
            ><span>{entry.category.label}</span><SectionIndicators
              class="ms-auto"
              uischema={entry.category.uischema}
              path={binding.layout.path}
            /></span
          >{/snippet}
        <DispatchRenderer
          schema={binding.layout.schema}
          uischema={entry.category.uischema}
          path={binding.layout.path}
          enabled={binding.layout.enabled}
          renderers={binding.layout.renderers}
          cells={binding.layout.cells}
        />
      </AccordionItem>
    {/each}
  </Accordion>
{/if}
