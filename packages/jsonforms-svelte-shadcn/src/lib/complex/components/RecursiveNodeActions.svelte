<script lang="ts">
  import ContainerValidationIndicator from './ContainerValidationIndicator.svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { PencilIcon, Trash2Icon, CheckIcon, XIcon } from '$lib/components/icons';
  import {
    useRendererMessages,
    type RecursiveTreeNode,
    type RecursiveTreeViewProps,
  } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let { node, model }: { node: RecursiveTreeNode; model: RecursiveTreeViewProps } = $props();
  let editing = $state.raw<RecursiveTreeNode>();
  let name = $state('');
  let error = $state<string>();
  const status = $derived(model.validation(node));
  function start(event: MouseEvent) {
    event.stopPropagation();
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
</script>

<div class="flex min-w-0 flex-1 items-center gap-1">
  {#if editing}
    <div class="min-w-0 flex-1">
      <Input
        bind:value={name}
        aria-label={message('mixed.rename')}
        disabled={!model.canRename(node)}
        aria-invalid={!!error}
        onclick={(event) => event.stopPropagation()}
        onkeydown={(event) => {
          event.stopPropagation();
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') editing = undefined;
        }}
      />
      {#if error}<p role="alert" class="text-sm text-red-600">{error}</p>{/if}
    </div>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={message('confirm.accept')}
      onclick={(event) => {
        event.stopPropagation();
        commit();
      }}><CheckIcon class="size-4" /></Button
    >
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={message('mixed.cancel')}
      onclick={(event) => {
        event.stopPropagation();
        editing = undefined;
      }}><XIcon class="size-4" /></Button
    >
  {:else}
    <button
      type="button"
      class="min-w-0 flex-1 truncate text-start"
      data-recursive-node={JSON.stringify(node.path)}
      onclick={(event) => {
        event.stopPropagation();
        model.select(node);
      }}>{node.label}</button
    >
    <ContainerValidationIndicator {...status} />
    {#if model.canRename(node)}<Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={message('mixed.rename') + ' ' + node.label}
        onclick={start}><PencilIcon class="size-4" /></Button
      >{/if}
    {#if model.canDelete(node)}<Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={message('mixed.delete') + ' ' + node.label}
        onclick={(event) => {
          event.stopPropagation();
          model.remove(node);
        }}><Trash2Icon class="size-4" /></Button
      >{/if}
  {/if}
</div>
