<script lang="ts">
  import CollectionPanelToggle from '../components/CollectionPanelToggle.svelte';
  import {
    ListWithDetailFrame,
    ListItemAvatar,
    useListWithDetail,
    useRendererMessages,
    useJsonFormsArrayControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import type { ComponentProps } from 'svelte';
  import type { VendorProps } from '../util';
  import type { ControlElement } from '@jsonforms/core';
  import { Avatar, Listbox, useListCollection } from '@skeletonlabs/skeleton-svelte';
  import {
    CheckIcon,
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
    Trash2Icon as TrashBinOutline,
  } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useSkeletonArrayControl } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  import TupleAction from '../components/TupleAction.svelte';
  import SplitPane from '../components/SplitPane.svelte';
  import Pane from '../components/Pane.svelte';
  const message = useRendererMessages();

  const props: RendererProps<ControlElement> = $props();
  const binding = useSkeletonArrayControl(useJsonFormsArrayControl(props));
  const list = useListWithDetail(props, binding);
  const { page, childErrors } = list;
  const { selectedIndex } = $derived(list);

  const collection = $derived(
    useListCollection({
      items: list.items,
      itemToString: (item) => item.label,
      itemToValue: (item) => item.value,
    }),
  );

  const listboxProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Listbox') as VendorProps<
      Pick<ComponentProps<typeof Listbox>, 'onValueChange'>
    >;
    return {
      ...skeletonProps,
      collection,
      value:
        selectedIndex !== undefined && list.selectedKey !== undefined ? [list.selectedKey] : [],
      onValueChange: (
        details: Parameters<NonNullable<ComponentProps<typeof Listbox>['onValueChange']>>[0],
      ) => {
        if (!page.prepare()) return;
        const val = details.value[0];
        list.selectedKey =
          val !== undefined && binding.control.rowKeys.includes(val) ? val : undefined;
        skeletonProps.onValueChange?.(details);
      },
      class: twMerge(
        // Bound list height while the splitter pane determines its width.
        'card preset-outlined-surface-200-800 max-h-96 min-w-0 overflow-y-auto',
        skeletonProps.class,
      ),
    };
  });

  const listboxItemProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Listbox.Item');
    return {
      ...skeletonProps,
      class: twMerge(
        'flex w-full min-w-0 shrink-0 cursor-pointer items-center gap-3 border-b px-4 py-3 text-start last:border-b-0 data-highlighted:preset-tonal-primary data-selected:preset-tonal-primary',
        skeletonProps.class,
      ),
    };
  });
</script>

<ListWithDetailFrame
  {binding}
  {list}
  {SplitPane}
  {Pane}
  {ValidationIcon}
  {CollectionPanelToggle}
  {ConfirmationDialog}
  {TupleAction}
  emptyClass="text-surface-500 dark:text-surface-400 py-8 text-center"
  addButtonClass="btn btn-sm preset-filled"
  toolbarClass="flex items-center justify-between px-4 py-2"
>
  {#snippet navigation()}
    <Listbox {...listboxProps} data-list-navigation>
      <Listbox.Content>
        {#each list.visibleItems as item (item.value)}
          <Listbox.Item {item} {...listboxItemProps}>
            <ListItemAvatar
              index={item.index}
              hidden={binding.appliedOptions.hideAvatar}
              errors={childErrors(item.index)}
              {ValidationBadge}
              {ValidationIcon}
            >
              <Avatar class="preset-filled-surface-500 size-10 rounded-full">
                <Avatar.Fallback>{item.index + 1}</Avatar.Fallback>
              </Avatar>
            </ListItemAvatar>

            <div data-list-label class="min-w-0 flex-1 overflow-hidden text-start">
              <p class="truncate text-sm font-medium" title={item.label}>
                {item.label}
              </p>
            </div>

            <Listbox.ItemIndicator class="shrink-0">
              <CheckIcon class="size-4" />
            </Listbox.ItemIndicator>

            <div data-list-actions class="flex shrink-0 items-center gap-1">
              {#if binding.appliedOptions.showSortButtons}
                <TupleAction
                  kind="add"
                  buttonClass="btn btn-sm preset-outlined"
                  {...list.rowAction(item.index, 'up')}
                >
                  {#snippet icon()}<ChevronUpOutline class="h-3 w-3" />{/snippet}
                </TupleAction>

                <TupleAction
                  kind="add"
                  buttonClass="btn btn-sm preset-outlined"
                  {...list.rowAction(item.index, 'down')}
                >
                  {#snippet icon()}<ChevronDownOutline class="h-3 w-3" />{/snippet}
                </TupleAction>
              {/if}

              <TupleAction
                kind="delete"
                buttonClass="btn btn-sm preset-tonal hover:preset-filled-error-500"
                {...list.rowAction(item.index, 'remove')}
              >
                {#snippet icon()}<TrashBinOutline class="h-3 w-3" />{/snippet}
              </TupleAction>
            </div>
          </Listbox.Item>
        {/each}
      </Listbox.Content>
    </Listbox>
    <CollectionPager {page} />
  {/snippet}
  {#snippet empty()}
    <p class="text-surface-500 dark:text-surface-400">
      {binding.control.translations?.noSelection ?? message('collection.selectItem')}
    </p>
  {/snippet}
</ListWithDetailFrame>
