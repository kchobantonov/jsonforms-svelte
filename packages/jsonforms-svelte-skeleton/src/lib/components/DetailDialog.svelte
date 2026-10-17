<script lang="ts">
  import {
    type DetailDialogProps,
    useRendererMessages,
    useDetailDialog,
    useDetailDialogGeometry,
    DialogActionHint,
  } from '@chobantonov/jsonforms-svelte';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import { getPortalRootNodeGetter, getPortalTarget } from '../util';
  import { PencilIcon, XIcon, Maximize2Icon, Minimize2Icon } from '@lucide/svelte';
  const props: DetailDialogProps = $props();
  const { label, enabled, children } = $derived(props);
  const editor = useDetailDialog(props);
  const geometry = useDetailDialogGeometry({
    open: () => editor.active,
    options: () => props.options?.dialog,
  });

  const getRootNode = getPortalRootNodeGetter();
  let dialog = $state<HTMLElement>();
  let opener: HTMLElement | undefined;
  const message = useRendererMessages();
  const maximizeLabel = $derived(
    message(geometry.maximized ? 'dialog.restore' : 'dialog.maximize'),
  );
</script>

<Dialog
  open={editor.active}
  {getRootNode}
  closeOnInteractOutside={false}
  initialFocusEl={() => dialog ?? null}
  finalFocusEl={() => opener ?? null}
  onOpenChange={({ open }) => {
    if (open) {
      if (props.beforeOpen?.() !== false) editor.begin();
    } else editor.cancel();
  }}
>
  <Dialog.Trigger
    type="button"
    class="btn-icon btn-icon-sm preset-tonal"
    disabled={!enabled && !props.inspectable}
    onclick={(event) => {
      opener = event.currentTarget;
    }}
    aria-label={props.triggerLabel ?? message('composite.edit', { label })}
    ><PencilIcon class="size-4" /></Dialog.Trigger
  >
  {#if editor.active}
    <Portal target={getPortalTarget()}>
      <Dialog.Backdrop class="fixed inset-0 z-50 bg-black/60" />
      <Dialog.Positioner class="fixed inset-0 z-50">
        <!-- Geometry updates replace inline styles; retain pointer access while Zag blocks the body. -->
        <Dialog.Content
          style={geometry.style}
          data-composite-detail-dialog
          class="card preset-filled-surface-50-950 rounded-container pointer-events-auto p-0"
        >
          {#snippet element(attributes)}
            <div {...attributes} bind:this={dialog}>
              <header
                use:geometry.header
                class="flex shrink-0 items-center justify-between gap-4 p-4"
                style:cursor={geometry.draggable ? 'move' : undefined}
                style:touch-action={geometry.draggable ? 'none' : undefined}
              >
                <Dialog.Title class="h5">{label}</Dialog.Title>
                <div class="flex gap-1">
                  {#if geometry.maximizable}
                    <button
                      type="button"
                      class="btn-icon btn-icon-sm preset-tonal"
                      aria-label={maximizeLabel}
                      title={maximizeLabel}
                      onclick={geometry.toggle}
                    >
                      {#if geometry.maximized}<Minimize2Icon class="size-4" />{:else}<Maximize2Icon
                          class="size-4"
                        />{/if}
                    </button>
                  {/if}
                  <Dialog.CloseTrigger
                    type="button"
                    class="btn-icon btn-icon-sm preset-tonal"
                    aria-label={message('composite.close')}
                    ><XIcon class="size-4" /></Dialog.CloseTrigger
                  >
                </div>
              </header>
              <div class="min-h-0 min-w-0 flex-1 overflow-auto p-4" data-detail-dialog-body>
                {#if editor.active}{@render children()}{/if}
              </div>
              <footer
                class="flex shrink-0 flex-wrap justify-end gap-2 p-4"
                data-detail-dialog-footer
              >
                {#if editor.showEmpty}<DialogActionHint text={message('composite.emptyTooltip')}
                    >{#snippet children(hintId)}<button
                        aria-describedby={hintId}
                        type="button"
                        class="btn btn-sm preset-tonal"
                        disabled={!editor.canEmpty}
                        onclick={editor.empty}
                        >{editor.label('emptyLabel', 'composite.empty')}</button
                      >{/snippet}</DialogActionHint
                  >{/if}
                {#if editor.showRemove}<DialogActionHint text={message('composite.removeTooltip')}
                    >{#snippet children(hintId)}<button
                        aria-describedby={hintId}
                        type="button"
                        class="btn btn-sm preset-filled-error-500"
                        disabled={!editor.canRemove}
                        onclick={editor.remove}
                        >{editor.label('removeLabel', 'composite.remove')}</button
                      >{/snippet}</DialogActionHint
                  >{/if}
                <DialogActionHint text={message('composite.cancelTooltip')}
                  >{#snippet children(hintId)}<button
                      aria-describedby={hintId}
                      type="button"
                      class="btn btn-sm preset-tonal"
                      onclick={() => {
                        editor.cancel();
                      }}>{editor.label('cancelLabel', 'composite.cancel')}</button
                    >{/snippet}</DialogActionHint
                >
                <DialogActionHint text={message('composite.applyTooltip')}
                  >{#snippet children(hintId)}<button
                      aria-describedby={hintId}
                      type="button"
                      class="btn btn-sm preset-tonal"
                      disabled={!editor.canApply}
                      onclick={() => {
                        editor.apply();
                      }}>{editor.label('okLabel', 'composite.apply')}</button
                    >{/snippet}</DialogActionHint
                >
              </footer>
            </div>
          {/snippet}
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  {/if}
</Dialog>
