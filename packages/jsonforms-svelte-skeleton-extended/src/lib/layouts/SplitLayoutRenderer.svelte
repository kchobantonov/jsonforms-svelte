<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsLayout,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import { Pane, SplitPane, useSkeletonLayout } from '@chobantonov/jsonforms-svelte-skeleton';
  import type { Layout } from '@jsonforms/core';

  const props: RendererProps<Layout> = $props();
  const binding = useSkeletonLayout(useJsonFormsLayout(props));

  const isHorizontal = $derived(binding.layout.direction === 'row');
  const splitDirection = $derived(isHorizontal ? 'horizontal' : 'vertical');

  const layoutClasses = $derived(
    isHorizontal ? binding.styles.horizontalLayout : binding.styles.verticalLayout,
  );
  const toCssSize = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return `${value}px`;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return undefined;
  };

  const verticalHeight = $derived.by(() => toCssSize(binding.appliedOptions.height));
  const verticalMinHeight = $derived.by(() => toCssSize(binding.appliedOptions.minHeight));

  const splitPaneClasses = $derived(`${layoutClasses.root} p-2`);
  const splitWrapperStyle = $derived.by(() => {
    if (isHorizontal) {
      return undefined;
    }

    if (!verticalHeight && !verticalMinHeight) {
      return undefined;
    }

    return [
      verticalHeight ? `height: ${verticalHeight};` : '',
      verticalMinHeight ? `min-height: ${verticalMinHeight};` : '',
    ]
      .filter(Boolean)
      .join(' ');
  });
  const paneClasses = $derived(`${layoutClasses.item} p-2`);

  const initialSizes = $derived.by(() => {
    const paneCount = binding.layout.uischema.elements.length;
    if (paneCount <= 0) {
      return [100];
    }

    const equal = 100 / paneCount;
    return Array.from({ length: paneCount }, () => equal);
  });
</script>

{#if binding.layout.visible}
  <div style={splitWrapperStyle}>
    <SplitPane
      direction={splitDirection}
      {initialSizes}
      responsive={false}
      minSize={1}
      class={splitPaneClasses}
    >
      {#each binding.layout.uischema.elements as element, index (binding.layout.path + '-' + index)}
        <Pane>
          <div class={paneClasses}>
            <DispatchRenderer
              schema={binding.layout.schema}
              uischema={element}
              path={binding.layout.path}
              enabled={binding.layout.enabled}
              renderers={binding.layout.renderers}
              cells={binding.layout.cells}
            />
          </div>
        </Pane>
      {/each}
    </SplitPane>
  </div>
{/if}
