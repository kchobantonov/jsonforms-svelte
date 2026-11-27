<script lang="ts">
  import {
    LayoutChild,
    type useJsonFormsLayout,
    type SplitPaneOptions,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Component, Snippet } from 'svelte';
  import { useSplitLayout } from './splitLayout.svelte';
  type PaneProps = { class?: string; children?: Snippet };
  const {
    layout,
    SplitPane,
    Pane,
  }: {
    layout: ReturnType<typeof useJsonFormsLayout>['layout'] & { direction?: string };
    SplitPane: Component<SplitPaneOptions & PaneProps>;
    Pane: Component<PaneProps & { style?: string }>;
  } = $props();
  const split = useSplitLayout(() => layout);
</script>

{#if layout.visible && split.value.items.length}
  <div
    use:split.measure
    data-split-layout={split.value.direction}
    data-layout-diagnostic={split.value.diagnostics
      .map((diagnostic) => diagnostic.code)
      .join(' ') || undefined}
    style:height={split.value.height}
    style:min-height={split.value.minHeight}
    class="min-h-0 min-w-0 overflow-hidden"
  >
    {#key split.value.key}
      <SplitPane
        direction={split.value.direction}
        initialSizes={split.value.sizes}
        sizes={split.value.controlledSizes}
        minimumSizes={split.value.minimumSizes}
        maximumSizes={split.value.maximumSizes}
        onResize={split.resize}
        resizable={split.value.resizable}
        resizeLabel={split.value.resizeLabel}
        responsive={false}
        minSize={1}
        class="h-full w-full min-w-0"
      >
        {#each split.value.items as item (item.index)}
          <Pane class="min-h-0 min-w-0" style={item.crossStyle}>
            <div class="h-full min-h-0 min-w-0 overflow-auto" data-split-pane={item.index}>
              <LayoutChild {layout} uischema={item.element} />
            </div>
          </Pane>
        {/each}
      </SplitPane>
    {/key}
  </div>
{/if}
