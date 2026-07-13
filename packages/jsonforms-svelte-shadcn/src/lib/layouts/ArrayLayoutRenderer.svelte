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
  import * as Accordion from '$lib/components/ui/accordion';
  import * as Avatar from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import {
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
    CircleAlertIcon as ExclamationCircleOutline,
    PlusIcon as PlusOutline,
    Trash2Icon as TrashBinOutline,
  } from '$lib/components/icons';
  import { twMerge } from 'tailwind-merge';
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { getPortalTarget, useShadcnArrayControl, useNested } from '../util';

  const props: RendererProps<ControlElement> = $props();

  const binding = useShadcnArrayControl(useJsonFormsArrayControl(props));

  // Accordion value — first panel open by default unless initCollapsed is set.
  // shadcnProps('Accordion') can override `multiple`, `collapsible`, etc.
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
    accordionValue = accordionAllowsMultiple ? value : value.slice(-1);
    binding.shadcnProps('Accordion').onValueChange?.(value);
  }

  function addButtonClick() {
    binding.addItem(
      binding.control.path,
      createDefaultValue(binding.control.schema, binding.control.rootSchema),
    )();
    if (!binding.appliedOptions.collapseNewItems && binding.control.data?.length) {
      // In single mode open only the new item; in multiple mode add it to the set.
      const newKey = `item-${dataLength}`;
      accordionValue = accordionAllowsMultiple ? [...accordionValue, newKey] : [newKey];
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
    const shadcnProps = binding.shadcnProps('card');
    return {
      ...shadcnProps,
      class: twMerge('my-1 min-w-full', binding.styles.arrayList.root, shadcnProps.class),
    };
  });

  const dialogProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('Dialog');
    return {
      ...shadcnProps,
      open: suggestToDelete !== null,
      onOpenChange: (open: boolean) => {
        if (!open) closeDeleteDialog();
        shadcnProps.onOpenChange?.(open);
      },
    };
  });
</script>

{#if binding.control.visible}
  <Card.Root {...cardProps}>
    <!-- Toolbar -->
    <Card.Header
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

      <Button
        size="icon-sm"
        class={binding.styles.arrayList?.addButton}
        disabled={addDisabled}
        onclick={addButtonClick}
        aria-label={binding.control.translations?.addAriaLabel || 'Add item'}
        title={binding.control.translations?.addTooltip || 'Add item'}
      >
        <PlusOutline class="h-4 w-4" />
      </Button>
    </Card.Header>

    <!-- List -->
    <Card.Content>
      {#if dataLength > 0}
        <Accordion.Root
          {...accordionProps}
          bind:value={accordionValue}
          onValueChange={handleAccordionValueChange}
        >
          {#each binding.control.data as _element, index (composePaths(binding.control.path, `${index}`))}
            <Accordion.Item value={`item-${index}`}>
              <Accordion.Trigger
                class="flex w-full items-center justify-between border-b text-start last:border-b-0"
                {...binding.shadcnProps('Accordion.ItemTrigger')}
              >
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  {#if !hideAvatar}
                    <div class="relative shrink-0">
                      <ValidationBadge border errors={childErrors(index)}>
                        <Avatar.Root size="lg" class="bg-primary text-primary-foreground">
                          <Avatar.Fallback>{index + 1}</Avatar.Fallback>
                        </Avatar.Root>
                      </ValidationBadge>
                    </div>
                  {/if}
                  <h3 class="truncate text-sm font-medium">
                    {childLabelForIndex(index)}
                  </h3>
                </div>

                <div class="me-2 flex shrink-0 items-center gap-1">
                  {#if binding.appliedOptions.showSortButtons}
                    <Button
                      variant="outline"
                      size="icon-xs"
                      disabled={index <= 0 || !binding.control.enabled}
                      aria-label={binding.control.translations?.upAriaLabel || 'Move up'}
                      title={binding.control.translations?.up || 'Move up'}
                      onclick={(e: Event) => moveUpClick(e, index)}
                    >
                      <ChevronUpOutline class="h-3 w-3" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon-xs"
                      disabled={index >= dataLength - 1 || !binding.control.enabled}
                      aria-label={binding.control.translations?.downAriaLabel || 'Move down'}
                      title={binding.control.translations?.down || 'Move down'}
                      onclick={(e: Event) => moveDownClick(e, index)}
                    >
                      <ChevronDownOutline class="h-3 w-3" />
                    </Button>
                  {/if}

                  <Button
                    variant="destructive"
                    size="icon-xs"
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
                  </Button>
                </div>
              </Accordion.Trigger>

              <Accordion.Content class="p-4" {...binding.shadcnProps('Accordion.ItemContent')}>
                <DispatchRenderer
                  schema={binding.control.schema}
                  uischema={foundUISchema}
                  path={composePaths(binding.control.path, `${index}`)}
                  enabled={binding.control.enabled}
                  renderers={binding.control.renderers}
                  cells={binding.control.cells}
                />
              </Accordion.Content>
            </Accordion.Item>
          {/each}
        </Accordion.Root>
      {:else}
        <p class={twMerge('text-center', binding.styles.arrayList?.noData)}>
          {binding.control.translations?.noDataMessage || 'No data'}
        </p>
      {/if}
    </Card.Content>
  </Card.Root>

  <Dialog.Root {...dialogProps}>
    <Dialog.Content portalProps={{ to: getPortalTarget() }} class="max-w-sm">
      <div class="text-center">
        <ExclamationCircleOutline class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <Dialog.Title class="text-lg font-semibold">
          {binding.control.translations?.deleteDialogTitle || 'Delete item?'}
        </Dialog.Title>
        <p class="mb-5 text-center text-sm">
          {binding.control.translations?.deleteDialogMessage ||
            'Are you sure you want to delete this item?'}
        </p>
        <div class="flex justify-center gap-4">
          <Dialog.Close>
            <Button variant="outline">
              {binding.control.translations?.deleteDialogDecline || 'Cancel'}
            </Button>
          </Dialog.Close>
          <Button variant="destructive" onclick={confirmDelete}>
            {binding.control.translations?.deleteDialogAccept || 'Delete'}
          </Button>
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Root>
{/if}
