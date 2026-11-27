<script lang="ts">
  import ConfirmationDialog from './ConfirmationDialog.svelte';
  import SectionIndicators from '../../layouts/SectionIndicators.svelte';
  import {
    type AdditionalPropertiesProps,
    useEditableAdditionalProperties,
    AdditionalPropertyHeading,
    AdditionalPropertyRows,
    PropertyNameForm,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    Button,
    Card,
    Input as FlowbiteInput,
    Modal,
    P,
    Span,
    ToolbarButton,
    Tooltip,
  } from 'flowbite-svelte';
  import { PenOutline, PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';

  import { additionalPropertiesDefaultTranslations } from '../../i18n/additionalPropertiesTranslations';
  import { setIsDynamicProperty, useControlAppliedOptions } from '../../util';

  import CollectionPager from '../../components/CollectionPager.svelte';
  import ValidationIcon from '../../controls/components/ValidationIcon.svelte';

  const props: AdditionalPropertiesProps = $props();
  const control = $derived(props.input.control);
  const embedded = $derived(props.embedded ?? false);
  const { resolvedOptions, rejected, editor, rename, openRenameDialog, restoreRenameFocus } =
    useEditableAdditionalProperties(
      props,
      useControlAppliedOptions,
      setIsDynamicProperty,
      additionalPropertiesDefaultTranslations,
    );
  const { page, message, deletion, propertyActionLabel, addProperty, removeProperty } = editor;
  const { canRename, closeRenameDialog, commitRename, nameErrors } = rename;
</script>

{#if control.visible}
  <AdditionalPropertyHeading {control} {rejected} {SectionIndicators} />
  <Card
    data-additional-properties
    data-embedded={embedded}
    class={`mt-1 mb-1 min-w-full ${embedded ? 'border-0 bg-transparent p-0 shadow-none' : ''}`}
    {...resolvedOptions.flowbiteProps('Card')}
  >
    <div class="ps-4 pe-4 pt-2 pb-2">
      <div class="flex flex-col gap-2 md:flex-row md:items-baseline">
        {#if editor.additionalPropertiesTitle}
          <P class="text-sm">{editor.additionalPropertiesTitle}</P>
        {/if}
        <div class="flex w-full items-end gap-2 md:flex-1">
          <div class="min-w-0 flex-1">
            <PropertyNameForm {control} {editor} />
          </div>
          <Button
            color="primary"
            size="sm"
            disabled={editor.addPropertyDisabled}
            onclick={addProperty}
            aria-label={editor.translations.addAriaLabel}
          >
            <PlusOutline class="h-4 w-4" />
          </Button>
          <Tooltip>
            <Span>{editor.translations.addTooltip}</Span>
          </Tooltip>
        </div>
      </div>
    </div>

    <div class="property-rows flex flex-col gap-2 ps-4 pe-4 pb-4">
      <AdditionalPropertyRows
        {control}
        {editor}
        {nameErrors}
        invalidClass="property-name-invalid text-error-600 dark:text-error-400 relative"
      >
        {#snippet errorIcon(errors)}<ValidationIcon {errors} showCount={false} />{/snippet}
        {#snippet actions(name)}
          <div class="absolute end-0 top-0 z-20 flex items-center">
            <ToolbarButton
              size="xs"
              onclick={(event: MouseEvent & { currentTarget: HTMLButtonElement }) =>
                openRenameDialog(name, event.currentTarget)}
              disabled={!canRename(name)}
              aria-label={propertyActionLabel('rename', name)}
              class="hover:text-primary-600 dark:hover:text-primary-400 h-4 w-4 p-0 text-gray-400"
            >
              <PenOutline class="h-4 w-4" />
            </ToolbarButton>
            <Tooltip>
              <Span>{editor.translations.renameTooltip}</Span>
            </Tooltip>
            <ToolbarButton
              size="xs"
              disabled={editor.removePropertyDisabled ||
                (resolvedOptions.value.restrict && control.schema.required?.includes(name))}
              onclick={() => removeProperty(name)}
              aria-label={propertyActionLabel('remove', name)}
              class="h-4 w-4 p-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <TrashBinOutline class="h-4 w-4" />
            </ToolbarButton>
            <Tooltip>
              <Span
                >{resolvedOptions.value.restrict && control.schema.required?.includes(name)
                  ? message('additionalProperties.deleteBlocked')
                  : editor.translations.removeTooltip}</Span
              >
            </Tooltip>
          </div>
        {/snippet}
      </AdditionalPropertyRows>
    </div>
    <CollectionPager {page} />
  </Card>
{/if}

{#if rename.name !== null}
  <Modal
    open
    title={editor.translations.renameDialogTitle}
    size="sm"
    autoclose={false}
    oncancel={closeRenameDialog}
    onoutroend={restoreRenameFocus}
  >
    <form onsubmit={commitRename}>
      <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {editor.translations.renameDialogDescription}
      </p>
      <label for={rename.inputAttributes.id} class="mb-2 block text-sm font-medium">
        {editor.translations.renamePropertyNameLabel}
      </label>
      <FlowbiteInput {...rename.inputAttributes} bind:value={rename.value} />
      {#if rename.error}
        <P
          id={control.id + '-rename-error'}
          class="mt-2 text-sm text-red-600 dark:text-red-400"
          role="alert">{rename.error}</P
        >
      {/if}
      <div class="mt-4 flex justify-end gap-2">
        <Button type="button" color="alternative" onclick={closeRenameDialog}>
          {editor.translations.renameDialogDecline}
        </Button>
        <Button type="submit" color="primary" disabled={rename.submitDisabled}>
          {editor.translations.renameDialogAccept}
        </Button>
      </div>
    </form>
  </Modal>
{/if}

{#if deletion.pending && control.visible}
  <ConfirmationDialog operation="delete" onAccept={deletion.accept} onCancel={deletion.cancel} />
{/if}

<style>
  :where(.property-rows) :global([data-additional-property-row]) {
    min-width: 0;
  }
  :where(.property-rows) :global([data-additional-property-row] label[for$='-input']) {
    max-width: calc(100% - 3rem);
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  :where(.property-rows) :global([data-additional-property-row] label[for$='-input'] + div) {
    padding-top: 0;
  }
  :where(.property-rows) :global(.property-name-invalid label) {
    color: var(--color-error-600, #dc2626) !important;
  }
</style>
