<script lang="ts">
  import {
    CollectionItem,
    arrayChildErrorCount,
    arrayChildNotice,
    showArraySortButtons,
  } from '@chobantonov/jsonforms-svelte';
  import { tick } from 'svelte';
  import { useCollectionAction } from '@chobantonov/jsonforms-svelte';
  import RowDetailToggle from '../components/RowDetailToggle.svelte';
  import { useDeletionConfirmation } from '@chobantonov/jsonforms-svelte';
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import {
    DispatchCell,
    LiteralControl,
    useCollectionPagination,
    dataPathSegments,
    collectionErrorPositions,
    scopeDataSegments,
    resolveTableColumns,
    useTableColumnWidths,
    TableColumnResize,
    RowDetailDialog,
    useRowDetailPanel,
    useRendererMessages,
    useArrayPanelState,
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
  import { useFlowbiteArrayControl } from '../util';

  import CollectionPager from '../components/CollectionPager.svelte';
  import DetailDialog from '../components/DetailDialog.svelte';
  import SectionIndicators from '../layouts/SectionIndicators.svelte';
  import RowDetailFrame from '../components/RowDetailFrame.svelte';

  const props: RendererProps<ControlElement> = $props();
  const controlPathSegments = $derived([
    ...(props.pathSegments ?? dataPathSegments(props.path)),
    ...scopeDataSegments(props.uischema.scope),
  ]);
  const jsonforms = useJsonForms();
  const binding = useFlowbiteArrayControl(useJsonFormsArrayControl(props));
  const panel = useArrayPanelState(
    () => binding.control.uischema.options,
    () => binding.control.config,
  );
  const panelContentId = $props.id();

  // Derived states
  const showSortButtons = $derived(showArraySortButtons(binding.appliedOptions));
  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);
  let selectedRowKeys = $state<string[]>([]);
  const selectedIndices = $derived(
    binding.control.rowKeys.flatMap((key, index) => (selectedRowKeys.includes(key) ? [index] : [])),
  );

  const keys = $derived(Array.from({ length: dataLength }, (_, index) => index));
  const errorPositions = $derived(
    collectionErrorPositions(jsonforms.core, controlPathSegments, keys),
  );
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
      return errorPositions;
    },
    kind: 'array',
  });

  const message = useRendererMessages();
  const childErrorCount = $derived(
    arrayChildErrorCount(
      binding.control.childErrors,
      controlPathSegments,
      binding.appliedOptions.showValidationIndicatorCount === true,
    ),
  );
  const firstInvalidIndex = $derived(errorPositions[0]?.index);
  let noticeElement = $state<HTMLParagraphElement>();
  async function revealFirstError() {
    const index = firstInvalidIndex;
    if (index === undefined || !page.change(Math.floor(index / page.size) + 1)) return;
    if (panel.collapsed) panel.toggle();
    if (rowPanel) rowDetail.select(index, true);
    await tick();
    const row = noticeElement?.parentElement?.querySelector<HTMLElement>(
      `[data-array-row-index="${index}"]`,
    );
    row?.scrollIntoView({ block: 'center' });
    if (rowDialog) {
      const label = message('collection.editRowDetails', { index: index + 1 });
      const trigger = [...(row?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find(
        (button) => button.getAttribute('aria-label') === label,
      );
      if (trigger) {
        trigger.click();
        return;
      }
    }
    row?.focus({ preventScroll: true });
  }
  const rowDetail = useRowDetailPanel({
    options: () => binding.control.uischema.options?.rowDetail,
    rows: () => binding.control.data,
    keys: () => binding.control.rowKeys,
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
  const selectable = $derived(
    binding.control.enabled && binding.appliedOptions.disableRemove !== true,
  );
  const canDeleteSelected = $derived(
    selectable &&
      selectedIndices.length > 0 &&
      (!binding.appliedOptions.restrict ||
        dataLength - selectedIndices.length >= (binding.control.arraySchema?.minItems ?? 0)),
  );
  const pageSelected = $derived(
    page.indices.length > 0 &&
      page.indices.every((index) => selectedRowKeys.includes(binding.control.rowKeys[index])),
  );
  const pagePartiallySelected = $derived(
    !pageSelected &&
      page.indices.some((index) => selectedRowKeys.includes(binding.control.rowKeys[index])),
  );

  function selectPage(checked: boolean) {
    const visibleKeys = page.indices.map((index) => binding.control.rowKeys[index]);
    selectedRowKeys = checked
      ? [...new Set([...selectedRowKeys, ...visibleKeys])]
      : selectedRowKeys.filter((key) => !visibleKeys.includes(key));
  }

  function selectRow(index: number, checked: boolean) {
    const key = binding.control.rowKeys[index];
    selectedRowKeys = checked
      ? [...new Set([...selectedRowKeys, key])]
      : selectedRowKeys.filter((selected) => selected !== key);
  }

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
      binding.control.schema.properties && !wholeRow(propName)
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
    if (wholeRow(propName)) return binding.control.schema;
    if (propName === '' && Object.hasOwn(binding.control.schema.properties ?? {}, ''))
      return binding.control.schema.properties![''];
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
        !!showSortButtons &&
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
      () => {
        binding.removeItems?.(
          binding.control.path,
          [...indices].sort((a, b) => b - a),
        )();
        selectedRowKeys = [];
      },
      allowed,
    );
  }

  function deleteSelected(event: Event) {
    if (canDeleteSelected) removeItemsClick(event, selectedIndices);
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
    <p role="alert" data-array-own-errors class="my-2 text-sm text-red-600 dark:text-red-400">
      {binding.control.errors}
    </p>
  {/if}
  {#if childErrorCount > 0 && !binding.appliedOptions.hideArraySummaryValidation && binding.appliedOptions.showValidationIndicator !== false && binding.appliedOptions.showValidationIndicator !== true}
    <p
      bind:this={noticeElement}
      role="alert"
      data-array-summary
      class="my-2 text-sm text-red-600 dark:text-red-400"
    >
      <span data-array-summary-message
        >{arrayChildNotice(
          childErrorCount,
          binding.appliedOptions.showValidationIndicatorCount === true,
          message,
        )}</span
      >
      {#if firstInvalidIndex !== undefined}
        <button type="button" class="ms-2 underline" onclick={revealFirstError}
          >{message('collection.firstError')}</button
        >
      {/if}
    </p>
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
        {#if binding.appliedOptions.showValidationIndicator !== false && (binding.control.errors || (!binding.appliedOptions.hideArraySummaryValidation && binding.appliedOptions.showValidationIndicator === true))}
          <SectionIndicators
            uischema={binding.control.uischema}
            path={props.path}
            pathSegments={props.pathSegments}
            errorMessage={binding.control.errors}
            errorSource="array"
            showData={false}
          />
        {/if}
      </div>
      <div class="flex items-center gap-2" data-array-actions>
        {#if panel.collapsible}
          <Button
            color="alternative"
            size="sm"
            data-array-panel-toggle
            aria-label={message(panel.collapsed ? 'tree.expand' : 'tree.collapse', {
              label: binding.computedLabel,
            })}
            aria-expanded={!panel.collapsed}
            aria-controls={panelContentId}
            onclick={panel.toggle}
          >
            {#if panel.collapsed}<ChevronDownOutline class="h-4 w-4" />{:else}<ChevronUpOutline
                class="h-4 w-4"
              />{/if}
          </Button>
        {/if}
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
          color="red"
          size="sm"
          data-delete-selected
          disabled={!canDeleteSelected}
          onclick={deleteSelected}
          aria-label={message('collection.deleteSelected')}
          title={message('collection.deleteSelected')}><TrashBinOutline class="h-4 w-4" /></Button
        >
        <Tooltip>
          <Span>{message('collection.deleteSelected')}</Span>
        </Tooltip>
        <Button
          color="primary"
          size="sm"
          disabled={addDisabled}
          onclick={addButtonClick}
          aria-label={binding.control.translations?.addAriaLabel ?? message('array.addAriaLabel')}
          title={binding.control.translations?.addTooltip ?? message('array.addTooltip')}
          class={binding.styles.arrayList?.addButton || ''}
        >
          <PlusOutline class="h-4 w-4" />
        </Button>
        <Tooltip>
          <Span>{binding.control.translations?.addTooltip ?? message('array.addTooltip')}</Span>
        </Tooltip>
      </div>
    </div>

    <div id={panelContentId} hidden={panel.collapsed}>
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
                  <TableHeadCell scope="col" class="w-8 px-2 text-center" data-column-selection>
                    <input
                      type="checkbox"
                      class="text-primary-600 focus:ring-primary-500 size-4 rounded border-gray-300"
                      aria-label={message('collection.selectPage')}
                      checked={pageSelected}
                      indeterminate={pagePartiallySelected}
                      disabled={!selectable || page.indices.length === 0}
                      onchange={(event) => selectPage(event.currentTarget.checked)}
                    />
                  </TableHeadCell>
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
                  {#if showSortButtons}
                    <TableHeadCell class="w-[100px] text-center"></TableHeadCell>
                  {/if}
                </TableHead>
              {/if}

              <TableBody>
                {#each page.indices as index (binding.control.rowKeys[index])}
                  <CollectionItem
                    identity={binding.control.rowKeys[index]}
                    path={composePaths(binding.control.path, `${index}`)}
                    sourceItem={binding.control.data[index]}
                  >
                    <TableBodyRow
                      data-array-row-index={index}
                      tabindex={-1}
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
                          !(event.target as Element).closest(
                            'button, a, [role="button"], input[type="checkbox"], [role="checkbox"]',
                          )
                        )
                          rowDetail.select(index);
                      }}
                    >
                      <TableBodyCell class="w-8 px-2 text-center" data-row-selection>
                        <input
                          type="checkbox"
                          class="text-primary-600 focus:ring-primary-500 size-4 rounded border-gray-300"
                          aria-label={message('collection.selectRow', { index: index + 1 })}
                          checked={selectedRowKeys.includes(binding.control.rowKeys[index])}
                          disabled={!selectable}
                          onchange={(event) => selectRow(index, event.currentTarget.checked)}
                        />
                      </TableBodyCell>
                      {#each validColumnProps as propName (propName)}
                        <TableBodyCell
                          style={columnStyle(propName)}
                          class="overflow-hidden px-4 py-2"
                        >
                          {#if !wholeRow(propName) && (propName === '' || propName.includes('.') || propName.includes('\0') || ['__proto__', 'constructor', 'prototype'].includes(propName))}
                            <LiteralControl
                              schema={binding.control.schema}
                              uischema={resolveUiSchema(propName)}
                              path={composePaths(binding.control.path, `${index}`)}
                              enabled={binding.control.enabled}
                              renderers={binding.control.renderers}
                              cells={binding.control.cells}
                              cellMode
                            />
                          {:else}
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
                          {/if}
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
                      {#if showSortButtons}
                        <TableBodyCell class="w-[100px] px-4 py-2 text-center">
                          <div class="flex items-center justify-center gap-1">
                            {#if showSortButtons}
                              <Button
                                color="alternative"
                                size="xs"
                                disabled={index <= 0 || !binding.control.enabled}
                                onclick={(e: MouseEvent) => moveUpClick(e, index)}
                                aria-label={binding.control.translations?.upAriaLabel ??
                                  message('array.upAriaLabel')}
                                title={binding.control.translations?.up ?? message('array.up')}
                                class={binding.styles.arrayList?.itemMoveUp || ''}
                              >
                                <ChevronUpOutline class="h-3 w-3" />
                              </Button>
                              <Tooltip>
                                <Span
                                  >{binding.control.translations?.up ?? message('array.up')}</Span
                                >
                              </Tooltip>

                              <Button
                                color="alternative"
                                size="xs"
                                disabled={index >= dataLength - 1 || !binding.control.enabled}
                                onclick={(e: MouseEvent) => moveDownClick(e, index)}
                                aria-label={binding.control.translations?.downAriaLabel ??
                                  message('array.downAriaLabel')}
                                title={binding.control.translations?.down ?? message('array.down')}
                                class={binding.styles.arrayList?.itemMoveDown || ''}
                              >
                                <ChevronDownOutline class="h-3 w-3" />
                              </Button>
                              <Tooltip>
                                <Span
                                  >{binding.control.translations?.down ??
                                    message('array.down')}</Span
                                >
                              </Tooltip>
                            {/if}
                          </div>
                        </TableBodyCell>
                      {/if}
                    </TableBodyRow>
                  </CollectionItem>
                {/each}
                {#if dataLength == 0}
                  <TableBodyRow class={binding.styles.arrayList?.item || ''}>
                    <TableBodyCell
                      class="px-4 text-center"
                      colspan={validColumnProps.length +
                        1 +
                        (rowDetail.options ? 1 : 0) +
                        (showSortButtons ? 1 : 0)}
                    >
                      <P class="text-center {binding.styles.arrayList?.noData || ''}">
                        {binding.control.translations?.noDataMessage ??
                          message('array.noDataMessage')}
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
    </div>
  </Card>
{/if}

{#if deletion.pending && binding.control.visible}
  <ConfirmationDialog
    operation="delete"
    title={message('collection.deleteSelected')}
    description={message('collection.deleteSelectedMessage')}
    acceptLabel={message('collection.deleteSelected')}
    onAccept={deletion.accept}
    onCancel={deletion.cancel}
  />
{/if}
