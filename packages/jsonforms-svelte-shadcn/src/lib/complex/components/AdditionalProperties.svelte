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
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Card from '@jsonforms-svelte-shadcn-ui/card';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { Input as InputControl } from '@jsonforms-svelte-shadcn-ui/input';
  import { Label } from '@jsonforms-svelte-shadcn-ui/label';
  import {
    PencilIcon as PenOutline,
    PlusIcon as PlusOutline,
    Trash2Icon as TrashBinOutline,
  } from '$lib/components/icons';

  import { additionalPropertiesDefaultTranslations } from '../../i18n/additionalPropertiesTranslations';
  import { getPortalTarget, setIsDynamicProperty, useControlAppliedOptions } from '../../util';

  import CollectionPager from '../../components/CollectionPager.svelte';
  import ValidationIcon from '../../controls/components/ValidationIcon.svelte';
  import LocalizedDialogContent from '../../components/LocalizedDialogContent.svelte';

  const props: AdditionalPropertiesProps = $props();
  const control = $derived(props.input.control);
  const embedded = $derived(props.embedded ?? false);
  const model = useEditableAdditionalProperties(
    props,
    useControlAppliedOptions,
    setIsDynamicProperty,
    additionalPropertiesDefaultTranslations,
  );
  const { resolvedOptions, rejected, editor, rename, renameAction, removeAction, takeTrigger } =
    model;
  const { page, message, deletion } = editor;
  const { closeRenameDialog, nameErrors } = rename;
</script>

{#if control.visible}
  <AdditionalPropertyHeading {control} {rejected} {SectionIndicators} />
  <Card.Root
    data-additional-properties
    data-embedded={embedded}
    class={`my-1 min-w-full ${embedded ? 'gap-0 border-0 bg-transparent py-0 shadow-none ring-0' : ''}`}
    {...resolvedOptions.shadcnProps('card')}
  >
    <div class="ps-4 pe-4 pt-2 pb-2">
      <div class="flex flex-col gap-2 md:flex-row md:gap-4">
        {#if editor.additionalPropertiesTitle}
          <div class="md:flex md:h-10 md:items-center md:pt-6">
            <span class="text-foreground text-sm">{editor.additionalPropertiesTitle}</span>
          </div>
        {/if}
        <div class="min-w-0 flex-1">
          <div class="property-name-row">
            <div class="property-name-control">
              <PropertyNameForm {control} {editor} />
            </div>
            <div class="col-start-2 row-start-2 self-center justify-self-end">
              <TupleAction kind="add" {...model.addAction}>
                {#snippet icon()}<PlusOutline class="h-4 w-4" />{/snippet}
              </TupleAction>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="property-rows flex flex-col gap-2 ps-4 pe-4 pb-4">
      <AdditionalPropertyRows
        {control}
        {editor}
        {nameErrors}
        invalidClass="property-name-invalid text-destructive relative"
      >
        {#snippet errorIcon(errors)}<ValidationIcon {errors} showCount={false} />{/snippet}
        {#snippet actions(name)}
          <div class="absolute end-1 top-0 z-20 flex items-center gap-1">
            <TupleAction
              kind="add"
              {...renameAction(name)}
              buttonVariant="ghost"
              buttonSize="icon-xs"
              buttonClass="text-muted-foreground"
            >
              {#snippet icon()}<PenOutline class="h-4 w-4" />{/snippet}
            </TupleAction>
            <TupleAction
              kind="delete"
              {...removeAction(name)}
              buttonVariant="destructive"
              buttonSize="icon-xs"
            >
              {#snippet icon()}<TrashBinOutline class="h-4 w-4" />{/snippet}
            </TupleAction>
          </div>
        {/snippet}
      </AdditionalPropertyRows>
    </div>
    <CollectionPager {page} />
  </Card.Root>
{/if}

<Dialog.Root open={rename.name !== null} onOpenChange={(open) => !open && closeRenameDialog()}>
  <LocalizedDialogContent
    portalProps={{ to: getPortalTarget() }}
    class="max-w-sm"
    closeLabel={message('dialog.close')}
    onCloseAutoFocus={(event) => {
      event.preventDefault();
      const trigger = takeTrigger();
      if (trigger?.isConnected && !trigger.matches(':disabled'))
        trigger.focus({ preventScroll: true });
    }}
  >
    <PropertyRenameForm
      {model}
      controlId={control.id}
      Title={Dialog.Title}
      Description={Dialog.Description}
      errorClass="text-destructive mt-2 text-sm"
    >
      {#snippet field()}
        <Label for={rename.inputAttributes.id} class="mb-2 block">
          {editor.translations.renamePropertyNameLabel}
        </Label>
        <InputControl {...rename.inputAttributes} bind:value={rename.value} />
      {/snippet}
      {#snippet actions()}
        <Button type="button" variant="outline" onclick={closeRenameDialog}>
          {editor.translations.renameDialogDecline}
        </Button>
        <Button type="submit" disabled={rename.submitDisabled}>
          {editor.translations.renameDialogAccept}
        </Button>
      {/snippet}
    </PropertyRenameForm>
  </LocalizedDialogContent>
</Dialog.Root>

{#if deletion.pending && control.visible}
  <ConfirmationDialog operation="delete" onAccept={deletion.accept} onCancel={deletion.cancel} />
{/if}

<style>
  :global(
    [data-additional-property-row]
      > [data-slot='field']
      > div:first-child
      > [data-slot='field-label']
  ) {
    max-width: calc(100% - 5rem);
    overflow-wrap: anywhere;
  }
  :global(
    [data-additional-property-row]
      > [data-slot='field']
      > div:first-child
      > [data-slot='field-label']
      > span:first-child
  ) {
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  :where(.property-rows) :global(.property-name-invalid label) {
    color: var(--color-destructive, #dc2626) !important;
  }
  .property-name-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 1rem;
  }

  /* Share the input row with the action, independently of label/help text height. */
  .property-name-control,
  .property-name-control :global(> div:has(> [data-slot='field'])),
  .property-name-control :global(> [data-slot='field']) {
    display: contents;
  }

  .property-name-control :global(> div > [data-slot='field']) {
    display: contents;
  }
  .property-name-control :global(> div > div:has(> [data-slot='field'])),
  .property-name-control :global(> div > div > [data-slot='field']) {
    display: contents;
  }

  .property-name-control :global(> *),
  .property-name-control :global([data-slot='field'] > *) {
    grid-column: 1;
    grid-row: 2;
    margin-block: 0;
  }

  .property-name-control :global([data-slot='field'] > label) {
    grid-row: 1;
    margin-bottom: 0.5rem;
  }

  .property-name-control :global([data-slot='field'] > p) {
    grid-row: 3;
    margin-top: 0.5rem;
  }
</style>
