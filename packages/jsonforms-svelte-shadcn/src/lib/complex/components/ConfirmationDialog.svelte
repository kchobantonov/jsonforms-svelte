<script lang="ts">
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { getPortalTarget } from '../../util';
  import LocalizedDialogContent from '../../components/LocalizedDialogContent.svelte';
  import {
    useConfirmationLabels,
    type ConfirmationDialogProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const props: ConfirmationDialogProps = $props();
  const labels = useConfirmationLabels(props);
</script>

<Dialog.Root
  open
  onOpenChange={(open) => {
    if (!open) props.onCancel();
  }}
>
  <LocalizedDialogContent
    portalProps={{ to: getPortalTarget() }}
    class="max-w-md"
    closeLabel={labels.close}
  >
    <Dialog.Title>{labels.title}</Dialog.Title>
    <Dialog.Description>{labels.description}</Dialog.Description>
    <div class="mt-4 flex justify-end gap-2">
      <Button variant="outline" onclick={props.onCancel}>{labels.decline}</Button>
      <Button onclick={props.onAccept}>{labels.accept}</Button>
    </div>
  </LocalizedDialogContent>
</Dialog.Root>
