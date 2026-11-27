<script lang="ts">
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import { getPortalRootNodeGetter, getPortalTarget } from '../../util';
  const getRootNode = getPortalRootNodeGetter();
  import {
    useConfirmationLabels,
    type ConfirmationDialogProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const props: ConfirmationDialogProps = $props();
  const labels = useConfirmationLabels(props);
</script>

<svelte:window
  onkeydowncapture={(event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    props.onCancel();
  }}
/>

<Dialog
  open
  {getRootNode}
  onOpenChange={(details) => {
    if (!details.open) props.onCancel();
  }}
>
  <Portal target={getPortalTarget()}>
    <Dialog.Backdrop class="bg-surface-950/40 fixed inset-0" />
    <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Content class="card preset-filled-surface-50-950 w-full max-w-md p-6">
        <Dialog.Title class="mb-3 text-lg font-semibold">{labels.title}</Dialog.Title>
        <Dialog.Description>{labels.description}</Dialog.Description>
        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="btn preset-outlined" onclick={props.onCancel}
            >{labels.decline}</button
          >
          <button type="button" class="btn preset-filled-primary-500" onclick={props.onAccept}
            >{labels.accept}</button
          >
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
