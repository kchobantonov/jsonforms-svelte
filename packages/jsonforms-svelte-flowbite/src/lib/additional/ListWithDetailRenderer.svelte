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
  import {
    Avatar,
    Button,
    Heading,
    Listgroup,
    ListgroupItem,
    P,
    Span,
    Tooltip,
  } from 'flowbite-svelte';
  import {
    ChevronDownOutline,
    ChevronUpOutline,
    PlusOutline,
    TrashBinOutline,
  } from 'flowbite-svelte-icons';
  import { twMerge } from 'tailwind-merge';
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useFlowbiteArrayControl } from '../util';

  // Props
  import CollectionPager from '../components/CollectionPager.svelte';
  import SplitPane from '../components/SplitPane.svelte';
  import Pane from '../components/Pane.svelte';
  const message = useRendererMessages();

  const props: RendererProps<ControlElement> = $props();
  const binding = useFlowbiteArrayControl(useJsonFormsArrayControl(props));
  const list = useListWithDetail(props, binding);
  const { arrayMessage, page, addButtonClick, childErrors, childLabelForIndex } = list;
  const { selectedIndex, addDisabled } = $derived(list);

  function selectItem(index: number) {
    if (!page.prepare()) return;
    list.selectedKey = binding.control.rowKeys[index];
  }

  const listgroupProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Listgroup');

    return {
      ...flowbiteProps,
      class: twMerge('max-h-96 min-w-0 overflow-y-auto', flowbiteProps.class),
    };
  });
  const listgroupItemProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('ListgroupItem');
    return {
      ...flowbiteProps,
      class: twMerge('min-w-0 shrink-0', flowbiteProps.class),
    };
  });
  const avatarProps = $derived(binding.flowbiteProps('Avatar'));
</script>

<ListWithDetailFrame
  {binding}
  {list}
  {SplitPane}
  {Pane}
  {ValidationIcon}
  {CollectionPanelToggle}
  {ConfirmationDialog}
  insetDetail
  toolbarClass="flex items-center justify-between border-gray-200 p-4 dark:border-gray-700"
>
  {#snippet heading()}<Heading tag="h3" class="text-lg font-semibold">
      {binding.computedLabel}
    </Heading>{/snippet}
  {#snippet addAction()}<Button
      color="primary"
      size="sm"
      disabled={addDisabled}
      onclick={addButtonClick}
      aria-label={arrayMessage('addAriaLabel')}
    >
      <PlusOutline class="h-4 w-4" />
    </Button>
    <Tooltip>
      <Span>{arrayMessage('addTooltip')}</Span>
    </Tooltip>{/snippet}
  {#snippet noData()}<P class="text-center">
      {arrayMessage('noDataMessage')}
    </P>{/snippet}

  {#snippet navigation()}
    <Listgroup active {...listgroupProps} data-list-navigation>
      {#each page.indices as index (binding.control.rowKeys[index])}
        {@const remove = list.rowAction(index, 'remove')}
        <ListgroupItem
          {...listgroupItemProps}
          active
          current={selectedIndex === index}
          onclick={() => selectItem(index)}
        >
          <ListItemAvatar
            {index}
            hidden={binding.appliedOptions.hideAvatar}
            errors={childErrors(index)}
            {ValidationBadge}
            {ValidationIcon}
          >
            <Avatar
              {...avatarProps}
              size="md"
              color={selectedIndex === index ? 'primary' : 'alternative'}
              class="flex items-center justify-center"
              aria-label={`${message('array.indexLabel')} ${index + 1}`}
            >
              {index + 1}
            </Avatar>
          </ListItemAvatar>

          <div data-list-label class="min-w-0 flex-1 overflow-hidden text-start">
            <Span
              class="block w-full truncate text-sm font-medium"
              title={childLabelForIndex(index)}
            >
              {childLabelForIndex(index)}
            </Span>
            <Tooltip>
              <Span>{childLabelForIndex(index)}</Span>
            </Tooltip>
          </div>

          <div data-list-actions class="flex shrink-0 items-center gap-1">
            {#if binding.appliedOptions.showSortButtons}
              {#each ['up', 'down'] as direction (direction)}
                {@const action = list.rowAction(index, direction === 'up' ? 'up' : 'down')}
                <Button
                  color="alternative"
                  size="xs"
                  disabled={action.disabled}
                  onclick={action.onclick}
                  aria-label={action.ariaLabel}
                >
                  {#if direction === 'up'}<ChevronUpOutline
                      class="h-3 w-3"
                    />{:else}<ChevronDownOutline class="h-3 w-3" />{/if}
                </Button>
                <Tooltip><Span>{action.label}</Span></Tooltip>
              {/each}
            {/if}
            <Button
              color="red"
              size="xs"
              disabled={remove.disabled}
              onclick={remove.onclick}
              aria-label={remove.ariaLabel}
            >
              <TrashBinOutline class="h-3 w-3" />
            </Button>
            <Tooltip><Span>{remove.label}</Span></Tooltip>
          </div>
        </ListgroupItem>
      {/each}
    </Listgroup>
    <CollectionPager {page} />
  {/snippet}
  {#snippet empty()}
    <P class="text-xl">
      {arrayMessage('noSelection')}
    </P>
  {/snippet}
</ListWithDetailFrame>
