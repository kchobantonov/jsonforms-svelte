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

  const props: RendererProps<ControlElement> = $props();

  const input = useFlowbiteArrayControl(useJsonFormsArrayControl(props));

  let currentlyExpanded = $state<number | null>(input.appliedOptions.initCollapsed ? null : 0);
  let suggestToDelete = $state<number | null>(null);

  // Computed values
  const dataLength = $derived(input.control.data ? input.control.data.length : 0);
  const hideAvatar = $derived(!!input.appliedOptions.hideAvatar);

  // indicate to our child renderers that we are increasing the "nested" level
  useNested('array');

  const addDisabled = $derived(
    !input.control.enabled ||
      (input.appliedOptions.restrict &&
        input.control.arraySchema?.maxItems !== undefined &&
        dataLength >= input.control.arraySchema.maxItems),
  );

  const foundUISchema = $derived(
    findUISchema(
      input.control.uischemas,
      input.control.schema,
      input.control.uischema.scope,
      input.control.path,
      undefined,
      input.control.uischema,
      input.control.rootSchema,
    ),
  );

  // Methods
  function addButtonClick() {
    input.addItem(
      input.control.path,
      createDefaultValue(input.control.schema, input.control.rootSchema),
    )();
    if (!input.appliedOptions.collapseNewItems && input.control.data?.length) {
      currentlyExpanded = dataLength - 1;
    }
  }

  function moveUpClick(event: Event, toMove: number) {
    event.stopPropagation();
    input.moveUp?.(input.control.path, toMove)();
  }

  function moveDownClick(event: Event, toMove: number) {
    event.stopPropagation();
    input.moveDown?.(input.control.path, toMove)();
  }

  function removeItemsClick(toDelete: number[] | null) {
    if (toDelete !== null) {
      input.removeItems?.(input.control.path, toDelete)();
    }
  }

  function childErrors(index: number): ErrorObject[] {
    return input.control.childErrors.filter((e) => {
      const errorDataPath = getControlPath(e);
      return errorDataPath.startsWith(composePaths(input.control.path, `${index}`));
    });
  }

  function childLabelForIndex(index: number): string {
    return input.childLabelForIndex?.(index) || `Item ${index + 1}`;
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
    const flowbiteProps = input.flowbiteProps('Card');

    return {
      ...flowbiteProps,

      class: twMerge(
        'mt-1',
        'mb-1',
        'min-w-full',
        input.styles.arrayList.root,
        flowbiteProps.class,
      ),
    };
  });
</script>

{#if input.control.visible}
  <Card {...cardProps}>
    <div
      class={`flex items-center justify-between pt-2 pr-4 pb-2 pl-4  ${input.styles.arrayList.toolbar || ''}`}
    >
      <div class={`flex items-center gap-2 ${input.styles.arrayList.title || ''}`}>
        <Heading tag="h3" class={`text-lg font-semibold ${input.styles.arrayList.label || ''}`}>
          {input.computedLabel}
        </Heading>
        {#if input.control.childErrors.length > 0 && !input.appliedOptions.hideArraySummaryValidation}
          <ValidationIcon
            errors={input.control.childErrors}
            class={input.styles.arrayList.validationIcon}
          ></ValidationIcon>
        {/if}
      </div>

      <Button
        color="primary"
        size="sm"
        disabled={addDisabled}
        onclick={addButtonClick}
        aria-label={input.control.translations?.addAriaLabel || 'Add item'}
        class={input.styles.arrayList?.addButton || ''}
      >
        <PlusOutline class="h-4 w-4" />
      </Button>
      <Tooltip>
        <Span>{input.control.translations?.addTooltip || 'Add item'}</Span>
      </Tooltip>
    </div>

    <div class="pr-4 pl-4">
      {#if dataLength > 0}
        <Accordion flush>
          {#each input.control.data as element, index (composePaths(input.control.path, `${index}`))}
            <AccordionItem open={currentlyExpanded === index} class="border-b last:border-b-0">
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
                  {#if input.appliedOptions.showSortButtons}
                    <Button
                      color="alternative"
                      size="xs"
                      disabled={index <= 0 || !input.control.enabled}
                      onclick={(e: Event) => moveUpClick(e, index)}
                      aria-label={input.control.translations?.upAriaLabel || 'Move up'}
                    >
                      <ChevronUpOutline class="h-3 w-3" />
                    </Button>
                    <Tooltip>
                      <Span>{input.control.translations?.up || 'Move up'}</Span>
                    </Tooltip>

                    <Button
                      color="alternative"
                      size="xs"
                      disabled={index >= dataLength - 1 || !input.control.enabled}
                      onclick={(e: Event) => moveDownClick(e, index)}
                      aria-label={input.control.translations?.downAriaLabel || 'Move down'}
                    >
                      <ChevronDownOutline class="h-3 w-3" />
                    </Button>
                    <Tooltip>
                      <Span>{input.control.translations?.down || 'Move down'}</Span>
                    </Tooltip>
                  {/if}

                  <Button
                    color="red"
                    size="xs"
                    disabled={!input.control.enabled ||
                      (input.appliedOptions.restrict &&
                        input.control.arraySchema?.minItems !== undefined &&
                        dataLength <= input.control.arraySchema.minItems)}
                    onclick={(e: Event) => {
                      e.stopPropagation();
                      openDeleteDialog(index);
                    }}
                    aria-label={input.control.translations?.removeAriaLabel || 'Remove item'}
                  >
                    <TrashBinOutline class="h-3 w-3" />
                  </Button>
                  <Tooltip>
                    <Span>{input.control.translations?.removeTooltip || 'Remove item'}</Span>
                  </Tooltip>
                </div>
              {/snippet}

              <div class="p-4">
                <DispatchRenderer
                  schema={input.control.schema}
                  uischema={foundUISchema}
                  path={composePaths(input.control.path, `${index}`)}
                  enabled={input.control.enabled}
                  renderers={input.control.renderers}
                  cells={input.control.cells}
                />
              </div>
            </AccordionItem>
          {/each}
        </Accordion>
      {:else}
        <P class="text-center {input.styles.arrayList?.noData || ''}">
          {input.control.translations?.noDataMessage || 'No data'}
        </P>
      {/if}
    </div>
  </Card>

  <Modal open={suggestToDelete !== null} size="sm" autoclose={false} outsideclose>
    <div class="text-center">
      <ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
      <Heading tag="h3" class="text-lg font-semibold">
        {input.control.translations?.deleteDialogTitle || 'Delete item?'}
      </Heading>
      <P class="mb-5 text-center text-sm">
        {input.control.translations?.deleteDialogMessage ||
          'Are you sure you want to delete this item?'}
      </P>
      <div class="flex justify-center gap-4">
        <Button color="alternative" onclick={closeDeleteDialog}>
          {input.control.translations?.deleteDialogDecline || 'Cancel'}
        </Button>
        <Button color="red" onclick={confirmDelete}>
          {input.control.translations?.deleteDialogAccept || 'Delete'}
        </Button>
      </div>
    </div>
  </Modal>
{/if}
