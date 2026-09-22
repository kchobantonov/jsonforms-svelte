<script lang="ts">
  import {
    type DetailDialogProps,
    useTranslator,
    useDetailDialog,
    DialogActionHint,
  } from '@chobantonov/jsonforms-svelte';
  import { Button, Modal } from 'flowbite-svelte';
  import { PenOutline } from 'flowbite-svelte-icons';
  const props: DetailDialogProps = $props();
  const { label, enabled, children } = $derived(props);
  const editor = useDetailDialog(props);

  let open = $state(false);
  $effect(() => {
    if (!open) editor.cancel();
  });
  const t = useTranslator();
</script>

<Button
  size="xs"
  color="alternative"
  disabled={!enabled}
  onclick={() => {
    editor.begin();
    open = true;
  }}
  aria-label={t.value('composite.edit', 'Edit ' + label, { label })}
  ><PenOutline class="h-4 w-4" /></Button
>
<Modal bind:open title={label} size="lg">
  <div data-composite-detail-dialog class="min-w-0">
    {#if editor.active}{@render children()}{/if}
  </div>
  {#snippet footer()}
    <div class="flex w-full flex-wrap justify-end gap-2">
      {#if editor.showEmpty}<DialogActionHint
          text={t.value('composite.emptyTooltip', 'Clear contents, keeping the object or array.')}
          >{#snippet children(hintId)}<button
              aria-describedby={hintId}
              type="button"
              class="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-600"
              disabled={!editor.canEmpty}
              onclick={editor.empty}
              >{editor.label('emptyLabel', 'composite.empty', 'Clear')}</button
            >{/snippet}</DialogActionHint
        >{/if}
      {#if editor.showRemove}<DialogActionHint
          text={t.value('composite.removeTooltip', 'Remove this value from the form data.')}
          >{#snippet children(hintId)}<button
              aria-describedby={hintId}
              type="button"
              class="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              disabled={!editor.canRemove}
              onclick={editor.remove}
              >{editor.label('removeLabel', 'composite.remove', 'Remove')}</button
            >{/snippet}</DialogActionHint
        >{/if}
      <DialogActionHint text={t.value('composite.cancelTooltip', 'Discard changes and close.')}
        >{#snippet children(hintId)}<button
            aria-describedby={hintId}
            type="button"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-600"
            onclick={() => {
              editor.cancel();
              open = false;
            }}>{editor.label('cancelLabel', 'composite.cancel', 'Cancel')}</button
          >{/snippet}</DialogActionHint
      >
      <DialogActionHint text={t.value('composite.applyTooltip', 'Apply changes and close.')}
        >{#snippet children(hintId)}<button
            aria-describedby={hintId}
            type="button"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-600"
            disabled={!editor.canApply}
            onclick={() => {
              if (editor.apply()) {
                open = false;
              }
            }}>{editor.label('okLabel', 'composite.apply', 'Apply')}</button
          >{/snippet}</DialogActionHint
      >
    </div>
  {/snippet}
</Modal>
