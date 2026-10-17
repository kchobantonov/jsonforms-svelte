import { describe, expect, it } from 'vitest';
import type { ErrorObject } from 'ajv';
import { OwnedErrorStore } from './ownedErrors';

const error = (instancePath = ''): ErrorObject => ({
  keyword: 'editor',
  instancePath,
  schemaPath: '',
  params: {},
  message: 'Invalid draft',
});

describe('renderer-owned errors', () => {
  it('keeps independent owners at the same path and clears only the matching owner', () => {
    const store = new OwnedErrorStore();
    const first = store.createOwner();
    const second = store.createOwner();
    first.publish(first.begin('/items/0'), [error()]);
    second.publish(second.begin('/items/0'), [error('/name')]);
    first.clear();
    expect(store.snapshot.errors.map((entry) => entry.instancePath)).toEqual(['/items/0/name']);
    second.dispose();
    expect(store.snapshot).toEqual({ errors: [], pending: false });
  });

  it('discards stale results after replacement, clearing and unmount', () => {
    const store = new OwnedErrorStore();
    const owner = store.createOwner();
    const previous = owner.begin('/old', true);
    const current = owner.begin('/new', true);
    expect(owner.publish(previous, [error()])).toBe(false);
    expect(store.snapshot.pending).toBe(true);
    expect(owner.publish(current, [error()])).toBe(true);
    expect(store.snapshot.errors[0].instancePath).toBe('/new');
    owner.clear();
    expect(owner.publish(current, [error()])).toBe(false);
    const last = owner.begin('/last', true);
    owner.dispose();
    expect(owner.publish(last, [error()])).toBe(false);
    expect(store.snapshot.pending).toBe(false);
  });

  it('relocates only an explicitly matched subject, including pending results', () => {
    const store = new OwnedErrorStore();
    const owner = store.createOwner();
    const generation = owner.begin('/items/10', true);
    owner.relocate('/items/9');
    owner.publish(generation, [error('/a~1b/~0key')]);
    expect(store.snapshot.errors[0].instancePath).toBe('/items/9/a~1b/~0key');
  });

  it('notifies errors and pending transitions without data edits and rejects another owner token', () => {
    const store = new OwnedErrorStore();
    const snapshots: boolean[] = [];
    const unsubscribe = store.subscribe((snapshot) => snapshots.push(snapshot.pending));
    const first = store.createOwner();
    const second = store.createOwner();
    const token = first.begin('', true);
    expect(second.publish(token, [error()])).toBe(false);
    first.publish(token, []);
    unsubscribe();
    first.clear();
    expect(snapshots).toEqual([false, true, false]);
  });

  it('invalidates all generations when the owning form is destroyed', () => {
    const store = new OwnedErrorStore();
    const owner = store.createOwner();
    const token = owner.begin('', true);
    store.dispose();
    expect(owner.publish(token, [error()])).toBe(false);
    expect(store.snapshot).toEqual({ errors: [], pending: false });
    expect(() => store.createOwner()).toThrow('disposed');
  });

  it('rejects malformed pointer paths without changing the published errors', () => {
    const store = new OwnedErrorStore();
    const owner = store.createOwner();
    const token = owner.begin('/safe');
    owner.publish(token, [error()]);
    expect(() => owner.relocate('items.0')).toThrow('JSON Pointer');
    expect(() => owner.publish(token, [error('/bad~escape')])).toThrow('JSON Pointer');
    expect(store.snapshot.errors[0].instancePath).toBe('/safe');
  });
  it('clears a discarded session without disabling later owners', () => {
    const store = new OwnedErrorStore();
    const first = store.createOwner();
    const second = store.createOwner();
    const token = first.begin('/value', true);
    second.publish(second.begin('/other'), [error()]);
    store.clear();
    expect(store.snapshot).toEqual({ errors: [], pending: false });
    expect(first.publish(token, [error()])).toBe(false);
    const next = first.begin('/value');
    expect(first.publish(next, [error()])).toBe(true);
    expect(store.snapshot.errors[0].instancePath).toBe('/value');
  });
});
