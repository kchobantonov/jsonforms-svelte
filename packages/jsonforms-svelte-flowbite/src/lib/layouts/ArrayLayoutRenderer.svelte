<script lang="ts">
  import { useCollectionAction } from '@chobantonov/jsonforms-svelte';
  import { untrack } from 'svelte';
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
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useFlowbiteArrayControl, useNested } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  const jsonforms = useJsonForms();

  const props: RendererProps<ControlElement> = $props();

  const binding = useFlowbiteArrayControl(useJsonFormsArrayControl(props));

  let currentlyExpanded = $state<number | null>(binding.appliedOptions.initCollapsed ? null : 0);
  const message = useRendererMessages();

  // Computed values
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

  // indicate to our child renderers that we are increasing the "nested" level
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

  // Methods
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
        if (!binding.appliedOptions.collapseNewItems) currentlyExpanded = newIndex;
      },
    );
  }

  function move(event: Event, from: number, direction: -1 | 1) {
    event.stopPropagation();
    const to = from + direction;
    void runCollectionAction(
      () =>
        !!binding.appliedOptions.showSortButtons &&
        Number.isInteger(from) &&
        from >= 0 &&
        from < dataLength &&
        to >= 0 &&
        to < dataLength,
      () => {
        if (currentlyExpanded === from) currentlyExpanded = to;
        else if (currentlyExpanded === to) currentlyExpanded = from;
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

  const cardProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Card');

    return {
      ...flowbiteProps,

      class: twMerge(
        'mt-1',
        'mb-1',
        'min-w-full',
        binding.styles.arrayList.root,
        flowbiteProps.class,
      ),
    };
  });
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
    <div
      class={`flex items-center justify-between pt-2 pr-4 pb-2 pl-4  ${binding.styles.arrayList.toolbar || ''}`}
    >
      <div class={`flex items-center gap-2 ${binding.styles.arrayList.title || ''}`}>
        <Heading tag="h3" class={`text-lg font-semibold ${binding.styles.arrayList.label || ''}`}>
          {binding.computedLabel}
        </Heading>
        {#if binding.control.childErrors.length > 0 && !binding.appliedOptions.hideArraySummaryValidation && binding.appliedOptions.showValidationIndicator !== false}
          <ValidationIcon
            data-array-summary
            errors={binding.control.childErrors}
            class={binding.styles.arrayList.validationIcon}
          ></ValidationIcon>
        {/if}
      </div>

      <Button
        color="primary"
        size="sm"
        disabled={addDisabled}
        onclick={addButtonClick}
        aria-label={binding.control.translations?.addAriaLabel ?? 'Add item'}
        class={binding.styles.arrayList?.addButton || ''}
      >
        <PlusOutline class="h-4 w-4" />
      </Button>
      <Tooltip>
        <Span>{binding.control.translations?.addTooltip ?? 'Add item'}</Span>
      </Tooltip>
    </div>

    <div class="pr-4 pl-4">
      {#if dataLength > 0}
        <Accordion flush>
          {#each page.indices as index (composePaths(binding.control.path, `${index}`))}
            <AccordionItem
              bind:open={
                () => currentlyExpanded === index,
                (open) => {
                  if (open) currentlyExpanded = index;
                  else if (currentlyExpanded === index) currentlyExpanded = null;
                }
              }
              class="border-b last:border-b-0"
            >
              {#snippet header()}
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  {#if !hideAvatar}
                    <div class="relative shrink-0">
                      <ValidationBadge border errors={childErrors(index)}>
                        <Avatar
                          size="md"
                          color="primary"
                          class="flex items-center justify-center"
                          aria-label={`Index ${index + 1}`}
                        >
                          {index + 1}
                        </Avatar>
                      </ValidationBadge>
                    </div>
                  {/if}

                  <Span class="truncate text-sm font-medium">
                    {childLabelForIndex(index)}
                  </Span>
                </div>

                <div class="mr-2 flex shrink-0 items-center gap-1">
                  {#if binding.appliedOptions.showSortButtons}
                    <Button
                      color="alternative"
                      size="xs"
                      disabled={index <= 0 || !binding.control.enabled}
                      aria-label={binding.control.translations?.upAriaLabel ?? 'Move up'}
                      onclick={(e: Event) => moveUpClick(e, index)}
                    >
                      <ChevronUpOutline class="h-3 w-3" />
                    </Button>
                    <Tooltip>
                      <Span>{binding.control.translations?.up ?? 'Move up'}</Span>
                    </Tooltip>

                    <Button
                      color="alternative"
                      size="xs"
                      disabled={index >= dataLength - 1 || !binding.control.enabled}
                      aria-label={binding.control.translations?.downAriaLabel ?? 'Move down'}
                      onclick={(e: Event) => moveDownClick(e, index)}
                    >
                      <ChevronDownOutline class="h-3 w-3" />
                    </Button>
                    <Tooltip>
                      <Span>{binding.control.translations?.down ?? 'Move down'}</Span>
                    </Tooltip>
                  {/if}

                  <Button
                    color="red"
                    size="xs"
                    disabled={binding.appliedOptions.disableRemove === true ||
                      !binding.control.enabled ||
                      (binding.appliedOptions.restrict &&
                        binding.control.arraySchema?.minItems !== undefined &&
                        dataLength <= binding.control.arraySchema.minItems)}
                    aria-label={binding.control.translations?.removeAriaLabel ?? 'Remove item'}
                    onclick={(e: Event) => {
                      e.stopPropagation();
                      openDeleteDialog(index);
                    }}
                  >
                    <TrashBinOutline class="h-3 w-3" />
                  </Button>
                  <Tooltip>
                    <Span>{binding.control.translations?.removeTooltip ?? 'Remove item'}</Span>
                  </Tooltip>
                </div>
              {/snippet}

              <div class="p-4">
                <DispatchRenderer
                  schema={binding.control.schema}
                  uischema={foundUISchema}
                  path={composePaths(binding.control.path, `${index}`)}
                  enabled={binding.control.enabled}
                  renderers={binding.control.renderers}
                  cells={binding.control.cells}
                />
              </div>
            </AccordionItem>
          {/each}
        </Accordion>
      {:else}
        <P class={`text-center ${binding.styles.arrayList?.noData || ''}`}>
          {binding.control.translations?.noDataMessage ?? 'No data'}
        </P>
      {/if}
    </div>
    <CollectionPager {page} />
  </Card>

  {#key deletion.pending}
    {#if deletion.pending}
      {@const request = untrack(() => deletion.pending)}
      {@const cancel = untrack(() => deletion.cancel)}
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
