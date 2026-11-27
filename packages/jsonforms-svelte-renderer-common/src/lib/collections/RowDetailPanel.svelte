<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { composePaths } from '@jsonforms/core';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  import RowDetailContent from './RowDetailContent.svelte';
  import type { RowDetailFrameProps } from './rowDetailFrame';
  import type { Component } from 'svelte';
  import { toCss } from '../layout/layoutSizing';
  let {
    panel,
    schema,
    path,
    scope,
    enabled,
    height,
    children,
    SplitPane,
    Pane,
    innerScroll = false,
  }: RowDetailFrameProps & {
    SplitPane: Component<{
      direction: 'horizontal' | 'vertical';
      responsive: boolean;
      minSize: number;
      initialSizes: number[];
      onResize: (sizes: number[]) => void;
      resizable: boolean;
      resizeLabel: string;
      children: Snippet;
    }>;
    Pane: Component<{ class: string; children: Snippet }>;
    innerScroll?: boolean;
  } = $props();
  const message = useRendererMessages();
  let sizes = $state.raw<number[]>([60, 40]);
  const direction = $derived(panel.options?.placement === 'bottom' ? 'vertical' : 'horizontal');
</script>

{#if panel.visible}
  <div
    data-row-detail-panel={direction}
    class="min-h-0 min-w-0"
    style:height={height === undefined ? '32rem' : toCss(height)}
  >
    <SplitPane
      {direction}
      responsive={false}
      minSize={1}
      initialSizes={untrack(() => sizes)}
      onResize={(next) => {
        sizes = next;
      }}
      resizable={panel.options?.resizable !== false}
      resizeLabel={message('collection.resizeDetails')}
    >
      <Pane class={innerScroll ? 'min-h-0 min-w-0' : 'min-h-0 min-w-0 overflow-auto'}>
        {#if innerScroll}<div class="min-h-0 min-w-0 flex-1 overflow-auto" data-row-table-scroll>
            {@render children()}
          </div>{:else}{@render children()}{/if}
      </Pane>
      <Pane class={innerScroll ? 'min-h-0 min-w-0' : 'min-h-0 min-w-0 overflow-auto'}>
        {#if innerScroll}<div class="min-h-0 min-w-0 flex-1 overflow-auto" data-row-detail-scroll>
            {@render detail()}
          </div>{:else}{@render detail()}{/if}
      </Pane>
    </SplitPane>
  </div>
{:else}
  {@render children()}
{/if}

{#snippet detail()}
  <div class={`p-4 ${direction === 'horizontal' ? 'min-w-64' : ''}`} data-row-detail-content>
    {#if panel.selectedIndex === undefined}
      <p>{message('collection.selectItem')}</p>
    {:else}
      <RowDetailContent
        identity={panel.selectedKey}
        sourceItem={panel.selectedItem}
        {schema}
        path={composePaths(path, String(panel.selectedIndex))}
        {scope}
        detail={panel.options?.detail}
        {enabled}
      />
    {/if}
  </div>
{/snippet}
