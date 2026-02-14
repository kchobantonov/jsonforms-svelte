<script lang="ts">
  import {
    useJsonFormsLayout,
    type RendererProps,
    DispatchRenderer,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useFlowbiteLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const control = useFlowbiteLayout(useJsonFormsLayout(props));
  const isHorizontal = $derived(control.layout.direction === 'row');

  const layoutClasses = $derived(
    isHorizontal ? control.styles.horizontalLayout : control.styles.verticalLayout,
  );

  const containerClasses = $derived(
    `${layoutClasses.root} flex ${isHorizontal ? 'flex-row gap-4' : 'flex-col gap-2'}`,
  );

  const itemClasses = $derived(`${layoutClasses.item} ${isHorizontal ? 'flex-1' : ''}`);
</script>

{#if control.layout.visible}
  <div class={containerClasses}>
    {#each control.layout.uischema.elements as element, index (control.layout.path + '-' + index)}
      <div class={itemClasses}>
        <DispatchRenderer
          schema={control.layout.schema}
          uischema={element}
          path={control.layout.path}
          enabled={control.layout.enabled}
          renderers={control.layout.renderers}
          cells={control.layout.cells}
        />
      </div>
    {/each}
  </div>
{/if}
