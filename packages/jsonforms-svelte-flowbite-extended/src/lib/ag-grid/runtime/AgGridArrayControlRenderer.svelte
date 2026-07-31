<script lang="ts">
  import {
    useJsonForms,
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
    type ControlElement,
    type JsonSchema,
  } from '@jsonforms/core';
  import type {
    ColDef,
    ColGroupDef,
    FilterChangedEvent,
    GridApi,
    GridOptions,
    ICellRendererParams,
    RowDragEndEvent,
    SelectionChangedEvent,
    SortChangedEvent,
  } from 'ag-grid-community';
  import { onMount } from 'svelte';
  import runtimeStyles from './ag-grid.css?inline';
  import AgGridHost from './AgGridHost.svelte';
  import { AgGridRowIdentity } from './row-identity.js';
  import type { AgGridCellHostProps, AgGridWrappedRow } from '../types.js';

  let { ...rendererProps }: RendererProps<ControlElement> = $props();
  const binding = useJsonFormsArrayControl(rendererProps);
  const jsonforms = useJsonForms();
  const rowIdentity = new AgGridRowIdentity();
  let gridApi = $state<GridApi<AgGridWrappedRow> | null>(null);
  let selectedIndexes = $state<number[]>([]);
  let sorted = $state(false);
  let filtered = $state(false);
  let sectionElement = $state<HTMLElement>();

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
      arrayDefaultTranslations,
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
    if (typeof schema.title === 'string') return schema.title;
    return propertyName
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^./, (value) => value.toUpperCase());
  }
  function resolveCellSchema(propertyName: string): JsonSchema {
    if (!propertyName) return binding.control.schema;
    return (
      Resolve.schema(
        binding.control.schema,
        `#/properties/${propertyName}`,
        binding.control.rootSchema,
      ) ??
      binding.control.schema.properties?.[propertyName] ??
      binding.control.schema
    );
  }
  function resolveUiSchema(propertyName: string): AgGridCellHostProps['uischema'] {
    const scope =
      binding.control.schema.properties && propertyName ? `#/properties/${propertyName}` : '#';
    const arrayOptions = { ...(binding.control.uischema.options ?? {}) };
    const cellOptions = arrayOptions.cells;
    delete arrayOptions.cells;
    delete arrayOptions.agGridOptions;
    const propertyOptions =
      cellOptions && typeof cellOptions === 'object'
        ? (cellOptions as Record<string, Record<string, unknown>>)[propertyName]
        : undefined;
    const options = { ...arrayOptions, ...(propertyOptions ?? {}) };

    return { type: 'Control', scope, label: false, options };
  }

  const columns = $derived.by((): ColDef<AgGridWrappedRow>[] => {
    const itemSchema = binding.control.schema;
    const configuredOptions = (appliedOptions.agGridOptions ?? {}) as GridOptions<AgGridWrappedRow>;
    const configuredColumns = Array.isArray(configuredOptions.columnDefs)
      ? (configuredOptions.columnDefs as Array<
          ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>
        >)
      : [];
    const entries: Array<[string, JsonSchema]> =
      itemSchema.type === 'object' && itemSchema.properties
        ? Object.entries(itemSchema.properties)
        : [['', itemSchema]];
    let hasDragColumn = false;
    const dataColumns = entries.map(([propertyName, propertySchema]) => {
      const override = configuredColumns.find(
        (column) => isColumnDefinition(column) && column.field === propertyName,
      );
      const resolvedType = resolveCellSchema(propertyName).type;
      const isBooleanCell =
        resolvedType === 'boolean' ||
        (Array.isArray(resolvedType) && resolvedType.includes('boolean'));
      if (override && isColumnDefinition(override) && override.rowDrag) hasDragColumn = true;
      return {
        headerName: titleFor(propertyName, propertySchema),
        colId: propertyName || '$value',
        autoHeight: true,
        valueGetter: ({ data }) =>
          !data
            ? undefined
            : propertyName
              ? (data.value as Record<string, unknown> | null | undefined)?.[propertyName]
              : data.value,
        ...(override && isColumnDefinition(override) ? override : {}),
        editable: false,
        cellRenderer: 'JsonFormsDispatchCell',
        cellRendererParams: { propertyName },
        cellClassRules: {
          ...(override && isColumnDefinition(override) ? override.cellClassRules : undefined),
          'jsonforms-ag-grid-data-cell': () => true,
          'jsonforms-ag-grid-boolean-cell': () => isBooleanCell,
        },
        suppressKeyboardEvent: ({ event }) =>
          event.target instanceof Element &&
          Boolean(
            event.target.closest('input, textarea, select, button, [contenteditable="true"]'),
          ),
      } as ColDef<AgGridWrappedRow>;
    });
    if (binding.control.enabled && Boolean(appliedOptions.showSortButtons) && !hasDragColumn) {
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
    return dataColumns;
  });

  function getCellProps(
    params: ICellRendererParams<AgGridWrappedRow> & { propertyName?: string },
  ): AgGridCellHostProps {
    const propertyName =
      params.propertyName ??
      (params.colDef?.cellRendererParams as { propertyName?: string } | undefined)?.propertyName ??
      '';
    const sourceIndex = params.data?.sourceIndex ?? params.node.sourceRowIndex;
    const itemPath = composePaths(binding.control.path, `${sourceIndex}`);
    return {
      schema: resolveCellSchema(propertyName),
      uischema: resolveUiSchema(propertyName),
      path: propertyName ? composePaths(itemPath, propertyName) : itemPath,
      enabled: binding.control.enabled,
      renderers: binding.control.renderers,
      cells: binding.control.cells,
      config: binding.control.config,
    };
  }

  const userGridOptions = $derived(
    (appliedOptions.agGridOptions ?? {}) as GridOptions<AgGridWrappedRow>,
  );
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
  const gridOptions = $derived.by((): GridOptions<AgGridWrappedRow> => {
    const baseOptions = { ...userGridOptions };
    const userComponents = baseOptions.components;
    delete baseOptions.rowData;
    delete baseOptions.columnDefs;
    delete baseOptions.components;
    delete baseOptions.onSelectionChanged;
    delete baseOptions.onSortChanged;
    delete baseOptions.onFilterChanged;
    delete baseOptions.onRowDragEnd;
    return {
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
      onSelectionChanged,
      onSortChanged,
      onFilterChanged,
      onRowDragEnd,
    };
  });

  function addItem() {
    binding.addItem(
      binding.control.path,
      createDefaultValue(binding.control.schema, binding.control.rootSchema),
    )();
  }
  function removeSelected() {
    if (removeDisabled) return;
    binding.removeItems?.(binding.control.path, [...selectedIndexes])();
    selectedIndexes = [];
    gridApi?.deselectAll();
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
  <section
    bind:this={sectionElement}
    class="jsonforms-ag-grid jsonforms-ag-grid--flowbite"
    style:width={gridWidth}
    data-jsonforms-ag-grid
  >
    <header class="jsonforms-ag-grid__toolbar">
      <div class="jsonforms-ag-grid__title-row">
        <h3 class="jsonforms-ag-grid__title">{computedLabel}</h3>
        {#if binding.control.childErrors.length > 0 && !appliedOptions.hideArraySummaryValidation}
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
        <button
          type="button"
          class="jsonforms-ag-grid__button jsonforms-ag-grid__button--remove"
          disabled={removeDisabled}
          onclick={removeSelected}
          aria-label={translations.removeAriaLabel ?? 'Delete selected rows'}
          title={translations.removeTooltip ?? 'Delete'}
          ><svg viewBox="0 0 24 24" aria-hidden="true"
            ><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" /></svg
          ></button
        >
        <button
          type="button"
          class="jsonforms-ag-grid__button jsonforms-ag-grid__button--add"
          disabled={addDisabled}
          onclick={addItem}
          aria-label={translations.addAriaLabel ?? 'Add row'}
          title={translations.addTooltip ?? 'Add'}
          ><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button
        >
      </div>
    </header>
    <div class="jsonforms-ag-grid__body" style:height={gridHeight}>
      {#if rows.length > 0}
        <AgGridHost
          options={gridOptions}
          {rows}
          {columns}
          {getCellProps}
          onready={(api) => (gridApi = api)}
        />
      {:else}
        <p class="jsonforms-ag-grid__empty">{translations.noDataMessage ?? 'No data'}</p>
      {/if}
    </div>
  </section>
{/if}
