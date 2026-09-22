<script lang="ts">
  import {
    type DetailDialogProps,
    useTranslator,
    useDetailDialog,
    DialogActionHint,
  } from '@chobantonov/jsonforms-svelte';
  import { PencilIcon, XIcon } from '@lucide/svelte';
  const props: DetailDialogProps = $props();
  const { label, enabled, children } = $derived(props);
  const editor = useDetailDialog(props);

  let dialog = $state<HTMLDialogElement>();
  const t = useTranslator();
</script>

<button
  type="button"
  class="btn-icon btn-icon-sm preset-tonal"
  disabled={!enabled}
  onclick={() => {
    editor.begin();
    dialog?.showModal();
  }}
  aria-label={t.value('composite.edit', 'Edit ' + label, { label })}
  ><PencilIcon class="size-4" /></button
>
<dialog
  bind:this={dialog}
  onclose={editor.cancel}
  oncancel={editor.cancel}
  aria-label={label}
  data-composite-detail-dialog
  class="card preset-filled-surface-50-950 rounded-container fixed m-auto max-h-[85vh] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto p-0 backdrop:bg-black/60"
>
  <header class="flex items-center justify-between gap-4 p-4">
    <h2 class="h5">{label}</h2>
    <button
      type="button"
      class="btn-icon btn-icon-sm preset-tonal"
      aria-label={t.value('composite.close', 'Close')}
      onclick={() => dialog?.close()}><XIcon class="size-4" /></button
    >
  </header>
  <div class="min-w-0 p-4">
    {#if editor.active}{@render children()}{/if}
  </div>
  <footer class="flex flex-wrap justify-end gap-2 p-4">
    {#if editor.showEmpty}<DialogActionHint
        text={t.value('composite.emptyTooltip', 'Clear contents, keeping the object or array.')}
        >{#snippet children(hintId)}<button
            aria-describedby={hintId}
            type="button"
            class="btn btn-sm preset-tonal"
            disabled={!editor.canEmpty}
            onclick={editor.empty}>{editor.label('emptyLabel', 'composite.empty', 'Clear')}</button
          >{/snippet}</DialogActionHint
      >{/if}
    {#if editor.showRemove}<DialogActionHint
        text={t.value('composite.removeTooltip', 'Remove this value from the form data.')}
        >{#snippet children(hintId)}<button
            aria-describedby={hintId}
            type="button"
            class="btn btn-sm preset-filled-error-500"
            disabled={!editor.canRemove}
            onclick={editor.remove}
            >{editor.label('removeLabel', 'composite.remove', 'Remove')}</button
          >{/snippet}</DialogActionHint
      >{/if}
    <DialogActionHint text={t.value('composite.cancelTooltip', 'Discard changes and close.')}
      >{#snippet children(hintId)}<button
          aria-describedby={hintId}
          type="button"
          class="btn btn-sm preset-tonal"
          onclick={() => {
            editor.cancel();
            dialog?.close();
          }}>{editor.label('cancelLabel', 'composite.cancel', 'Cancel')}</button
        >{/snippet}</DialogActionHint
    >
    <DialogActionHint text={t.value('composite.applyTooltip', 'Apply changes and close.')}
      >{#snippet children(hintId)}<button
          aria-describedby={hintId}
          type="button"
          class="btn btn-sm preset-tonal"
          disabled={!editor.canApply}
          onclick={() => {
            if (editor.apply()) {
              dialog?.close();
            }
          }}>{editor.label('okLabel', 'composite.apply', 'Apply')}</button
        >{/snippet}</DialogActionHint
    >
  </footer>
</dialog>
