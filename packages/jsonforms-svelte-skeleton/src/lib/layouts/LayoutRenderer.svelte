<script lang="ts">
  import {
    useJsonFormsLayout,
    useCollectionItemIdentity,
    useLayoutSizing,
    type RendererProps,
    DispatchRenderer,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';

  // legacyColumns is consumed by the reactive sizing helper rather than the template.
  // eslint-disable-next-line svelte/no-unused-props
  const props: RendererProps<Layout> & { legacyColumns?: boolean } = $props();
  const binding = useSkeletonLayout(useJsonFormsLayout(props));
  const sizing = useLayoutSizing(
    () => binding.layout,
    () => props.legacyColumns === true,
  );
  const collectionItem = useCollectionItemIdentity();
  // The containing occurrence owns this layout instance. Its absolute path
  // changes during moves and must not remount the layout's child editors.
  const layoutIdentity = $derived(collectionItem?.key ?? binding.layout.path);
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
    data-layout-container-diagnostic={sizing.containerDiagnostics.length
      ? sizing.containerDiagnostics.map((diagnostic) => diagnostic.message).join(' ')
      : undefined}
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
    {#each sizing.items as item (layoutIdentity + '-' + item.index)}
      <div
        class={itemClasses}
        data-layout-item={item.index}
        data-columns={item.columns}
        data-columns-diagnostic={item.diagnostics[0]}
        data-layout-diagnostic={item.diagnostics.length ? item.diagnostics.join(' ') : undefined}
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
{/if}
