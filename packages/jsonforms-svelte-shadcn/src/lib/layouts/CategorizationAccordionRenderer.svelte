<script lang="ts">
  import SectionIndicators from './SectionIndicators.svelte';
  import {
    CategoryLabel,
    CategoryPanel,
    useJsonFormsCategorization,
    type RendererProps,
    useLayoutCategorySelection,
    useAccordionCategoryFocus,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import { useShadcnLayout } from '../util';
  import * as Accordion from '@jsonforms-svelte-shadcn-ui/accordion';
  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsCategorization(props));
  const selection = useLayoutCategorySelection(binding, true);
  let root = $state<HTMLDivElement>();
  const onfocusin = useAccordionCategoryFocus(
    selection,
    () => root,
    '[data-slot="accordion-trigger"]',
  );
</script>

{#if binding.layout.visible && selection.entries.length}
  <div bind:this={root} {onfocusin}>
    <Accordion.Root
      {...binding.shadcnProps('Accordion')}
      type="single"
      value={selection.key}
      onValueChange={selection.selectKey}
    >
      {#each selection.entries as entry (entry.key)}
        <Accordion.Item value={entry.key}>
          <Accordion.Trigger class="hover:no-underline">
            <CategoryLabel
              category={entry.category}
              layout={binding.layout}
              {SectionIndicators}
              class="flex min-w-0 flex-1 items-center gap-2"
            />
          </Accordion.Trigger>
          <Accordion.Content forceMount hidden={selection.key !== entry.key}>
            <CategoryPanel {entry} selected={selection.key} layout={binding.layout} />
          </Accordion.Content>
        </Accordion.Item>
      {/each}
    </Accordion.Root>
  </div>
{/if}
