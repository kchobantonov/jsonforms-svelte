<script lang="ts">
  import { arrayCardProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import CollectionPanelToggle from '../components/CollectionPanelToggle.svelte';
  import {
    ArrayLayoutItemHeading,
    ArrayLayoutRow,
    ArrayLayoutToolbar,
    arrayToolbarClasses,
    useArrayLayout,
    DispatchRenderer,
    useJsonFormsArrayControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { ComponentProps } from 'svelte';
  import type { VendorProps } from '../util';
  import type { ControlElement } from '@jsonforms/core';
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

  const props: RendererProps<ControlElement> = $props();
  const binding = useSkeletonArrayControl(useJsonFormsArrayControl(props));
  const getRootNode = getPortalRootNodeGetter();

  const layout = useArrayLayout(props, binding, () =>
    Boolean(binding.skeletonProps('Accordion').multiple),
  );
  const { collection, deletion } = layout;
  const { arrayMessage, message, panel, page } = collection;
  const { dataLength } = $derived(collection);
  const panelContentId = $props.id();

  useNested('array');

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
      value: layout.expanded,
      onValueChange: (details: { value: string[] }) => {
        // In single mode, keep only the last selected item so the previously
        // open panel closes automatically. In multiple mode keep all.
        layout.expanded = multiple ? details.value : details.value.slice(-1);
        // Allow a consumer-provided onValueChange to also fire.
        skeletonProps.onValueChange?.(details);
      },
    };
  });

  const cardProps = $derived(
    arrayCardProps(
      binding.skeletonProps('card'),
      binding.styles.arrayList.root,
      'card preset-outlined-surface-200-800 mt-1 mb-1 min-w-full',
      twMerge,
    ),
  );

  const dialogProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Dialog') as VendorProps<
      Pick<ComponentProps<typeof Dialog>, 'onOpenChange'>
    >;
    return {
      ...skeletonProps,
      getRootNode,
      open: Boolean(deletion.pending),
      onOpenChange: (e: { open: boolean }) => {
        if (!e.open) deletion.cancel();
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
    <ArrayLayoutToolbar
      {collection}
      {panelContentId}
      {CollectionPanelToggle}
      {ValidationIcon}
      {binding}
      {...arrayToolbarClasses(binding.styles.arrayList, twMerge)}
    >
      {#snippet add()}<TupleAction
          kind="add"
          buttonClass={twMerge('btn btn-sm preset-filled', binding.styles.arrayList?.addButton)}
          {...layout.addAction}
        >
          {#snippet icon()}<PlusOutline class="h-4 w-4" />{/snippet}
        </TupleAction>{/snippet}
    </ArrayLayoutToolbar>

    <!-- List -->
    <div id={panelContentId} hidden={panel.collapsed} class="px-4 pb-4">
      {#if dataLength > 0}
        <Accordion {...accordionProps}>
          <ArrayLayoutRow control={binding.control} {layout} {ValidationIcon}>
            {#snippet children(index)}
              <Accordion.Item value={`item-${index}`}>
                <Accordion.ItemTrigger
                  class="flex w-full items-center justify-between border-b text-start last:border-b-0"
                  {...binding.skeletonProps('Accordion.ItemTrigger')}
                >
                  <ArrayLayoutItemHeading {index} {collection} hideAvatar={layout.hideAvatar}>
                    {#snippet avatar()}<Avatar
                        class="preset-filled-primary-500 size-10 rounded-full"
                      >
                        <Avatar.Fallback>{index + 1}</Avatar.Fallback>
                      </Avatar>{/snippet}
                  </ArrayLayoutItemHeading>

                  <div class="me-2 flex shrink-0 items-center gap-1">
                    {#if layout.showSortButtons}
                      <TupleAction
                        kind="add"
                        buttonClass="btn btn-sm preset-outlined"
                        {...layout.moveAction(index, 'up')}
                      >
                        {#snippet icon()}<ChevronUpOutline class="h-3 w-3" />{/snippet}
                      </TupleAction>

                      <TupleAction
                        kind="add"
                        buttonClass="btn btn-sm preset-outlined"
                        {...layout.moveAction(index, 'down')}
                      >
                        {#snippet icon()}<ChevronDownOutline class="h-3 w-3" />{/snippet}
                      </TupleAction>
                    {/if}

                    <TupleAction
                      kind="delete"
                      buttonClass="btn btn-sm preset-tonal hover:preset-filled-error-500"
                      {...layout.deleteAction(index)}
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
                  <DispatchRenderer {...layout.itemRenderer(index)} />
                </Accordion.ItemContent>
              </Accordion.Item>
            {/snippet}
          </ArrayLayoutRow>
        </Accordion>
      {:else}
        <p class={twMerge('text-center', binding.styles.arrayList?.noData)}>
          {arrayMessage('noDataMessage')}
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
              <button type="button" class="btn preset-filled-error-500" onclick={deletion.accept}>
                {message('confirm.accept')}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
{/if}
