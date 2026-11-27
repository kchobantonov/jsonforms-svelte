<script lang="ts">
  import type { Snippet } from 'svelte';
  import DialogActionHint from './DialogActionHint.svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  import type { useDetailDialog } from './detailDialog.svelte';
  type Action = 'empty' | 'remove' | 'cancel' | 'apply';
  const {
    editor,
    button,
    close,
    blurBeforeApply = false,
  }: {
    editor: ReturnType<typeof useDetailDialog>;
    close?: () => void;
    blurBeforeApply?: boolean;
    button: Snippet<
      [
        Action,
        string,
        {
          type: 'button';
          'aria-describedby': string;
          disabled?: boolean;
          onpointerdown?: (event: PointerEvent) => void;
          onclick(): void;
        },
      ]
    >;
  } = $props();
  const message = useRendererMessages();
  async function apply() {
    if (
      blurBeforeApply &&
      document.activeElement instanceof HTMLElement &&
      document.activeElement.closest('[data-composite-detail-dialog]')
    )
      document.activeElement.blur();
    if (await editor.apply()) close?.();
  }
</script>

{#snippet action(kind: Action, label: string, click: () => void, disabled?: boolean)}
  <DialogActionHint
    text={message(`composite.${kind}Tooltip`)}
    align={blurBeforeApply && kind === 'apply' ? 'end' : 'center'}
  >
    {#snippet children(id)}
      {@render button(kind, label, {
        type: 'button',
        'aria-describedby': id,
        disabled,
        onpointerdown:
          blurBeforeApply && kind === 'apply' ? (event) => event.preventDefault() : undefined,
        onclick: click,
      })}
    {/snippet}
  </DialogActionHint>
{/snippet}
{#if editor.showEmpty}{@render action(
    'empty',
    editor.label('emptyLabel', 'composite.empty'),
    editor.empty,
    !editor.canEmpty,
  )}{/if}
{#if editor.showRemove}{@render action(
    'remove',
    editor.label('removeLabel', 'composite.remove'),
    editor.remove,
    !editor.canRemove,
  )}{/if}
{@render action('cancel', editor.label('cancelLabel', 'composite.cancel'), () => {
  editor.cancel();
  close?.();
})}
{@render action('apply', editor.label('okLabel', 'composite.apply'), apply, !editor.canApply)}
