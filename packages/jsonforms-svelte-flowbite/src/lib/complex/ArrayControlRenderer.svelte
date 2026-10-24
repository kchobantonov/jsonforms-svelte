<script lang="ts">
  import { useCollectionAction } from '@chobantonov/jsonforms-svelte';
  import RowDetailToggle from '../components/RowDetailToggle.svelte';
  import { useDeletionConfirmation } from '@chobantonov/jsonforms-svelte';
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import {
    DispatchCell,
    useCollectionPagination,
    collectionErrorPositions,
    resolveTableColumns,
    useTableColumnWidths,
    TableColumnResize,
    RowDetailDialog,
    useRowDetailPanel,
    useRendererMessages,
    useJsonForms,
    useJsonFormsArrayControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    composePaths,
    getI18nKey,
    createDefaultValue,
    Resolve,
    type ControlElement,
    type JsonSchema,
  } from '@jsonforms/core';
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

  import CollectionPager from '../components/CollectionPager.svelte';
  import DetailDialog from '../components/DetailDialog.svelte';
  import RowDetailFrame from '../components/RowDetailFrame.svelte';

  const props: RendererProps<ControlElement> = $props();
  const jsonforms = useJsonForms();
  const binding = useFlowbiteArrayControl(useJsonFormsArrayControl(props));

  // Derived states
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
  });

  const message = useRendererMessages();
  const rowDetail = useRowDetailPanel({
    options: () => binding.control.uischema.options?.rowDetail,
    rows: () => binding.control.data,
    prepare: page.prepare,
  });
  const rowDialog = $derived(
    rowDetail.options?.presentation === 'dialog' ? rowDetail.options : undefined,
  );
  const rowPanel = $derived(rowDetail.options?.presentation === 'panel');

  const tableColumns = $derived(
    resolveTableColumns(binding.control.schema, binding.control.uischema.options?.columnDefs),
  );
  const validColumnProps = $derived(tableColumns.map((column) => column.field));
  const wholeRow = (field: string) =>
    tableColumns.find((column) => column.field === field)?.scope === '#';
  const columnWidths = useTableColumnWidths(() => tableColumns);
  const columnStyle = columnWidths.style;

  const addDisabled = $derived(
    binding.appliedOptions.disableAdd === true ||
      !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema !== undefined &&
        binding.control.arraySchema.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );

  function title(prop: string): string {
    const schema = resolveCellSchema(prop);
    const fallback = schema.title ?? (prop ? startCase(prop) : binding.computedLabel);
    const key = getI18nKey(schema, undefined, composePaths(binding.control.path, prop), 'label');
    return jsonforms.i18n?.translate?.(key, fallback, { schema }) ?? fallback;
  }

  function showAsterisk(prop: string): boolean {
    return binding.control.schema.required?.includes(prop) ?? false;
  }

  function resolveUiSchema(propName: string): ControlElement {
    const scope =
      binding.control.schema.properties && propName && !wholeRow(propName)
        ? `#/properties/${propName.replaceAll('~', '~0').replaceAll('/', '~1')}`
        : '#';
    return {
      type: 'Control',
      scope,
      label: false,
      options: binding.control.uischema.options?.cells?.[propName],
    };
  }

  function resolveCellSchema(propName: string): JsonSchema {
    if (!propName || wholeRow(propName)) return binding.control.schema;
    return (
      Resolve.schema(
        binding.control.schema,
        `#/properties/${propName.replaceAll('~', '~0').replaceAll('/', '~1')}`,
        binding.control.rootSchema,
      ) ??
      binding.control.schema.properties?.[propName] ??
      binding.control.schema
    );
  }

  // Actions
  const runCollectionAction = useCollectionAction(() => binding.control, page.prepare);

  function addButtonClick() {
    void runCollectionAction(
      () => !addDisabled,
      () => {
        binding.addItem(
          binding.control.path,
          createDefaultValue(binding.control.schema, binding.control.rootSchema),
        )();
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
    'arrayTable',
    () => page.prepare(),
  );

  function removeItemsClick(event: Event, toDelete: number[]) {
    event.stopPropagation();
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

  function isDeleteDisabled(): boolean | undefined {
    return (
      binding.appliedOptions.disableRemove === true ||
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
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class="my-2 text-sm">{binding.control.errors}</p>
  {/if}
  <Card {...cardProps}>
    <div
      class="flex items-center justify-between pt-2 pr-4 pb-2 pl-4 {binding.styles.arrayList
        .toolbar || ''}"
    >
      <div class={`flex items-center gap-2 ${binding.styles.arrayList.title || ''}`}>
        <Heading tag="h3" class="text-lg font-semibold {binding.styles.arrayList.label || ''}">
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
      <div class="flex items-center gap-2" data-array-actions>
        {#if rowPanel}
          <RowDetailToggle
            open={rowDetail.panelOpen}
            disabled={false}
            onclick={rowDetail.toggle}
            label={message(
              rowDetail.panelOpen ? 'collection.hideDetails' : 'collection.showDetails',
            )}
          />
        {/if}
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
    </div>

    <RowDetailFrame
      panel={rowDetail}
      schema={binding.control.schema}
      path={binding.control.path}
      scope={binding.control.uischema.scope}
      enabled={binding.control.enabled}
      height={binding.control.uischema.options?.layout?.height}
    >
      <div class="pr-4 pl-4">
        <div class="w-full overflow-x-auto">
          <Table hoverable={true} {...tableProps} style={columnWidths.tableStyle}>
            {#if tableColumns.length > 0 || rowDetail.options}
              <TableHead>
                {#each validColumnProps as prop (prop)}
                  <TableHeadCell
                    scope="col"
                    data-column-field={prop}
                    style={`position:relative;${columnStyle(prop)}`}
                  >
                    {title(prop)}{#if showAsterisk(prop)}<Span
                        aria-hidden="true"
                        class={binding.styles?.control?.asterisk ??
                          'text-red-600 dark:text-red-400'}>*</Span
                      >
                    {/if}
                    <TableColumnResize
                      label={title(prop)}
                      width={columnWidths.get(prop)}
                      minWidth={tableColumns.find((column) => column.field === prop)?.minWidth}
                      maxWidth={tableColumns.find((column) => column.field === prop)?.maxWidth}
                      onresizestart={columnWidths.start}
                      onresize={(width) => columnWidths.set(prop, width)}
                    />
                  </TableHeadCell>
                {/each}
                {#if rowDetail.options}<TableHeadCell></TableHeadCell>{/if}
                {#if binding.control.enabled}
                  <TableHeadCell
                    class={`text-center ${binding.appliedOptions.showSortButtons ? 'w-[150px]' : 'w-[50px]'}`}
                  ></TableHeadCell>
                {/if}
              </TableHead>
            {/if}

            <TableBody>
              {#each page.indices as index (index)}
                <TableBodyRow
                  class={twMerge(
                    binding.styles.arrayList?.item,
                    rowDetail.visible &&
                      rowDetail.selectedIndex === index &&
                      'bg-gray-100 dark:bg-gray-700',
                  )}
                  aria-current={rowDetail.visible && rowDetail.selectedIndex === index
                    ? 'true'
                    : undefined}
                  onpointerup={(event: PointerEvent) => {
                    if (
                      rowPanel &&
                      event.button === 0 &&
                      !(event.target as Element).closest('button, a, [role="button"]')
                    )
                      rowDetail.select(index);
                  }}
                >
                  {#each validColumnProps as propName (propName)}
                    <TableBodyCell style={columnStyle(propName)} class="overflow-hidden px-4 py-2">
                      <DispatchCell
                        schema={resolveCellSchema(propName)}
                        uischema={resolveUiSchema(propName)}
                        path={composePaths(
                          composePaths(binding.control.path, `${index}`),
                          wholeRow(propName) ? '' : propName,
                        )}
                        enabled={binding.control.enabled}
                        renderers={binding.control.renderers}
                        cells={binding.control.cells}
                      />
                    </TableBodyCell>
                  {/each}
                  {#if rowDialog}
                    <TableBodyCell class="px-4 py-2">
                      <RowDetailDialog
                        Dialog={DetailDialog}
                        schema={binding.control.schema}
                        path={composePaths(binding.control.path, `${index}`)}
                        scope={binding.control.uischema.scope}
                        options={rowDialog}
                        enabled={binding.control.enabled}
                        {index}
                        prepare={page.prepare}
                      />
                    </TableBodyCell>
                  {:else if rowPanel}
                    <TableBodyCell class="px-4 py-2">
                      <Button
                        type="button"
                        color="alternative"
                        size="sm"
                        onclick={() => rowDetail.select(index, true)}
                        >{message('collection.editRowDetails', { index: index + 1 })}</Button
                      >
                    </TableBodyCell>
                  {/if}
                  {#if binding.control.enabled}
                    <TableBodyCell
                      class={`px-4 py-2 text-center ${binding.appliedOptions.showSortButtons ? 'w-[150px]' : 'w-[50px]'}`}
                    >
                      <div class="flex items-center justify-center gap-1">
                        {#if binding.appliedOptions.showSortButtons}
                          <Button
                            color="alternative"
                            size="xs"
                            disabled={index <= 0 || !binding.control.enabled}
                            onclick={(e: MouseEvent) => moveUpClick(e, index)}
                            aria-label={binding.control.translations?.upAriaLabel ?? 'Move up'}
                            class={binding.styles.arrayList?.itemMoveUp || ''}
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
                            onclick={(e: MouseEvent) => moveDownClick(e, index)}
                            aria-label={binding.control.translations?.downAriaLabel ?? 'Move down'}
                            class={binding.styles.arrayList?.itemMoveDown || ''}
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
                          disabled={isDeleteDisabled()}
                          onclick={(e: MouseEvent) => removeItemsClick(e, [index])}
                          aria-label={binding.control.translations?.removeAriaLabel ??
                            'Delete item'}
                          class={binding.styles.arrayList?.itemDelete || ''}
                        >
                          <TrashBinOutline class="h-3 w-3" />
                        </Button>
                        <Tooltip>
                          <Span>{binding.control.translations?.removeTooltip ?? 'Delete'}</Span>
                        </Tooltip>
                      </div>
                    </TableBodyCell>
                  {/if}
                </TableBodyRow>
              {/each}
              {#if dataLength == 0}
                <TableBodyRow class={binding.styles.arrayList?.item || ''}>
                  <TableBodyCell
                    class="px-4 text-center"
                    colspan={validColumnProps.length +
                      (rowDetail.options ? 1 : 0) +
                      (binding.control.enabled ? 1 : 0)}
                  >
                    <P class="text-center {binding.styles.arrayList?.noData || ''}">
                      {binding.control.translations?.noDataMessage ?? 'No data'}
                    </P>
                  </TableBodyCell>
                </TableBodyRow>
              {/if}
            </TableBody>
          </Table>
        </div>
      </div>
      <CollectionPager {page} />
    </RowDetailFrame>
  </Card>
{/if}

{#if deletion.pending && binding.control.visible}
  <ConfirmationDialog operation="delete" onAccept={deletion.accept} onCancel={deletion.cancel} />
{/if}
