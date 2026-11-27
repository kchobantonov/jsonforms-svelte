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
  import type { ControlElement } from '@jsonforms/core';
  import * as Accordion from '@jsonforms-svelte-shadcn-ui/accordion';
  import * as Avatar from '@jsonforms-svelte-shadcn-ui/avatar';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Card from '@jsonforms-svelte-shadcn-ui/card';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import {
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
    CircleAlertIcon as ExclamationCircleOutline,
    PlusIcon as PlusOutline,
    Trash2Icon as TrashBinOutline,
  } from '$lib/components/icons';
  import { twMerge } from 'tailwind-merge';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import TupleAction from '../components/TupleAction.svelte';
  import { getPortalTarget, useShadcnArrayControl, useNested } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  import LocalizedDialogContent from '../components/LocalizedDialogContent.svelte';

  const props: RendererProps<ControlElement> = $props();
  const binding = useShadcnArrayControl(useJsonFormsArrayControl(props));

  const layout = useArrayLayout(props, binding, () => accordionAllowsMultiple);
  const { collection, deletion } = layout;
  const { arrayMessage, message, panel, page } = collection;
  const { dataLength } = $derived(collection);
  const panelContentId = $props.id();

  useNested('array');

  // Resolved Accordion props — shadcnProps can override defaults.
  // `multiple` defaults to false (single open panel).
  // `collapsible` defaults to true (panels can be toggled closed).
  const accordionAllowsMultiple = $derived(
    binding.shadcnProps('Accordion').multiple === true ||
      binding.shadcnProps('Accordion').type === 'multiple',
  );
  const accordionProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('Accordion');
    const {
      multiple: _multiple,
      collapsible: _collapsible,
      type: _type,
      ...restProps
    } = shadcnProps;
    return {
      ...restProps,
      type: 'multiple' as const,
    };
  });

  function handleAccordionValueChange(value: string[]) {
    layout.expanded = accordionAllowsMultiple ? value : value.slice(-1);
    binding.shadcnProps('Accordion').onValueChange?.(value);
  }

  const cardProps = $derived(
    arrayCardProps(
      binding.shadcnProps('card'),
      binding.styles.arrayList.root,
      'my-1 min-w-full',
      twMerge,
    ),
  );

  const dialogProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('Dialog');
    return {
      ...shadcnProps,
      open: Boolean(deletion.pending),
      onOpenChange: (open: boolean) => {
        if (!open) deletion.cancel();
        shadcnProps.onOpenChange?.(open);
      },
    };
  });
</script>

{#if binding.control.visible}
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class="my-2 text-sm">{binding.control.errors}</p>
  {/if}
  <Card.Root {...cardProps}>
    <!-- Toolbar -->
    <ArrayLayoutToolbar
      Header={Card.Header}
      {collection}
      {panelContentId}
      {CollectionPanelToggle}
      {ValidationIcon}
      {binding}
      {...arrayToolbarClasses(binding.styles.arrayList, twMerge)}
    >
      {#snippet add()}<TupleAction
          kind="add"
          buttonSize="icon-sm"
          buttonClass={binding.styles.arrayList?.addButton}
          {...layout.addAction}
        >
          {#snippet icon()}<PlusOutline class="h-4 w-4" />{/snippet}
        </TupleAction>{/snippet}
    </ArrayLayoutToolbar>

    <!-- List -->
    <Card.Content id={panelContentId} hidden={panel.collapsed}>
      {#if dataLength > 0}
        <Accordion.Root
          {...accordionProps}
          bind:value={layout.expanded}
          onValueChange={handleAccordionValueChange}
        >
          <ArrayLayoutRow control={binding.control} {layout} {ValidationIcon}>
            {#snippet children(index)}
              <Accordion.Item value={`item-${index}`}>
                <Accordion.Trigger
                  class="flex w-full items-center justify-between border-b text-start last:border-b-0"
                  {...binding.shadcnProps('Accordion.ItemTrigger')}
                >
                  <ArrayLayoutItemHeading {index} {collection} hideAvatar={layout.hideAvatar}>
                    {#snippet avatar()}<Avatar.Root
                        size="lg"
                        class="bg-primary text-primary-foreground"
                      >
                        <Avatar.Fallback>{index + 1}</Avatar.Fallback>
                      </Avatar.Root>{/snippet}
                  </ArrayLayoutItemHeading>

                  <div class="me-2 flex shrink-0 items-center gap-1">
                    {#if layout.showSortButtons}
                      <TupleAction
                        kind="add"
                        buttonVariant="outline"
                        buttonSize="icon-xs"
                        {...layout.moveAction(index, 'up')}
                      >
                        {#snippet icon()}<ChevronUpOutline class="h-3 w-3" />{/snippet}
                      </TupleAction>

                      <TupleAction
                        kind="add"
                        buttonVariant="outline"
                        buttonSize="icon-xs"
                        {...layout.moveAction(index, 'down')}
                      >
                        {#snippet icon()}<ChevronDownOutline class="h-3 w-3" />{/snippet}
                      </TupleAction>
                    {/if}

                    <TupleAction kind="delete" buttonSize="icon-xs" {...layout.deleteAction(index)}>
                      {#snippet icon()}<TrashBinOutline class="h-3 w-3" />{/snippet}
                    </TupleAction>
                  </div>
                </Accordion.Trigger>

                <Accordion.Content class="p-4" {...binding.shadcnProps('Accordion.ItemContent')}>
                  <DispatchRenderer {...layout.itemRenderer(index)} />
                </Accordion.Content>
              </Accordion.Item>
            {/snippet}
          </ArrayLayoutRow>
        </Accordion.Root>
      {:else}
        <p class={twMerge('text-center', binding.styles.arrayList?.noData)}>
          {arrayMessage('noDataMessage')}
        </p>
      {/if}
    </Card.Content>
    <div hidden={panel.collapsed}><CollectionPager {page} /></div>
  </Card.Root>

  <Dialog.Root {...dialogProps}>
    <LocalizedDialogContent
      portalProps={{ to: getPortalTarget() }}
      class="max-w-sm"
      closeLabel={message('dialog.close')}
    >
      <div class="text-center">
        <ExclamationCircleOutline class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <Dialog.Title class="text-lg font-semibold">
          {message('confirm.delete.title')}
        </Dialog.Title>
        <p class="mb-5 text-center text-sm">
          {message('confirm.delete.message')}
        </p>
        <div class="flex justify-center gap-4">
          <Button variant="outline" onclick={deletion.cancel}>
            {message('confirm.decline')}
          </Button>
          <Button variant="destructive" onclick={deletion.accept}>
            {message('confirm.accept')}
          </Button>
        </div>
      </div>
    </LocalizedDialogContent>
  </Dialog.Root>
{/if}
