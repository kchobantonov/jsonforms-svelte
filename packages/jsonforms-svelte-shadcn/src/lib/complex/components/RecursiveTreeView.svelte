<script lang="ts">
  import {
    useRendererMessages,
    type RecursiveTreeNode,
    type RecursiveTreeViewProps,
  } from '@chobantonov/jsonforms-svelte';
  import * as Collapsible from '@jsonforms-svelte-shadcn-ui/collapsible';
  import { ChevronRightIcon } from '$lib/components/icons';
  import RecursiveNodeActions from './RecursiveNodeActions.svelte';
  const model: RecursiveTreeViewProps = $props();
  const message = useRendererMessages();
  let expanded = $state(['[]']);
  const key = (node: RecursiveTreeNode) => JSON.stringify(node.path);
</script>

{#snippet row(node: RecursiveTreeNode)}
  <Collapsible.Root
    open={expanded.includes(key(node))}
    onOpenChange={(open) => {
      expanded = open ? [...expanded, key(node)] : expanded.filter((value) => value !== key(node));
    }}
  >
    <div
      class="flex min-w-0 items-center gap-1 rounded-md p-1"
      class:bg-accent={key(model.selected) === key(node)}
    >
      {#if node.children.length}
        <Collapsible.Trigger
          aria-label={message(expanded.includes(key(node)) ? 'tree.collapse' : 'tree.expand', {
            label: node.label,
          })}
          class="inline-flex size-8 shrink-0 items-center justify-center"
        >
          <ChevronRightIcon class={expanded.includes(key(node)) ? 'size-4 rotate-90' : 'size-4'} />
        </Collapsible.Trigger>
      {:else}<span class="size-8 shrink-0"></span>{/if}
      <RecursiveNodeActions {node} {model} />
    </div>
    {#if node.children.length}<Collapsible.Content class="ps-5">
        {#each node.children as child (key(child))}{@render row(child)}{/each}
      </Collapsible.Content>{/if}
  </Collapsible.Root>
{/snippet}
<nav aria-label={model.root.label}>{@render row(model.root)}</nav>
