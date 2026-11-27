import type { AgGridWrappedRow } from './types';

export function createGridRows() {
  let rowCache: { data: unknown; keys: readonly string[]; rows: AgGridWrappedRow[] } | undefined;
  return (data: unknown, keys: readonly string[]): AgGridWrappedRow[] => {
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
  };
}
