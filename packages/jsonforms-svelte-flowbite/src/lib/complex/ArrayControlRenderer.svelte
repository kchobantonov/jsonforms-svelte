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
  const input = useFlowbiteArrayControl(useJsonFormsArrayControl(props));

  // Derived states
  const dataLength = $derived(input.control.data ? input.control.data.length : 0);

  const validColumnProps = $derived.by(() => {
    if (
      input.control.schema.type === 'object' &&
      typeof input.control.schema.properties === 'object'
    ) {
      return Object.keys(input.control.schema.properties).filter(
        (prop) => input.control.schema.properties![prop].type !== 'array',
      );
    }
    // primitives
    return [''];
  });

  const addDisabled = $derived(
    !input.control.enabled ||
      (input.appliedOptions.restrict &&
        input.control.arraySchema !== undefined &&
        input.control.arraySchema.maxItems !== undefined &&
        dataLength >= input.control.arraySchema.maxItems),
  );

  function title(prop: string): string {
    return input.control.schema.properties?.[prop]?.title ?? startCase(prop);
  }

  function showAsterisk(prop: string): boolean {
    return input.control.schema.required?.includes(prop) ?? false;
  }

  function resolveUiSchema(propName: string): ControlElement {
    const scope = input.control.schema.properties && propName ? `#/properties/${propName}` : '#';
    return { type: 'Control', scope: scope, label: false };
  }

  // Actions
  function addButtonClick() {
    input.addItem(
      input.control.path,
      createDefaultValue(input.control.schema, input.control.rootSchema),
    )();
  }

  function moveUpClick(event: Event, toMove: number) {
    event.stopPropagation();
    input.moveUp?.(input.control.path, toMove)();
  }

  function moveDownClick(event: Event, toMove: number) {
    event.stopPropagation();
    input.moveDown?.(input.control.path, toMove)();
  }

  function removeItemsClick(event: Event, toDelete: number[]) {
    event.stopPropagation();
    input.removeItems?.(input.control.path, toDelete)();
  }

  function isDeleteDisabled(index: number): boolean {
    return (
      !input.control.enabled ||
      (input.appliedOptions.restrict &&
        input.control.arraySchema !== undefined &&
        input.control.arraySchema.minItems !== undefined &&
        dataLength <= input.control.arraySchema.minItems)
    );
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

  const tableProps = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Table');

    return {
      ...flowbiteProps,

      class: twMerge('w-full', flowbiteProps.class),
    };
  });
</script>

{#if input.control.visible}
  <Card {...cardProps}>
    <div
      class="flex items-center justify-between pt-2 pr-4 pb-2 pl-4 {input.styles.arrayList
        .toolbar || ''}"
    >
      <div class={`flex items-center gap-2 ${input.styles.arrayList.title || ''}`}>
        <Heading tag="h3" class="text-lg font-semibold {input.styles.arrayList.label || ''}">
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
        size="sm"
        color="primary"
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
      <div class="w-full overflow-x-auto">
        <Table hoverable={true} {...tableProps}>
          {#if input.control.schema.type === 'object'}
            <TableHead>
              {#each validColumnProps as prop, index (prop)}
                <TableHeadCell>
                  {title(prop)}{#if showAsterisk(prop)}<span
                      class={input.styles?.control?.asterisk ?? 'text-red-600 dark:text-red-400 '}
                      >*</span
                    >
                  {/if}
                </TableHeadCell>
              {/each}
              {#if input.control.enabled}
                <TableHeadCell
                  class={`text-center ${input.appliedOptions.showSortButtons ? 'w-[150px]' : 'w-[50px]'}`}
                ></TableHeadCell>
              {/if}
            </TableHead>
          {/if}

          <TableBody>
            {#each input.control.data as element, index (index)}
              <TableBodyRow class={input.styles.arrayList?.item || ''}>
                {#each validColumnProps as propName (propName)}
                  <TableBodyCell class="px-4 py-0">
                    <DispatchRenderer
                      schema={input.control.schema}
                      uischema={resolveUiSchema(propName)}
                      path={composePaths(input.control.path, `${index}`)}
                      enabled={input.control.enabled}
                      renderers={input.control.renderers}
                      cells={input.control.cells}
                    />
                  </TableBodyCell>
                {/each}
                {#if input.control.enabled}
                  <TableBodyCell
                    class={`px-4 py-0 text-center ${input.appliedOptions.showSortButtons ? 'w-[150px]' : 'w-[50px]'}`}
                  >
                    <div class="flex items-center justify-center gap-1">
                      {#if input.appliedOptions.showSortButtons}
                        <Button
                          size="xs"
                          color="alternative"
                          disabled={index <= 0 || !input.control.enabled}
                          onclick={(e: MouseEvent) => moveUpClick(e, index)}
                          aria-label={input.control.translations?.upAriaLabel || 'Move up'}
                          class={input.styles.arrayList?.itemMoveUp || ''}
                        >
                          <ChevronUpOutline class="h-3 w-3" />
                        </Button>
                        <Tooltip>
                          <Span>{input.control.translations?.up || 'Move up'}</Span>
                        </Tooltip>

                        <Button
                          size="xs"
                          color="alternative"
                          disabled={index >= dataLength - 1 || !input.control.enabled}
                          onclick={(e: MouseEvent) => moveDownClick(e, index)}
                          aria-label={input.control.translations?.downAriaLabel || 'Move down'}
                          class={input.styles.arrayList?.itemMoveDown || ''}
                        >
                          <ChevronDownOutline class="h-3 w-3" />
                        </Button>
                        <Tooltip>
                          <Span>{input.control.translations?.down || 'Move down'}</Span>
                        </Tooltip>
                      {/if}

                      <Button
                        size="xs"
                        color="red"
                        disabled={isDeleteDisabled(index)}
                        onclick={(e: MouseEvent) => removeItemsClick(e, [index])}
                        aria-label={input.control.translations?.removeAriaLabel || 'Delete item'}
                        class={input.styles.arrayList?.itemDelete || ''}
                      >
                        <TrashBinOutline class="h-3 w-3" />
                      </Button>
                      <Tooltip>
                        <Span>{input.control.translations?.removeTooltip || 'Delete'}</Span>
                      </Tooltip>
                    </div>
                  </TableBodyCell>
                {/if}
              </TableBodyRow>
            {/each}
            {#if dataLength == 0}
              <TableBodyRow class={input.styles.arrayList?.item || ''}>
                <TableBodyCell
                  class={`px-4 text-center`}
                  colspan={validColumnProps.length + (input.control.enabled ? 1 : 0)}
                >
                  <P class="text-center {input.styles.arrayList?.noData || ''}">
                    {input.control.translations?.noDataMessage || 'No data'}
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
