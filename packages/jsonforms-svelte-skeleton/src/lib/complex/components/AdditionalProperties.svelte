<script lang="ts">
  import ConfirmationDialog from './ConfirmationDialog.svelte';
  import SectionIndicators from '../../layouts/SectionIndicators.svelte';
  import TupleAction from '../../components/TupleAction.svelte';
  import {
    type AdditionalPropertiesProps,
    useEditableAdditionalProperties,
    AdditionalPropertyHeading,
    AdditionalPropertyRows,
    PropertyNameForm,
    PropertyRenameForm,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import {
    PencilIcon as PenOutline,
    PlusIcon as PlusOutline,
    Trash2Icon as TrashBinOutline,
  } from '@lucide/svelte';

  import { additionalPropertiesDefaultTranslations } from '../../i18n/additionalPropertiesTranslations';
  import {
    getPortalRootNodeGetter,
    getPortalTarget,
    setIsDynamicProperty,
    useControlAppliedOptions,
  } from '../../util';

  import CollectionPager from '../../components/CollectionPager.svelte';
  import ValidationIcon from '../../controls/components/ValidationIcon.svelte';

  const props: AdditionalPropertiesProps = $props();
  const control = $derived(props.input.control);
  const embedded = $derived(props.embedded ?? false);
  const getRootNode = getPortalRootNodeGetter();
  const model = useEditableAdditionalProperties(
    props,
    useControlAppliedOptions,
    setIsDynamicProperty,
    additionalPropertiesDefaultTranslations,
    true,
  );
  const { resolvedOptions, rejected, editor, rename, renameAction, removeAction } = model;
  const { page, deletion } = editor;
  const { closeRenameDialog, nameErrors } = rename;
</script>

{#if control.visible}
  <AdditionalPropertyHeading {control} {rejected} {SectionIndicators} />
  <section
    data-additional-properties
    data-embedded={embedded}
    class={`mt-1 mb-1 min-w-full ${embedded ? '' : 'card preset-outlined-surface-200-800'}`}
    {...resolvedOptions.skeletonProps('card')}
  >
    <div class="ps-4 pe-4 pt-2 pb-2">
      <div class="flex flex-col gap-2 md:flex-row md:gap-4">
        {#if editor.additionalPropertiesTitle}
          <div class="md:flex md:h-10 md:items-center md:pt-6">
            <span class="text-surface-950-50 text-sm">{editor.additionalPropertiesTitle}</span>
          </div>
        {/if}
        <div class="min-w-0 flex-1">
          <div class="relative">
            <div class="pe-12">
              <PropertyNameForm {control} {editor} />
            </div>
            <TupleAction
              kind="add"
              {...model.addAction}
              buttonClass="btn btn-sm preset-filled absolute end-0 top-6 shrink-0 p-0"
            >
              {#snippet icon()}<PlusOutline class="h-4 w-4" />{/snippet}
            </TupleAction>
          </div>
        </div>
      </div>
    </div>

    <div class="property-rows flex flex-col gap-2 ps-4 pe-4 pb-4">
      <AdditionalPropertyRows
        {control}
        {editor}
        {nameErrors}
        invalidClass="property-name-invalid text-error-600 dark:text-error-400 relative"
        padEmptyName
      >
        {#snippet errorIcon(errors)}<ValidationIcon {errors} showCount={false} />{/snippet}
        {#snippet actions(name)}
          <div class="absolute end-1 top-0 z-20 flex items-center">
            <TupleAction
              kind="add"
              {...renameAction(name)}
              buttonClass="hover:preset-tonal rounded-base text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 inline-flex size-7 items-center justify-center"
            >
              {#snippet icon()}<PenOutline class="h-4 w-4" />{/snippet}
            </TupleAction>
            <TupleAction
              kind="delete"
              {...removeAction(name)}
              buttonClass="hover:preset-tonal rounded-base text-surface-500 dark:text-surface-400 hover:text-error-500 dark:hover:text-error-400 inline-flex size-7 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            >
              {#snippet icon()}<TrashBinOutline class="h-4 w-4" />{/snippet}
            </TupleAction>
          </div>
        {/snippet}
      </AdditionalPropertyRows>
    </div>
    <CollectionPager {page} />
  </section>
{/if}

<Dialog
  open={rename.name !== null}
  {getRootNode}
  onOpenChange={(event) => !event.open && closeRenameDialog()}
>
  <Portal target={getPortalTarget()}>
    <Dialog.Backdrop class="bg-surface-950/40 fixed inset-0" />
    <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Content class="card preset-filled-surface-50-950 w-full max-w-sm p-6">
        <PropertyRenameForm
          {model}
          controlId={control.id}
          Title={Dialog.Title}
          Description={Dialog.Description}
          errorClass="text-error-500 mt-2 text-sm"
        >
          {#snippet field()}
            <label for={rename.inputAttributes.id} class="mb-2 block text-sm font-medium">
              {editor.translations.renamePropertyNameLabel}
            </label>
            <input {...rename.inputAttributes} class="input" bind:value={rename.value} />
          {/snippet}
          {#snippet actions()}
            <button type="button" class="btn preset-outlined" onclick={closeRenameDialog}>
              {editor.translations.renameDialogDecline}
            </button>
            <button
              type="submit"
              class="btn preset-filled-primary-500"
              disabled={rename.submitDisabled}
            >
              {editor.translations.renameDialogAccept}
            </button>
          {/snippet}
        </PropertyRenameForm>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>

{#if deletion.pending && control.visible}
  <ConfirmationDialog operation="delete" onAccept={deletion.accept} onCancel={deletion.cancel} />
{/if}

<style>
  :where(.property-rows) :global([data-additional-property-row]) {
    min-width: 0;
  }
  :where(.property-rows) :global([data-additional-property-row] label[for$='-input']) {
    max-width: calc(100% - 5rem);
  }
  :where(.property-rows)
    :global([data-additional-property-row] label[for$='-input'] > span:first-child) {
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  :where(.property-rows) :global(.property-name-invalid label) {
    color: var(--color-error-600, #dc2626) !important;
  }
</style>
