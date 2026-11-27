<script lang="ts">
  import type { Component, ComponentProps, Snippet } from 'svelte';
  import type { TreeNode, TreeNodeData } from './treeBuilder.svelte';
  import MixedNodeLabel from './MixedNodeLabel.svelte';
  import type { useMixedTreeView } from './mixedTreeView.svelte';
  type Node = TreeNode<TreeNodeData>;
  const {
    node,
    active,
    view,
    control,
    focusedId,
    onFocusChange,
    JsonTypeIcon,
    ContainerValidationIndicator,
    CheckIcon,
    XIcon,
    RenameInput,
    renameInputProps,
    button,
    treeNodeAction,
  }: Pick<
    ComponentProps<typeof MixedNodeLabel>,
    'ContainerValidationIndicator' | 'CheckIcon' | 'XIcon' | 'button'
  > & {
    RenameInput?: Component<{ value: string }>;
    renameInputProps: Record<string, unknown>;
    node: Node;
    active: boolean;
    view: ReturnType<typeof useMixedTreeView>;
    control: { enabled: boolean; path: string };
    focusedId?: string;
    onFocusChange?: (id: string | undefined) => void;
    JsonTypeIcon: Component<{ type: TreeNodeData['type']; active: boolean }>;
    treeNodeAction: Snippet<[Node, boolean, 'rename' | 'delete']>;
  } = $props();
  const actions = $derived(view.actions);
  const canHaveActions = $derived(node.data?.path !== control.path);
</script>

{#snippet actionButtons()}
  {#if canHaveActions}
    {#if actions.canRenameNode(node)}{@render treeNodeAction(node, active, 'rename')}{/if}
    {#if node.data?.canDelete && !actions.isDeleteDisabled(node)}{@render treeNodeAction(
        node,
        active,
        'delete',
      )}{/if}
  {/if}
{/snippet}

{#snippet nodeActions()}
  {#if actions.renamingNodeId !== node.id && control.enabled}
    <div
      class={[
        'ms-auto flex shrink-0 items-center gap-0.5',
        canHaveActions && 'opacity-0 transition-opacity group-hover:opacity-100',
      ]}
      style:opacity={active || focusedId === node.id ? 1 : undefined}
      onfocusin={onFocusChange && (() => onFocusChange?.(node.id))}
      onfocusout={onFocusChange && (() => onFocusChange?.(undefined))}
    >
      {@render actionButtons()}
    </div>
  {/if}
{/snippet}

<div class="group flex min-w-0 flex-1 items-center gap-1">
  {#if node.data?.type}<JsonTypeIcon type={node.data.type} {active} />{/if}
  <MixedNodeLabel
    {node}
    {actions}
    validationAt={view.validationAt}
    {ContainerValidationIndicator}
    {CheckIcon}
    {XIcon}
    {button}
  >
    {#snippet field()}
      {@const attributes = { ...renameInputProps, ...actions.renameInput(node) }}
      {#if RenameInput}
        <RenameInput {...attributes} bind:value={actions.renameValue} />
      {:else}
        <input {...attributes} bind:value={actions.renameValue} />
      {/if}
    {/snippet}
  </MixedNodeLabel>
  {@render nodeActions()}
</div>
