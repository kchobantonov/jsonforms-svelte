<script lang="ts">
  import {
    useJsonFormsLayout,
    useHorizontalLayout,
    type RendererProps,
    DispatchRenderer,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useSkeletonLayout(useJsonFormsLayout(props));
  const horizontal = useHorizontalLayout(() => binding.layout);
  const isHorizontal = $derived(binding.layout.direction === 'row');

  const layoutClasses = $derived(
    isHorizontal ? binding.styles.horizontalLayout : binding.styles.verticalLayout,
  );

  const containerClasses = $derived(
    `${layoutClasses.root} flex ${isHorizontal ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'}`,
  );

  const itemClasses = $derived(layoutClasses.item);
</script>

{#if binding.layout.visible}
  <div class={containerClasses}>
    {#if isHorizontal}
      {#each horizontal.items as item (binding.layout.path + '-' + item.index)}
        <div
          class={itemClasses}
          style={item.style}
          data-columns={item.columns}
          data-columns-diagnostic={item.diagnostic}
        >
          <DispatchRenderer
            schema={binding.layout.schema}
            uischema={item.element}
            path={binding.layout.path}
            enabled={binding.layout.enabled}
            renderers={binding.layout.renderers}
            cells={binding.layout.cells}
          />
        </div>
      {/each}
    {:else}
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
    {/if}
  </div>
{/if}
