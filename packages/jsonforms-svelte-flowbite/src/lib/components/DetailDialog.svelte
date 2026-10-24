<script lang="ts">
  import type { Action } from 'svelte/action';
  import {
    type DetailDialogProps,
    useRendererMessages,
    useDetailDialog,
    useDetailDialogGeometry,
    DialogActionHint,
  } from '@chobantonov/jsonforms-svelte';
  import { Button, Modal } from 'flowbite-svelte';
  import { PenOutline, ExpandOutline, CompressOutline, CloseOutline } from 'flowbite-svelte-icons';
  const props: DetailDialogProps = $props();
  const { label, enabled, children } = $derived(props);
  const editor = useDetailDialog(props);
  const geometry = useDetailDialogGeometry({
    open: () => editor.active,
    options: () => props.options?.dialog,
  });

  let open = $state(false);
  let opener: HTMLElement | undefined;
  // Flowbite removes its native dialog after an outro. Restore focus after that
  // teardown, when the trigger is no longer inert and the dialog has left the top layer.
  const restoreTriggerFocus: Action<HTMLElement> = () => {
    return {
      destroy() {
        const trigger = opener;
        requestAnimationFrame(() => {
          if (!open && trigger?.isConnected) trigger.focus({ preventScroll: true });
        });
      },
    };
  };
  $effect(() => {
    if (!open) editor.cancel();
  });
  const message = useRendererMessages();
  const maximizeLabel = $derived(
    message(geometry.maximized ? 'dialog.restore' : 'dialog.maximize'),
  );
</script>

<Button
  size="xs"
  color="alternative"
  disabled={!enabled && !props.inspectable}
  onclick={(event: MouseEvent) => {
    if (props.beforeOpen?.() === false) return;
    opener = event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
    editor.begin();
    open = true;
  }}
  aria-label={props.triggerLabel ?? message('composite.edit', { label })}
  ><PenOutline class="h-4 w-4" /></Button
>
<Modal
  bind:open
  size="lg"
  dismissable={false}
  outsideclose={false}
  aria-label={label}
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
      <h3>{label}</h3>
      <div class="flex gap-1">
        {#if geometry.maximizable}<Button
            type="button"
            size="xs"
            color="alternative"
            aria-label={maximizeLabel}
            title={maximizeLabel}
            onclick={geometry.toggle}
          >
            {#if geometry.maximized}<CompressOutline class="h-4 w-4" />{:else}<ExpandOutline
                class="h-4 w-4"
              />{/if}
          </Button>{/if}
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
    {#if editor.active}{@render children()}{/if}
  </div>
  {#snippet footer()}
    <div class="flex w-full flex-wrap justify-end gap-2" data-detail-dialog-footer>
      {#if editor.showEmpty}<DialogActionHint text={message('composite.emptyTooltip')}
          >{#snippet children(hintId)}<Button
              aria-describedby={hintId}
              type="button"
              color="alternative"
              size="sm"
              disabled={!editor.canEmpty}
              onclick={editor.empty}>{editor.label('emptyLabel', 'composite.empty')}</Button
            >{/snippet}</DialogActionHint
        >{/if}
      {#if editor.showRemove}<DialogActionHint text={message('composite.removeTooltip')}
          >{#snippet children(hintId)}<Button
              aria-describedby={hintId}
              type="button"
              color="red"
              size="sm"
              disabled={!editor.canRemove}
              onclick={editor.remove}>{editor.label('removeLabel', 'composite.remove')}</Button
            >{/snippet}</DialogActionHint
        >{/if}
      <DialogActionHint text={message('composite.cancelTooltip')}
        >{#snippet children(hintId)}<Button
            aria-describedby={hintId}
            type="button"
            color="alternative"
            size="sm"
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
            color="alternative"
            size="sm"
            disabled={!editor.canApply}
            onclick={() => {
              if (editor.apply()) {
                open = false;
              }
            }}>{editor.label('okLabel', 'composite.apply')}</Button
          >{/snippet}</DialogActionHint
      >
    </div>
  {/snippet}
</Modal>
