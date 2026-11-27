<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { SplitPaneOptions } from '../layout/splitPane.svelte';
  import type { useMixedTreeView } from './mixedTreeView.svelte';
  import MixedNodeDetail from './MixedNodeDetail.svelte';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  let {
    view,
    control,
    navigationKey,
    SplitPane,
    Pane,
    resizeLabel,
    constrainTree = false,
    treeNavigation,
    treeToolbar,
    breadcrumbs,
  }: {
    view: ReturnType<typeof useMixedTreeView>;
    control: Parameters<typeof useMixedTreeView>[1]['control'];
    navigationKey: symbol;
    SplitPane: Component<SplitPaneOptions & { children: Snippet }>;
    Pane: Component<{ children: Snippet }>;
    resizeLabel?: string;
    constrainTree?: boolean;
    treeNavigation: Snippet;
    treeToolbar: Snippet;
    breadcrumbs: Snippet;
  } = $props();
  const { editor, selectedNode } = $derived(view);
</script>

{#snippet tree()}
  <SplitPane initialSizes={[25, 75]} {...resizeLabel === undefined ? {} : { resizeLabel }}>
    <Pane>
      <div
        class={[
          'pointer-events-auto flex flex-col ps-1 pe-4 pt-1 select-text',
          !constrainTree && 'h-full min-h-0',
        ]}
      >
        <div class="mb-4 flex min-w-0 items-center gap-2">{@render treeToolbar()}</div>
        {#if editor.treeNodes}
          {#if constrainTree}{@render treeNavigation()}{:else}<div
              class="min-h-0 flex-1 overflow-auto"
            >
              {@render treeNavigation()}
            </div>{/if}
        {/if}
      </div>
    </Pane>
    <Pane>
      <div class="pointer-events-auto ps-4 pe-4 select-text">
        {#each selectedNode ? [selectedNode.data.control] : [] as detailControl (detailControl.path)}
          {#if view.breadcrumbSegments.length}{@render breadcrumbs()}{/if}
          <MixedNodeDetail {control} {detailControl} {editor} {navigationKey} />
        {/each}
      </div>
    </Pane>
  </SplitPane>
{/snippet}

{#if view.showTreeView}
  {#if constrainTree}<div class="min-h-0 min-w-0">{@render tree()}</div>{:else}{@render tree()}{/if}
{:else if editor.schema && editor.uischema}
  <DispatchRenderer
    schema={editor.schema}
    uischema={editor.structuredUISchema!}
    path={control.path}
    renderers={control.renderers}
    cells={control.cells}
    enabled={control.enabled}
  />
{/if}
