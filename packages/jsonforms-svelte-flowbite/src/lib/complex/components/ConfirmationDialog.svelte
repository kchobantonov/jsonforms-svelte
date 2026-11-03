<script lang="ts">
  import { Modal, Button } from 'flowbite-svelte';
  import { tick } from 'svelte';
  import { useRendererMessages, type ConfirmationOperation } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let {
    operation,
    onAccept,
    onCancel,
  }: { operation: ConfirmationOperation; onAccept: () => void; onCancel: () => void } = $props();
  function currentFocus(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    let active: Element | null = document.activeElement;
    while (active instanceof HTMLElement && active.shadowRoot?.activeElement) {
      active = active.shadowRoot.activeElement;
    }
    return active instanceof HTMLElement ? active : null;
  }
  const returnFocus = currentFocus();
  let cancelled = false;
  function restoreFocus() {
    void tick().then(() => {
      if (returnFocus?.isConnected) returnFocus.focus();
    });
  }
  function cancel() {
    if (!cancelled) {
      cancelled = true;
      onCancel();
    }
    restoreFocus();
  }
</script>

<Modal
  open
  aria-label={message('confirm.' + operation + '.title')}
  title={message('confirm.' + operation + '.title')}
  onclose={restoreFocus}
  onkeydown={(event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    cancel();
  }}
>
  <p>{message('confirm.' + operation + '.message')}</p>
  {#snippet footer()}
    <Button color="alternative" onclick={cancel}>{message('confirm.decline')}</Button>
    <Button onclick={onAccept}>{message('confirm.accept')}</Button>
  {/snippet}
</Modal>
