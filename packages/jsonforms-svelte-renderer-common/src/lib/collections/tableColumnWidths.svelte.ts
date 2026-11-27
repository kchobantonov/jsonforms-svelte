import { SvelteMap } from 'svelte/reactivity';
import { untrack } from 'svelte';
import type { TableColumn } from './tableColumns';

export function useTableColumnWidths(columns: () => TableColumn[]) {
  const widths = new SvelteMap<string, number>();
  let otherWidth = $state(0);
  let previous = untrack(() => JSON.stringify(columns()));
  $effect(() => {
    const next = JSON.stringify(columns());
    if (next !== previous) {
      previous = next;
      widths.clear();
      otherWidth = 0;
    }
  });
  return {
    start(table: HTMLTableElement) {
      if (widths.size) return;
      let other = 0;
      for (const cell of table.querySelectorAll<HTMLTableCellElement>('thead th')) {
        const width = cell.getBoundingClientRect().width;
        const field = cell.dataset.columnField;
        if (field !== undefined) widths.set(field, width);
        else other += width;
      }
      otherWidth = other;
    },
    get tableStyle() {
      if (!widths.size) return undefined;
      const total = [...widths.values()].reduce((sum, width) => sum + width, otherWidth);
      return `table-layout:fixed;width:${total}px;min-width:${total}px`;
    },
    get: (field: string) =>
      widths.get(field) ?? columns().find((column) => column.field === field)?.width,
    set: (field: string, width: number) => widths.set(field, width),
    style(field: string) {
      const column = columns().find((column) => column.field === field);
      const width = widths.get(field) ?? column?.width;
      if (widths.has(field)) return `width:${width}px;min-width:${width}px;max-width:${width}px`;
      return [
        width === undefined ? '' : `width:${width}px`,
        column?.minWidth === undefined ? '' : `min-width:${column.minWidth}px`,
        column?.maxWidth === undefined ? '' : `max-width:${column.maxWidth}px`,
      ]
        .filter(Boolean)
        .join(';');
    },
  };
}
