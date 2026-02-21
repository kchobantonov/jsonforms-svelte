<script lang="ts">
  import {
    useJsonFormsLayout,
    type RendererProps,
    DispatchRenderer,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useFlowbiteLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useFlowbiteLayout(useJsonFormsLayout(props));
  const isHorizontal = $derived(binding.layout.direction === 'row');

  const layoutClasses = $derived(
    isHorizontal ? binding.styles.horizontalLayout : binding.styles.verticalLayout,
  );

  const containerClasses = $derived(
    `${layoutClasses.root} flex ${isHorizontal ? 'flex-row gap-4' : 'flex-col gap-2'}`,
  );

  const itemClasses = $derived(`${layoutClasses.item} ${isHorizontal ? 'flex-1' : ''}`);
</script>

{#if binding.layout.visible}
  <div class={containerClasses}>
    {#each binding.layout.uischema.elements as element, index (binding.layout.path + '-' + index)}
      <div class={itemClasses}>
        <DispatchRenderer
          schema={binding.layout.schema}
          uischema={element}
          path={binding.layout.path}
          enabled={binding.layout.enabled}
          renderers={binding.layout.renderers}
          cells={binding.layout.cells}
        />
      </div>
    {/each}
  </div>
{/if}
