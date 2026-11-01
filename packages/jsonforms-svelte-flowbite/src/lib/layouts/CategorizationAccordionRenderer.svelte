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
  import { useFlowbiteLayout } from '../util';
  import { Accordion, AccordionItem } from 'flowbite-svelte';
  const props: RendererProps<Layout> = $props();
  const binding = useFlowbiteLayout(useJsonFormsCategorization(props));
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
          ?.querySelectorAll<HTMLElement>(':scope > div > * > button[aria-expanded]')
          [selection.index]?.focus();
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
        </AccordionItem>
      {/each}
    </Accordion>
  </div>
{/if}
