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
  import type { AgGridAppearance, AgGridCellHostProps, AgGridWrappedRow } from '../types.js';

  let {
    appearance = 'neutral',
    ...rendererProps
  }: RendererProps<ControlElement> & { appearance?: AgGridAppearance } = $props();

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
    if (!(root instanceof ShadowRoot)) return;

    const styleContainer = root;
    const styleId = 'jsonforms-ag-grid-runtime-styles';

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

  const rows = $derived.by((): AgGridWrappedRow[] => {
    const data = Array.isArray(binding.control.data) ? binding.control.data : [];
    return rowIdentity.reconcile(data);
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
    if (typeof schema.title === 'string') return schema.title;
    return propertyName
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^./, (value) => value.toUpperCase());
  }

  const columns = $derived.by((): ColDef<AgGridWrappedRow>[] => {
    const itemSchema = binding.control.schema;
    const baseGridOptions = (appliedOptions.agGridOptions ?? {}) as GridOptions<AgGridWrappedRow>;

    const configuredColumns: Array<ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>> =
      Array.isArray(baseGridOptions.columnDefs)
        ? (baseGridOptions.columnDefs as Array<
            ColDef<AgGridWrappedRow> | ColGroupDef<AgGridWrappedRow>
          >)
        : [];
    const entries: Array<[string, JsonSchema]> =
      itemSchema.type === 'object' && itemSchema.properties
        ? Object.entries(itemSchema.properties)
        : [['', itemSchema]];

    let hasDragColumn = false;
    const dataColumns: ColDef<AgGridWrappedRow>[] = entries.map(
      ([propertyName, propertySchema]) => {
        const override = configuredColumns.find(
          (column) => isColumnDefinition(column) && column.field === propertyName,
        );
        if (override && isColumnDefinition(override) && override.rowDrag) hasDragColumn = true;

        return {
          headerName: titleFor(propertyName, propertySchema),
          colId: propertyName || '$value',
          autoHeight: true,
          valueGetter: ({ data }) => {
            if (!data) return undefined;
            if (!propertyName) return data.value;
            return (data.value as Record<string, unknown> | null | undefined)?.[propertyName];
          },
          ...(override && isColumnDefinition(override) ? override : {}),
          editable: false,
          cellRenderer: 'JsonFormsDispatchCell',
          cellRendererParams: { propertyName },
          cellClassRules: {
            ...(override && isColumnDefinition(override) ? override.cellClassRules : undefined),
            'jsonforms-ag-grid-data-cell': () => true,
          },
          suppressKeyboardEvent: ({ event }) => {
            const target = event.target;
            return (
              target instanceof Element &&
              Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]'))
            );
          },
        } as ColDef<AgGridWrappedRow>;
      },
    );

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

    if (appearance === 'shadcn') {
      const shadcn = isRecord(options.shadcn) ? options.shadcn : {};
      const select = isRecord(shadcn['Select']) ? shadcn['Select'] : {};
      const content = isRecord(select['Content']) ? select['Content'] : {};

      options.shadcn = {
        ...shadcn,
        Select: {
          ...select,
          Content: { ...content, preventScroll: false },
        },
      };
    }

    if (appearance === 'skeleton') {
      options.nativeSelect = true;
    }

    return {
      type: 'Control',
      scope,
      label: false,
      options,
    };
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
        for (let index = fromIndex; index > toIndex; index--) {
          binding.moveUp?.(binding.control.path, index)();
        }
      } else {
        for (let index = fromIndex; index < toIndex; index++) {
          binding.moveDown?.(binding.control.path, index)();
        }
      }
      event.api.clearFocusedCell();
    }

    userGridOptions.onRowDragEnd?.(event);
  }

  const userGridOptions = $derived(
    (appliedOptions.agGridOptions ?? {}) as GridOptions<AgGridWrappedRow>,
  );
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
    class={`jsonforms-ag-grid jsonforms-ag-grid--${appearance}`}
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
          >
            {binding.control.childErrors.length}
          </span>
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
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" />
          </svg>
        </button>
        <button
          type="button"
          class="jsonforms-ag-grid__button jsonforms-ag-grid__button--add"
          disabled={addDisabled}
          onclick={addItem}
          aria-label={translations.addAriaLabel ?? 'Add row'}
          title={translations.addTooltip ?? 'Add'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
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

<style>
  .jsonforms-ag-grid {
    --jsonforms-ag-grid-background: light-dark(#fff, #111827);
    --jsonforms-ag-grid-foreground: light-dark(#111827, #f9fafb);
    --jsonforms-ag-grid-accent: light-dark(#2563eb, #60a5fa);
    --jsonforms-ag-grid-border: light-dark(#e5e7eb, #374151);
    --jsonforms-ag-grid-header-background: light-dark(#f9fafb, #1f2937);
    --jsonforms-ag-grid-header-foreground: var(--jsonforms-ag-grid-foreground);
    --jsonforms-ag-grid-odd-row-background: color-mix(
      in srgb,
      var(--jsonforms-ag-grid-foreground) 2%,
      transparent
    );
    --jsonforms-ag-grid-selected-row-background: color-mix(
      in srgb,
      var(--jsonforms-ag-grid-accent) 14%,
      transparent
    );
    --jsonforms-ag-grid-row-hover: color-mix(
      in srgb,
      var(--jsonforms-ag-grid-accent) 9%,
      transparent
    );
    --jsonforms-ag-grid-font-family: inherit;
    box-sizing: border-box;
    overflow: visible;
    border: 1px solid var(--jsonforms-ag-grid-border);
    border-radius: 0.5rem;
    background: var(--jsonforms-ag-grid-background);
    color: var(--jsonforms-ag-grid-foreground);
    font: inherit;
  }

  .jsonforms-ag-grid--shadcn {
    --jsonforms-ag-grid-background: hsl(var(--card, var(--background, 0 0% 100%)));
    --jsonforms-ag-grid-foreground: hsl(var(--card-foreground, var(--foreground, 222.2 84% 4.9%)));
    --jsonforms-ag-grid-accent: hsl(var(--primary, 222.2 47.4% 11.2%));
    --jsonforms-ag-grid-border: hsl(var(--border, 214.3 31.8% 91.4%));
    --jsonforms-ag-grid-header-background: hsl(var(--muted, 210 40% 96.1%));
    --jsonforms-ag-grid-header-foreground: hsl(var(--muted-foreground, 215.4 16.3% 46.9%));
    --jsonforms-ag-grid-font-family: var(--font-sans, inherit);
    border-radius: var(--radius, 0.5rem);
  }

  .jsonforms-ag-grid--skeleton {
    --jsonforms-ag-grid-background: var(--color-surface-50-950, light-dark(#fff, #111827));
    --jsonforms-ag-grid-foreground: var(--color-surface-950-50, light-dark(#111827, #f9fafb));
    --jsonforms-ag-grid-accent: var(--color-primary-500, #6366f1);
    --jsonforms-ag-grid-border: var(--color-surface-200-800, light-dark(#e5e7eb, #374151));
    --jsonforms-ag-grid-header-background: var(
      --color-surface-100-900,
      light-dark(#f3f4f6, #1f2937)
    );
    --jsonforms-ag-grid-header-foreground: var(--color-surface-700-300, currentColor);
    border-radius: var(--radius-base, 0.5rem);
  }

  .jsonforms-ag-grid--flowbite {
    --jsonforms-ag-grid-background: var(--color-gray-50, #f9fafb);
    --jsonforms-ag-grid-foreground: var(--color-gray-900, #111827);
    --jsonforms-ag-grid-accent: var(--color-primary-600, #2563eb);
    --jsonforms-ag-grid-border: var(--color-gray-200, #e5e7eb);
    --jsonforms-ag-grid-header-background: var(--color-white, #fff);
    --jsonforms-ag-grid-header-foreground: var(--color-gray-700, #374151);
    --jsonforms-ag-grid-font-family: inherit;
    border-radius: 0.5rem;
  }

  :global(.dark) .jsonforms-ag-grid--flowbite {
    --jsonforms-ag-grid-background: var(--color-gray-800, #1f2937);
    --jsonforms-ag-grid-foreground: var(--color-gray-100, #f3f4f6);
    --jsonforms-ag-grid-border: var(--color-gray-700, #374151);
    --jsonforms-ag-grid-header-background: var(--color-gray-900, #111827);
    --jsonforms-ag-grid-header-foreground: var(--color-gray-300, #d1d5db);
  }

  .jsonforms-ag-grid__toolbar {
    min-height: 3rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--jsonforms-ag-grid-border);
  }

  .jsonforms-ag-grid__title-row,
  .jsonforms-ag-grid__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .jsonforms-ag-grid__title {
    margin: 0;
    color: inherit;
    font-family: var(--font-heading, inherit);
    font-size: 1rem;
    font-weight: 600;
  }

  .jsonforms-ag-grid__validation {
    min-width: 1.25rem;
    height: 1.25rem;
    display: inline-grid;
    place-items: center;
    border-radius: 9999px;
    background: color-mix(in srgb, #dc2626 14%, transparent);
    color: light-dark(#b91c1c, #fca5a5);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .jsonforms-ag-grid__button {
    box-sizing: border-box;
    width: 2rem;
    height: 2rem;
    display: inline-grid;
    place-items: center;
    border: 1px solid var(--jsonforms-ag-grid-border);
    border-radius: min(var(--radius, 0.375rem), 0.5rem);
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .jsonforms-ag-grid__button:hover:not(:disabled) {
    background: var(--jsonforms-ag-grid-row-hover);
  }

  .jsonforms-ag-grid__button:focus-visible {
    outline: 2px solid var(--jsonforms-ag-grid-accent);
    outline-offset: 2px;
  }

  .jsonforms-ag-grid__button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .jsonforms-ag-grid__button--add {
    border-color: var(--jsonforms-ag-grid-accent);
    background: var(--jsonforms-ag-grid-accent);
    color: hsl(var(--primary-foreground, 0 0% 100%));
  }

  .jsonforms-ag-grid__button--remove:hover:not(:disabled) {
    border-color: #dc2626;
    color: #dc2626;
  }

  .jsonforms-ag-grid__button svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  .jsonforms-ag-grid__body {
    min-height: 8rem;
  }

  .jsonforms-ag-grid__empty {
    height: 100%;
    min-height: 8rem;
    display: grid;
    place-items: center;
    margin: 0;
    color: var(--jsonforms-ag-grid-header-foreground);
  }

  :is(.jsonforms-ag-grid--shadcn, .jsonforms-ag-grid--skeleton, .jsonforms-ag-grid--flowbite)
    :global(.jsonforms-ag-grid-data-cell) {
    padding: 0;
  }

  :is(.jsonforms-ag-grid--shadcn, .jsonforms-ag-grid--skeleton, .jsonforms-ag-grid--flowbite)
    :global(.jsonforms-ag-grid-cell-host > *),
  :is(.jsonforms-ag-grid--shadcn, .jsonforms-ag-grid--skeleton, .jsonforms-ag-grid--flowbite)
    :global(.jsonforms-ag-grid-cell-host > * > :first-child),
  :is(.jsonforms-ag-grid--shadcn, .jsonforms-ag-grid--skeleton, .jsonforms-ag-grid--flowbite)
    :global(.jsonforms-ag-grid-cell-host > * > :first-child > :first-child),
  :is(.jsonforms-ag-grid--shadcn, .jsonforms-ag-grid--skeleton, .jsonforms-ag-grid--flowbite)
    :global(.jsonforms-ag-grid-cell-host .group) {
    height: 100%;
  }

  :is(.jsonforms-ag-grid--shadcn, .jsonforms-ag-grid--skeleton, .jsonforms-ag-grid--flowbite)
    :global(
      .jsonforms-ag-grid-cell-host
        :is(
          input:not([type='checkbox']):not([type='radio']),
          textarea,
          select,
          [data-slot='select-trigger']
        )
    ) {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 100%;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  :is(.jsonforms-ag-grid--shadcn, .jsonforms-ag-grid--skeleton, .jsonforms-ag-grid--flowbite)
    :global(
      .jsonforms-ag-grid-cell-host
        :is(
          input:not([type='checkbox']):not([type='radio']),
          textarea,
          select,
          [data-slot='select-trigger']
        ):focus-visible
    ) {
    outline: 0;
    box-shadow: inset 0 -2px 0 var(--jsonforms-ag-grid-accent);
  }

  :is(.jsonforms-ag-grid--shadcn, .jsonforms-ag-grid--skeleton, .jsonforms-ag-grid--flowbite)
    :global(
      .jsonforms-ag-grid-cell-host
        :is(
          input:not([type='checkbox']):not([type='radio']),
          textarea,
          select,
          [data-slot='select-trigger']
        )[aria-invalid='true']
    ) {
    box-shadow: inset 0 -2px 0 #dc2626;
  }
</style>
