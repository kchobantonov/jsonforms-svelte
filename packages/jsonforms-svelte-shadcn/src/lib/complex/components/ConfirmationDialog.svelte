<script lang="ts">
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { getPortalTarget } from '../../util';
  import LocalizedDialogContent from '../../components/LocalizedDialogContent.svelte';
  import { useRendererMessages, type ConfirmationOperation } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let {
    operation,
    onAccept,
    onCancel,
    title,
    description,
    acceptLabel,
  }: {
    operation: ConfirmationOperation;
    onAccept: () => void;
    onCancel: () => void;
    title?: string;
    description?: string;
    acceptLabel?: string;
  } = $props();
</script>

<Dialog.Root
  open
  onOpenChange={(open) => {
    if (!open) onCancel();
  }}
>
  <LocalizedDialogContent
    portalProps={{ to: getPortalTarget() }}
    class="max-w-md"
    closeLabel={message('dialog.close')}
  >
    <Dialog.Title>{title ?? message('confirm.' + operation + '.title')}</Dialog.Title>
    <Dialog.Description
      >{description ?? message('confirm.' + operation + '.message')}</Dialog.Description
    >
    <div class="mt-4 flex justify-end gap-2">
      <Button variant="outline" onclick={onCancel}>{message('confirm.decline')}</Button>
      <Button onclick={onAccept}>{acceptLabel ?? message('confirm.accept')}</Button>
    </div>
  </LocalizedDialogContent>
</Dialog.Root>
