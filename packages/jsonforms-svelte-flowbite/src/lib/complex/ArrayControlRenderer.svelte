<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsArrayControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import { composePaths, createDefaultValue, type ControlElement } from '@jsonforms/core';
  import {
    Button,
    Card,
    Heading,
    P,
    Span,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Tooltip,
  } from 'flowbite-svelte';
  import {
    ChevronDownOutline,
    ChevronUpOutline,
    PlusOutline,
    TrashBinOutline,
  } from 'flowbite-svelte-icons';
  import startCase from 'lodash/startCase';
  import { twMerge } from 'tailwind-merge';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useFlowbiteArrayControl } from '../util';

  const props: RendererProps<ControlElement> = $props();
  const binding = useFlowbiteArrayControl(useJsonFormsArrayControl(props));

  // Derived states
  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);

  const validColumnProps = $derived.by(() => {
    if (
      binding.control.schema.type === 'object' &&
      typeof binding.control.schema.properties === 'object'
    ) {
      return Object.keys(binding.control.schema.properties).filter(
        (prop) => binding.control.schema.properties![prop].type !== 'array',
      );
    }
    // primitives
    return [''];
  });

  const addDisabled = $derived(
    !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema !== undefined &&
        binding.control.arraySchema.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );

  function title(prop: string): string {
    return binding.control.schema.properties?.[prop]?.title ?? startCase(prop);
  }

  function showAsterisk(prop: string): boolean {
    return binding.control.schema.required?.includes(prop) ?? false;
  }

  function resolveUiSchema(propName: string): ControlElement {
    const scope = binding.control.schema.properties && propName ? `#/properties/${propName}` : '#';
    return { type: 'Control', scope: scope, label: false };
  }

  // Actions
  function addButtonClick() {
    binding.addItem(
      binding.control.path,
      createDefaultValue(binding.control.schema, binding.control.rootSchema),
    )();
  }

  function moveUpClick(event: Event, toMove: number) {
    event.stopPropagation();
    binding.moveUp?.(binding.control.path, toMove)();
  }

  function moveDownClick(event: Event, toMove: number) {
    event.stopPropagation();
    binding.moveDown?.(binding.control.path, toMove)();
  }

  function removeItemsClick(event: Event, toDelete: number[]) {
    event.stopPropagation();
    binding.removeItems?.(binding.control.path, toDelete)();
  }

  function isDeleteDisabled(index: number): boolean {
    return (
      !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema !== undefined &&
        binding.control.arraySchema.minItems !== undefined &&
        dataLength <= binding.control.arraySchema.minItems)
    );
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

  const tableProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Table');

    return {
      ...flowbiteProps,

      class: twMerge('w-full', flowbiteProps.class),
    };
  });
</script>

{#if binding.control.visible}
  <Card {...cardProps}>
    <div
      class="flex items-center justify-between pt-2 pr-4 pb-2 pl-4 {binding.styles.arrayList
        .toolbar || ''}"
    >
      <div class={`flex items-center gap-2 ${binding.styles.arrayList.title || ''}`}>
        <Heading tag="h3" class="text-lg font-semibold {binding.styles.arrayList.label || ''}">
          {binding.computedLabel}
        </Heading>
        {#if binding.control.childErrors.length > 0 && !binding.appliedOptions.hideArraySummaryValidation}
          <ValidationIcon
            errors={binding.control.childErrors}
            class={binding.styles.arrayList.validationIcon}
          ></ValidationIcon>
        {/if}
      </div>
      <Button
        size="sm"
        color="primary"
        disabled={addDisabled}
        onclick={addButtonClick}
        aria-label={binding.control.translations?.addAriaLabel || 'Add item'}
        class={binding.styles.arrayList?.addButton || ''}
      >
        <PlusOutline class="h-4 w-4" />
      </Button>
      <Tooltip>
        <Span>{binding.control.translations?.addTooltip || 'Add item'}</Span>
      </Tooltip>
    </div>

    <div class="pr-4 pl-4">
      <div class="w-full overflow-x-auto">
        <Table hoverable={true} {...tableProps}>
          {#if binding.control.schema.type === 'object'}
            <TableHead>
              {#each validColumnProps as prop, index (prop)}
                <TableHeadCell>
                  {title(prop)}{#if showAsterisk(prop)}<span
                      class={binding.styles?.control?.asterisk ?? 'text-red-600 dark:text-red-400 '}
                      >*</span
                    >
                  {/if}
                </TableHeadCell>
              {/each}
              {#if binding.control.enabled}
                <TableHeadCell
                  class={`text-center ${binding.appliedOptions.showSortButtons ? 'w-[150px]' : 'w-[50px]'}`}
                ></TableHeadCell>
              {/if}
            </TableHead>
          {/if}

          <TableBody>
            {#each binding.control.data as element, index (index)}
              <TableBodyRow class={binding.styles.arrayList?.item || ''}>
                {#each validColumnProps as propName (propName)}
                  <TableBodyCell class="px-4 py-2">
                    <DispatchRenderer
                      schema={binding.control.schema}
                      uischema={resolveUiSchema(propName)}
                      path={composePaths(binding.control.path, `${index}`)}
                      enabled={binding.control.enabled}
                      renderers={binding.control.renderers}
                      cells={binding.control.cells}
                    />
                  </TableBodyCell>
                {/each}
                {#if binding.control.enabled}
                  <TableBodyCell
                    class={`px-4 py-2 text-center ${binding.appliedOptions.showSortButtons ? 'w-[150px]' : 'w-[50px]'}`}
                  >
                    <div class="flex items-center justify-center gap-1">
                      {#if binding.appliedOptions.showSortButtons}
                        <Button
                          size="xs"
                          color="alternative"
                          disabled={index <= 0 || !binding.control.enabled}
                          onclick={(e: MouseEvent) => moveUpClick(e, index)}
                          aria-label={binding.control.translations?.upAriaLabel || 'Move up'}
                          class={binding.styles.arrayList?.itemMoveUp || ''}
                        >
                          <ChevronUpOutline class="h-3 w-3" />
                        </Button>
                        <Tooltip>
                          <Span>{binding.control.translations?.up || 'Move up'}</Span>
                        </Tooltip>

                        <Button
                          size="xs"
                          color="alternative"
                          disabled={index >= dataLength - 1 || !binding.control.enabled}
                          onclick={(e: MouseEvent) => moveDownClick(e, index)}
                          aria-label={binding.control.translations?.downAriaLabel || 'Move down'}
                          class={binding.styles.arrayList?.itemMoveDown || ''}
                        >
                          <ChevronDownOutline class="h-3 w-3" />
                        </Button>
                        <Tooltip>
                          <Span>{binding.control.translations?.down || 'Move down'}</Span>
                        </Tooltip>
                      {/if}

                      <Button
                        size="xs"
                        color="red"
                        disabled={isDeleteDisabled(index)}
                        onclick={(e: MouseEvent) => removeItemsClick(e, [index])}
                        aria-label={binding.control.translations?.removeAriaLabel || 'Delete item'}
                        class={binding.styles.arrayList?.itemDelete || ''}
                      >
                        <TrashBinOutline class="h-3 w-3" />
                      </Button>
                      <Tooltip>
                        <Span>{binding.control.translations?.removeTooltip || 'Delete'}</Span>
                      </Tooltip>
                    </div>
                  </TableBodyCell>
                {/if}
              </TableBodyRow>
            {/each}
            {#if dataLength == 0}
              <TableBodyRow class={binding.styles.arrayList?.item || ''}>
                <TableBodyCell
                  class={`px-4 text-center`}
                  colspan={validColumnProps.length + (binding.control.enabled ? 1 : 0)}
                >
                  <P class="text-center {binding.styles.arrayList?.noData || ''}">
                    {binding.control.translations?.noDataMessage || 'No data'}
                  </P>
                </TableBodyCell>
              </TableBodyRow>
            {/if}
          </TableBody>
        </Table>
      </div>
    </div>
  </Card>
{/if}
