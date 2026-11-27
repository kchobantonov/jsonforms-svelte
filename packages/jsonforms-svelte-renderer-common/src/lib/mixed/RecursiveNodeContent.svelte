<script lang="ts">
  import type { Snippet, Component } from 'svelte';
  import type { RecursiveTreeNode } from './recursiveTree';
  import type { RecursiveTreeViewProps } from './recursiveTreeContext';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  const {
    node,
    model,
    Input,
    button,
    Validation,
  }: {
    node: RecursiveTreeNode;
    model: RecursiveTreeViewProps;
    Input?: Component<{ value: string }>;
    button: Snippet<
      ['rename' | 'remove' | 'accept' | 'cancel', string, (event: MouseEvent) => void]
    >;
    Validation: Component<ReturnType<RecursiveTreeViewProps['validation']>>;
  } = $props();
  const message = useRendererMessages();
  let editing = $state.raw<RecursiveTreeNode>();
  let name = $state('');
  let error = $state<string>();
  const status = $derived(model.validation(node));
  const selected = $derived(JSON.stringify(model.selected.path) === JSON.stringify(node.path));
  function start() {
    editing = node;
    name = node.label;
    error = undefined;
  }
  function commit() {
    if (!editing) return;
    error = model.validateRename(editing, name);
    if (!error) {
      model.rename(editing, name);
      editing = undefined;
    }
  }

  const stop = (action: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    action();
  };
  function keydown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === 'Enter') commit();
    if (event.key === 'Escape') editing = undefined;
  }
</script>

<div class="group/recursive flex min-w-0 flex-1 items-center gap-1">
  {#if editing}
    {@const attributes = {
      'aria-label': message('mixed.rename'),
      disabled: !model.canRename(node),
      'aria-invalid': !!error,
      onclick: (event: MouseEvent) => event.stopPropagation(),
      onkeydown: keydown,
    }}
    <div class="min-w-0 flex-1">
      {#if Input}<Input {...attributes} bind:value={name} />{:else}<input
          class="input"
          {...attributes}
          bind:value={name}
        />{/if}
      {#if error}<p role="alert" class="text-sm text-red-600">{error}</p>{/if}
    </div>
    {@render button('accept', message('confirm.accept'), stop(commit))}
    {@render button(
      'cancel',
      message('mixed.cancel'),
      stop(() => (editing = undefined)),
    )}
  {:else}
    <button
      type="button"
      class="min-w-0 flex-1 truncate text-start"
      data-recursive-node={JSON.stringify(node.path)}
      onclick={stop(() => model.select(node))}>{node.label}</button
    >
    <Validation {...status} />
    <div
      class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within/recursive:opacity-100 group-hover/recursive:opacity-100"
      style:opacity={selected ? 1 : undefined}
    >
      {#if model.canRename(node)}{@render button(
          'rename',
          message('mixed.rename') + ' ' + node.label,
          stop(start),
        )}{/if}
      {#if model.canDelete(node)}{@render button(
          'remove',
          message('mixed.delete') + ' ' + node.label,
          stop(() => model.remove(node)),
        )}{/if}
    </div>
  {/if}
</div>
