<script lang="ts">
  import {
    useJsonFormsLayout,
    useLayoutSizing,
    type RendererProps,
    DispatchRenderer,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useFlowbiteLayout } from '../util';

  // legacyColumns is consumed by the reactive sizing helper rather than the template.
  // eslint-disable-next-line svelte/no-unused-props
  const props: RendererProps<Layout> & { legacyColumns?: boolean } = $props();
  const binding = useFlowbiteLayout(useJsonFormsLayout(props));
  const sizing = useLayoutSizing(
    () => binding.layout,
    () => props.legacyColumns === true,
  );
  const isHorizontal = $derived(binding.layout.direction === 'row');

  const layoutClasses = $derived(
    isHorizontal ? binding.styles.horizontalLayout : binding.styles.verticalLayout,
  );

  const itemClasses = $derived(layoutClasses.item);
</script>

{#if binding.layout.visible}
  <div
    class={layoutClasses.root}
    data-layout={sizing.direction}
    data-layout-mode={sizing.legacy ? 'legacy-columns' : 'portable'}
    style:flex={sizing.legacy ? undefined : '1 1 auto'}
    style:display={sizing.container.display}
    style:flex-direction={sizing.container.flexDirection}
    style:padding={sizing.container.padding}
    style:gap={sizing.container.gap}
    style:flex-wrap={sizing.container.flexWrap}
    style:align-items={sizing.container.alignItems}
    style:justify-content={sizing.container.justifyContent}
    style:min-width={sizing.container.minWidth}
  >
    {#each sizing.items as item (binding.layout.path + '-' + item.index)}
      <div
        class={itemClasses}
        data-layout-item={item.index}
        data-columns={item.columns}
        data-columns-diagnostic={item.diagnostics[0]}
        style:display={sizing.legacy ? undefined : 'flex'}
        style:flex-direction={sizing.legacy ? undefined : 'column'}
        style:flex={item.style.flex}
        style:width={item.style.width}
        style:height={item.style.height}
        style:min-width={item.style.minWidth}
        style:max-width={item.style.maxWidth}
        style:min-height={item.style.minHeight}
        style:max-height={item.style.maxHeight}
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
  </div>
  {#each sizing.diagnostics as message, index (index)}
    <p role="alert" data-layout-diagnostic>{message}</p>
  {/each}
{/if}
