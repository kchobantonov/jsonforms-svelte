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
  import type { ControlElement } from '@jsonforms/core';
  import * as Avatar from '@jsonforms-svelte-shadcn-ui/avatar';
  import * as Item from '@jsonforms-svelte-shadcn-ui/item';
  import {
    CheckIcon,
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
    Trash2Icon as TrashBinOutline,
  } from '$lib/components/icons';
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useShadcnArrayControl } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  import TupleAction from '../components/TupleAction.svelte';
  import SplitPane from '../components/SplitPane.svelte';
  import Pane from '../components/Pane.svelte';
  const message = useRendererMessages();

  const props: RendererProps<ControlElement> = $props();
  const binding = useShadcnArrayControl(useJsonFormsArrayControl(props));
  const list = useListWithDetail(props, binding);
  const { page, childErrors } = list;
  const { selectedIndex } = $derived(list);

  const selectedVisibleIndex = $derived(
    selectedIndex !== undefined && page.indices.includes(selectedIndex)
      ? selectedIndex
      : page.indices[0],
  );

  function selectByKeyboard(event: KeyboardEvent, item: (typeof list.items)[number]) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (page.prepare()) list.selectedKey = item.value;
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const options = Array.from(
      event.currentTarget instanceof HTMLElement
        ? (event.currentTarget
            .closest('[role="listbox"]')
            ?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])
        : [],
    );
    const current = options.indexOf(event.currentTarget as HTMLElement);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? options.length - 1
          : Math.max(
              0,
              Math.min(options.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)),
            );
    const nextIndex = page.indices[next];
    if (nextIndex === undefined || !page.prepare()) return;
    list.selectedKey = binding.control.rowKeys[nextIndex];
    options[next]?.focus();
  }
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
  emptyClass="text-muted-foreground py-8 text-center"
  toolbarClass="flex items-center justify-between px-4 py-2"
>
  {#snippet navigation()}
    <!-- Constrained, scrollable item list -->
    <div
      role="listbox"
      data-list-navigation
      aria-label={binding.computedLabel}
      class="border-border max-h-96 min-w-0 overflow-y-auto rounded-lg border p-1"
      {...binding.shadcnProps('Item.Group')}
    >
      {#each list.visibleItems as item (item.value)}
        <Item.Root
          role="option"
          tabindex={selectedVisibleIndex === item.index ? 0 : -1}
          aria-selected={selectedIndex === item.index}
          variant={selectedIndex === item.index ? 'muted' : 'default'}
          class="shrink-0 cursor-pointer flex-nowrap"
          onclick={() => {
            if (page.prepare()) list.selectedKey = item.value;
          }}
          onkeydown={(event: KeyboardEvent) => selectByKeyboard(event, item)}
          {...binding.shadcnProps('Item')}
        >
          <ListItemAvatar
            index={item.index}
            hidden={binding.appliedOptions.hideAvatar}
            errors={childErrors(item.index)}
            {ValidationBadge}
            {ValidationIcon}
          >
            <Avatar.Root size="lg" class="bg-muted">
              <Avatar.Fallback>{item.index + 1}</Avatar.Fallback>
            </Avatar.Root>
          </ListItemAvatar>

          <Item.Content data-list-label class="min-w-0 overflow-hidden">
            <Item.Title class="w-full min-w-0 truncate" title={item.label}>
              {item.label}
            </Item.Title>
          </Item.Content>

          {#if selectedIndex === item.index}
            <CheckIcon class="size-4" />
          {/if}

          <div data-list-actions class="flex shrink-0 items-center gap-1">
            {#if binding.appliedOptions.showSortButtons}
              <TupleAction
                kind="add"
                buttonVariant="outline"
                buttonSize="icon-xs"
                {...list.rowAction(item.index, 'up')}
              >
                {#snippet icon()}<ChevronUpOutline class="h-3 w-3" />{/snippet}
              </TupleAction>

              <TupleAction
                kind="add"
                buttonVariant="outline"
                buttonSize="icon-xs"
                {...list.rowAction(item.index, 'down')}
              >
                {#snippet icon()}<ChevronDownOutline class="h-3 w-3" />{/snippet}
              </TupleAction>
            {/if}

            <TupleAction
              kind="delete"
              buttonSize="icon-xs"
              {...list.rowAction(item.index, 'remove')}
            >
              {#snippet icon()}<TrashBinOutline class="h-3 w-3" />{/snippet}
            </TupleAction>
          </div>
        </Item.Root>
      {/each}
    </div>

    <CollectionPager {page} />
  {/snippet}
  {#snippet empty()}
    <p class="text-muted-foreground">
      {binding.control.translations?.noSelection ?? message('collection.selectItem')}
    </p>
  {/snippet}
</ListWithDetailFrame>
