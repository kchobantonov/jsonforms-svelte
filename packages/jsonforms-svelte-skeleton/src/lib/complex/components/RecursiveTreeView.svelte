<script lang="ts">
  import type { RecursiveTreeNode, RecursiveTreeViewProps } from '@chobantonov/jsonforms-svelte';
  import { TreeView, createTreeViewCollection } from '@skeletonlabs/skeleton-svelte';
  import { ChevronRightIcon } from '@lucide/svelte';
  import RecursiveNodeActions from './RecursiveNodeActions.svelte';
  const model: RecursiveTreeViewProps = $props();
  const key = (node: RecursiveTreeNode) => JSON.stringify(node.path);
  const collection = $derived(
    createTreeViewCollection<RecursiveTreeNode>({
      nodeToValue: key,
      nodeToString: (node) => node.label,
      nodeToChildren: (node) => node.children,
      rootNode: {
        label: '',
        path: ['__root__'],
        data: undefined,
        schema: {},
        children: [model.root],
      },
    }),
  );
  let expanded = $state(['[]']);
  const find = (node: RecursiveTreeNode, value: string): RecursiveTreeNode | undefined =>
    key(node) === value ? node : node.children.map((child) => find(child, value)).find(Boolean);
</script>

{#snippet row(node: RecursiveTreeNode, indexPath: number[])}
  <TreeView.NodeProvider value={{ node, indexPath }}>
    {#if node.children.length}
      <TreeView.Branch>
        <TreeView.BranchControl
          class={`flex min-w-0 items-center gap-1 rounded-md p-1 ${key(model.selected) === key(node) ? 'preset-tonal' : ''}`}
        >
          <TreeView.BranchIndicator><ChevronRightIcon class="size-4" /></TreeView.BranchIndicator>
          <TreeView.BranchText class="flex min-w-0 flex-1"
            ><RecursiveNodeActions {node} {model} /></TreeView.BranchText
          >
        </TreeView.BranchControl>
        <TreeView.BranchContent class="ps-5">
          {#each node.children as child, index (key(child))}{@render row(child, [
              ...indexPath,
              index,
            ])}{/each}
        </TreeView.BranchContent>
      </TreeView.Branch>
    {:else}
      <TreeView.Item
        class={`flex min-w-0 items-center gap-1 rounded-md p-1 ${key(model.selected) === key(node) ? 'preset-tonal' : ''}`}
      >
        <span class="flex min-w-0 flex-1"><RecursiveNodeActions {node} {model} /></span>
      </TreeView.Item>
    {/if}
  </TreeView.NodeProvider>
{/snippet}
<TreeView
  {collection}
  expandedValue={expanded}
  selectedValue={[key(model.selected)]}
  onExpandedChange={(event) => (expanded = event.expandedValue)}
  onSelectionChange={(event) => {
    const node = find(model.root, event.selectedValue[0]);
    if (node) model.select(node);
  }}
>
  <TreeView.Tree aria-label={model.root.label}>{@render row(model.root, [0])}</TreeView.Tree>
</TreeView>
