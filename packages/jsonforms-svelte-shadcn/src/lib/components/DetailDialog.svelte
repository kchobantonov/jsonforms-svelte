<script lang="ts">
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import {
    type DetailDialogProps,
    useDetailDialog,
    DialogActionHint,
    DetailDialogActions,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { PencilIcon, MaximizeIcon, MinimizeIcon, XIcon } from '$lib/components/icons';
  import { getPortalTarget } from '../util';
  const props: DetailDialogProps = $props();
  const { label, children } = $derived(props);
  const editor = useDetailDialog(props);
  const { geometry, message } = editor;
  let open = $state(false);
  $effect(() => {
    if (!open) editor.cancel();
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props: triggerProps })}
      <Button
        {...triggerProps}
        onclick={(event: MouseEvent) => {
          if (editor.openFrom(event)) open = true;
        }}
        type="button"
        variant="ghost"
        size="icon-sm"
        {...editor.triggerProps}
      >
        <PencilIcon class="size-4" />
      </Button>
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Content
    portalProps={{ to: getPortalTarget() }}
    class="gap-0"
    style={geometry.style}
    showCloseButton={false}
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      geometry.focus();
    }}
    onCloseAutoFocus={(event) => {
      event.preventDefault();
      if (editor.opener?.isConnected) editor.opener.focus({ preventScroll: true });
    }}
    onInteractOutside={(event) => event.preventDefault()}
    data-composite-detail-dialog
  >
    <div
      use:geometry.header
      class="shrink-0 pe-16 pb-4"
      style:cursor={geometry.draggable ? 'move' : undefined}
      style:touch-action={geometry.draggable ? 'none' : undefined}
    >
      <Dialog.Header><Dialog.Title>{props.title ?? label}</Dialog.Title></Dialog.Header>
      <div class="absolute end-2 top-2 flex gap-1">
        {#if geometry.maximizable}<DialogActionHint text={editor.maximizeLabel}
            >{#snippet children(hintId)}<Button
                aria-describedby={hintId}
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={editor.maximizeLabel}
                title={editor.maximizeLabel}
                onclick={geometry.toggle}
              >
                {#if geometry.maximized}<MinimizeIcon class="size-4" />{:else}<MaximizeIcon
                    class="size-4"
                  />{/if}
              </Button>{/snippet}</DialogActionHint
          >{/if}
        <Dialog.Close>
          {#snippet child({ props: closeProps })}
            <Button
              {...closeProps}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={message('composite.close')}><XIcon class="size-4" /></Button
            >
          {/snippet}
        </Dialog.Close>
      </div>
    </div>
    <div class="min-h-0 min-w-0 flex-1 overflow-auto py-2" data-detail-dialog-body>
      {#if editor.conflict}<p role="alert" data-detail-conflict class="text-destructive mb-2">
          {message('composite.applyConflict')}
        </p>{/if}
      {#if editor.active}{@render children()}{/if}
    </div>
    <Dialog.Footer class="shrink-0 flex-wrap gap-2 pt-4" data-detail-dialog-footer>
      <DetailDialogActions {editor} close={() => (open = false)}>
        {#snippet button(kind, label, attributes)}<Button
            {...attributes}
            variant={kind === 'remove' ? 'destructive' : 'outline'}>{label}</Button
          >{/snippet}
      </DetailDialogActions>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
{#if editor.active && editor.pendingDeletion}
  <ConfirmationDialog
    operation={editor.pendingDeletion.operation}
    onAccept={editor.acceptDeletion}
    onCancel={editor.cancelDeletion}
  />
{/if}
