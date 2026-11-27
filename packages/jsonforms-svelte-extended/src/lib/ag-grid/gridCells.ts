import {
  mergeRendererOptions,
  type useJsonFormsArrayControl,
  type useRowDetailPanel,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import { composePaths, getControlPath } from '@jsonforms/core';
import type { ICellRendererParams } from 'ag-grid-community';
import isEqual from 'lodash/isEqual';
import type { useGridColumns } from './gridColumns.svelte';
import type { AgGridCellHostProps, AgGridWrappedRow } from './types';

export function createGridCellProps(
  binding: ReturnType<typeof useJsonFormsArrayControl>,
  rowDetail: ReturnType<typeof useRowDetailPanel>,
  gridColumns: ReturnType<typeof useGridColumns>,
  prepare: () => boolean,
  configureOptions?: (options: Record<string, unknown>) => void,
) {
  const { wholeRow, resolveCellSchema } = gridColumns;
  const cellUiSchemaCache = new Map<
    string,
    { options: Record<string, unknown>; value: AgGridCellHostProps['uischema'] }
  >();
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
    configureOptions?.(options);
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
  return function getCellProps(
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
  };
}
