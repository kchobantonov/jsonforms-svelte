<script module lang="ts">
  import { createGridStyleInstaller } from '@chobantonov/jsonforms-svelte-extended';
  import runtimeStyles from './ag-grid.css?inline';
  const acquireRuntimeStyles = createGridStyleInstaller(
    'jsonforms-skeleton-ag-grid-runtime-styles',
    runtimeStyles,
  );
</script>

<script lang="ts">
  import {
    RowDetailToggle,
    DetailDialog,
    TupleAction,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { ConfirmationDialog } from '@chobantonov/jsonforms-svelte-skeleton';
  import {
    useDeletionConfirmation,
    useArrayPanelState,
    rendererArrayDefaults,
    useRendererMessages,
    dataPathSegments,
    scopeDataSegments,
    usePendingControlChanges,
    useJsonFormsArrayControl,
    useAuthoredConfig,
    resolveRestrict,
    mergeRendererOptions,
    type RendererProps,
    resolvePagination,
    arrayChildNotice,
    arrayChildErrorCount,
    collectionErrorPositions,
    useRowDetailPanel,
    RowDetailDialog,
    useCollectionAction,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ChevronDownIcon, ChevronUpIcon } from '@lucide/svelte';
  import { useJsonForms, useDispatch } from '@chobantonov/jsonforms-svelte';
  import {
    composePaths,
    computeLabel,
    createDefaultValue,
    defaultJsonFormsI18nState,
    getArrayTranslations,
    update,
    type LabelElement,
    type ControlElement,
  } from '@jsonforms/core';
  import type {
    CellEditRequestEvent,
    FilterChangedEvent,
    GridApi,
    GridOptions,
    GridState,
    RowDragEndEvent,
    RowClickedEvent,
    RowDataUpdatedEvent,
    SelectionChangedEvent,
    SortChangedEvent,
  } from 'ag-grid-community';
  import isEqual from 'lodash/isEqual';
  import { onMount, tick, untrack } from 'svelte';
  import { RowDetailFrame } from '@chobantonov/jsonforms-svelte-skeleton';
  import {
    AgGridHost,
    createGridCellProps,
    createGridRows,
    useGridColumns,
    splitCssSize,
    useLabelSummaryText,
  } from '@chobantonov/jsonforms-svelte-extended';
  import DispatchCellHost from './DispatchCellHost.svelte';
  import type { AgGridWrappedRow } from '../types.js';

  let { ...rendererProps }: RendererProps<ControlElement> = $props();
  const controlPathSegments = $derived([
    ...(rendererProps.pathSegments ?? dataPathSegments(rendererProps.path)),
    ...scopeDataSegments(rendererProps.uischema.scope),
  ]);
  const binding = useJsonFormsArrayControl(rendererProps);
  const panel = useArrayPanelState(
    () => binding.control.uischema.options,
    () => binding.control.config,
  );
  const panelContentId = $props.id();
  const authored = useAuthoredConfig();
  const jsonforms = useJsonForms();
  const dispatch = useDispatch();
  const message = useRendererMessages();
  const labelText = useLabelSummaryText(() =>
    Object.values(binding.control.uischema.options?.cells ?? {})
      .map((options) => (options as { summary?: LabelElement }).summary)
      .filter((summary): summary is LabelElement => summary?.type === 'Label'),
  );
  $effect(() => {
    const revision = labelText.revision;
    const api = gridApi;
    if (!revision) return;
    untrack(() => {
      if (!api || api.isDestroyed()) return;
      api.resetQuickFilter();
      api.refreshClientSideRowModel('filter');
      api.refreshCells({ force: true });
    });
  });

  const pending = usePendingControlChanges();
  const prepare = () => {
    pending.flush();
    return !pending.isBlocked();
  };
  const collectionAction = useCollectionAction(() => binding.control, prepare);
  const deletion = useDeletionConfirmation(
    () => ({ ...binding.control, options: binding.control.uischema.options }),
    'agGrid',
    prepare,
  );
  const rowDetail = useRowDetailPanel({
    options: () => binding.control.uischema.options?.rowDetail,
    rows: () => binding.control.data,
    keys: () => binding.control.rowKeys,
    prepare,
  });
  $effect(() => {
    void binding.control.childErrors;
    const api = gridApi;
    untrack(() => {
      if (api && !api.isDestroyed()) {
        api.refreshCells({ force: true, columns: ['$detail'] });
      }
    });
  });
  // Preserve native sorting, filtering, paging, widths and checkbox selection across pane toggles.
  let savedGridState: GridState | undefined;
  const highlightedIndex = $derived(rowDetail.visible ? rowDetail.selectedIndex : undefined);
  $effect(() => {
    void highlightedIndex;
    const api = gridApi;
    untrack(() => {
      if (api && !api.isDestroyed()) api.refreshCells({ force: true });
    });
  });
  let gridApi = $state<GridApi<AgGridWrappedRow> | null>(null);
  let selectedIndexes = $state<number[]>([]);
  let pendingAddedIndex = $state<number>();
  let addedHidden = $state(false);
  let sorted = $state(false);
  let filtered = $state(false);
  let sectionElement = $state<HTMLElement>();
  let gridOptionsCache:
    | {
        userOptions: GridOptions<AgGridWrappedRow>;
        enabled: boolean;
        readonly?: boolean;
        sorted: boolean;
        filtered: boolean;
        popupParent: HTMLElement | undefined;
        value: GridOptions<AgGridWrappedRow>;
      }
    | undefined;

  onMount(() => {
    const root = sectionElement?.getRootNode();
    const styleContainer = root instanceof ShadowRoot ? root : document.head;
    return acquireRuntimeStyles(styleContainer);
  });

  const appliedOptions = $derived.by(() =>
    mergeRendererOptions<
      Record<string, unknown> & { agGridOptions?: GridOptions<AgGridWrappedRow> }
    >(binding.control.config, binding.control.uischema.options, {
      restrict: resolveRestrict(binding.control.uischema.options, authored.value),
    }),
  );
  const childErrorCount = $derived(
    arrayChildErrorCount(
      binding.control.childErrors,
      controlPathSegments,
      appliedOptions.showValidationIndicatorCount === true,
    ),
  );
  const dataLength = $derived(
    Array.isArray(binding.control.data) ? binding.control.data.length : 0,
  );
  const firstInvalidIndex = $derived(
    collectionErrorPositions(
      jsonforms.core,
      controlPathSegments,
      Array.from({ length: dataLength }, (_, index) => index),
    )[0]?.index,
  );
  const computedLabel = $derived(
    computeLabel(
      binding.control.label,
      binding.control.required,
      Boolean(appliedOptions.hideRequiredAsterisk),
    ),
  );
  const translations = $derived(
    getArrayTranslations(
      jsonforms.i18n?.translate ?? defaultJsonFormsI18nState.translate,
      rendererArrayDefaults(message),
      binding.control.i18nKeyPrefix,
      binding.control.label,
    ),
  );
  const addDisabled = $derived(
    !binding.control.enabled ||
      binding.control.readonly ||
      appliedOptions.disableAdd === true ||
      (Boolean(appliedOptions.restrict) &&
        binding.control.arraySchema?.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );
  const removeDisabled = $derived(
    !binding.control.enabled ||
      binding.control.readonly ||
      appliedOptions.disableRemove === true ||
      selectedIndexes.length === 0 ||
      (Boolean(appliedOptions.restrict) &&
        binding.control.arraySchema?.minItems !== undefined &&
        dataLength - selectedIndexes.length < binding.control.arraySchema.minItems),
  );
  const gridRows = createGridRows();
  const rows = $derived(gridRows(binding.control.data, binding.control.rowKeys));

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  function configureCellOptions(options: Record<string, unknown>) {
    options.nativeSelect = true;
    const skeleton = isRecord(options.skeleton) ? options.skeleton : {};
    const datePicker = isRecord(skeleton['DatePicker']) ? skeleton['DatePicker'] : {};
    const positioning = isRecord(datePicker['positioning']) ? datePicker['positioning'] : {};
    options.skeleton = {
      ...skeleton,
      DatePicker: {
        ...datePicker,
        positioning: { boundary: [], ...positioning },
      },
    };
  }

  const gridColumns = useGridColumns(
    binding,
    jsonforms,
    rowDetail,
    labelText,
    message,
    () => appliedOptions,
  );
  const getCellProps = createGridCellProps(
    binding,
    rowDetail,
    gridColumns,
    prepare,
    configureCellOptions,
  );

  const userGridOptions = $derived.by((): GridOptions<AgGridWrappedRow> => {
    const native = (appliedOptions.agGridOptions ?? {}) as GridOptions<AgGridWrappedRow>;
    const pagination = resolvePagination(
      binding.control.uischema.options?.pagination,
      binding.control.config,
      'array',
    );
    return {
      ...native,
      getLocaleText:
        native.getLocaleText ??
        ((params) => {
          if (native.localeText?.[params.key] !== undefined) return native.localeText[params.key];
          const key = 'agGrid.' + params.key;
          const translated = message(key);
          return translated === key ? params.defaultValue : translated;
        }),
      pagination: native.pagination ?? pagination.enabled,
      paginationPageSize: native.paginationPageSize ?? pagination.size,
      paginationPageSizeSelector: native.paginationPageSizeSelector ?? pagination.choices,
    };
  });
  function onSelectionChanged(event: SelectionChangedEvent<AgGridWrappedRow>) {
    selectedIndexes = (event.selectedNodes ?? [])
      .map((node) => node.data?.sourceIndex)
      .filter((index): index is number => index !== undefined);
    userGridOptions.onSelectionChanged?.(event);
  }

  function onCellEditRequest(event: CellEditRequestEvent<AgGridWrappedRow>) {
    const index = event.data?.sourceIndex;
    const ready =
      binding.control.enabled && binding.control.visible && !binding.control.readonly && prepare();
    const values = binding.control.data;
    if (
      ready &&
      Number.isInteger(index) &&
      index >= 0 &&
      index < values.length &&
      binding.control.rowKeys[index] === event.data?.key
    ) {
      const field = event.column.getColDef().field ?? event.column.getColId();
      const item = values[index];
      const itemPath = composePaths(binding.control.path, String(index));
      if (
        binding.control.schema.type === 'object' &&
        item !== null &&
        typeof item === 'object' &&
        !Array.isArray(item)
      ) {
        if (!isEqual((item as Record<string, unknown>)[field], event.newValue))
          dispatch(
            update(itemPath, () => ({
              ...(item as Record<string, unknown>),
              [field]: event.newValue,
            })),
          );
      } else if (field === 'value' && !isEqual(item, event.newValue))
        dispatch(update(itemPath, () => event.newValue));
    }
    userGridOptions.onCellEditRequest?.(event);
  }
  function onSortChanged(event: SortChangedEvent<AgGridWrappedRow>) {
    sorted = event.api.getColumnState().some((column) => Boolean(column.sort));
    userGridOptions.onSortChanged?.(event);
  }
  function onFilterChanged(event: FilterChangedEvent<AgGridWrappedRow>) {
    filtered = event.api.isAnyFilterPresent();
    if (!filtered) addedHidden = false;
    userGridOptions.onFilterChanged?.(event);
  }
  function onRowDataUpdated(event: RowDataUpdatedEvent<AgGridWrappedRow>) {
    const index = pendingAddedIndex;
    if (index !== undefined) {
      const node = event.api.getRowNode(binding.control.rowKeys[index]);
      if (node) {
        pendingAddedIndex = undefined;
        addedHidden = node.rowIndex == null;
        if (node.rowIndex != null) {
          if (event.api.getGridOption('pagination'))
            event.api.paginationGoToPage(
              Math.floor(node.rowIndex / event.api.paginationGetPageSize()),
            );
          event.api.ensureIndexVisible(node.rowIndex);
        }
      }
    }
    userGridOptions.onRowDataUpdated?.(event);
  }
  function clearFilters() {
    const api = gridApi;
    if (!api || api.isDestroyed()) return;
    api.setFilterModel(null);
    api.setGridOption('quickFilterText', '');
    addedHidden = false;
  }
  function onRowDragEnd(event: RowDragEndEvent<AgGridWrappedRow>) {
    const fromKey = event.node.data?.key;
    const toKey = event.overNode?.data?.key;
    const order = rows.map((row) => row.key);
    const allowed = () =>
      !event.api.isDestroyed() &&
      event.api.getAllGridColumns().some((column) => Boolean(column.getColDef().rowDrag)) &&
      !userGridOptions.suppressRowDrag &&
      !sorted &&
      !filtered &&
      fromKey !== undefined &&
      toKey !== undefined &&
      fromKey !== toKey &&
      isEqual(
        rows.map((row) => row.key),
        order,
      ) &&
      rows.some((row) => row.key === fromKey) &&
      rows.some((row) => row.key === toKey);
    void collectionAction(allowed, () => {
      const fromIndex = rows.findIndex((row) => row.key === fromKey);
      const toIndex = rows.findIndex((row) => row.key === toKey);
      if (fromIndex > toIndex) {
        for (let index = fromIndex; index > toIndex; index--)
          binding.moveUp?.(binding.control.path, index)();
      } else {
        for (let index = fromIndex; index < toIndex; index++)
          binding.moveDown?.(binding.control.path, index)();
      }
      event.api.clearFocusedCell();
    });
    userGridOptions.onRowDragEnd?.(event);
  }
  // AG Grid localizes its native controls only at creation. Defer recreation
  // while an isolated dialog or invalid editor draft still owns pending changes.
  const localization = $derived({
    locale: jsonforms.i18n?.locale,
    translate: jsonforms.i18n?.translate,
    localeText: appliedOptions.agGridOptions?.localeText,
    getLocaleText: appliedOptions.agGridOptions?.getLocaleText,
  });
  let appliedLocalization = $state.raw(untrack(() => localization));
  $effect(() => {
    const next = localization;
    if (
      (next.locale === appliedLocalization.locale &&
        next.translate === appliedLocalization.translate &&
        next.getLocaleText === appliedLocalization.getLocaleText &&
        isEqual(next.localeText, appliedLocalization.localeText)) ||
      pending.isBlocked()
    )
      return;
    untrack(() => pending.flush());
    if (pending.isBlocked()) return;
    appliedLocalization = next;
  });
  const gridOptions = $derived.by((): GridOptions<AgGridWrappedRow> => {
    if (
      gridOptionsCache &&
      gridOptionsCache.enabled === binding.control.enabled &&
      gridOptionsCache.readonly === binding.control.readonly &&
      gridOptionsCache.sorted === sorted &&
      gridOptionsCache.filtered === filtered &&
      gridOptionsCache.popupParent === sectionElement &&
      isEqual(gridOptionsCache.userOptions, userGridOptions)
    ) {
      return gridOptionsCache.value;
    }
    const baseOptions = { ...userGridOptions };
    const userComponents = baseOptions.components;
    delete baseOptions.rowData;
    delete baseOptions.columnDefs;
    delete baseOptions.components;
    delete baseOptions.onSelectionChanged;
    delete baseOptions.onSortChanged;
    delete baseOptions.onFilterChanged;
    delete baseOptions.onRowDragEnd;
    const value: GridOptions<AgGridWrappedRow> = {
      ...baseOptions,
      components: userComponents,
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        ...(userGridOptions.defaultColDef ?? {}),
      },
      suppressCellFocus: true,
      readOnlyEdit: true,
      getRowId: ({ data }) => data.key,
      rowSelection: binding.control.enabled
        ? (userGridOptions.rowSelection ?? {
            mode: 'multiRow',
            checkboxes: true,
            headerCheckbox: true,
          })
        : undefined,
      suppressRowDrag:
        Boolean(userGridOptions.suppressRowDrag) ||
        !binding.control.enabled ||
        binding.control.readonly ||
        sorted ||
        filtered,
      popupParent: userGridOptions.popupParent ?? sectionElement,
      onCellClicked: (event) => {
        if (
          rowDetail.options?.presentation === 'panel' &&
          event.data &&
          !(
            event.event?.target instanceof Element &&
            event.event.target.closest(
              'button, a, [role="button"], [role="checkbox"], .ag-selection-checkbox',
            )
          )
        )
          rowDetail.select(event.data.sourceIndex);
        userGridOptions.onCellClicked?.(event);
      },
      onRowClicked: (event: RowClickedEvent<AgGridWrappedRow>) => {
        if (
          rowDetail.options?.presentation === 'panel' &&
          event.data &&
          !(
            event.event?.target instanceof Element &&
            event.event.target.closest('.ag-cell, button, a, [role="button"], [role="checkbox"]')
          )
        )
          rowDetail.select(event.data.sourceIndex);
        userGridOptions.onRowClicked?.(event);
      },
      onSelectionChanged,
      onCellEditRequest,
      onSortChanged,
      onFilterChanged,
      onRowDataUpdated,
      onRowDragEnd,
    };
    gridOptionsCache = {
      userOptions: userGridOptions,
      enabled: binding.control.enabled,
      readonly: binding.control.readonly,
      sorted,
      filtered,
      popupParent: sectionElement,
      value,
    };
    return value;
  });

  function addItem() {
    void collectionAction(
      () => !addDisabled,
      () => {
        pendingAddedIndex = dataLength;
        binding.addItem(
          binding.control.path,
          createDefaultValue(binding.control.schema, binding.control.rootSchema),
        )();
      },
    );
  }
  function removeSelected() {
    const indexes = [...selectedIndexes];
    deletion.request(
      () => indexes.map((index) => binding.control.data?.[index]),
      () => {
        binding.removeItems?.(binding.control.path, indexes)();
        selectedIndexes = [];
        gridApi?.deselectAll();
      },
      () =>
        appliedOptions.disableRemove !== true &&
        indexes.length > 0 &&
        indexes.every((index) => Number.isInteger(index) && index >= 0 && index < dataLength) &&
        (!appliedOptions.restrict ||
          binding.control.arraySchema?.minItems === undefined ||
          dataLength - indexes.length >= binding.control.arraySchema.minItems),
    );
  }
  const bodyHeight = $derived(
    splitCssSize(binding.control.uischema.options?.height) ??
      splitCssSize(binding.control.config?.height) ??
      '400px',
  );
  let errorDialogIndex = $state<number>();
  let errorDialogHost = $state<HTMLDivElement>();
  let errorDialogReturnFocus = $state<HTMLElement>();
  async function revealFirstError(event: MouseEvent) {
    const index = firstInvalidIndex;
    if (index === undefined) return;
    if (rowDetail.options?.presentation === 'dialog') {
      errorDialogReturnFocus =
        event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
      errorDialogIndex = index;
      await tick();
      errorDialogHost?.querySelector<HTMLButtonElement>('button')?.click();
      return;
    }
    const api = gridApi;
    if (api && !api.isDestroyed()) {
      const rowKey = binding.control.rowKeys[index];
      if (
        rowDetail.options?.presentation !== 'panel' &&
        api.getRowNode(rowKey)?.rowIndex == null &&
        api.isAnyFilterPresent()
      ) {
        clearFilters();
      }
      const node = api.getRowNode(rowKey);
      if (node?.rowIndex != null) {
        if (api.getGridOption('pagination'))
          api.paginationGoToPage(Math.floor(node.rowIndex / api.paginationGetPageSize()));
        api.ensureIndexVisible(node.rowIndex);
      }
    }
    if (rowDetail.options?.presentation === 'panel') rowDetail.select(index, true);
  }
</script>

{#if binding.control.visible}
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class="text-error-600 dark:text-error-400 my-2 text-sm">
      {binding.control.errors}
    </p>
  {/if}
  {#if childErrorCount > 0 && !appliedOptions.hideArraySummaryValidation && appliedOptions.showValidationIndicator !== false}
    <p role="alert" data-array-summary class="text-error-600 dark:text-error-400 my-2 text-sm">
      <span data-array-summary-message
        >{arrayChildNotice(
          childErrorCount,
          appliedOptions.showValidationIndicatorCount === true,
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
  <section
    bind:this={sectionElement}
    class="jsonforms-ag-grid jsonforms-ag-grid--skeleton"
    style:width="100%"
    data-jsonforms-ag-grid
  >
    <header class="jsonforms-ag-grid__toolbar">
      <div class="jsonforms-ag-grid__title-row">
        <h3 class="jsonforms-ag-grid__title">{computedLabel}</h3>
      </div>
      <div class="jsonforms-ag-grid__actions">
        {#if panel.collapsible}
          <button
            type="button"
            class="btn btn-sm preset-tonal"
            data-array-panel-toggle
            aria-label={message(panel.collapsed ? 'tree.expand' : 'tree.collapse', {
              label: computedLabel,
            })}
            aria-expanded={!panel.collapsed}
            aria-controls={panelContentId}
            onclick={panel.toggle}
          >
            {#if panel.collapsed}<ChevronDownIcon class="h-4 w-4" />{:else}<ChevronUpIcon
                class="h-4 w-4"
              />{/if}
          </button>
        {/if}
        {#if rowDetail.options?.presentation === 'panel'}
          <RowDetailToggle
            open={rowDetail.panelOpen}
            disabled={false}
            onclick={rowDetail.toggle}
            label={message(
              rowDetail.panelOpen ? 'collection.hideDetails' : 'collection.showDetails',
            )}
          />
        {/if}
        <TupleAction
          kind="delete"
          label={translations.removeTooltip ?? message('array.removeTooltip')}
          ariaLabel={translations.removeAriaLabel ?? message('array.removeAriaLabel')}
          buttonClass="btn-icon preset-tonal hover:preset-filled-error-500 size-8"
          disabled={removeDisabled}
          onclick={removeSelected}
        />
        <TupleAction
          kind="add"
          label={translations.addTooltip ?? message('array.addTooltip')}
          ariaLabel={translations.addAriaLabel ?? message('array.addAriaLabel')}
          buttonClass="btn-icon preset-filled size-8"
          disabled={addDisabled}
          onclick={addItem}
        />
      </div>
    </header>
    <div
      id={panelContentId}
      hidden={panel.collapsed}
      style:display={panel.collapsed ? 'none' : 'block'}
    >
      {#if addedHidden}
        <div role="status" class="jsonforms-ag-grid__added-hidden">
          {message('collection.addedHidden')}
          <button type="button" class="btn preset-tonal" onclick={clearFilters}
            >{message('collection.clearFilters')}</button
          >
        </div>
      {/if}
      <RowDetailFrame
        panel={rowDetail}
        schema={binding.control.schema}
        path={binding.control.path}
        scope={binding.control.uischema.scope}
        enabled={binding.control.enabled}
        height={binding.control.uischema.options?.layout?.height}
      >
        <div class="jsonforms-ag-grid__body" style:height={rowDetail.visible ? '100%' : bodyHeight}>
          {#if rows.length > 0}
            {#key appliedLocalization}
              <AgGridHost
                cellHost={DispatchCellHost}
                options={gridOptions}
                {rows}
                columns={gridColumns.columns}
                {getCellProps}
                onready={(api) => (gridApi = api)}
                readState={() => savedGridState}
                saveState={(snapshot) => {
                  savedGridState = snapshot;
                }}
              />
            {/key}
          {:else}
            <p class="jsonforms-ag-grid__empty">{translations.noDataMessage}</p>
          {/if}
        </div>
      </RowDetailFrame>
    </div>
  </section>
  {#if errorDialogIndex !== undefined && rowDetail.options?.presentation === 'dialog'}
    <div bind:this={errorDialogHost} class="sr-only">
      <RowDetailDialog
        Dialog={DetailDialog}
        schema={binding.control.schema}
        path={composePaths(binding.control.path, `${errorDialogIndex}`)}
        scope={binding.control.uischema.scope}
        options={rowDetail.options}
        enabled={binding.control.enabled}
        index={errorDialogIndex}
        {prepare}
        returnFocus={errorDialogReturnFocus}
      />
    </div>
  {/if}
{/if}

{#if deletion.pending && binding.control.visible}
  <ConfirmationDialog
    operation={deletion.pending.operation}
    onAccept={deletion.accept}
    onCancel={deletion.cancel}
  />
{/if}
