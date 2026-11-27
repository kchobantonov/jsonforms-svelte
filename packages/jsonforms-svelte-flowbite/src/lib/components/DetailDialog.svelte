<script lang="ts">
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import type { Action } from 'svelte/action';
  import {
    type DetailDialogProps,
    useDetailDialog,
    DialogActionHint,
    DetailDialogActions,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button, Modal } from 'flowbite-svelte';
  import { PenOutline, ExpandOutline, CompressOutline, CloseOutline } from 'flowbite-svelte-icons';
  const props: DetailDialogProps = $props();
  const { label, children } = $derived(props);
  const editor = useDetailDialog(props);
  const { geometry, message } = editor;

  let open = $state(false);
  // Flowbite removes its native dialog after an outro. Restore focus after that
  // teardown, when the trigger is no longer inert and the dialog has left the top layer.
  const restoreTriggerFocus: Action<HTMLElement> = () => {
    return {
      destroy() {
        const trigger = editor.opener;
        requestAnimationFrame(() => {
          if (!open && trigger?.isConnected) trigger.focus({ preventScroll: true });
        });
      },
    };
  };
  $effect(() => {
    if (!open) editor.cancel();
  });
</script>

<Button
  size="xs"
  color="alternative"
  {...editor.triggerProps}
  onclick={(event: MouseEvent) => {
    if (editor.openFrom(event)) open = true;
  }}><PenOutline class="h-4 w-4" /></Button
>
<Modal
  bind:open
  size="lg"
  dismissable={false}
  outsideclose={false}
  aria-label={props.title ?? label}
  style={geometry.style}
  classes={{ header: 'shrink-0', body: 'min-h-0 flex-1 overflow-auto', footer: 'shrink-0' }}
>
  {#snippet header()}
    <div
      use:geometry.header
      use:restoreTriggerFocus
      data-autofocus
      tabindex="-1"
      class="flex w-full items-center justify-between gap-4"
      style:cursor={geometry.draggable ? 'move' : undefined}
      style:touch-action={geometry.draggable ? 'none' : undefined}
    >
      <h3>{props.title ?? label}</h3>
      <div class="flex gap-1">
        {#if geometry.maximizable}<DialogActionHint text={editor.maximizeLabel} placement="bottom"
            >{#snippet children(hintId)}<Button
                aria-describedby={hintId}
                type="button"
                size="xs"
                color="alternative"
                aria-label={editor.maximizeLabel}
                title={editor.maximizeLabel}
                onclick={geometry.toggle}
              >
                {#if geometry.maximized}<CompressOutline class="h-4 w-4" />{:else}<ExpandOutline
                    class="h-4 w-4"
                  />{/if}
              </Button>{/snippet}</DialogActionHint
          >{/if}
        <Button
          type="button"
          size="xs"
          color="alternative"
          aria-label={message('composite.close')}
          onclick={() => {
            open = false;
          }}><CloseOutline class="h-4 w-4" /></Button
        >
      </div>
    </div>
  {/snippet}
  <div data-composite-detail-dialog data-detail-dialog-body class="min-w-0">
    {#if editor.conflict}<p
        role="alert"
        data-detail-conflict
        class="mb-2 text-red-600 dark:text-red-400"
      >
        {message('composite.applyConflict')}
      </p>{/if}
    {#if editor.active}{@render children()}{/if}
  </div>
  {#snippet footer()}
    <div class="flex w-full flex-wrap justify-end gap-2" data-detail-dialog-footer>
      <DetailDialogActions {editor} close={() => (open = false)} blurBeforeApply>
        {#snippet button(kind, label, attributes)}<Button
            {...attributes}
            size="sm"
            color={kind === 'remove' ? 'red' : 'alternative'}>{label}</Button
          >{/snippet}
      </DetailDialogActions>
    </div>
  {/snippet}
</Modal>
{#if editor.active && editor.pendingDeletion}
  <ConfirmationDialog
    operation={editor.pendingDeletion.operation}
    onAccept={editor.acceptDeletion}
    onCancel={editor.cancelDeletion}
  />
{/if}
