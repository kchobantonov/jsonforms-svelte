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
  import { useFlowbiteLayout } from '../util';
  import { Accordion, AccordionItem } from 'flowbite-svelte';
  const props: RendererProps<Layout> = $props();
  const binding = useFlowbiteLayout(useJsonFormsCategorization(props));
  const selection = useLayoutCategorySelection(binding, true);
  let root = $state<HTMLDivElement>();
  const onfocusin = useAccordionCategoryFocus(
    selection,
    () => root,
    ':scope > div > * > button[aria-expanded]',
  );
</script>

{#if binding.layout.visible && selection.entries.length}
  <div bind:this={root} {onfocusin}>
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
          {#snippet header()}<CategoryLabel
              category={entry.category}
              layout={binding.layout}
              {SectionIndicators}
              class="flex flex-1 items-center gap-2"
            />{/snippet}
          <CategoryPanel {entry} selected={selection.key} layout={binding.layout} />
        </AccordionItem>
      {/each}
    </Accordion>
  </div>
{/if}
