<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsArrayControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    composePaths,
    createDefaultValue,
    findUISchema,
    getControlPath,
    type ControlElement,
  } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import { Accordion, Avatar, Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import {
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
    CircleAlertIcon as ExclamationCircleOutline,
    PlusIcon as PlusOutline,
    Trash2Icon as TrashBinOutline,
  } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import {
    getPortalRootNodeGetter,
    getPortalTarget,
    useSkeletonArrayControl,
    useNested,
  } from '../util';

  const props: RendererProps<ControlElement> = $props();

  const binding = useSkeletonArrayControl(useJsonFormsArrayControl(props));
  const getRootNode = getPortalRootNodeGetter();

  // Accordion value — first panel open by default unless initCollapsed is set.
  // skeletonProps('Accordion') can override `multiple`, `collapsible`, etc.
  // via uischema options, e.g.:
  //   "options": { "Accordion": { "multiple": true, "collapsible": true } }
  let accordionValue = $state<string[]>(binding.appliedOptions.initCollapsed ? [] : ['item-0']);
  let suggestToDelete = $state<number | null>(null);

  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);
  const hideAvatar = $derived(!!binding.appliedOptions.hideAvatar);

  useNested('array');

  const addDisabled = $derived(
    !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema?.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );

  const foundUISchema = $derived(
    findUISchema(
      binding.control.uischemas,
      binding.control.schema,
      binding.control.uischema.scope,
      binding.control.path,
      undefined,
      binding.control.uischema,
      binding.control.rootSchema,
    ),
  );

  // Resolved Accordion props — skeletonProps can override defaults.
  // `multiple` defaults to false (single open panel).
  // `collapsible` defaults to true (panels can be toggled closed).
  const accordionProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Accordion');
    const multiple = skeletonProps.multiple ?? false;
    return {
      collapsible: true,
      ...skeletonProps,
      multiple,
      value: accordionValue,
      onValueChange: (details: { value: string[] }) => {
        // In single mode, keep only the last selected item so the previously
        // open panel closes automatically. In multiple mode keep all.
        accordionValue = multiple ? details.value : details.value.slice(-1);
        // Allow a consumer-provided onValueChange to also fire.
        skeletonProps.onValueChange?.(details);
      },
    };
  });

  function addButtonClick() {
    binding.addItem(
      binding.control.path,
      createDefaultValue(binding.control.schema, binding.control.rootSchema),
    )();
    if (!binding.appliedOptions.collapseNewItems && binding.control.data?.length) {
      // In single mode open only the new item; in multiple mode add it to the set.
      const newKey = `item-${dataLength}`;
      accordionValue = accordionProps.multiple ? [...accordionValue, newKey] : [newKey];
    }
  }

  function moveUpClick(event: Event, toMove: number) {
    event.stopPropagation();
    binding.moveUp?.(binding.control.path, toMove)();
  }

  function moveDownClick(event: Event, toMove: number) {
    event.stopPropagation();
    binding.moveDown?.(binding.control.path, toMove)();
  }

  function removeItemsClick(toDelete: number[] | null) {
    if (toDelete !== null) {
      binding.removeItems?.(binding.control.path, toDelete)();
    }
  }

  function childErrors(index: number): ErrorObject[] {
    return binding.control.childErrors.filter((e) => {
      const errorDataPath = getControlPath(e);
      return errorDataPath.startsWith(composePaths(binding.control.path, `${index}`));
    });
  }

  function childLabelForIndex(index: number): string {
    return binding.childLabelForIndex?.(index) || `Item ${index + 1}`;
  }

  function openDeleteDialog(index: number) {
    suggestToDelete = index;
  }

  function closeDeleteDialog() {
    suggestToDelete = null;
  }

  function confirmDelete() {
    if (suggestToDelete !== null) {
      removeItemsClick([suggestToDelete]);
      closeDeleteDialog();
    }
  }

  const cardProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('card');
    return {
      ...skeletonProps,
      class: twMerge(
        'card preset-outlined-surface-200-800 mt-1 mb-1 min-w-full',
        binding.styles.arrayList.root,
        skeletonProps.class,
      ),
    };
  });

  const dialogProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Dialog');
    return {
      ...skeletonProps,
      getRootNode,
      open: suggestToDelete !== null,
      onOpenChange: (e: { open: boolean }) => {
        if (!e.open) closeDeleteDialog();
        skeletonProps.onOpenChange?.(e);
      },
    };
  });
</script>

{#if binding.control.visible}
  <section {...cardProps}>
    <!-- Toolbar -->
    <div
      class={twMerge(
        'flex items-center justify-between px-4 py-2',
        binding.styles.arrayList.toolbar,
      )}
    >
      <div class={twMerge('flex items-center gap-2', binding.styles.arrayList.title)}>
        <h3 class={twMerge('text-lg font-semibold', binding.styles.arrayList.label)}>
          {binding.computedLabel}
        </h3>
        {#if binding.control.childErrors.length > 0 && !binding.appliedOptions.hideArraySummaryValidation}
          <ValidationIcon
            errors={binding.control.childErrors}
            class={binding.styles.arrayList.validationIcon}
          />
        {/if}
      </div>

      <button
        type="button"
        class={twMerge('btn btn-sm preset-filled', binding.styles.arrayList?.addButton)}
        disabled={addDisabled}
        onclick={addButtonClick}
        aria-label={binding.control.translations?.addAriaLabel || 'Add item'}
        title={binding.control.translations?.addTooltip || 'Add item'}
      >
        <PlusOutline class="h-4 w-4" />
      </button>
    </div>

    <!-- List -->
    <div class="px-4 pb-4">
      {#if dataLength > 0}
        <Accordion {...accordionProps}>
          {#each binding.control.data as element, index (composePaths(binding.control.path, `${index}`))}
            <Accordion.Item value={`item-${index}`}>
              <Accordion.ItemTrigger
                class="flex w-full items-center justify-between border-b text-left last:border-b-0"
                {...binding.skeletonProps('Accordion.ItemTrigger')}
              >
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  {#if !hideAvatar}
                    <div class="relative shrink-0">
                      <ValidationBadge border errors={childErrors(index)}>
                        <Avatar class="preset-filled-primary-500 size-10 rounded-full">
                          <Avatar.Fallback>{index + 1}</Avatar.Fallback>
                        </Avatar>
                      </ValidationBadge>
                    </div>
                  {/if}
                  <h3 class="truncate text-sm font-medium">
                    {childLabelForIndex(index)}
                  </h3>
                </div>

                <div class="mr-2 flex shrink-0 items-center gap-1">
                  {#if binding.appliedOptions.showSortButtons}
                    <button
                      type="button"
                      class="btn btn-sm preset-outlined"
                      disabled={index <= 0 || !binding.control.enabled}
                      aria-label={binding.control.translations?.upAriaLabel || 'Move up'}
                      title={binding.control.translations?.up || 'Move up'}
                      onclick={(e: Event) => moveUpClick(e, index)}
                    >
                      <ChevronUpOutline class="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      class="btn btn-sm preset-outlined"
                      disabled={index >= dataLength - 1 || !binding.control.enabled}
                      aria-label={binding.control.translations?.downAriaLabel || 'Move down'}
                      title={binding.control.translations?.down || 'Move down'}
                      onclick={(e: Event) => moveDownClick(e, index)}
                    >
                      <ChevronDownOutline class="h-3 w-3" />
                    </button>
                  {/if}

                  <button
                    type="button"
                    class="btn btn-sm preset-tonal hover:preset-filled-error-500"
                    disabled={!binding.control.enabled ||
                      (binding.appliedOptions.restrict &&
                        binding.control.arraySchema?.minItems !== undefined &&
                        dataLength <= binding.control.arraySchema.minItems)}
                    aria-label={binding.control.translations?.removeAriaLabel || 'Remove item'}
                    title={binding.control.translations?.removeTooltip || 'Remove item'}
                    onclick={(e: Event) => {
                      e.stopPropagation();
                      openDeleteDialog(index);
                    }}
                  >
                    <TrashBinOutline class="h-3 w-3" />
                  </button>
                </div>
                <Accordion.ItemIndicator class="group shrink-0">
                  <ChevronDownOutline class="size-4 group-data-[state=open]:hidden" />
                  <ChevronUpOutline class="hidden size-4 group-data-[state=open]:block" />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>

              <Accordion.ItemContent
                class="p-4"
                {...binding.skeletonProps('Accordion.ItemContent')}
              >
                <DispatchRenderer
                  schema={binding.control.schema}
                  uischema={foundUISchema}
                  path={composePaths(binding.control.path, `${index}`)}
                  enabled={binding.control.enabled}
                  renderers={binding.control.renderers}
                  cells={binding.control.cells}
                />
              </Accordion.ItemContent>
            </Accordion.Item>
          {/each}
        </Accordion>
      {:else}
        <p class={twMerge('text-center', binding.styles.arrayList?.noData)}>
          {binding.control.translations?.noDataMessage || 'No data'}
        </p>
      {/if}
    </div>
  </section>

  <Dialog {...dialogProps}>
    <Portal target={getPortalTarget()}>
      <Dialog.Backdrop class="bg-surface-50-950/50 fixed inset-0" />
      <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Content class="card preset-filled-surface-50-950 w-full max-w-sm p-6">
          <div class="text-center">
            <ExclamationCircleOutline class="text-surface-400-600 mx-auto mb-4 h-12 w-12" />
            <Dialog.Title class="text-lg font-semibold">
              {binding.control.translations?.deleteDialogTitle || 'Delete item?'}
            </Dialog.Title>
            <p class="mb-5 text-center text-sm">
              {binding.control.translations?.deleteDialogMessage ||
                'Are you sure you want to delete this item?'}
            </p>
            <div class="flex justify-center gap-4">
              <Dialog.CloseTrigger class="btn preset-outlined">
                {binding.control.translations?.deleteDialogDecline || 'Cancel'}
              </Dialog.CloseTrigger>
              <button type="button" class="btn preset-filled-error-500" onclick={confirmDelete}>
                {binding.control.translations?.deleteDialogAccept || 'Delete'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
{/if}
