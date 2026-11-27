<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { SplitPaneOptions } from '../layout/splitPane.svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  import type { useListWithDetail } from './listWithDetail.svelte';
  import ListItemDetail from './ListItemDetail.svelte';
  const {
    SplitPane,
    Pane,
    list,
    control,
    insetDetail = false,
    navigation,
    empty,
  }: {
    SplitPane: Component<SplitPaneOptions & { class?: string; children: Snippet }>;
    Pane: Component<{ class?: string; children: Snippet }>;
    list: ReturnType<typeof useListWithDetail>;
    control: Parameters<typeof useListWithDetail>[1]['control'];
    insetDetail?: boolean;
    navigation: Snippet;
    empty: Snippet;
  } = $props();
  const message = useRendererMessages();
</script>

<SplitPane
  direction="horizontal"
  initialSizes={[25, 75]}
  minimumSizes={[15, 25]}
  maximumSizes={[60, 85]}
  minSize={1}
  resizeLabel={message('splitLayout.resize')}
  class="min-h-64 w-full"
>
  <Pane class={insetDetail ? 'flex min-w-0 flex-col' : 'flex min-w-0 flex-col p-4'}>
    {@render navigation()}
  </Pane>
  <Pane class={insetDetail ? 'min-w-0' : 'min-w-0 p-4'}>
    <div
      class={insetDetail ? 'h-full min-w-0 overflow-y-auto p-4' : 'h-full min-w-0 overflow-y-auto'}
    >
      {#if list.selectedIndex === undefined}
        <div class="flex h-full items-center justify-center">{@render empty()}</div>
      {:else}
        {#key list.selectedKey}
          <ListItemDetail {control} selectedIndex={list.selectedIndex} />
        {/key}
      {/if}
    </div>
  </Pane>
</SplitPane>
