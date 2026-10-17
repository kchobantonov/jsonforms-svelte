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
  import { useShadcnLayout } from '../util';
  import * as Accordion from '@jsonforms-svelte-shadcn-ui/accordion';
  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsCategorization(props));
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
  <Accordion.Root
    {...binding.shadcnProps('Accordion')}
    type="single"
    value={selection.key}
    onValueChange={selection.selectKey}
  >
    {#each selection.entries as entry (entry.key)}
      <Accordion.Item value={entry.key}>
        <Accordion.Trigger
          >{entry.category.label}<SectionIndicators
            class="ms-auto"
            uischema={entry.category.uischema}
            path={binding.layout.path}
          /></Accordion.Trigger
        >
        <Accordion.Content forceMount hidden={selection.key !== entry.key}>
          <DispatchRenderer
            schema={binding.layout.schema}
            uischema={entry.category.uischema}
            path={binding.layout.path}
            enabled={binding.layout.enabled}
            renderers={binding.layout.renderers}
            cells={binding.layout.cells}
          />
        </Accordion.Content>
      </Accordion.Item>
    {/each}
  </Accordion.Root>
{/if}
