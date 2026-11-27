<script lang="ts">
  import type { useJsonFormsLayout } from '../core/jsonFormsCompositions.svelte';
  import LayoutChild from './LayoutChild.svelte';
  import { useCollectionItemIdentity } from '../collections/collectionItemContext';
  import { useLayoutSizing } from './layoutSizing.svelte';
  import type { Styles } from './styles';
  const {
    layout,
    classes,
  }: {
    layout: ReturnType<typeof useJsonFormsLayout>['layout'] & { direction?: string };
    classes: Styles['verticalLayout'];
  } = $props();
  const sizing = useLayoutSizing(() => layout);
  const collectionItem = useCollectionItemIdentity();
  // Moves preserve the occurrence key so focused child editors stay mounted.
  const layoutIdentity = $derived(collectionItem?.key ?? layout.path);
</script>

{#if layout.visible}
  <div
    class={classes.root}
    data-layout={sizing.direction}
    data-layout-mode="portable"
    data-layout-container-diagnostic={sizing.containerDiagnostics.length
      ? sizing.containerDiagnostics.map((diagnostic) => diagnostic.message).join(' ')
      : undefined}
    style:flex="1 1 auto"
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
        class={classes.item}
        data-layout-item={item.index}
        data-layout-diagnostic={item.diagnostics.length ? item.diagnostics.join(' ') : undefined}
        style:display="flex"
        style:flex-direction="column"
        style:flex={item.style.flex}
        style:width={item.style.width}
        style:height={item.style.height}
        style:min-width={item.style.minWidth}
        style:max-width={item.style.maxWidth}
        style:min-height={item.style.minHeight}
        style:max-height={item.style.maxHeight}
      >
        <LayoutChild {layout} uischema={item.element} />
      </div>
    {/each}
  </div>
{/if}
