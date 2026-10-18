<script lang="ts">
  import { RowDetailToggle } from '@chobantonov/jsonforms-svelte-flowbite';
  import { ConfirmationDialog } from '@chobantonov/jsonforms-svelte-flowbite';
  import { useDeletionConfirmation } from '@chobantonov/jsonforms-svelte';
  import { Button } from 'flowbite-svelte';
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import { fileFilterValue, useLabelSummaryText } from '@chobantonov/jsonforms-svelte-extended';
  import {
    useJsonForms,
    resolvePagination,
    resolveTableColumns,
    useRendererMessages,
    useRowDetailPanel,
    usePendingControlChanges,
    useJsonFormsArrayControl,
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
    getI18nKey,
    type Translator,
    type LabelElement,
    type ControlElement,
    type JsonSchema,
  } from '@jsonforms/core';
  import type {
    ColDef,
    ColGroupDef,
    FilterChangedEvent,
    GridApi,
    GridOptions,
    GridState,
    ICellRendererParams,
    RowDragEndEvent,
    SelectionChangedEvent,
    SortChangedEvent,
  } from 'ag-grid-community';
  import isEqual from 'lodash/isEqual';
  import { onMount, untrack } from 'svelte';
  import { RowDetailFrame } from '@chobantonov/jsonforms-svelte-flowbite';
  import runtimeStyles from './ag-grid.css?inline';
  import AgGridHost from './AgGridHost.svelte';
  import { AgGridRowIdentity } from './row-identity.js';
  import type { AgGridCellHostProps, AgGridWrappedRow } from '../types.js';

  let { ...rendererProps }: RendererProps<ControlElement> = $props();
  const binding = useJsonFormsArrayControl(rendererProps);
  const jsonforms = useJsonForms();
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
  const deletion = useDeletionConfirmation(
    () => ({ ...binding.control, options: binding.control.uischema.options }),
    'agGrid',
    prepare,
  );
  const rowDetail = useRowDetailPanel({
    options: () => binding.control.uischema.options?.rowDetail,
    rows: () => binding.control.data,
    prepare,
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
  const rowIdentity = new AgGridRowIdentity();
  let gridApi = $state<GridApi<AgGridWrappedRow> | null>(null);
  let selectedIndexes = $state<number[]>([]);
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
        translate: Translator | undefined;
        locale: string | undefined;
        path: string;
        showSortButtons: boolean;
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
        sorted: boolean;
        filtered: boolean;
        popupParent: HTMLElement | undefined;
        value: GridOptions<AgGridWrappedRow>;
      }
    | undefined;

  onMount(() => {
    const root = sectionElement?.getRootNode();
    const styleContainer = root instanceof ShadowRoot ? root : document.head;
    const styleId = 'jsonforms-flowbite-ag-grid-runtime-styles';
    if (!styleContainer.querySelector(`#${styleId}`)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = runtimeStyles;
      styleContainer.prepend(style);
    }
  });

  const appliedOptions = $derived.by(() => ({
    ...(binding.control.config ?? {}),
    ...(binding.control.uischema.options ?? {}),
  }));
  const dataLength = $derived(
    Array.isArray(binding.control.data) ? binding.control.data.length : 0,
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
      (Boolean(appliedOptions.restrict) &&
        binding.control.arraySchema?.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );
  const removeDisabled = $derived(
    !binding.control.enabled ||
      appliedOptions.disableRemove === true ||
      selectedIndexes.length === 0 ||
      (Boolean(appliedOptions.restrict) &&
        binding.control.arraySchema?.minItems !== undefined &&
        dataLength - selectedIndexes.length < binding.control.arraySchema.minItems),
  );
  const rows = $derived.by(() =>
    rowIdentity.reconcile(Array.isArray(binding.control.data) ? binding.control.data : []),
  );

  function isColumnDefinition(
    column: ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>,
  ): column is ColDef<AgGridWrappedRow> {
    return !('children' in column);
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
    const options = { ...arrayOptions, ...(propertyOptions ?? {}) };
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
      const showSortButtons = Boolean(appliedOptions.showSortButtons);
      if (
        columnsCache &&
        isEqual(columnsCache.schema, itemSchema) &&
        isEqual(columnsCache.rootSchema, binding.control.rootSchema) &&
        columnsCache.enabled === binding.control.enabled &&
        columnsCache.translate === jsonforms.i18n?.translate &&
        columnsCache.locale === jsonforms.i18n?.locale &&
        columnsCache.path === binding.control.path &&
        columnsCache.showSortButtons === showSortButtons &&
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

      let hasDragColumn = false;
      let dataColumns: Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>> =
        entries.map(([propertyName]) => {
          const override = flatColumns.find(
            (column) => isColumnDefinition(column) && column.field === propertyName,
          );
          const resolvedType = resolveCellSchema(propertyName).type;
          const isBooleanCell =
            resolvedType === 'boolean' ||
            (Array.isArray(resolvedType) && resolvedType.includes('boolean'));
          if (override && isColumnDefinition(override) && override.rowDrag) hasDragColumn = true;

          return {
            headerName: titleFor(propertyName, resolveCellSchema(propertyName)),
            colId: propertyName || '$value',
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
            const base = generated.get(definition.field ?? '');
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

      if (binding.control.enabled && showSortButtons && !hasDragColumn) {
        dataColumns.unshift({
          headerName: '',
          rowDrag: true,
          sortable: false,
          filter: false,
          resizable: false,
          suppressMovable: true,
          width: 38,
          maxWidth: 38,
          valueGetter: () => '',
        });
      }

      if (rowDetail.options) {
        dataColumns.push({
          headerName: '',
          width: 64,
          minWidth: 64,
          maxWidth: 64,
          pinned: 'right',
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
        showSortButtons,
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
    if (
      (params.rowDetail ||
        (params.colDef?.cellRendererParams as { rowDetail?: boolean } | undefined)?.rowDetail) &&
      rowDetail.options
    ) {
      return {
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
          selected: rowDetail.visible && rowDetail.selectedIndex === sourceIndex,
          prepare,
          select: () => rowDetail.select(sourceIndex, true),
        },
      };
    }

    return {
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
  function onSortChanged(event: SortChangedEvent<AgGridWrappedRow>) {
    sorted = event.api.getColumnState().some((column) => Boolean(column.sort));
    userGridOptions.onSortChanged?.(event);
  }
  function onFilterChanged(event: FilterChangedEvent<AgGridWrappedRow>) {
    filtered = Object.keys(event.api.getFilterModel()).length > 0;
    userGridOptions.onFilterChanged?.(event);
  }
  function onRowDragEnd(event: RowDragEndEvent<AgGridWrappedRow>) {
    const fromIndex = event.node.data?.sourceIndex ?? -1;
    const toIndex = event.overNode?.data?.sourceIndex ?? -1;
    if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex && !sorted && !filtered) {
      if (fromIndex > toIndex) {
        for (let index = fromIndex; index > toIndex; index--)
          binding.moveUp?.(binding.control.path, index)();
      } else {
        for (let index = fromIndex; index < toIndex; index++)
          binding.moveDown?.(binding.control.path, index)();
      }
      event.api.clearFocusedCell();
    }
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
      getRowId: ({ data }) => data.key,
      rowSelection: binding.control.enabled
        ? (userGridOptions.rowSelection ?? {
            mode: 'multiRow',
            checkboxes: true,
            headerCheckbox: true,
          })
        : undefined,
      suppressRowDrag:
        Boolean(userGridOptions.suppressRowDrag) || !binding.control.enabled || sorted || filtered,
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
      onSelectionChanged,
      onSortChanged,
      onFilterChanged,
      onRowDragEnd,
    };
    gridOptionsCache = {
      userOptions: userGridOptions,
      enabled: binding.control.enabled,
      sorted,
      filtered,
      popupParent: sectionElement,
      value,
    };
    return value;
  });

  function addItem() {
    if (!prepare() || addDisabled) return;
    binding.addItem(
      binding.control.path,
      createDefaultValue(binding.control.schema, binding.control.rootSchema),
    )();
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
  const gridHeight = $derived(
    typeof appliedOptions.gridHeight === 'string' ? appliedOptions.gridHeight : '400px',
  );
  const gridWidth = $derived(
    typeof appliedOptions.gridWidth === 'string' ? appliedOptions.gridWidth : '100%',
  );
  const errorSummary = $derived(
    binding.control.childErrors
      .map((error: { message?: string }) => error.message)
      .filter((message): message is string => Boolean(message))
      .join('\n'),
  );
</script>

{#if binding.control.visible}
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class="my-2 text-sm">{binding.control.errors}</p>
  {/if}
  <section
    bind:this={sectionElement}
    class="jsonforms-ag-grid jsonforms-ag-grid--flowbite"
    style:width={gridWidth}
    data-jsonforms-ag-grid
  >
    <header class="jsonforms-ag-grid__toolbar">
      <div class="jsonforms-ag-grid__title-row">
        <h3 class="jsonforms-ag-grid__title">{computedLabel}</h3>
        {#if binding.control.childErrors.length > 0 && !appliedOptions.hideArraySummaryValidation && appliedOptions.showValidationIndicator !== false}
          <span
            class="jsonforms-ag-grid__validation"
            role="status"
            title={errorSummary || 'Validation errors'}
            aria-label={`${binding.control.childErrors.length} validation error${binding.control.childErrors.length === 1 ? '' : 's'}`}
            >{binding.control.childErrors.length}</span
          >
        {/if}
      </div>
      <div class="jsonforms-ag-grid__actions">
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
        <Button
          type="button"
          size="xs"
          color="alternative"
          disabled={removeDisabled}
          onclick={removeSelected}
          aria-label={translations.removeAriaLabel}
          title={translations.removeTooltip}><TrashBinOutline class="h-4 w-4" /></Button
        >
        <Button
          type="button"
          size="xs"
          disabled={addDisabled}
          onclick={addItem}
          aria-label={translations.addAriaLabel}
          title={translations.addTooltip}><PlusOutline class="h-4 w-4" /></Button
        >
      </div>
    </header>
    <RowDetailFrame
      panel={rowDetail}
      schema={binding.control.schema}
      path={binding.control.path}
      scope={binding.control.uischema.scope}
      enabled={binding.control.enabled}
      height={binding.control.uischema.options?.layout?.height}
    >
      <div class="jsonforms-ag-grid__body" style:height={rowDetail.visible ? '100%' : gridHeight}>
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
  </section>
{/if}

{#if deletion.pending && binding.control.visible}
  <ConfirmationDialog
    operation={deletion.pending.operation}
    onAccept={deletion.accept}
    onCancel={deletion.cancel}
  />
{/if}
