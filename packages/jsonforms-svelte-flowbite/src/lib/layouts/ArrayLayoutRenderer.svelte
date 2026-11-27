<script lang="ts">
  import { arrayCardProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import CollectionPanelToggle from '../components/CollectionPanelToggle.svelte';
  import {
    ArrayLayoutItemHeading,
    ArrayLayoutRow,
    ArrayLayoutToolbar,
    useArrayLayout,
    DispatchRenderer,
    useJsonFormsArrayControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { tick, untrack } from 'svelte';
  import type { ControlElement } from '@jsonforms/core';
  import {
    Accordion,
    AccordionItem,
    Avatar,
    Button,
    Card,
    Heading,
    Modal,
    P,
    Span,
    Tooltip,
  } from 'flowbite-svelte';
  import {
    ChevronDownOutline,
    ChevronUpOutline,
    ExclamationCircleOutline,
    PlusOutline,
    TrashBinOutline,
  } from 'flowbite-svelte-icons';
  import { twMerge } from 'tailwind-merge';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useFlowbiteArrayControl, useNested } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';

  const props: RendererProps<ControlElement> = $props();
  const binding = useFlowbiteArrayControl(useJsonFormsArrayControl(props));

  const layout = useArrayLayout(props, binding, () => false);
  const { collection, deletion, addButtonClick, moveUpClick, moveDownClick, removeItemsClick } =
    layout;
  const { arrayMessage, message, panel, page } = collection;
  const { dataLength, addDisabled } = $derived(collection);
  const panelContentId = $props.id();
  let deleteTrigger: HTMLElement | undefined;
  function restoreDeleteFocus() {
    void tick().then(() => {
      if (deleteTrigger?.isConnected) deleteTrigger.focus();
    });
  }

  // indicate to our child renderers that we are increasing the "nested" level
  useNested('array');

  // Methods
  function openDeleteDialog(index: number, trigger: HTMLElement) {
    deleteTrigger = trigger;
    removeItemsClick([index]);
  }
  function closeDeleteDialog() {
    deletion.cancel();
    restoreDeleteFocus();
  }

  const cardProps = $derived(
    arrayCardProps(
      binding.flowbiteProps('Card'),
      binding.styles.arrayList.root,
      'mt-1 mb-1 min-w-full',
      twMerge,
    ),
  );
  const modalProps = $derived.by(() => {
    const props = binding.flowbiteProps('Modal');
    return {
      ...props,
      onclose: (event: Event) => {
        closeDeleteDialog();
        if (typeof props.onclose === 'function') props.onclose(event);
      },
    };
  });
</script>

{#if binding.control.visible}
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class="my-2 text-sm">{binding.control.errors}</p>
  {/if}
  <Card {...cardProps}>
    <ArrayLayoutToolbar
      toolbarClass={`flex items-center justify-between pt-2 pr-4 pb-2 pl-4  ${binding.styles.arrayList.toolbar || ''}`}
      {collection}
      {panelContentId}
      {CollectionPanelToggle}
      {ValidationIcon}
      {binding}
      titleClass={`flex items-center gap-2 ${binding.styles.arrayList.title || ''}`}
      labelClass={`text-lg font-semibold ${binding.styles.arrayList.label || ''}`}
    >
      {#snippet heading(label, cls)}<Heading tag="h3" class={cls}>{label}</Heading>{/snippet}
      {#snippet add()}<Button
          color="primary"
          size="sm"
          disabled={addDisabled}
          onclick={addButtonClick}
          aria-label={arrayMessage('addAriaLabel')}
          class={binding.styles.arrayList?.addButton || ''}
        >
          <PlusOutline class="h-4 w-4" />
        </Button>
        <Tooltip>
          <Span>{arrayMessage('addTooltip')}</Span>
        </Tooltip>{/snippet}
    </ArrayLayoutToolbar>

    <div id={panelContentId} hidden={panel.collapsed} class="pr-4 pl-4">
      {#if dataLength > 0}
        <!-- Expansion is controlled below. Disable the native shared selection
             feedback so retiring row instances cannot change the current row. -->
        <Accordion flush multiple>
          <ArrayLayoutRow control={binding.control} {layout} {ValidationIcon}>
            {#snippet children(index)}
              <AccordionItem
                bind:open={
                  () => layout.expanded.includes(`item-${index}`),
                  (open) => {
                    if (open) layout.expanded = [`item-${index}`];
                    else if (layout.expanded.includes(`item-${index}`)) layout.expanded = [];
                  }
                }
                class="border-b last:border-b-0"
              >
                {#snippet header()}
                  <ArrayLayoutItemHeading
                    {index}
                    {collection}
                    hideAvatar={layout.hideAvatar}
                    Title={Span}
                  >
                    {#snippet avatar()}<Avatar
                        size="md"
                        color="primary"
                        class="flex items-center justify-center"
                        aria-label={message('collection.index', { index: index + 1 })}
                      >
                        {index + 1}
                      </Avatar>{/snippet}
                  </ArrayLayoutItemHeading>

                  <div class="mr-2 flex shrink-0 items-center gap-1">
                    {#if layout.showSortButtons}
                      <Button
                        color="alternative"
                        size="xs"
                        disabled={index <= 0 || !binding.control.enabled}
                        aria-label={arrayMessage('upAriaLabel')}
                        onclick={(e: Event) => moveUpClick(e, index)}
                      >
                        <ChevronUpOutline class="h-3 w-3" />
                      </Button>
                      <Tooltip>
                        <Span>{arrayMessage('up')}</Span>
                      </Tooltip>

                      <Button
                        color="alternative"
                        size="xs"
                        disabled={index >= dataLength - 1 || !binding.control.enabled}
                        aria-label={arrayMessage('downAriaLabel')}
                        onclick={(e: Event) => moveDownClick(e, index)}
                      >
                        <ChevronDownOutline class="h-3 w-3" />
                      </Button>
                      <Tooltip>
                        <Span>{arrayMessage('down')}</Span>
                      </Tooltip>
                    {/if}

                    <Button
                      color="red"
                      size="xs"
                      disabled={collection.removeDisabled}
                      aria-label={arrayMessage('removeAriaLabel')}
                      onclick={(e: Event) => {
                        e.stopPropagation();
                        openDeleteDialog(index, e.currentTarget as HTMLElement);
                      }}
                    >
                      <TrashBinOutline class="h-3 w-3" />
                    </Button>
                    <Tooltip>
                      <Span>{arrayMessage('removeTooltip')}</Span>
                    </Tooltip>
                  </div>
                {/snippet}

                <div class="p-4">
                  <DispatchRenderer {...layout.itemRenderer(index)} />
                </div>
              </AccordionItem>
            {/snippet}
          </ArrayLayoutRow>
        </Accordion>
      {:else}
        <P class={`text-center ${binding.styles.arrayList?.noData || ''}`}>
          {arrayMessage('noDataMessage')}
        </P>
      {/if}
    </div>
    <div hidden={panel.collapsed}><CollectionPager {page} /></div>
  </Card>

  {#key deletion.pending}
    {#if deletion.pending}
      {@const request = untrack(() => deletion.pending)}
      {@const cancel = untrack(() => closeDeleteDialog)}
      {@const accept = untrack(() => deletion.accept)}
      <Modal
        aria-label={message('confirm.delete.title')}
        bind:open={
          () => deletion.pending === request,
          (open) => {
            if (!open) cancel();
          }
        }
        size="sm"
        autoclose={false}
        outsideclose
        {...modalProps}
        onclose={(event) => {
          if (deletion.pending === request) modalProps.onclose(event);
        }}
      >
        <div class="text-center">
          <ExclamationCircleOutline
            class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200"
          />
          <Heading tag="h3" class="text-lg font-semibold">
            {message('confirm.delete.title')}
          </Heading>
          <P class="mb-5 text-center text-sm">
            {message('confirm.delete.message')}
          </P>
          <div class="flex justify-center gap-4">
            <Button color="alternative" onclick={cancel}>
              {message('confirm.decline')}
            </Button>
            <Button color="red" onclick={accept}>
              {message('confirm.accept')}
            </Button>
          </div>
        </div>
      </Modal>
    {/if}
  {/key}
{/if}
