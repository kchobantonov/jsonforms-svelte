<script lang="ts">
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { getPortalTarget } from '../../util';
  import { useRendererMessages, type ConfirmationOperation } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let {
    operation,
    onAccept,
    onCancel,
  }: { operation: ConfirmationOperation; onAccept: () => void; onCancel: () => void } = $props();
</script>

<Dialog.Root
  open
  onOpenChange={(open) => {
    if (!open) onCancel();
  }}
>
  <Dialog.Content portalProps={{ to: getPortalTarget() }} class="max-w-md">
    <Dialog.Title>{message('confirm.' + operation + '.title')}</Dialog.Title>
    <Dialog.Description>{message('confirm.' + operation + '.message')}</Dialog.Description>
    <div class="mt-4 flex justify-end gap-2">
      <Button variant="outline" onclick={onCancel}>{message('confirm.decline')}</Button>
      <Button onclick={onAccept}>{message('confirm.accept')}</Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
