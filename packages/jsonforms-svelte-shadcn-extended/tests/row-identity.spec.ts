import { describe, expect, it } from 'vitest';
import { AgGridRowIdentity } from '../src/lib/ag-grid/runtime/row-identity.js';

describe('AgGridRowIdentity', () => {
  it('keeps ids through immutable edits, appends, moves, and removals', () => {
    const identity = new AgGridRowIdentity();
    const first = { value: 'first' };
    const second = { value: 'second' };

    const initial = identity.reconcile([first, second]);
    const editedFirst = { value: 'edited' };
    const appended = { value: 'appended' };
    const edited = identity.reconcile([editedFirst, second, appended]);

    expect(edited.map((row) => row.key)).toEqual([
      initial[0].key,
      initial[1].key,
      expect.any(String),
    ]);

    const moved = identity.reconcile([appended, editedFirst, second]);
    expect(moved.map((row) => row.key)).toEqual([edited[2].key, edited[0].key, edited[1].key]);

    const removed = identity.reconcile([appended, second]);
    expect(removed.map((row) => row.key)).toEqual([moved[0].key, moved[2].key]);
  });
});
