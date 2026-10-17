<script lang="ts">
  import { Modal, Button } from 'flowbite-svelte';
  import { useRendererMessages, type ConfirmationOperation } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let {
    operation,
    onAccept,
    onCancel,
  }: { operation: ConfirmationOperation; onAccept: () => void; onCancel: () => void } = $props();
</script>

<Modal
  open
  aria-label={message('confirm.' + operation + '.title')}
  title={message('confirm.' + operation + '.title')}
  onclose={onCancel}
>
  <p>{message('confirm.' + operation + '.message')}</p>
  {#snippet footer()}
    <Button color="alternative" onclick={onCancel}>{message('confirm.decline')}</Button>
    <Button onclick={onAccept}>{message('confirm.accept')}</Button>
  {/snippet}
</Modal>
