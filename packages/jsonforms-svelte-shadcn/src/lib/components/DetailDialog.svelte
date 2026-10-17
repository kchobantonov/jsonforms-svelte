<script lang="ts">
  import {
    type DetailDialogProps,
    useRendererMessages,
    useDetailDialog,
    useDetailDialogGeometry,
    DialogActionHint,
  } from '@chobantonov/jsonforms-svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { PencilIcon, MaximizeIcon, MinimizeIcon, XIcon } from '$lib/components/icons';
  import { getPortalTarget } from '../util';
  const props: DetailDialogProps = $props();
  const { label, enabled, children } = $derived(props);
  const editor = useDetailDialog(props);
  const geometry = useDetailDialogGeometry({
    open: () => editor.active,
    options: () => props.options?.dialog,
  });
  let open = $state(false);
  let opener: HTMLElement | undefined;
  $effect(() => {
    if (!open) editor.cancel();
  });

  const message = useRendererMessages();
  const maximizeLabel = $derived(
    message(geometry.maximized ? 'dialog.restore' : 'dialog.maximize'),
  );
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props: triggerProps })}
      <Button
        {...triggerProps}
        onclick={(event: MouseEvent) => {
          if (props.beforeOpen?.() === false) return;
          opener = event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
          editor.begin();
          open = true;
        }}
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={!enabled && !props.inspectable}
        aria-label={props.triggerLabel ?? message('composite.edit', { label })}
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
      if (opener?.isConnected) opener.focus({ preventScroll: true });
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
      <Dialog.Header><Dialog.Title>{label}</Dialog.Title></Dialog.Header>
      <div class="absolute end-2 top-2 flex gap-1">
        {#if geometry.maximizable}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={maximizeLabel}
            title={maximizeLabel}
            onclick={geometry.toggle}
          >
            {#if geometry.maximized}<MinimizeIcon class="size-4" />{:else}<MaximizeIcon
                class="size-4"
              />{/if}
          </Button>
        {/if}
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
      {#if editor.active}{@render children()}{/if}
    </div>
    <Dialog.Footer class="shrink-0 flex-wrap gap-2 pt-4" data-detail-dialog-footer>
      {#if editor.showEmpty}<DialogActionHint text={message('composite.emptyTooltip')}
          >{#snippet children(hintId)}<Button
              aria-describedby={hintId}
              type="button"
              variant="outline"
              disabled={!editor.canEmpty}
              onclick={editor.empty}>{editor.label('emptyLabel', 'composite.empty')}</Button
            >{/snippet}</DialogActionHint
        >{/if}
      {#if editor.showRemove}<DialogActionHint text={message('composite.removeTooltip')}
          >{#snippet children(hintId)}<Button
              aria-describedby={hintId}
              type="button"
              variant="destructive"
              disabled={!editor.canRemove}
              onclick={editor.remove}>{editor.label('removeLabel', 'composite.remove')}</Button
            >{/snippet}</DialogActionHint
        >{/if}
      <DialogActionHint text={message('composite.cancelTooltip')}
        >{#snippet children(hintId)}<Button
            aria-describedby={hintId}
            type="button"
            variant="outline"
            onclick={() => {
              editor.cancel();
              open = false;
            }}>{editor.label('cancelLabel', 'composite.cancel')}</Button
          >{/snippet}</DialogActionHint
      >
      <DialogActionHint text={message('composite.applyTooltip')}
        >{#snippet children(hintId)}<Button
            aria-describedby={hintId}
            type="button"
            variant="outline"
            disabled={!editor.canApply}
            onclick={() => {
              if (editor.apply()) {
                open = false;
              }
            }}>{editor.label('okLabel', 'composite.apply')}</Button
          >{/snippet}</DialogActionHint
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
