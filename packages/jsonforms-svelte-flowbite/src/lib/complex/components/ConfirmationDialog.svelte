<script lang="ts">
  import { Modal, Button } from 'flowbite-svelte';
  import { tick } from 'svelte';
  import {
    useConfirmationLabels,
    type ConfirmationDialogProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const props: ConfirmationDialogProps = $props();
  const labels = useConfirmationLabels(props);
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
      props.onCancel();
    }
    restoreFocus();
  }
</script>

<Modal
  open
  aria-label={labels.title}
  title={labels.title}
  onclose={restoreFocus}
  onkeydown={(event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    cancel();
  }}
>
  <p>{labels.description}</p>
  {#snippet footer()}
    <Button color="alternative" onclick={cancel}>{labels.decline}</Button>
    <Button onclick={props.onAccept}>{labels.accept}</Button>
  {/snippet}
</Modal>
