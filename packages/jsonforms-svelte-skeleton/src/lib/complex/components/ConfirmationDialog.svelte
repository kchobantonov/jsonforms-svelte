<script lang="ts">
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import { getPortalRootNodeGetter, getPortalTarget } from '../../util';
  const getRootNode = getPortalRootNodeGetter();
  import { useRendererMessages, type ConfirmationOperation } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let {
    operation,
    onAccept,
    onCancel,
  }: { operation: ConfirmationOperation; onAccept: () => void; onCancel: () => void } = $props();
</script>

<Dialog
  open
  {getRootNode}
  onOpenChange={(details) => {
    if (!details.open) onCancel();
  }}
>
  <Portal target={getPortalTarget()}>
    <Dialog.Backdrop class="bg-surface-950/40 fixed inset-0" />
    <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Content class="card preset-filled-surface-50-950 w-full max-w-md p-6">
        <Dialog.Title class="mb-3 text-lg font-semibold"
          >{message('confirm.' + operation + '.title')}</Dialog.Title
        >
        <Dialog.Description>{message('confirm.' + operation + '.message')}</Dialog.Description>
        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="btn preset-outlined" onclick={onCancel}
            >{message('confirm.decline')}</button
          >
          <button type="button" class="btn preset-filled-primary-500" onclick={onAccept}
            >{message('confirm.accept')}</button
          >
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
