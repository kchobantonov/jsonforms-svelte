<script lang="ts">
  import {
    CollectionItem,
    dataPathSegments,
    errorTargetSegments,
    showArraySortButtons,
  } from '@chobantonov/jsonforms-svelte';
  import { useCollectionAction } from '@chobantonov/jsonforms-svelte';
  import {
    findDetailUISchema,
    unconstrainedArrayItem,
    resolveArrayItemCollapsed,
    useArrayPanelState,
    useDeletionConfirmation,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import type { ComponentProps } from 'svelte';
  import type { VendorProps } from '../util';
  import {
    DispatchRenderer,
    useJsonForms,
    useCollectionPagination,
    collectionErrorPositions,
    scopeDataSegments,
    useJsonFormsArrayControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    composePaths,
    createDefaultValue,
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
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import TupleAction from '../components/TupleAction.svelte';
  import {
    getPortalRootNodeGetter,
    getPortalTarget,
    useSkeletonArrayControl,
    useNested,
  } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  const jsonforms = useJsonForms();

  const props: RendererProps<ControlElement> = $props();
  const controlPathSegments = $derived([
    ...(props.pathSegments ?? dataPathSegments(props.path)),
    ...scopeDataSegments(props.uischema.scope),
  ]);

  const binding = useSkeletonArrayControl(useJsonFormsArrayControl(props));
  const getRootNode = getPortalRootNodeGetter();

  // The outer panel and its individual items have separate expansion state.
  // skeletonProps('Accordion') can override `multiple`, `collapsible`, etc.
  // via uischema options, e.g.:
  //   "options": { "Accordion": { "multiple": true, "collapsible": true } }
  let accordionValue = $state<string[]>(
    resolveArrayItemCollapsed(binding.control.uischema.options, binding.control.config)
      ? []
      : ['item-0'],
  );
  const panel = useArrayPanelState(
    () => binding.control.uischema.options,
    () => binding.control.config,
  );
  const panelContentId = $props.id();
  const message = useRendererMessages();

  const showSortButtons = $derived(showArraySortButtons(binding.appliedOptions));
  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);
  const keys = $derived(Array.from({ length: dataLength }, (_, index) => index));
  const page = useCollectionPagination({
    get keys() {
      return keys;
    },
    get local() {
      return binding.control.uischema.options?.pagination;
    },
    get config() {
      return binding.control.config;
    },
    get errors() {
      return collectionErrorPositions(jsonforms.core, controlPathSegments, keys);
    },
    kind: 'array',
    defaultEnabled: false,
  });

  const hideAvatar = $derived(!!binding.appliedOptions.hideAvatar);
  const headerErrors = $derived.by(() => {
    const errors = binding.control.childErrors;
    if (!binding.appliedOptions.hideArraySummaryValidation) return errors;
    const path = controlPathSegments;
    return errors.filter((error) => {
      const target = errorTargetSegments(error);
      return target.length === path.length && path.every((part, index) => target[index] === part);
    });
  });

  useNested('array');

  const addDisabled = $derived(
    binding.appliedOptions.disableAdd === true ||
      !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema?.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );

  const foundUISchema = $derived(
    findDetailUISchema(
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
    const skeletonProps = binding.skeletonProps('Accordion') as VendorProps<
      Pick<ComponentProps<typeof Accordion>, 'onValueChange' | 'multiple'>
    >;
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

  const runCollectionAction = useCollectionAction(() => binding.control, page.prepare);

  function addButtonClick() {
    void runCollectionAction(
      () => !addDisabled,
      () => {
        const newIndex = dataLength;
        binding.addItem(
          binding.control.path,
          createDefaultValue(binding.control.schema, binding.control.rootSchema),
        )();
        const newKey = `item-${newIndex}`;
        if (binding.appliedOptions.collapseNewItems) {
          accordionValue = accordionValue.filter((key) => key !== newKey);
        } else {
          accordionValue = accordionProps.multiple ? [...accordionValue, newKey] : [newKey];
        }
      },
    );
  }

  function move(event: Event, from: number, direction: -1 | 1) {
    event.stopPropagation();
    const to = from + direction;
    void runCollectionAction(
      () =>
        !!showSortButtons &&
        Number.isInteger(from) &&
        from >= 0 &&
        from < dataLength &&
        to >= 0 &&
        to < dataLength,
      () => {
        accordionValue = accordionValue.map((key) =>
          key === `item-${from}` ? `item-${to}` : key === `item-${to}` ? `item-${from}` : key,
        );
        const action = direction === -1 ? binding.moveUp : binding.moveDown;
        action?.(binding.control.path, from)();
      },
    );
  }
  function moveUpClick(event: Event, index: number) {
    move(event, index, -1);
  }
  function moveDownClick(event: Event, index: number) {
    move(event, index, 1);
  }

  const deletion = useDeletionConfirmation(
    () => ({
      ...binding.control,
      options: binding.control.uischema.options,
    }),
    'arrayLayout',
    () => page.prepare(),
  );

  function removeItemsClick(toDelete: number[] | null) {
    if (!toDelete) return;
    const indices = [...new Set(toDelete)].filter(
      (index) => Number.isInteger(index) && index >= 0 && index < dataLength,
    );
    const allowed = () =>
      indices.length > 0 &&
      binding.appliedOptions.disableRemove !== true &&
      (!binding.appliedOptions.restrict ||
        dataLength - indices.length >= (binding.control.arraySchema?.minItems ?? 0));
    deletion.request(
      () => indices.map((index) => binding.control.data[index]),
      () => {
        accordionValue = accordionValue.flatMap((key) => {
          const index = Number(key.slice('item-'.length));
          if (!key.startsWith('item-') || !Number.isInteger(index)) return [key];
          if (indices.includes(index)) return [];
          return [`item-${index - indices.filter((removed) => removed < index).length}`];
        });
        binding.removeItems?.(binding.control.path, indices)();
      },
      allowed,
    );
  }

  function childErrors(index: number): ErrorObject[] {
    const rowPath = composePaths(binding.control.path, `${index}`);
    return binding.control.childErrors.filter((error) => {
      const errorPath = getControlPath(error);
      return errorPath === rowPath || errorPath.startsWith(`${rowPath}.`);
    });
  }

  function childLabelForIndex(index: number): string {
    return (
      binding.childLabelForIndex?.(index) || message('collection.itemLabel', { index: index + 1 })
    );
  }

  function openDeleteDialog(index: number) {
    removeItemsClick([index]);
  }
  function closeDeleteDialog() {
    deletion.cancel();
  }
  function confirmDelete() {
    deletion.accept();
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
    const skeletonProps = binding.skeletonProps('Dialog') as VendorProps<
      Pick<ComponentProps<typeof Dialog>, 'onOpenChange'>
    >;
    return {
      ...skeletonProps,
      getRootNode,
      open: Boolean(deletion.pending),
      onOpenChange: (e: { open: boolean }) => {
        if (!e.open) closeDeleteDialog();
        skeletonProps.onOpenChange?.(e);
      },
    };
  });
</script>

{#if binding.control.visible}
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class="my-2 text-sm">{binding.control.errors}</p>
  {/if}
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
        {#if headerErrors.length > 0 && binding.appliedOptions.showValidationIndicator !== false}
          <ValidationIcon
            data-array-summary
            errors={headerErrors}
            class={binding.styles.arrayList.validationIcon}
          />
        {/if}
      </div>

      <div class="flex items-center gap-2">
        {#if panel.collapsible}
          <button
            type="button"
            class="btn btn-sm preset-tonal"
            data-array-panel-toggle
            aria-label={message(panel.collapsed ? 'tree.expand' : 'tree.collapse', {
              label: binding.computedLabel,
            })}
            aria-expanded={!panel.collapsed}
            aria-controls={panelContentId}
            onclick={panel.toggle}
          >
            {#if panel.collapsed}<ChevronDownOutline class="h-4 w-4" />{:else}<ChevronUpOutline
                class="h-4 w-4"
              />{/if}
          </button>
        {/if}
        <TupleAction
          kind="add"
          buttonClass={twMerge('btn btn-sm preset-filled', binding.styles.arrayList?.addButton)}
          disabled={addDisabled}
          onclick={addButtonClick}
          ariaLabel={binding.control.translations?.addAriaLabel ?? message('array.addAriaLabel')}
          label={binding.control.translations?.addTooltip ?? message('array.addTooltip')}
        >
          {#snippet icon()}<PlusOutline class="h-4 w-4" />{/snippet}
        </TupleAction>
      </div>
    </div>

    <!-- List -->
    <div id={panelContentId} hidden={panel.collapsed} class="px-4 pb-4">
      {#if dataLength > 0}
        <Accordion {...accordionProps}>
          {#each page.indices as index (binding.control.rowKeys[index])}
            <CollectionItem
              identity={binding.control.rowKeys[index]}
              path={composePaths(binding.control.path, `${index}`)}
              sourceItem={binding.control.data[index]}
            >
              <div class="relative">
                <Accordion.Item value={`item-${index}`}>
                  <Accordion.ItemTrigger
                    class="flex w-full items-center justify-between border-b text-start last:border-b-0"
                    {...binding.skeletonProps('Accordion.ItemTrigger')}
                  >
                    <div class="flex min-w-0 flex-1 items-center gap-3">
                      {#if !hideAvatar}
                        <div data-array-avatar class="relative shrink-0">
                          <Avatar class="preset-filled-primary-500 size-10 rounded-full">
                            <Avatar.Fallback>{index + 1}</Avatar.Fallback>
                          </Avatar>
                        </div>
                      {/if}
                      <h3
                        class={`truncate text-sm font-medium ${hideAvatar && childErrors(index).length ? 'ps-7' : ''}`}
                      >
                        {#if hideAvatar}<span class="sr-only"
                            >{message('collection.index', { index: index + 1 })}:
                          </span>{/if}
                        {childLabelForIndex(index)}
                      </h3>
                    </div>

                    <div class="me-2 flex shrink-0 items-center gap-1">
                      {#if showSortButtons}
                        <TupleAction
                          kind="add"
                          buttonClass="btn btn-sm preset-outlined"
                          disabled={index <= 0 || !binding.control.enabled}
                          ariaLabel={binding.control.translations?.upAriaLabel ??
                            message('array.upAriaLabel')}
                          label={binding.control.translations?.up ?? message('array.up')}
                          onclick={(e: Event) => moveUpClick(e, index)}
                        >
                          {#snippet icon()}<ChevronUpOutline class="h-3 w-3" />{/snippet}
                        </TupleAction>

                        <TupleAction
                          kind="add"
                          buttonClass="btn btn-sm preset-outlined"
                          disabled={index >= dataLength - 1 || !binding.control.enabled}
                          ariaLabel={binding.control.translations?.downAriaLabel ??
                            message('array.downAriaLabel')}
                          label={binding.control.translations?.down ?? message('array.down')}
                          onclick={(e: Event) => moveDownClick(e, index)}
                        >
                          {#snippet icon()}<ChevronDownOutline class="h-3 w-3" />{/snippet}
                        </TupleAction>
                      {/if}

                      <TupleAction
                        kind="delete"
                        buttonClass="btn btn-sm preset-tonal hover:preset-filled-error-500"
                        disabled={binding.appliedOptions.disableRemove === true ||
                          !binding.control.enabled ||
                          (binding.appliedOptions.restrict &&
                            binding.control.arraySchema?.minItems !== undefined &&
                            dataLength <= binding.control.arraySchema.minItems)}
                        ariaLabel={binding.control.translations?.removeAriaLabel ??
                          message('array.removeAriaLabel')}
                        label={binding.control.translations?.removeTooltip ??
                          message('array.removeTooltip')}
                        onclick={(e: Event) => {
                          e.stopPropagation();
                          openDeleteDialog(index);
                        }}
                      >
                        {#snippet icon()}<TrashBinOutline class="h-3 w-3" />{/snippet}
                      </TupleAction>
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
                      schema={unconstrainedArrayItem(
                        binding.control.schema,
                        binding.control.data[index],
                      ).schema}
                      uischema={unconstrainedArrayItem(
                        binding.control.schema,
                        binding.control.data[index],
                      ).uischema ?? foundUISchema}
                      path={composePaths(binding.control.path, `${index}`)}
                      enabled={binding.control.enabled}
                      renderers={binding.control.renderers}
                      cells={binding.control.cells}
                    />
                  </Accordion.ItemContent>
                </Accordion.Item>
                <div class={`absolute top-4 z-10 ${hideAvatar ? 'start-1' : 'start-10'}`}>
                  <ValidationIcon data-row-summary errors={childErrors(index)} />
                </div>
              </div>
            </CollectionItem>
          {/each}
        </Accordion>
      {:else}
        <p class={twMerge('text-center', binding.styles.arrayList?.noData)}>
          {binding.control.translations?.noDataMessage ?? message('array.noDataMessage')}
        </p>
      {/if}
    </div>
    <div hidden={panel.collapsed}><CollectionPager {page} /></div>
  </section>

  <Dialog {...dialogProps}>
    <Portal target={getPortalTarget()}>
      <Dialog.Backdrop class="bg-surface-50-950/50 fixed inset-0" />
      <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Content class="card preset-filled-surface-50-950 w-full max-w-sm p-6">
          <div class="text-center">
            <ExclamationCircleOutline class="text-surface-400-600 mx-auto mb-4 h-12 w-12" />
            <Dialog.Title class="text-lg font-semibold">
              {message('confirm.delete.title')}
            </Dialog.Title>
            <p class="mb-5 text-center text-sm">
              {message('confirm.delete.message')}
            </p>
            <div class="flex justify-center gap-4">
              <Dialog.CloseTrigger class="btn preset-outlined">
                {message('confirm.decline')}
              </Dialog.CloseTrigger>
              <button type="button" class="btn preset-filled-error-500" onclick={confirmDelete}>
                {message('confirm.accept')}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
{/if}
