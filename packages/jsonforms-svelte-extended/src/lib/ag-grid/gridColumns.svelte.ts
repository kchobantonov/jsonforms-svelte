import {
  composePaths,
  defaultJsonFormsI18nState,
  getI18nKey,
  Resolve,
  type JsonSchema,
  type ControlElement,
  type LabelElement,
  type Translator,
} from '@jsonforms/core';
import type { ColDef, ColGroupDef, GridOptions } from 'ag-grid-community';
import isEqual from 'lodash/isEqual';
import { SvelteMap } from 'svelte/reactivity';
import {
  compositeSummaryPresentation,
  resolveTableColumns,
  showArraySortButtons,
  type useJsonFormsArrayControl,
  type useRowDetailPanel,
  type useRendererMessages,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import type { useJsonForms } from '@chobantonov/jsonforms-svelte';
import type { useLabelSummaryText } from '../presentation/labelSummaryText.svelte';
import { fileFilterValue } from '../file/fileFilterValue';
import type { AgGridWrappedRow } from './types';

export function useGridColumns(
  binding: ReturnType<typeof useJsonFormsArrayControl>,
  jsonforms: NonNullable<ReturnType<typeof useJsonForms>>,
  rowDetail: ReturnType<typeof useRowDetailPanel>,
  labelText: ReturnType<typeof useLabelSummaryText>,
  message: ReturnType<typeof useRendererMessages>,
  getOptions: () => Record<string, unknown>,
) {
  const appliedOptions = $derived(getOptions());
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
        const generated = new SvelteMap(
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

  return {
    get columns() {
      return columns;
    },
    wholeRow,
    resolveCellSchema,
  };
}
