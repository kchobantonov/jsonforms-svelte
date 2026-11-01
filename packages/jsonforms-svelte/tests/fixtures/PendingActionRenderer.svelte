<script lang="ts">
  import { onMount } from 'svelte';
  import type { UISchemaElement } from '@jsonforms/core';
  import {
    registerDetailDialogChange,
    usePendingControlAction,
  } from '../../src/lib/detailDialog.svelte';
  import { useOwnedErrors } from '../../src/lib/ownedErrors.svelte';
  import { useCollectionAction } from '../../src/lib/collectionAction.svelte';
  import { useDeletionConfirmation } from '../../src/lib/deletionConfirmation.svelte';
  import type { OwnedErrorStore } from '../../src/lib/ownedErrors';

  let { uischema }: { uischema: UISchemaElement } = $props();
  const prepareAction = usePendingControlAction();
  const store = useOwnedErrors();
  let blocked = $state(false);
  let collectionPath = $state('items');
  let deletionData = $state.raw(['existing']);
  let pendingDeletionEdit: string[] | undefined;
  let onFlush: (() => void) | undefined;
  registerDetailDialogChange({ isBlocked: () => blocked });
  registerDetailDialogChange({
    flush: () => {
      if (pendingDeletionEdit) deletionData = pendingDeletionEdit;
      pendingDeletionEdit = undefined;
      onFlush?.();
    },
  });
  const collectionAction = useCollectionAction(
    () => ({ path: collectionPath, enabled: true, visible: true }),
    () => true,
  );
  const deletion = useDeletionConfirmation(
    () => ({
      path: 'items',
      data: deletionData,
      enabled: true,
      visible: true,
      options: { confirmation: { delete: 'always' } },
    }),
    'arrayLayout',
    () => true,
  );
  onMount(() => {
    uischema.options?.capture?.(store as OwnedErrorStore);
    uischema.options?.captureBlocked?.((value: boolean) => (blocked = value));
    uischema.options?.captureCollectionPath?.((value: string) => (collectionPath = value));
    uischema.options?.captureDeletionData?.((value: string[]) => (deletionData = value));
    uischema.options?.capturePendingDeletionEdit?.(
      (value: string[]) => (pendingDeletionEdit = value),
    );
    uischema.options?.captureOnFlush?.((callback: () => void) => (onFlush = callback));
  });

  async function act() {
    if (await prepareAction()) uischema.options?.onaction?.();
  }

  async function requestDelete() {
    await deletion.request(
      () => [deletionData],
      () => uischema.options?.ondelete?.(),
      () => true,
    );
    uischema.options?.onDeleteRequestSettled?.();
  }
</script>

<button type="button" onclick={act}>Act</button>
<button
  type="button"
  onclick={() =>
    collectionAction(
      () => true,
      () => uischema.options?.oncollection?.(),
    )}>Collection</button
>
<button type="button" onclick={requestDelete}>Delete</button>
{#if deletion.pending}
  <span data-discarded>{JSON.stringify(deletion.pending.discarded)}</span>
  <button type="button" onclick={deletion.accept}>Yes</button>
{/if}
