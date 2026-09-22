<script lang="ts">
  import {
    type DetailDialogProps,
    useTranslator,
    useDetailDialog,
    DialogActionHint,
  } from '@chobantonov/jsonforms-svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { PencilIcon } from '$lib/components/icons';
  import { getPortalTarget } from '../util';
  const props: DetailDialogProps = $props();
  const { label, enabled, children } = $derived(props);
  const editor = useDetailDialog(props);
  let open = $state(false);
  $effect(() => {
    if (!open) editor.cancel();
  });

  const t = useTranslator();
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        onclick={() => {
          editor.begin();
          open = true;
        }}
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={!enabled}
        aria-label={t.value('composite.edit', 'Edit ' + label, { label })}
      >
        <PencilIcon class="size-4" />
      </Button>
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Content
    portalProps={{ to: getPortalTarget() }}
    class="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
    data-composite-detail-dialog
  >
    <Dialog.Header><Dialog.Title>{label}</Dialog.Title></Dialog.Header>
    <div class="min-w-0 py-2">
      {#if editor.active}{@render children()}{/if}
    </div>
    <Dialog.Footer class="flex-wrap gap-2">
      {#if editor.showEmpty}<DialogActionHint
          text={t.value('composite.emptyTooltip', 'Clear contents, keeping the object or array.')}
          >{#snippet children(hintId)}<button
              aria-describedby={hintId}
              type="button"
              class="border-input bg-background rounded-md border px-3 py-2 text-sm disabled:opacity-50"
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
              class="bg-destructive rounded-md px-3 py-2 text-sm text-white disabled:opacity-50"
              disabled={!editor.canRemove}
              onclick={editor.remove}
              >{editor.label('removeLabel', 'composite.remove', 'Remove')}</button
            >{/snippet}</DialogActionHint
        >{/if}
      <DialogActionHint text={t.value('composite.cancelTooltip', 'Discard changes and close.')}
        >{#snippet children(hintId)}<button
            aria-describedby={hintId}
            type="button"
            class="border-input bg-background rounded-md border px-3 py-2 text-sm disabled:opacity-50"
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
            class="border-input bg-background rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            disabled={!editor.canApply}
            onclick={() => {
              if (editor.apply()) {
                open = false;
              }
            }}>{editor.label('okLabel', 'composite.apply', 'Apply')}</button
          >{/snippet}</DialogActionHint
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
