import type { AgGridWrappedRow } from '../types.js';

/**
 * Keeps AG Grid row ids stable when JSON Forms replaces immutable row values.
 * Exact value identities win (so moves/removals keep their rows), then an
 * unmatched value inherits the id at the same array position (normal edits).
 */
export class AgGridRowIdentity {
  private previous: AgGridWrappedRow[] = [];
  private nextKey = 0;

  reconcile(values: unknown[]): AgGridWrappedRow[] {
    const next = new Array<AgGridWrappedRow | undefined>(values.length);
    const usedPreviousIndexes = new Set<number>();
    const previousIndexesByValue = new Map<unknown, number[]>();
    const valueCursors = new Map<unknown, number>();

    this.previous.forEach((row, index) => {
      const indexes = previousIndexesByValue.get(row.value);
      if (indexes) indexes.push(index);
      else previousIndexesByValue.set(row.value, [index]);
    });

    for (let sourceIndex = 0; sourceIndex < values.length; sourceIndex++) {
      const value = values[sourceIndex];
      const previousIndexes = previousIndexesByValue.get(value);
      const cursor = valueCursors.get(value) ?? 0;
      const previousIndex = previousIndexes?.[cursor];

      if (previousIndex !== undefined) {
        valueCursors.set(value, cursor + 1);
        usedPreviousIndexes.add(previousIndex);
        next[sourceIndex] = {
          key: this.previous[previousIndex].key,
          sourceIndex,
          value,
        };
      }
    }

    for (let sourceIndex = 0; sourceIndex < values.length; sourceIndex++) {
      if (next[sourceIndex]) continue;

      if (sourceIndex < this.previous.length && !usedPreviousIndexes.has(sourceIndex)) {
        usedPreviousIndexes.add(sourceIndex);
        next[sourceIndex] = {
          key: this.previous[sourceIndex].key,
          sourceIndex,
          value: values[sourceIndex],
        };
      } else {
        next[sourceIndex] = {
          key: `row-${this.nextKey++}`,
          sourceIndex,
          value: values[sourceIndex],
        };
      }
    }

    this.previous = next as AgGridWrappedRow[];
    return this.previous;
  }
}
