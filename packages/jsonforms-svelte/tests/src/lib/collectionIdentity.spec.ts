import { coreReducer, update, type JsonFormsCore, type UpdateAction } from '@jsonforms/core';
import { describe, expect, it } from 'vite-plus/test';
import { CollectionIdentityStore } from '../../../src/lib/collectionIdentity';

const apply = (store: CollectionIdentityStore, before: unknown, action: UpdateAction) => {
  const after = coreReducer({ data: before } as JsonFormsCore, action).data;
  store.update(before, after, action);
  return after;
};

describe('collection occurrence identity', () => {
  it('uses command indices to distinguish equal primitive removals', () => {
    const store = new CollectionIdentityStore();
    const before = ['same', 'same', 'same'];
    const keys = store.keys(before);
    const after = apply(
      store,
      before,
      update(
        '',
        (rows) => {
          rows.splice(1, 1);
          return rows;
        },
        { type: 'REMOVE', indices: [1] },
      ),
    );
    expect(store.keys(after)).toEqual([keys[0], keys[2]]);
    expect(before).toEqual(['same', 'same', 'same']);
  });
  it('retains exact occurrences on an equal-value move', () => {
    const store = new CollectionIdentityStore();
    const before = ['same', 'same'];
    const keys = store.keys(before);
    const after = apply(
      store,
      before,
      update('', (rows) => rows.reverse(), { type: 'MOVE', moves: [{ from: 1, to: 0 }] }),
    );
    expect(store.keys(after)).toEqual([keys[1], keys[0]]);
  });
  it('assigns new occurrences on append without changing existing ids', () => {
    const store = new CollectionIdentityStore();
    const before = ['same'];
    const keys = store.keys(before);
    const after = apply(
      store,
      before,
      update('', (rows) => [...rows, 'same'], { type: 'ADD', values: ['same'] }),
    );
    expect(store.keys(after)[0]).toBe(keys[0]);
    expect(store.keys(after)[1]).not.toBe(keys[0]);
  });
  it('retains containing rows during explicit descendant edits', () => {
    const store = new CollectionIdentityStore();
    const before = { rows: [{ text: 'before' }, { text: 'same' }] };
    const keys = store.keys(before.rows);
    const after = apply(
      store,
      before,
      update('rows.0.text', () => 'after'),
    );
    expect(store.keys(after.rows)).toEqual(keys);
    expect(after.rows[0].text).toBe('after');
  });
  it('retains nested occurrence ids through core deep-cloned reorder', () => {
    const store = new CollectionIdentityStore();
    const before = [{ children: ['same', 'same'] }, { children: ['other'] }];
    const nested = store.keys(before[0].children);
    const after = apply(
      store,
      before,
      update('', (rows) => rows.reverse(), { type: 'MOVE', moves: [{ from: 1, to: 0 }] }),
    );
    expect(after[1]).not.toBe(before[0]);
    expect(store.keys(after[1].children)).toEqual(nested);
  });
  it('does not infer primitive occurrence identity after external replacement', () => {
    const store = new CollectionIdentityStore();
    const before = ['same', 'same'];
    const keys = store.keys(before);
    const after = ['same'];
    store.reconcile(before, after);
    expect(keys).not.toContain(store.keys(after)[0]);
  });
  it('matches unique external object references but not duplicate references or labels', () => {
    const store = new CollectionIdentityStore();
    const unique = { name: 'same' };
    const duplicate = { name: 'same' };
    const before = [unique, duplicate, duplicate];
    const keys = store.keys(before);
    const after = [duplicate, unique, { name: 'same' }];
    store.reconcile(before, after);
    expect(store.keys(after)[1]).toBe(keys[0]);
    expect(keys).not.toContain(store.keys(after)[0]);
    expect(keys).not.toContain(store.keys(after)[2]);
  });
  it('rejects operation metadata when middleware changes the resulting data', () => {
    const store = new CollectionIdentityStore();
    const before = ['same', 'same'];
    const keys = store.keys(before);
    const after = ['replacement'];
    store.update(
      before,
      after,
      update('', () => after, { type: 'REMOVE', indices: [0] }),
    );
    expect(keys).not.toContain(store.keys(after)[0]);
  });
});
