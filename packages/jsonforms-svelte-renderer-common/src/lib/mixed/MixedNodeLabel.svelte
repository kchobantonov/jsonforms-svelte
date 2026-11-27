<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { useMixedTreeActions } from './mixedTreeActions.svelte';
  import type { TreeNode, TreeNodeData } from './treeBuilder.svelte';
  import type { useMixedTreeView } from './mixedTreeView.svelte';
  import type { ErrorObject } from 'ajv';

  const {
    node,
    actions,
    validationAt,
    ContainerValidationIndicator,
    field,
    button,
    CheckIcon,
    XIcon,
    text,
  }: {
    node: TreeNode<TreeNodeData>;
    actions: ReturnType<typeof useMixedTreeActions>;
    validationAt: ReturnType<typeof useMixedTreeView>['validationAt'];
    ContainerValidationIndicator: Component<{
      show: boolean;
      count?: number;
      errors?: ErrorObject[];
    }>;
    field: Snippet;
    CheckIcon: Component<{ class?: string }>;
    XIcon: Component<{ class?: string }>;
    button: Snippet<[ReturnType<ReturnType<typeof useMixedTreeActions>['renameButton']>, Snippet]>;
    text?: Snippet<[string, string, 'alert' | undefined]>;
  } = $props();
</script>

{#snippet content(value: string, cls: string, role?: 'alert')}
  {#if text}{@render text(value, cls, role)}{:else}<span class={cls} {role}>{value}</span>{/if}
{/snippet}
{#if actions.renamingNodeId === node.id}
  <div class="flex min-w-0 flex-1 flex-col">
    <div class="flex min-w-0 items-center gap-1">
      <div class="min-w-0 flex-1">{@render field()}</div>
      {#snippet confirmIcon()}<CheckIcon class="size-4" />{/snippet}
      {#snippet cancelIcon()}<XIcon class="size-4" />{/snippet}
      {@render button(actions.renameButton(node, true), confirmIcon)}
      {@render button(actions.renameButton(node, false), cancelIcon)}
    </div>
    {#if actions.renameError}
      {@render content(actions.renameError, 'mt-0.5 text-xs text-red-500', 'alert')}
    {/if}
  </div>
{:else}
  {@render content(node.label, 'min-w-0 flex-1 truncate text-start text-sm')}
  <ContainerValidationIndicator {...validationAt(node.data!.path)} />
{/if}
