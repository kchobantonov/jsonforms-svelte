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
  resolvePagination,
  arrayChildErrorCount,
  collectionErrorPositions,
  useRowDetailPanel,
  useCollectionAction,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import { useJsonForms, useDispatch } from '@chobantonov/jsonforms-svelte';
import {
  composePaths,
  computeLabel,
  createDefaultValue,
  defaultJsonFormsI18nState,
  getArrayTranslations,
  update,
  type LabelElement,
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
import { createGridCellProps } from './gridCells';
import { createGridRows } from './gridRows';
import { useGridColumns } from './gridColumns.svelte';
import { splitCssSize } from '../layouts/splitLayout';
import { useLabelSummaryText } from '../presentation/labelSummaryText.svelte';
import type { AgGridWrappedRow } from './types.js';
import type { AgGridRendererProps } from './types.js';
import type { createGridStyleInstaller } from './gridStyles';

export function useGridArrayControl(
  rendererProps: AgGridRendererProps,
  acquireRuntimeStyles: ReturnType<typeof createGridStyleInstaller>,
  configureCellOptions?: (options: Record<string, unknown>) => void,
) {
  const controlPathSegments = $derived([
    ...(rendererProps.pathSegments ?? dataPathSegments(rendererProps.path)),
    ...scopeDataSegments(rendererProps.uischema.scope),
  ]);
  const binding = useJsonFormsArrayControl(rendererProps);
  const panel = useArrayPanelState(
    () => binding.control.uischema.options,
    () => binding.control.config,
  );
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
  return {
    binding,
    panel,
    message,
    rowDetail,
    gridColumns,
    getCellProps,
    deletion,
    prepare,
    clearFilters,
    removeSelected,
    addItem,
    revealFirstError,
    get childErrorCount() {
      return childErrorCount;
    },
    get appliedOptions() {
      return appliedOptions;
    },
    get firstInvalidIndex() {
      return firstInvalidIndex;
    },
    get computedLabel() {
      return computedLabel;
    },
    get translations() {
      return translations;
    },
    get removeAction() {
      return {
        kind: 'delete' as const,
        label: translations.removeTooltip ?? message('array.removeTooltip'),
        ariaLabel: translations.removeAriaLabel ?? message('array.removeAriaLabel'),
        disabled: removeDisabled,
        onclick: removeSelected,
      };
    },
    get removeDisabled() {
      return removeDisabled;
    },
    get addAction() {
      return {
        kind: 'add' as const,
        label: translations.addTooltip ?? message('array.addTooltip'),
        ariaLabel: translations.addAriaLabel ?? message('array.addAriaLabel'),
        disabled: addDisabled,
        onclick: addItem,
      };
    },
    get addDisabled() {
      return addDisabled;
    },
    get addedHidden() {
      return addedHidden;
    },
    get bodyHeight() {
      return bodyHeight;
    },
    get rows() {
      return rows;
    },
    get appliedLocalization() {
      return appliedLocalization;
    },
    get gridOptions() {
      return gridOptions;
    },
    get errorDialogIndex() {
      return errorDialogIndex;
    },
    get errorDialogReturnFocus() {
      return errorDialogReturnFocus;
    },

    get sectionElement() {
      return sectionElement;
    },
    set sectionElement(element: HTMLElement | undefined) {
      sectionElement = element;
    },
    get errorDialogHost() {
      return errorDialogHost;
    },
    set errorDialogHost(element: HTMLDivElement | undefined) {
      errorDialogHost = element;
    },
    onready(api: GridApi<AgGridWrappedRow>) {
      gridApi = api;
    },
    readState: () => savedGridState,
    saveState(snapshot: GridState) {
      savedGridState = snapshot;
    },
  };
}
