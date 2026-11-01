import { describe, expect, it } from 'vite-plus/test';
import { PropertyIdentityStore } from './propertyIdentity';

describe('property occurrence identity', () => {
  it('retains existing properties through reorder and sibling changes', () => {
    const store = new PropertyIdentityStore();
    const before = store.reconcile(['first', 'second']);
    const after = store.reconcile(['second', 'third', 'first']);
    expect(after.get('first')).toBe(before.get('first'));
    expect(after.get('second')).toBe(before.get('second'));
    expect(after.get('third')).not.toBe(before.get('first'));
  });

  it('retains explicit rename identity without mutating the rendered snapshot', () => {
    const store = new PropertyIdentityStore();
    const before = store.reconcile(['', 'sibling']);
    store.rename('', '__proto__');
    const after = store.reconcile(['__proto__', 'sibling']);
    expect(after.get('__proto__')).toBe(before.get(''));
    expect(after.get('sibling')).toBe(before.get('sibling'));
    expect(before.has('__proto__')).toBe(false);
    expect(before.has('')).toBe(true);
  });

  it('does not infer external rename or resurrect removed occurrences', () => {
    const store = new PropertyIdentityStore();
    const before = store.reconcile(['old']);
    const renamed = store.reconcile(['new']);
    expect(renamed.get('new')).not.toBe(before.get('old'));
    const restored = store.reconcile(['old']);
    expect(restored.get('old')).not.toBe(before.get('old'));
  });

  it('does not overwrite an existing property or invent a missing rename source', () => {
    const store = new PropertyIdentityStore();
    const before = store.reconcile(['first', 'second']);
    store.rename('first', 'second');
    store.rename('missing', 'third');
    expect(store.reconcile(['first', 'second'])).toEqual(before);
  });
});
