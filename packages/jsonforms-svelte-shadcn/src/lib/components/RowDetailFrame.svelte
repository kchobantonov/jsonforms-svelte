<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { composePaths, type JsonSchema } from '@jsonforms/core';
  import {
    RowDetailContent,
    useRendererMessages,
    toCss,
    type RowDetailPanelState,
  } from '@chobantonov/jsonforms-svelte';
  import SplitPane from './SplitPane.svelte';
  import Pane from './Pane.svelte';
  let {
    panel,
    schema,
    path,
    scope,
    enabled,
    height,
    children,
  }: {
    panel: RowDetailPanelState;
    schema: JsonSchema;
    path: string;
    scope: string;
    enabled: boolean;
    height?: number | string;
    children: Snippet;
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
      <Pane class="min-h-0 min-w-0 overflow-auto">
        {@render children()}
      </Pane>
      <Pane class="min-h-0 min-w-0 overflow-auto">
        <div class="p-4" data-row-detail-content>
          {#if panel.selectedIndex === undefined}
            <p>{message('collection.selectDetails')}</p>
          {:else}
            <RowDetailContent
              {schema}
              path={composePaths(path, String(panel.selectedIndex))}
              {scope}
              detail={panel.options?.detail}
              {enabled}
            />
          {/if}
        </div>
      </Pane>
    </SplitPane>
  </div>
{:else}
  {@render children()}
{/if}
