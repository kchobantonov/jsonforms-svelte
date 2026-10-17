<script lang="ts">
  import {
    findDetailUISchema,
    useDeletionConfirmation,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import {
    DispatchRenderer,
    useJsonForms,
    useCollectionPagination,
    collectionErrorPositions,
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
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { getPortalTarget, useShadcnArrayControl, useNested } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  const jsonforms = useJsonForms();

  const props: RendererProps<ControlElement> = $props();

  const binding = useShadcnArrayControl(useJsonFormsArrayControl(props));

  // Accordion value — first panel open by default unless initCollapsed is set.
  // shadcnProps('Accordion') can override `multiple`, `collapsible`, etc.
  // via uischema options, e.g.:
  //   "options": { "Accordion": { "multiple": true, "collapsible": true } }
  let accordionValue = $state<string[]>(binding.appliedOptions.initCollapsed ? [] : ['item-0']);
  const message = useRendererMessages();

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
      return collectionErrorPositions(jsonforms.core, binding.control.path, keys);
    },
    kind: 'array',
    defaultEnabled: false,
  });

  const hideAvatar = $derived(!!binding.appliedOptions.hideAvatar);

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
    if (addDisabled || !page.prepare() || addDisabled) return;
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
    if (!binding.control.enabled || toMove <= 0 || !page.prepare()) return;
    binding.moveUp?.(binding.control.path, toMove)();
  }

  function moveDownClick(event: Event, toMove: number) {
    event.stopPropagation();
    if (!binding.control.enabled || toMove >= dataLength - 1 || !page.prepare()) return;
    binding.moveDown?.(binding.control.path, toMove)();
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
      () => binding.removeItems?.(binding.control.path, indices)(),
      allowed,
    );
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
    removeItemsClick([index]);
  }
  function closeDeleteDialog() {
    deletion.cancel();
  }
  function confirmDelete() {
    deletion.accept();
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
      open: Boolean(deletion.pending),
      onOpenChange: (open: boolean) => {
        if (!open) closeDeleteDialog();
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
        {#if binding.control.childErrors.length > 0 && !binding.appliedOptions.hideArraySummaryValidation && binding.appliedOptions.showValidationIndicator !== false}
          <ValidationIcon
            data-array-summary
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
        aria-label={binding.control.translations?.addAriaLabel ?? 'Add item'}
        title={binding.control.translations?.addTooltip ?? 'Add item'}
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
          {#each page.indices as index (composePaths(binding.control.path, `${index}`))}
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
                      aria-label={binding.control.translations?.upAriaLabel ?? 'Move up'}
                      title={binding.control.translations?.up ?? 'Move up'}
                      onclick={(e: Event) => moveUpClick(e, index)}
                    >
                      <ChevronUpOutline class="h-3 w-3" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon-xs"
                      disabled={index >= dataLength - 1 || !binding.control.enabled}
                      aria-label={binding.control.translations?.downAriaLabel ?? 'Move down'}
                      title={binding.control.translations?.down ?? 'Move down'}
                      onclick={(e: Event) => moveDownClick(e, index)}
                    >
                      <ChevronDownOutline class="h-3 w-3" />
                    </Button>
                  {/if}

                  <Button
                    variant="destructive"
                    size="icon-xs"
                    disabled={binding.appliedOptions.disableRemove === true ||
                      !binding.control.enabled ||
                      (binding.appliedOptions.restrict &&
                        binding.control.arraySchema?.minItems !== undefined &&
                        dataLength <= binding.control.arraySchema.minItems)}
                    aria-label={binding.control.translations?.removeAriaLabel ?? 'Remove item'}
                    title={binding.control.translations?.removeTooltip ?? 'Remove item'}
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
          {binding.control.translations?.noDataMessage ?? 'No data'}
        </p>
      {/if}
    </Card.Content>
    <CollectionPager {page} />
  </Card.Root>

  <Dialog.Root {...dialogProps}>
    <Dialog.Content portalProps={{ to: getPortalTarget() }} class="max-w-sm">
      <div class="text-center">
        <ExclamationCircleOutline class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <Dialog.Title class="text-lg font-semibold">
          {message('confirm.delete.title')}
        </Dialog.Title>
        <p class="mb-5 text-center text-sm">
          {message('confirm.delete.message')}
        </p>
        <div class="flex justify-center gap-4">
          <Button variant="outline" onclick={closeDeleteDialog}>
            {message('confirm.decline')}
          </Button>
          <Button variant="destructive" onclick={confirmDelete}>
            {message('confirm.accept')}
          </Button>
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Root>
{/if}
