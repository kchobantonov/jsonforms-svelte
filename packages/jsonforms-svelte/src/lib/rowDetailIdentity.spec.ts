import { describe, expect, it } from 'vite-plus/test';
import { reconcileRowDetailSelection as reconcile } from './rowDetailIdentity';

describe('row-detail occurrence identity', () => {
  it.each([0, 1])('does not transfer duplicate primitive selection %s after deletion', (index) => {
    expect(reconcile({ index, source: 'same' }, ['same', 'same'], ['same'])).toBeUndefined();
  });
  it('does not transfer repeated object references after deletion', () => {
    const source = {};
    expect(reconcile({ index: 1, source }, [source, source], [source])).toBeUndefined();
  });
  it('invalidates when a formerly unique value becomes ambiguous', () => {
    expect(reconcile({ index: 0, source: 'same' }, ['same'], ['same', 'same'])).toBeUndefined();
  });
  it('preserves a duplicate selection when the collection has not changed', () => {
    const rows = ['same', 'same'];
    const selected = { index: 1, source: 'same' };
    expect(reconcile(selected, rows, rows)).toBe(selected);
  });
  it('follows a unique object through reorder and deletion of an earlier row', () => {
    const first = { label: 'same' };
    const second = { label: 'same' };
    expect(reconcile({ index: 1, source: second }, [first, second], [second, first])).toEqual({
      index: 0,
      source: second,
    });
    expect(reconcile({ index: 1, source: second }, [first, second], [second])).toEqual({
      index: 0,
      source: second,
    });
  });
  it('does not match equal object labels after the selected row is deleted', () => {
    const first = { label: 'same' };
    const second = { label: 'same' };
    expect(reconcile({ index: 0, source: first }, [first, second], [second])).toBeUndefined();
  });
  it('preserves immutable editing of the selected unique row', () => {
    const first = {};
    const second = { text: 'old' };
    const edited = { text: 'new' };
    expect(reconcile({ index: 1, source: second }, [first, second], [first, edited])).toEqual({
      index: 1,
      source: edited,
    });
  });
  it('invalidates unrelated external replacements', () => {
    const source = {};
    expect(reconcile({ index: 0, source }, [source, {}], [{}, {}])).toBeUndefined();
  });
  it('clears when the collection disappears', () => {
    expect(reconcile({ index: 0, source: 1 }, [1], undefined)).toBeUndefined();
  });
});
