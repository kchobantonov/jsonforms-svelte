<script lang="ts">
  import type { RecursiveTreeNode, RecursiveTreeViewProps } from '@chobantonov/jsonforms-svelte';
  import TreeView from '$lib/components/TreeView/TreeView.svelte';
  import type { TreeNode } from '$lib/components/TreeView/types';
  import RecursiveNodeActions from './RecursiveNodeActions.svelte';
  const model: RecursiveTreeViewProps = $props();
  const project = (node: RecursiveTreeNode): TreeNode<RecursiveTreeNode> => ({
    id: JSON.stringify(node.path),
    label: node.label,
    data: node,
    children: node.children.map(project),
  });
  const nodes = $derived([project(model.root)]);
  let expandedNodes = $state(['[]']);
</script>

<TreeView
  {nodes}
  bind:expandedNodes
  activeNodeId={JSON.stringify(model.selected.path)}
  onNodeClick={(node) => {
    if (node.data) model.select(node.data);
  }}
>
  {#snippet nodeSnippet({ node })}
    {#if node.data}<RecursiveNodeActions node={node.data} {model} />{/if}
  {/snippet}
</TreeView>
