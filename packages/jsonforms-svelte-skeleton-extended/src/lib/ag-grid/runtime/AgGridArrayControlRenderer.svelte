<script module lang="ts">
  type StyleRoot = ShadowRoot | HTMLHeadElement;
  const styleOwners = new WeakMap<StyleRoot, { style: HTMLStyleElement; users: number }>();

  function acquireRuntimeStyles(root: StyleRoot, id: string, css: string): () => void {
    const owned = styleOwners.get(root);
    if (owned) {
      owned.users += 1;
      return () => releaseRuntimeStyles(root, owned);
    }
    if (root.querySelector(`#${id}`)) return () => {};
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    root.prepend(style);
    const created = { style, users: 1 };
    styleOwners.set(root, created);
    return () => releaseRuntimeStyles(root, created);
  }

  function releaseRuntimeStyles(
    root: StyleRoot,
    owner: { style: HTMLStyleElement; users: number },
  ) {
    owner.users -= 1;
    if (owner.users) return;
    owner.style.remove();
    styleOwners.delete(root);
  }
</script>

<script lang="ts">
  import {
    RowDetailToggle,
    DetailDialog,
    TupleAction,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { ConfirmationDialog } from '@chobantonov/jsonforms-svelte-skeleton';
  import { useArrayPanelState, useDeletionConfirmation } from '@chobantonov/jsonforms-svelte';
  import { ChevronDownIcon, ChevronUpIcon } from '@lucide/svelte';
  import {
    fileFilterValue,
    splitCssSize,
    useLabelSummaryText,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    useJsonForms,
    useDispatch,
    resolvePagination,
    resolveTableColumns,
    showArraySortButtons,
    useRendererMessages,
    arrayChildNotice,
    arrayChildErrorCount,
    collectionErrorPositions,
    dataPathSegments,
    scopeDataSegments,
    useRowDetailPanel,
    RowDetailDialog,
    usePendingControlChanges,
    useCollectionAction,
    useJsonFormsArrayControl,
    useAuthoredConfig,
    resolveRestrict,
    mergeRendererOptions,
    compositeSummaryPresentation,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    Resolve,
    arrayDefaultTranslations,
    composePaths,
    computeLabel,
    createDefaultValue,
    defaultJsonFormsI18nState,
    getArrayTranslations,
    getControlPath,
    getI18nKey,
    update,
    type Translator,
    type LabelElement,
    type ControlElement,
    type JsonSchema,
  } from '@jsonforms/core';
  import type {
    CellEditRequestEvent,
    ColDef,
    ColGroupDef,
    FilterChangedEvent,
    GridApi,
    GridOptions,
    GridState,
    ICellRendererParams,
    RowDragEndEvent,
    RowClickedEvent,
    RowDataUpdatedEvent,
    SelectionChangedEvent,
    SortChangedEvent,
  } from 'ag-grid-community';
  import isEqual from 'lodash/isEqual';
  import { onMount, tick, untrack } from 'svelte';
  import { RowDetailFrame } from '@chobantonov/jsonforms-svelte-skeleton';
  import runtimeStyles from './ag-grid.css?inline';
  import AgGridHost from './AgGridHost.svelte';
  import type { AgGridCellHostProps, AgGridWrappedRow } from '../types.js';

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
  // Memoization only: reactive cache writes would invalidate the derived columns that fill it.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  let cellUiSchemaCache = new Map<
    string,
    { options: Record<string, unknown>; value: AgGridCellHostProps['uischema'] }
  >();
  let columnsCache:
    | {
        schema: JsonSchema;
        rootSchema: JsonSchema;
        enabled: boolean;
        readonly: boolean | undefined;
        translate: Translator | undefined;
        locale: string | undefined;
        path: string;
        showSortButtons: boolean;
        hideRequiredAsterisk: boolean;
        cellOptions: unknown;
        rowDetailOptions: unknown;
        wholeRowFields: string[];
        configuredColumns:
          | Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>>
          | undefined;
        value: Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>>;
      }
    | undefined;
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
    const styleId = 'jsonforms-skeleton-ag-grid-runtime-styles';
    return acquireRuntimeStyles(styleContainer, styleId, runtimeStyles);
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
      arrayDefaultTranslations.map((entry) => ({
        key: entry.key,
        default: (label = '') =>
          message(
            'array.' +
              entry.key +
              (label && ['addTooltip', 'addAriaLabel'].includes(entry.key) ? 'WithLabel' : ''),
            { label },
          ),
      })),
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
  let rowCache: { data: unknown; keys: readonly string[]; rows: AgGridWrappedRow[] } | undefined;
  const rows = $derived.by((): AgGridWrappedRow[] => {
    const data = binding.control.data;
    const keys = binding.control.rowKeys;
    // Validation/pending updates must not refresh native rowData during a drag.
    if (rowCache && rowCache.data === data && rowCache.keys === keys) return rowCache.rows;
    const values: unknown[] = Array.isArray(data) ? data : [];
    const rows = values.map((value, sourceIndex) => ({
      key: keys[sourceIndex],
      sourceIndex,
      value,
    }));
    rowCache = { data, keys, rows };
    return rows;
  });

  function isColumnDefinition(
    column: ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>,
  ): column is ColDef<AgGridWrappedRow> {
    return !('children' in column);
  }
  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  function titleFor(propertyName: string, schema: JsonSchema): string {
    const fallback =
      schema.title ??
      propertyName
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/^./, (value) => value.toUpperCase());
    const key = getI18nKey(
      schema,
      undefined,
      composePaths(binding.control.path, propertyName),
      'label',
    );
    return jsonforms.i18n?.translate?.(key, fallback, { schema }) ?? fallback;
  }
  function resolveCellSchema(propertyName: string): JsonSchema {
    if (!propertyName || wholeRow(propertyName)) return binding.control.schema;
    return (
      Resolve.schema(
        binding.control.schema,
        `#/properties/${propertyName.replaceAll('~', '~0').replaceAll('/', '~1')}`,
        binding.control.rootSchema,
      ) ??
      binding.control.schema.properties?.[propertyName] ??
      binding.control.schema
    );
  }
  function resolveUiSchema(propertyName: string): AgGridCellHostProps['uischema'] {
    const scope =
      binding.control.schema.properties && propertyName && !wholeRow(propertyName)
        ? `#/properties/${propertyName.replaceAll('~', '~0').replaceAll('/', '~1')}`
        : '#';
    const arrayOptions = { ...(binding.control.uischema.options ?? {}) };
    const cellOptions = arrayOptions.cells;
    delete arrayOptions.cells;
    delete arrayOptions.agGridOptions;
    // The parent grid presentation must not select another grid inside an array cell.
    // An explicit column override is merged below and can still request a variant.
    delete arrayOptions.variant;
    const propertyOptions =
      cellOptions && typeof cellOptions === 'object'
        ? (cellOptions as Record<string, Record<string, unknown>>)[propertyName]
        : undefined;
    const options = mergeRendererOptions(arrayOptions, propertyOptions);

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
    const cached = cellUiSchemaCache.get(propertyName);
    if (cached && cached.value.scope === scope && isEqual(cached.options, options))
      return cached.value;

    const value: AgGridCellHostProps['uischema'] = {
      type: 'Control',
      scope,
      label: false,
      options,
    };
    cellUiSchemaCache.set(propertyName, { options, value });
    return value;
  }

  const wholeRowFields = $derived(
    Array.isArray(
      (appliedOptions.agGridOptions as GridOptions<AgGridWrappedRow> | undefined)?.columnDefs,
    )
      ? []
      : resolveTableColumns(binding.control.schema, binding.control.uischema.options?.columnDefs)
          .filter((column) => column.scope === '#')
          .map((column) => column.field),
  );
  const wholeRow = (field: string) => wholeRowFields.includes(field);

  const columns = $derived.by(
    (): Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>> => {
      const itemSchema = binding.control.schema;
      const baseGridOptions = (appliedOptions.agGridOptions ?? {}) as GridOptions<AgGridWrappedRow>;

      const portable = binding.control.uischema.options?.columnDefs;
      const configuredColumns:
        | Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>>
        | undefined = Array.isArray(baseGridOptions.columnDefs)
        ? baseGridOptions.columnDefs
        : Array.isArray(portable)
          ? resolveTableColumns(itemSchema, portable).map(({ scope: _scope, ...column }) => ({
              ...column,
              field: column.field as ColDef<AgGridWrappedRow>['field'],
            }))
          : undefined;
      const flatten = (
        definitions: Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>>,
      ): ColDef<AgGridWrappedRow>[] =>
        definitions.flatMap((definition) =>
          'children' in definition ? flatten(definition.children) : [definition],
        );
      const flatColumns = flatten(configuredColumns ?? []);
      const showSortButtons = showArraySortButtons(appliedOptions);
      const hideRequiredAsterisk = Boolean(appliedOptions.hideRequiredAsterisk);
      const cellOptions = binding.control.uischema.options?.cells;
      if (
        columnsCache &&
        isEqual(columnsCache.schema, itemSchema) &&
        isEqual(columnsCache.rootSchema, binding.control.rootSchema) &&
        columnsCache.enabled === binding.control.enabled &&
        columnsCache.readonly === binding.control.readonly &&
        columnsCache.translate === jsonforms.i18n?.translate &&
        columnsCache.locale === jsonforms.i18n?.locale &&
        columnsCache.path === binding.control.path &&
        columnsCache.showSortButtons === showSortButtons &&
        columnsCache.hideRequiredAsterisk === hideRequiredAsterisk &&
        isEqual(columnsCache.cellOptions, cellOptions) &&
        isEqual(columnsCache.rowDetailOptions, rowDetail.options) &&
        isEqual(columnsCache.wholeRowFields, wholeRowFields) &&
        isEqual(columnsCache.configuredColumns, configuredColumns)
      ) {
        return columnsCache.value;
      }
      const entries: Array<[string, JsonSchema]> =
        itemSchema.type === 'object' && itemSchema.properties
          ? Object.entries(itemSchema.properties)
          : [['', itemSchema]];
      for (const field of wholeRowFields) {
        if (!entries.some(([name]) => name === field)) entries.push([field, itemSchema]);
      }

      let dataColumns: Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>> =
        entries.map(([propertyName]) => {
          const override = flatColumns.find(
            (column) => isColumnDefinition(column) && column.field === propertyName,
          );
          const resolvedType = resolveCellSchema(propertyName).type;
          const isBooleanCell =
            resolvedType === 'boolean' ||
            (Array.isArray(resolvedType) && resolvedType.includes('boolean'));
          return {
            headerName: titleFor(propertyName, resolveCellSchema(propertyName)),
            colId: propertyName || 'value',
            valueGetter: ({ data }) => {
              if (!data) return undefined;
              const summary = binding.control.uischema.options?.cells?.[propertyName]?.summary;
              if (summary?.type === 'Label') {
                const rowPath = composePaths(binding.control.path, String(data.sourceIndex));
                const cellPath =
                  wholeRow(propertyName) || !propertyName
                    ? rowPath
                    : composePaths(rowPath, propertyName);
                return labelText.text(summary as LabelElement, cellPath, data.value);
              }
              const value =
                propertyName && !wholeRow(propertyName)
                  ? (data.value as Record<string, unknown> | null | undefined)?.[propertyName]
                  : data.value;
              if (summary?.type === 'Control') {
                const schema = resolveCellSchema(propertyName);
                return compositeSummaryPresentation(
                  value,
                  summary as ControlElement,
                  schema.title,
                  jsonforms.i18n?.translate ?? defaultJsonFormsI18nState.translate,
                  message,
                  schema,
                ).text;
              }
              return (
                fileFilterValue(
                  value,
                  resolveCellSchema(propertyName),
                  binding.control.rootSchema,
                ) ?? value
              );
            },
            ...(override && isColumnDefinition(override) ? override : {}),
            editable: false,
            cellRenderer: 'JsonFormsDispatchCell',
            cellRendererParams: {
              propertyName,
              suppressMouseEventHandling: () => true,
            },
            cellClassRules: {
              ...(override && isColumnDefinition(override) ? override.cellClassRules : undefined),
              'jsonforms-ag-grid-data-cell': () => true,
              'jsonforms-ag-grid-boolean-cell': () => isBooleanCell,
            },
            suppressKeyboardEvent: ({ event }) => {
              const target = event.target;
              return (
                target instanceof Element &&
                Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]'))
              );
            },
          } as ColDef<AgGridWrappedRow>;
        });

      if (configuredColumns !== undefined) {
        const generated = new Map(
          entries.map(([field], index) => [field, dataColumns[index] as ColDef<AgGridWrappedRow>]),
        );
        const arrange = (
          definitions: Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>>,
        ): Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>> =>
          definitions.map((definition) => {
            if ('children' in definition)
              return { ...definition, children: arrange(definition.children) };
            const key = definition.field ?? definition.colId ?? '';
            const base = generated.get(key) ?? (key === 'value' ? generated.get('') : undefined);
            return base
              ? {
                  ...base,
                  ...definition,
                  cellRenderer: definition.cellRenderer ?? base.cellRenderer,
                  cellRendererParams: {
                    ...base.cellRendererParams,
                    ...definition.cellRendererParams,
                  },
                }
              : definition;
          });
        dataColumns = arrange(configuredColumns);
      }

      const markRequiredHeaders = (
        definitions: Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>>,
      ): Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>> =>
        definitions.map((definition) => {
          if ('children' in definition)
            return { ...definition, children: markRequiredHeaders(definition.children) };
          const field = definition.field ?? definition.colId;
          if (
            !field ||
            !itemSchema.required?.includes(field) ||
            (cellOptions?.[field]?.hideRequiredAsterisk ?? hideRequiredAsterisk)
          )
            return definition;
          return { ...definition, headerName: `${definition.headerName ?? field} *` };
        });
      dataColumns = markRequiredHeaders(dataColumns);
      const hasDragColumn = flatten(dataColumns).some((column) => Boolean(column.rowDrag));

      if (
        binding.control.enabled &&
        !binding.control.readonly &&
        showSortButtons &&
        !hasDragColumn
      ) {
        dataColumns.unshift({
          colId: '$drag',
          headerName: '',
          rowDrag: true,
          sortable: false,
          filter: false,
          resizable: false,
          suppressMovable: true,
          width: 38,
          minWidth: 38,
          maxWidth: 38,
          valueGetter: () => '',
        });
      }

      if (rowDetail.options) {
        dataColumns.push({
          colId: '$detail',
          headerName: '',
          width: 104,
          minWidth: 104,
          maxWidth: 104,
          pinned: 'right',
          lockPinned: true,
          flex: 0,
          sortable: false,
          filter: false,
          resizable: false,
          suppressMovable: true,
          cellRenderer: 'JsonFormsDispatchCell',
          cellRendererParams: { rowDetail: true, suppressMouseEventHandling: () => true },
          suppressKeyboardEvent: ({ event }) =>
            event.target instanceof Element && Boolean(event.target.closest('button')),
        });
      }
      columnsCache = {
        schema: itemSchema,
        rootSchema: binding.control.rootSchema,
        enabled: binding.control.enabled,
        readonly: binding.control.readonly,
        showSortButtons,
        hideRequiredAsterisk,
        cellOptions,
        rowDetailOptions: rowDetail.options,
        wholeRowFields,
        configuredColumns,
        translate: jsonforms.i18n?.translate,
        locale: jsonforms.i18n?.locale,
        path: binding.control.path,
        value: dataColumns,
      };
      return dataColumns;
    },
  );

  function getCellProps(
    params: ICellRendererParams<AgGridWrappedRow> & { propertyName?: string; rowDetail?: boolean },
  ): AgGridCellHostProps {
    const propertyName =
      params.propertyName ??
      (params.colDef?.cellRendererParams as { propertyName?: string } | undefined)?.propertyName ??
      '';
    const sourceIndex = params.data?.sourceIndex ?? params.node.sourceRowIndex;
    const itemPath = composePaths(binding.control.path, `${sourceIndex}`);
    const itemKey = params.data?.key ?? binding.control.rowKeys[sourceIndex];
    const item =
      itemKey === undefined
        ? undefined
        : { key: itemKey, path: itemPath, sourceItem: binding.control.data[sourceIndex] };
    if (
      (params.rowDetail ||
        (params.colDef?.cellRendererParams as { rowDetail?: boolean } | undefined)?.rowDetail) &&
      rowDetail.options
    ) {
      return {
        item,
        schema: binding.control.schema,
        uischema: { type: 'Control', scope: '#' },
        path: itemPath,
        enabled: binding.control.enabled,
        renderers: binding.control.renderers,
        cells: binding.control.cells,
        config: binding.control.config,
        rowDetail: {
          options: rowDetail.options,
          scope: binding.control.uischema.scope,
          index: sourceIndex,
          errors: binding.control.childErrors.filter((error) => {
            const path = getControlPath(error);
            return path === itemPath || path.startsWith(`${itemPath}.`);
          }),
          selected: rowDetail.visible && rowDetail.selectedIndex === sourceIndex,
          prepare,
          select: () => rowDetail.select(sourceIndex, true),
        },
      };
    }

    return {
      item,
      schema: resolveCellSchema(propertyName),
      uischema: resolveUiSchema(propertyName),
      path:
        propertyName && !wholeRow(propertyName) ? composePaths(itemPath, propertyName) : itemPath,
      enabled: binding.control.enabled,
      renderers: binding.control.renderers,
      cells: binding.control.cells,
      config: binding.control.config,
    };
  }

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
                options={gridOptions}
                {rows}
                {columns}
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
